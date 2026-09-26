import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/*
 * POST /api/admin/clover-sync
 *
 * Called by the "Sync Clover" button on the admin dashboard.
 * Pulls recent in-store payments from Clover and saves them into the
 * Supabase `payments` table (same table the Stripe webhook writes to),
 * with payment_source = 'clover'.
 *
 * Safe to run as often as you like: each Clover payment is saved once,
 * keyed on clover_payment_id (run sql/add-clover-column.sql one time first).
 *
 * Vercel environment variables needed:
 *   CLOVER_API_TOKEN            merchant API token from the Clover dashboard
 *   CLOVER_MERCHANT_ID          the ID in your Clover dashboard URL
 *   NEXT_PUBLIC_SUPABASE_URL    (you already have this)
 *   SUPABASE_SERVICE_ROLE_KEY   (you already have this)
 * Optional:
 *   CLOVER_API_BASE             defaults to https://api.clover.com
 *                               (use https://apisandbox.dev.clover.com for a sandbox account)
 */

const DAYS_BACK = 30;      // how far back each sync looks
const PAGE_SIZE = 100;     // Clover's max page size
const MAX_PAGES = 20;      // safety cap: up to 2,000 payments per sync

function cents(n) {
  return Math.round(Number(n || 0)) / 100;
}

function cardBrand(type) {
  if (!type) return null;
  const map = {
    VISA: 'visa',
    MC: 'mastercard',
    AMEX: 'amex',
    DISCOVER: 'discover',
    JCB: 'jcb',
    DINERS_CLUB: 'diners',
  };
  return map[type] || String(type).toLowerCase();
}

function customerFromOrder(order) {
  const c = order && order.customers && order.customers.elements && order.customers.elements[0];
  if (!c) return { name: null, email: null };
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || null;
  const email =
    (c.emailAddresses && c.emailAddresses.elements && c.emailAddresses.elements[0] &&
      c.emailAddresses.elements[0].emailAddress) || null;
  return { name, email };
}

async function fetchCloverPayments() {
  const base = process.env.CLOVER_API_BASE || 'https://api.clover.com';
  const mId = process.env.CLOVER_MERCHANT_ID;
  const token = process.env.CLOVER_API_TOKEN;
  const since = Date.now() - DAYS_BACK * 24 * 60 * 60 * 1000;

  const all = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams();
    params.append('filter', 'createdTime>=' + since);
    params.append('expand', 'cardTransaction');
    params.append('expand', 'tender');
    params.append('expand', 'refunds');
    params.append('expand', 'order.customers');
    params.append('limit', String(PAGE_SIZE));
    params.append('offset', String(page * PAGE_SIZE));

    const res = await fetch(base + '/v3/merchants/' + mId + '/payments?' + params.toString(), {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 401) throw new Error('Clover rejected the API token (401). Check CLOVER_API_TOKEN in Vercel.');
      if (res.status === 404) throw new Error('Clover merchant not found (404). Check CLOVER_MERCHANT_ID in Vercel.');
      throw new Error('Clover API error ' + res.status + ': ' + body.slice(0, 300));
    }

    const data = await res.json();
    const items = (data && data.elements) || [];
    all.push(...items);
    if (items.length < PAGE_SIZE) break;
  }
  return all;
}

function toPaymentRow(p) {
  const card = p.cardTransaction || {};
  const tender = p.tender || {};
  const refunded = p.refunds && p.refunds.elements && p.refunds.elements.length > 0;
  const { name, email } = customerFromOrder(p.order);
  const isCard = Boolean(card.last4 || card.cardType);

  return {
    clover_payment_id: p.id,
    payment_source: 'clover',
    amount_total: cents(Number(p.amount || 0) + Number(p.tipAmount || 0)),
    payment_status: p.result === 'SUCCESS' ? 'paid' : String(p.result || 'unknown').toLowerCase(),
    refund_status: refunded ? 'refunded' : null,
    payment_method: isCard ? 'card' : (tender.label ? String(tender.label).toLowerCase() : null),
    brand: cardBrand(card.cardType),
    last4: card.last4 || null,
    customer_name: name,
    customer_email: email,
    receipt_url: null,
    created_at: new Date(p.createdTime || Date.now()).toISOString(),
  };
}

/*
 * Read the real column names of the payments table, so we only send
 * columns that exist. Uses Supabase's built-in API description; falls
 * back to looking at one existing row.
 */
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

// For each value, the column names it could be stored under (first match wins).
const COLUMN_OPTIONS = {
  brand: ['brand', 'card_brand', 'payment_method_brand'],
  last4: ['last4', 'card_last4', 'last_4', 'payment_method_last4'],
  payment_method: ['payment_method', 'payment_method_type', 'method'],
  amount_total: ['amount_total', 'amount', 'total'],
  receipt_url: ['receipt_url'],
  refund_status: ['refund_status'],
};

function fitRowToColumns(row, columns) {
  if (!columns) return row;
  const out = {};
  for (const [field, value] of Object.entries(row)) {
    const options = COLUMN_OPTIONS[field] || [field];
    const col = options.find(function (c) { return columns.has(c); });
    if (col && value !== undefined) out[col] = value;
  }
  return out;
}

async function saveRows(rawRows) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const columns = await getPaymentColumns(url, key);
  if (columns && !columns.has('clover_payment_id')) {
    throw new Error('The payments table is missing the clover_payment_id column. Run sql/add-clover-column.sql in Supabase once.');
  }
  const rows = rawRows.map(function (r) { return fitRowToColumns(r, columns); });

  const res = await fetch(url + '/rest/v1/payments?on_conflict=clover_payment_id', {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      // Skip payments that were already imported; return only the new ones.
      Prefer: 'resolution=ignore-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
    cache: 'no-store',
  });

  const text = await res.text();
  if (!res.ok) {
    if (text.includes('clover_payment_id')) {
      throw new Error('The payments table is missing the clover_payment_id column. Run sql/add-clover-column.sql in Supabase once.');
    }
    throw new Error('Supabase error ' + res.status + ': ' + text.slice(0, 300));
  }
  const saved = text ? JSON.parse(text) : [];
  return Array.isArray(saved) ? saved.length : 0;
}

export async function POST() {
  const missing = ['CLOVER_API_TOKEN', 'CLOVER_MERCHANT_ID', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
    .filter(function (k) { return !process.env[k]; });
  if (missing.length) {
    return NextResponse.json(
      { error: 'Missing in Vercel settings: ' + missing.join(', ') },
      { status: 500 }
    );
  }

  try {
    const payments = await fetchCloverPayments();
    const rows = payments.map(toPaymentRow);
    const imported = rows.length ? await saveRows(rows) : 0;

    return NextResponse.json({ ok: true, imported: imported, checked: rows.length });
  } catch (err) {
    console.error('Clover sync failed:', err);
    return NextResponse.json({ error: err.message || 'Could not sync Clover.' }, { status: 500 });
  }
}
