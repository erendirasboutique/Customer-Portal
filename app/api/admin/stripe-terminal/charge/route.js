import { NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  isUnlocked, maxChargeCents, savePaymentToLedger, setupProblem, stripeErrorMessage, stripePost,
} from '@/lib/stripeTerminal';
import { createReceipt } from '@/lib/receipts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/*
 * POST /api/admin/stripe-terminal/charge
 * Body: { paymentMethodId, amount, name, email, note, idempotencyKey }
 *
 * `paymentMethodId` (pm_...) is made by Stripe's secure card fields in the
 * browser. Card numbers never reach this server.
 */

function cleanText(v, max) {
  return String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export async function POST(req) {
  const problem = setupProblem();
  if (problem) return NextResponse.json({ error: problem }, { status: 500 });
  if (!isUnlocked(req)) {
    return NextResponse.json({ error: 'Terminal is locked. Enter the passcode again.', locked: true }, { status: 401 });
  }

  let body = {};
  try { body = await req.json(); } catch (e) { /* empty */ }

  const paymentMethodId = String(body.paymentMethodId || '');
  const cents = Math.round(Number(body.amount) * 100);
  const name = cleanText(body.name, 80);
  const email = cleanText(body.email, 120);
  const note = cleanText(body.note, 150);

  if (!/^pm_[A-Za-z0-9]+$/.test(paymentMethodId)) {
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

  const params = {
    amount: cents,
    currency: 'usd',
    payment_method: paymentMethodId,
    payment_method_types: ['card'],
    confirm: 'true',
    // Staff can't complete a bank verification popup for the customer, so fail
    // cleanly instead of leaving the payment half-done.
    error_on_requires_action: 'true',
    description: ['Phone order', name, note].filter(Boolean).join(' - ').slice(0, 350),
    metadata: { source: 'card_terminal', customer_name: name, customer_email: email, note: note },
    expand: ['latest_charge'],
    // No receipt_email: customers get your branded receipt link instead.
  };
  if (String(process.env.STRIPE_TERMINAL_MOTO || '').toLowerCase() === 'true') {
    params.payment_method_options = { card: { moto: 'true' } };
  }

  const idempotencyKey = 'terminal-' + (String(body.idempotencyKey || '').slice(0, 64) || crypto.randomUUID());

  let intent;
  try {
    const r = await stripePost('/payment_intents', params, idempotencyKey);
    if (!r.ok) {
      console.error('Stripe charge failed', r.status, JSON.stringify(r.data).slice(0, 500));
      return NextResponse.json({ error: stripeErrorMessage(r.data && r.data.error) }, { status: 402 });
    }
    intent = r.data;
    if (intent.status !== 'succeeded') {
      return NextResponse.json({
        error: intent.status === 'processing'
          ? 'Stripe is still processing this payment. Check the Stripe dashboard before charging again.'
          : stripeErrorMessage(intent.last_payment_error),
      }, { status: 402 });
    }
  } catch (err) {
    console.error('Stripe charge error', err);
    return NextResponse.json({ error: 'Could not reach Stripe. Check the Stripe dashboard before charging again.' }, { status: 502 });
  }

  // The card is charged. Everything below is a bonus: if any of it fails the
  // payment still stands, so never report the charge as failed.
  const ch = intent.latest_charge && typeof intent.latest_charge === 'object' ? intent.latest_charge : {};
  const card = (ch.payment_method_details && ch.payment_method_details.card) || {};
  const amount = Number(intent.amount_received || intent.amount || cents) / 100;
  const created = (ch.created || intent.created || Math.floor(Date.now() / 1000)) * 1000;

  // 1. Branded receipt page + Dub short link.
  let receipt = null;
  let receiptError = null;
  try {
    receipt = await createReceipt({
      provider: 'stripe',
      paymentRef: intent.id,
      amount: amount,
      currency: intent.currency,
      brand: card.brand,
      last4: card.last4,
      authCode: card.authorization_code || null,
      created: created,
      name: name,
      email: email,
      note: note,
    }, req.nextUrl.origin);
  } catch (err) {
    console.error('Charged, but could not create receipt', err);
    receiptError = err.message || 'Could not create the receipt.';
  }

  // 2. Payment ledger on your dashboard.
  let recorded = false;
  let ledgerError = null;
  try {
    await savePaymentToLedger({
      intent_id: intent.id,
      charge_id: ch.id || null,
      payment_source: 'stripe',
      amount_total: amount,
      payment_status: 'paid',
      payment_method: 'card',
      brand: card.brand ? String(card.brand).toLowerCase() : null,
      last4: card.last4 || null,
      customer_name: name || null,
      customer_email: email || null,
      note: note || null,
      receipt_url: receipt ? receipt.url : null,
      created_at: new Date(created).toISOString(),
    });
    recorded = true;
  } catch (err) {
    console.error('Charged, but could not add to payments table', err);
    ledgerError = err.message || 'Could not add it to the payment ledger.';
  }

  return NextResponse.json({
    ok: true,
    id: intent.id,
    amount: amount,
    brand: card.brand || null,
    last4: card.last4 || null,
    recorded: recorded,
    ledgerError: ledgerError,
    receiptUrl: receipt ? receipt.url : null,
    receiptShort: Boolean(receipt && receipt.shortUrl),
    receiptNumber: receipt ? receipt.number : null,
    receiptError: receiptError,
  });
}
