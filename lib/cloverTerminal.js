import crypto from 'crypto';

/*
 * Shared helpers for the Clover card terminal (/admin/clover-terminal).
 *
 * Vercel environment variables:
 *   CLOVER_ECOMM_PUBLIC_KEY    "public key" from Clover Ecommerce API Tokens
 *   CLOVER_ECOMM_PRIVATE_KEY   "private token" from Clover Ecommerce API Tokens
 *   CLOVER_TERMINAL_PASSCODE   a passcode you choose; staff enter it to unlock the terminal
 *   CLOVER_MERCHANT_ID         (already set for Clover sync)
 *   CLOVER_API_TOKEN           (already set for Clover sync)
 * Optional:
 *   CLOVER_ENV                 set to "sandbox" to test with a Clover sandbox account
 *   CLOVER_TERMINAL_MAX        largest single charge in dollars (default 5000)
 */

export const COOKIE_NAME = 'ebtq_clover_terminal';
const SESSION_HOURS = 12;

export function isSandbox() {
  return String(process.env.CLOVER_ENV || '').toLowerCase() === 'sandbox';
}

export function cloverUrls() {
  const sandbox = isSandbox();
  return {
    sdk: sandbox ? 'https://checkout.sandbox.dev.clover.com/sdk.js' : 'https://checkout.clover.com/sdk.js',
    charges: sandbox ? 'https://scl-sandbox.dev.clover.com/v1/charges' : 'https://scl.clover.com/v1/charges',
    rest: process.env.CLOVER_API_BASE || (sandbox ? 'https://apisandbox.dev.clover.com' : 'https://api.clover.com'),
  };
}

export function maxChargeCents() {
  const dollars = Number(process.env.CLOVER_TERMINAL_MAX || 5000);
  return Math.round((dollars > 0 ? dollars : 5000) * 100);
}

export function missingEnv() {
  return ['CLOVER_ECOMM_PUBLIC_KEY', 'CLOVER_ECOMM_PRIVATE_KEY', 'CLOVER_TERMINAL_PASSCODE', 'CLOVER_MERCHANT_ID']
    .filter(function (k) { return !process.env[k]; });
}

/* ---------- Passcode + unlock cookie ---------- */

function signingKey() {
  // Changing the passcode or the private key logs every device out.
  return crypto
    .createHash('sha256')
    .update(String(process.env.CLOVER_ECOMM_PRIVATE_KEY || '') + '|' + String(process.env.CLOVER_TERMINAL_PASSCODE || ''))
    .digest();
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
  const real = process.env.CLOVER_TERMINAL_PASSCODE;
  if (!real) return false;
  return safeEqual(String(input || '').trim(), real.trim());
}

export function makeSessionCookie() {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const value = expires + '.' + sign(String(expires));
  return {
    name: COOKIE_NAME,
    value: value,
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_HOURS * 60 * 60,
    },
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

/* ---------- Saving to the payments table ---------- */

// For each value, the column names it could be stored under (first match wins).
const COLUMN_OPTIONS = {
  brand: ['payment_method_brand', 'brand', 'card_brand'],
  last4: ['payment_method_last4', 'last4', 'card_last4', 'last_4'],
  payment_method: ['payment_method', 'payment_method_type', 'method'],
  amount_total: ['amount_total', 'amount', 'total'],
  note: ['admin_notes'],
};

async function getPaymentColumns(url, key) {
  const headers = { apikey: key, Authorization: 'Bearer ' + key };
  try {
    const res = await fetch(url + '/rest/v1/', {
      headers: { ...headers, Accept: 'application/openapi+json' },
      cache: 'no-store',
    });
    if (res.ok) {
      const spec = await res.json();
      const props = spec && spec.definitions && spec.definitions.payments && spec.definitions.payments.properties;
      if (props) return new Set(Object.keys(props));
    }
  } catch (e) { /* fall through */ }

  const res = await fetch(url + '/rest/v1/payments?select=*&limit=1', { headers, cache: 'no-store' });
  const rows = res.ok ? await res.json() : [];
  if (Array.isArray(rows) && rows[0]) return new Set(Object.keys(rows[0]));
  return null;
}

function fitRow(row, columns) {
  if (!columns) return row;
  const out = {};
  for (const [field, value] of Object.entries(row)) {
    const options = COLUMN_OPTIONS[field] || [field];
    const col = options.find(function (c) { return columns.has(c); });
    if (col && value !== undefined && value !== null && value !== '') out[col] = value;
  }
  return out;
}

export async function savePaymentRow(row) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase settings.');

  const columns = await getPaymentColumns(url, key);
  const res = await fetch(url + '/rest/v1/payments?on_conflict=clover_payment_id', {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify([fitRow(row, columns)]),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Supabase error ' + res.status + ': ' + (await res.text()).slice(0, 300));
}
