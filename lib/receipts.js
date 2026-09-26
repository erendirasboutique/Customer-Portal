import crypto from 'crypto';

/*
 * Receipts for card-terminal charges.
 *
 * Each receipt gets:
 *   - a row in the Supabase `receipts` table (run sql/receipts.sql once)
 *   - a public page at /receipt/<token>   (long random token, can't be guessed)
 *   - a Dub short link on receipts.erendirasboutique.com pointing at that page
 *
 * Vercel environment variables:
 *   DUB_API_KEY            Dub API key (same name your shipping portal uses)
 *   DUB_RECEIPTS_DOMAIN    optional, defaults to receipts.erendirasboutique.com
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (already set)
 */

const DEFAULT_DOMAIN = 'receipts.erendirasboutique.com';

function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase settings.');
  return {
    url: url + '/rest/v1',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
  };
}

export function newReceiptToken() {
  return crypto.randomBytes(18).toString('base64url'); // 24 url-safe characters
}

// Short, readable number printed on the receipt, e.g. EB-260926-7K3Q
export function newReceiptNumber(date) {
  const d = new Date(date || Date.now());
  const la = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: '2-digit', month: '2-digit', day: '2-digit' })
    .formatToParts(d)
    .reduce(function (acc, p) { acc[p.type] = p.value; return acc; }, {});
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let tail = '';
  const bytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) tail += alphabet[bytes[i] % alphabet.length];
  return 'EB-' + la.year + la.month + la.day + '-' + tail;
}

async function makeShortLink(longUrl, receipt) {
  const apiKey = process.env.DUB_API_KEY;
  if (!apiKey) return null;
  const res = await fetch('https://api.dub.co/links', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: longUrl,
      domain: process.env.DUB_RECEIPTS_DOMAIN || DEFAULT_DOMAIN,
      externalId: 'receipt_' + receipt.id,
      title: "Your receipt from Erendira's Boutique",
      description: 'Receipt ' + receipt.receipt_number,
    }),
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error('Dub short link failed', res.status, (await res.text()).slice(0, 300));
    return null;
  }
  const data = await res.json();
  return data && data.shortLink ? data.shortLink : null;
}

/*
 * Saves a receipt for an approved payment and returns { url, shortUrl, number }.
 * `origin` is the site address (e.g. https://my.erendirasboutique.com).
 *
 * p = {
 *   provider:   'clover' | 'stripe'
 *   paymentRef: the processor's payment/charge ID
 *   amount:     dollars (e.g. 125.5)
 *   currency, brand, last4, authCode, created (ms or ISO), name, email, note
 * }
 */
export async function createReceipt(p, origin) {
  const s = supa();
  const row = {
    token: newReceiptToken(),
    receipt_number: newReceiptNumber(p.created),
    provider: p.provider,
    payment_ref: p.paymentRef || null,
    clover_charge_id: p.provider === 'clover' ? (p.paymentRef || null) : null,
    amount: Number(p.amount || 0),
    currency: String(p.currency || 'usd').toLowerCase(),
    status: 'paid',
    card_brand: p.brand ? String(p.brand).toUpperCase() : null,
    card_last4: p.last4 || null,
    auth_code: p.authCode || null,
    customer_name: p.name || null,
    customer_email: p.email || null,
    note: p.note || null,
    source: 'card_terminal',
  };
  if (p.created) row.created_at = new Date(p.created).toISOString();

  const res = await fetch(s.url + '/receipts', {
    method: 'POST',
    headers: { ...s.headers, Prefer: 'return=representation' },
    body: JSON.stringify(row),
    cache: 'no-store',
  });
  const text = await res.text();
  if (!res.ok) {
    if (/PGRST204|PGRST205|42P01|42703|does not exist|schema cache/.test(text)) {
      throw new Error('The receipts table is missing or out of date. Run sql/receipts.sql in Supabase (it is safe to run again).');
    }
    throw new Error('Could not save receipt: ' + text.slice(0, 300));
  }
  const saved = JSON.parse(text)[0];
  const longUrl = origin.replace(/\/$/, '') + '/receipt/' + saved.token;

  let shortUrl = null;
  try {
    shortUrl = await makeShortLink(longUrl, saved);
  } catch (err) {
    console.error('Dub short link error', err);
  }

  if (shortUrl) {
    await fetch(s.url + '/receipts?id=eq.' + saved.id, {
      method: 'PATCH',
      headers: { ...s.headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ short_url: shortUrl }),
      cache: 'no-store',
    }).catch(function () { /* the long link still works */ });
  }

  return { url: shortUrl || longUrl, shortUrl: shortUrl, longUrl: longUrl, number: saved.receipt_number };
}

export async function getReceiptByToken(token) {
  if (!token || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const s = supa();
  const res = await fetch(s.url + '/receipts?token=eq.' + encodeURIComponent(token) + '&select=*&limit=1', {
    headers: s.headers,
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}
