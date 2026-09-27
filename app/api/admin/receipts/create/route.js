import { NextResponse } from 'next/server';
import { cloverCardDetails, isStaffUnlocked, normalizePayment, supa } from '@/lib/ledgerReceipts';
import { createReceipt, getReceiptsByPaymentRefs, receiptLink } from '@/lib/receipts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/*
 * POST /api/admin/receipts/create
 * Body: { paymentId, name, email, note }
 *
 * Makes a branded receipt + short link for a payment already in the ledger
 * (e.g. an in-store Clover sale). If one already exists, returns it.
 */

function cleanText(v, max) {
  return String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export async function POST(req) {
  if (!isStaffUnlocked(req)) {
    return NextResponse.json({ error: 'Locked. Enter the passcode again.', locked: true }, { status: 401 });
  }

  let body = {};
  try { body = await req.json(); } catch (e) { /* empty */ }
  const paymentId = String(body.paymentId || '');
  const name = cleanText(body.name, 80);
  const email = cleanText(body.email, 120);
  const note = cleanText(body.note, 150);

  if (!paymentId) return NextResponse.json({ error: 'Missing payment.' }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'That email address does not look right.' }, { status: 400 });
  }

  try {
    const s = supa();
    const res = await fetch(s.url + '/payments?id=eq.' + encodeURIComponent(paymentId) + '&select=*&limit=1', {
      headers: s.headers,
      cache: 'no-store',
    });
    const rows = res.ok ? await res.json() : [];
    if (!Array.isArray(rows) || !rows[0]) {
      return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    }
    const raw = rows[0];
    const p = normalizePayment(raw);
    const origin = req.nextUrl.origin;

    // Already has one? Hand back the same link.
    const existing = (await getReceiptsByPaymentRefs([p.ref]))[p.ref];
    if (existing) {
      return NextResponse.json({ ok: true, existed: true, url: receiptLink(existing, origin), number: existing.receipt_number, short: Boolean(existing.short_url) });
    }

    // Fill in card details and the authorization code straight from Clover.
    const extra = p.provider === 'clover' ? await cloverCardDetails(p.ref) : {};

    const receipt = await createReceipt({
      provider: p.provider,
      paymentRef: p.ref,
      amount: p.amount,
      currency: 'usd',
      brand: extra.brand || p.brand,
      last4: extra.last4 || p.last4,
      authCode: extra.authCode || null,
      method: extra.method || p.method,
      status: p.status,
      source: p.provider === 'clover' ? 'in_store' : 'online',
      created: p.created_at || extra.created,
      name: name || p.name,
      email: email || p.email,
      note: note,
    }, origin);

    // Save the link on the payment, and fill in the customer's name/email if
    // the payment didn't have them. Never overwrite what's already there.
    const patch = {};
    if (!raw.receipt_url || p.provider === 'clover') patch.receipt_url = receipt.url;
    if (name && !raw.customer_name && 'customer_name' in raw) patch.customer_name = name;
    if (email && !raw.customer_email && 'customer_email' in raw) patch.customer_email = email;
    if (Object.keys(patch).length) {
      await fetch(s.url + '/payments?id=eq.' + encodeURIComponent(paymentId), {
        method: 'PATCH',
        headers: { ...s.headers, Prefer: 'return=minimal' },
        body: JSON.stringify(patch),
        cache: 'no-store',
      }).catch(function (e) { console.error('Could not save receipt link on payment', e); });
    }

    return NextResponse.json({ ok: true, url: receipt.url, number: receipt.number, short: Boolean(receipt.shortUrl) });
  } catch (err) {
    console.error('Create receipt failed', err);
    return NextResponse.json({ error: err.message || 'Could not create the receipt.' }, { status: 500 });
  }
}
