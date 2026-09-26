import crypto from 'crypto';

/*
 * Shared helpers for the Stripe card terminal (/admin/stripe-terminal).
 *
 * Vercel environment variables:
 *   STRIPE_SECRET_KEY                 (you already have this)
 *   STRIPE_PUBLISHABLE_KEY            pk_live_... from Stripe → Developers → API keys
 *                                     (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY also works if you already have it)
 *   STRIPE_TERMINAL_PASSCODE          passcode staff enter to unlock the terminal.
 *                                     Leave unset to reuse CLOVER_TERMINAL_PASSCODE.
 * Optional:
 *   STRIPE_TERMINAL_MOTO=true         only after Stripe approves your account for
 *                                     phone (MOTO) payments; skips bank verification prompts
 *   STRIPE_TERMINAL_MAX               largest single charge in dollars (default 5000)
 */

export const COOKIE_NAME = 'ebtq_stripe_terminal';
const SESSION_HOURS = 12;

export function publishableKey() {
  return process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
}

function passcode() {
  return process.env.STRIPE_TERMINAL_PASSCODE || process.env.CLOVER_TERMINAL_PASSCODE || '';
}

export function isTestMode() {
  return String(process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test_');
}

export function maxChargeCents() {
  const dollars = Number(process.env.STRIPE_TERMINAL_MAX || 5000);
  return Math.round((dollars > 0 ? dollars : 5000) * 100);
}

export function setupProblem() {
  const missing = [];
  if (!process.env.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
  if (!publishableKey()) missing.push('STRIPE_PUBLISHABLE_KEY');
  if (!passcode()) missing.push('STRIPE_TERMINAL_PASSCODE');
  if (missing.length) return 'Missing in Vercel settings: ' + missing.join(', ');

  const pkTest = publishableKey().startsWith('pk_test_');
  if (pkTest !== isTestMode()) {
    return 'Your Stripe keys don’t match: one is a test key and the other is live. Use both live or both test.';
  }
  return null;
}

/* ---------- Passcode + unlock cookie ---------- */

function signingKey() {
  return crypto.createHash('sha256').update(String(process.env.STRIPE_SECRET_KEY || '') + '|' + passcode()).digest();
}

function sign(value) {
  return crypto.createHmac('sha256', signingKey()).update(value).digest('hex');
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function passcodeMatches(input) {
  const real = passcode();
  if (!real) return false;
  return safeEqual(String(input || '').trim(), real.trim());
}

export function makeSessionCookie() {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  return {
    name: COOKIE_NAME,
    value: expires + '.' + sign(String(expires)),
    options: { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: SESSION_HOURS * 60 * 60 },
  };
}

export function isUnlocked(req) {
  const raw = req.cookies.get(COOKIE_NAME);
  const value = raw && raw.value;
  if (!value || value.indexOf('.') === -1) return false;
  const [expires, sig] = value.split('.');
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  return safeEqual(sig, sign(expires));
}

/* ---------- Stripe API (plain fetch, no extra packages) ---------- */

function formEncode(obj, prefix, out) {
  out = out || [];
  Object.keys(obj).forEach(function (k) {
    const v = obj[k];
    if (v === undefined || v === null || v === '') return;
    const key = prefix ? prefix + '[' + k + ']' : k;
    if (Array.isArray(v)) {
      v.forEach(function (item) { out.push(encodeURIComponent(key + '[]') + '=' + encodeURIComponent(item)); });
    } else if (typeof v === 'object') {
      formEncode(v, key, out);
    } else {
      out.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(v)));
    }
  });
  return out;
}

export async function stripePost(path, params, idempotencyKey) {
  const headers = {
    Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const res = await fetch('https://api.stripe.com/v1' + path, {
    method: 'POST',
    headers: headers,
    body: formEncode(params).join('&'),
    cache: 'no-store',
  });
  let data = {};
  try { data = await res.json(); } catch (e) { data = {}; }
  return { ok: res.ok, status: res.status, data: data };
}

export function stripeErrorMessage(err) {
  const e = err || {};
  if (e.code === 'authentication_required' || e.decline_code === 'authentication_required') {
    return 'This card needs the customer to approve the payment with their bank, which can’t be done over the phone. Send them a payment link instead.';
  }
  if (e.decline_code === 'insufficient_funds') return 'Declined: insufficient funds.';
  if (e.code === 'incorrect_cvc') return 'The CVV is incorrect.';
  if (e.code === 'expired_card') return 'The card has expired.';
  if (e.code === 'incorrect_zip') return 'The ZIP code doesn’t match the card.';
  if (e.message) return e.message + (e.decline_code ? ' (' + e.decline_code + ')' : '');
  return 'Stripe could not complete the charge.';
}

/* ---------- Payment ledger (Supabase payments table) ---------- */

// For each value, the column names it could be stored under (first match wins).
const COLUMN_OPTIONS = {
  intent_id: ['stripe_payment_intent_id', 'payment_intent_id', 'stripe_payment_intent', 'payment_intent'],
  charge_id: ['stripe_charge_id', 'charge_id'],
  brand: ['payment_method_brand', 'brand', 'card_brand'],
  last4: ['payment_method_last4', 'last4', 'card_last4', 'last_4'],
  payment_method: ['payment_method', 'payment_method_type', 'method'],
  amount_total: ['amount_total', 'amount', 'total'],
  note: ['admin_notes'],
};

function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase settings.');
  return { url: url + '/rest/v1', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, base: url };
}

async function getPaymentColumns(s) {
  try {
    const res = await fetch(s.url + '/', { headers: { ...s.headers, Accept: 'application/openapi+json' }, cache: 'no-store' });
    if (res.ok) {
      const spec = await res.json();
      const props = spec && spec.definitions && spec.definitions.payments && spec.definitions.payments.properties;
      if (props) return new Set(Object.keys(props));
    }
  } catch (e) { /* fall through */ }
  const res = await fetch(s.url + '/payments?select=*&limit=1', { headers: s.headers, cache: 'no-store' });
  const rows = res.ok ? await res.json() : [];
  if (Array.isArray(rows) && rows[0]) return new Set(Object.keys(rows[0]));
  return null;
}

function pickColumn(field, columns) {
  const options = COLUMN_OPTIONS[field] || [field];
  if (!columns) return options[0];
  return options.find(function (c) { return columns.has(c); }) || null;
}

function fitRow(row, columns) {
  const out = {};
  Object.keys(row).forEach(function (field) {
    const value = row[field];
    if (value === undefined || value === null || value === '') return;
    const col = pickColumn(field, columns);
    if (col) out[col] = value;
  });
  return out;
}

/*
 * Adds the payment to the ledger. If a row for this PaymentIntent already
 * exists (e.g. your Stripe webhook saved it first), it just adds the receipt
 * link and details to that row instead of creating a duplicate.
 */
export async function savePaymentToLedger(row) {
  const s = supa();
  const columns = await getPaymentColumns(s);
  const fitted = fitRow(row, columns);
  const intentCol = pickColumn('intent_id', columns);

  if (intentCol && row.intent_id) {
    const existing = await fetch(
      s.url + '/payments?' + intentCol + '=eq.' + encodeURIComponent(row.intent_id) + '&select=*&limit=1',
      { headers: s.headers, cache: 'no-store' }
    );
    const found = existing.ok ? await existing.json() : [];
    if (Array.isArray(found) && found[0]) {
      const patch = fitRow({
        receipt_url: row.receipt_url,
        customer_name: found[0][pickColumn('customer_name', columns)] ? undefined : row.customer_name,
        note: row.note,
      }, columns);
      const idCol = columns && columns.has('id') ? 'id' : intentCol;
      const idVal = idCol === 'id' ? found[0].id : row.intent_id;
      await fetch(s.url + '/payments?' + idCol + '=eq.' + encodeURIComponent(idVal), {
        method: 'PATCH',
        headers: { ...s.headers, Prefer: 'return=minimal' },
        body: JSON.stringify(patch),
        cache: 'no-store',
      });
      return 'updated';
    }
  }

  const res = await fetch(s.url + '/payments', {
    method: 'POST',
    headers: { ...s.headers, Prefer: 'return=minimal' },
    body: JSON.stringify(fitted),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Supabase error ' + res.status + ': ' + (await res.text()).slice(0, 300));
  return 'inserted';
}
