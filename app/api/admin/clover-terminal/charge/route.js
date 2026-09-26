import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cloverUrls, isUnlocked, maxChargeCents, missingEnv, savePaymentRow } from '@/lib/cloverTerminal';
import { createReceipt } from '@/lib/receipts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/*
 * POST /api/admin/clover-terminal/charge
 * Body: { token, amount, name, email, note, idempotencyKey }
 *
 * `token` is the one-time card token made by Clover's secure card fields
 * in the browser. Card numbers never reach this server.
 */

function cleanText(v, max) {
  return String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cloverErrorMessage(data, status) {
  const e = (data && data.error) || {};
  const msg = e.message || (data && data.message) || '';
  const code = e.declineCode || e.decline_code || e.code || '';
  if (msg && code) return msg + ' (' + code + ')';
  if (msg) return msg;
  if (status === 401) return 'Clover rejected the private key. Check CLOVER_ECOMM_PRIVATE_KEY in Vercel.';
  return 'Clover could not complete the charge (error ' + status + ').';
}

// Records the charge in the payments table with the customer's name/email,
// but only when Clover confirms the charge ID is also the payment ID that
// "Sync Clover" imports. Otherwise Sync imports it, so nothing is duplicated.
async function recordCharge(charge, info) {
  const mId = process.env.CLOVER_MERCHANT_ID;
  const token = process.env.CLOVER_API_TOKEN;
  if (!token) return false;

  const res = await fetch(cloverUrls().rest + '/v3/merchants/' + mId + '/payments/' + charge.id, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return false;

  const src = charge.source || {};
  await savePaymentRow({
    clover_payment_id: charge.id,
    payment_source: 'clover',
    amount_total: Number(charge.amount || info.cents) / 100,
    payment_status: 'paid',
    payment_method: 'card',
    brand: src.brand ? String(src.brand).toLowerCase() : null,
    last4: src.last4 || null,
    customer_name: info.name || null,
    customer_email: info.email || null,
    note: info.note || null,
    receipt_url: info.receiptUrl || null,
    created_at: new Date(charge.created || Date.now()).toISOString(),
  });
  return true;
}

export async function POST(req) {
  const missing = missingEnv();
  if (missing.length) {
    return NextResponse.json({ error: 'Missing in Vercel settings: ' + missing.join(', ') }, { status: 500 });
  }
  if (!isUnlocked(req)) {
    return NextResponse.json({ error: 'Terminal is locked. Enter the passcode again.', locked: true }, { status: 401 });
  }

  let body = {};
  try { body = await req.json(); } catch (e) { /* empty */ }

  const token = String(body.token || '');
  const cents = Math.round(Number(body.amount) * 100);
  const name = cleanText(body.name, 80);
  const email = cleanText(body.email, 120);
  const note = cleanText(body.note, 150);

  if (!token.startsWith('clv_')) {
    return NextResponse.json({ error: 'Card details are missing. Re-enter the card.' }, { status: 400 });
  }
  if (!Number.isFinite(cents) || cents < 50) {
    return NextResponse.json({ error: 'Enter an amount of at least $0.50.' }, { status: 400 });
  }
  if (cents > maxChargeCents()) {
    return NextResponse.json({ error: 'That is over the $' + (maxChargeCents() / 100) + ' limit for one charge.' }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'That email address does not look right.' }, { status: 400 });
  }

  const description = ['Phone order', name, note].filter(Boolean).join(' - ').slice(0, 255);
  const payload = {
    amount: cents,
    currency: 'usd',
    source: token,
    capture: true,
    ecomind: 'moto', // entered by staff (mail / telephone order)
    description: description,
  };
  // No receipt_email to Clover: customers get your branded receipt link instead,
  // so they don't receive two different receipts.

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || '127.0.0.1';
  const idempotencyKey = String(body.idempotencyKey || '').slice(0, 64) || crypto.randomUUID();

  let charge;
  try {
    const res = await fetch(cloverUrls().charges, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.CLOVER_ECOMM_PRIVATE_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'ErendirasBoutiquePortal/1.0',
        'x-forwarded-for': ip,
        'idempotency-key': idempotencyKey,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { message: text.slice(0, 200) }; }

    if (!res.ok) {
      console.error('Clover charge failed', res.status, text.slice(0, 500));
      return NextResponse.json({ error: cloverErrorMessage(data, res.status) }, { status: 402 });
    }
    if (data.paid === false || (data.status && data.status !== 'succeeded')) {
      return NextResponse.json({ error: cloverErrorMessage(data, 402) || 'The card was declined.' }, { status: 402 });
    }
    charge = data;
  } catch (err) {
    console.error('Clover charge error', err);
    return NextResponse.json({ error: 'Could not reach Clover. The card was not charged. Try again.' }, { status: 502 });
  }

  // The card is charged at this point. Everything below is a bonus: if any of
  // it fails the payment still stands, so never report the charge as failed.

  // 1. Branded receipt page + Dub short link.
  let receipt = null;
  let receiptError = null;
  try {
    receipt = await createReceipt(charge, { cents, name, email, note }, req.nextUrl.origin);
  } catch (err) {
    console.error('Charged, but could not create receipt', err);
    receiptError = err.message || 'Could not create the receipt.';
  }

  // 2. Payment ledger ("Sync Clover" brings it in if this is skipped).
  let recorded = false;
  try {
    recorded = await recordCharge(charge, { cents, name, email, note, receiptUrl: receipt && receipt.url });
  } catch (err) {
    console.error('Charged, but could not record in payments table', err);
  }

  const src = charge.source || {};
  return NextResponse.json({
    ok: true,
    id: charge.id,
    amount: Number(charge.amount || cents) / 100,
    brand: src.brand || null,
    last4: src.last4 || null,
    recorded: recorded,
    receiptUrl: receipt ? receipt.url : null,
    receiptShort: Boolean(receipt && receipt.shortUrl),
    receiptNumber: receipt ? receipt.number : null,
    receiptError: receiptError,
  });
}
