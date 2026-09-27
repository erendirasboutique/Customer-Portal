import { isUnlocked as cloverUnlocked, cloverUrls } from '@/lib/cloverTerminal';
import { isUnlocked as stripeUnlocked } from '@/lib/stripeTerminal';

/*
 * Helpers for the Receipts page (/admin/receipts): making branded receipts
 * for payments already in the ledger, like in-store Clover sales that came
 * in through "Sync Clover".
 *
 * Uses the same passcode lock as the card terminals: if either terminal is
 * unlocked on this device, the Receipts page is too.
 */

export function isStaffUnlocked(req) {
  return cloverUnlocked(req) || stripeUnlocked(req);
}

export function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase settings.');
  return { url: url + '/rest/v1', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' } };
}

function first(row, keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '') return { key: k, value: row[k] };
  }
  return { key: null, value: null };
}

const STRIPE_REF_KEYS = [
  'stripe_payment_intent_id', 'payment_intent_id', 'stripe_payment_intent', 'payment_intent',
  'stripe_charge_id', 'charge_id', 'stripe_checkout_session_id', 'checkout_session_id', 'stripe_session_id',
];

/* Turns a payments-table row (whatever its column names are) into one shape. */
export function normalizePayment(row) {
  const source = String(row.payment_source || '').toLowerCase();
  const clover = first(row, ['clover_payment_id']);
  const stripe = first(row, STRIPE_REF_KEYS);
  const provider = clover.value || source === 'clover' ? 'clover' : 'stripe';
  const ref = clover.value || stripe.value || 'payment:' + row.id;

  return {
    id: row.id,
    provider: provider,
    ref: String(ref),
    name: first(row, ['customer_name', 'name']).value,
    email: first(row, ['customer_email', 'email']).value,
    amount: Number(first(row, ['amount_total', 'amount', 'total']).value || 0),
    brand: first(row, ['payment_method_brand', 'brand', 'card_brand']).value,
    last4: first(row, ['payment_method_last4', 'last4', 'card_last4', 'last_4']).value,
    method: String(first(row, ['payment_method', 'payment_method_type', 'method']).value || 'card').toLowerCase(),
    status: row.refund_status === 'refunded' ? 'refunded' : (row.payment_status || 'paid'),
    created_at: row.created_at,
    receipt_url: row.receipt_url || null,
  };
}

/*
 * For Clover payments, asks Clover for the card details and authorization
 * code so the receipt is complete. Returns {} if Clover can't be reached.
 */
export async function cloverCardDetails(paymentId) {
  const token = process.env.CLOVER_API_TOKEN;
  const mId = process.env.CLOVER_MERCHANT_ID;
  if (!token || !mId || !paymentId) return {};
  try {
    const res = await fetch(
      cloverUrls().rest + '/v3/merchants/' + mId + '/payments/' + encodeURIComponent(paymentId) + '?expand=cardTransaction&expand=tender',
      { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' }, cache: 'no-store' }
    );
    if (!res.ok) return {};
    const p = await res.json();
    const card = p.cardTransaction || {};
    const tender = p.tender || {};
    return {
      brand: card.cardType || null,
      last4: card.last4 || null,
      authCode: card.authCode || null,
      method: card.last4 || card.cardType ? 'card' : (tender.label ? String(tender.label).toLowerCase() : null),
      created: p.createdTime || null,
    };
  } catch (e) {
    return {};
  }
}
