import { NextResponse } from 'next/server';
import { isStaffUnlocked, normalizePayment, supa } from '@/lib/ledgerReceipts';
import { getReceiptsByPaymentRefs, receiptLink } from '@/lib/receipts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/*
 * GET /api/admin/receipts/payments?source=clover|stripe|all&q=search
 * Recent payments from the ledger, each with its branded receipt link if one exists.
 */
export async function GET(req) {
  if (!isStaffUnlocked(req)) {
    return NextResponse.json({ locked: true }, { status: 401 });
  }

  const source = req.nextUrl.searchParams.get('source') || 'clover';
  const q = String(req.nextUrl.searchParams.get('q') || '').trim().toLowerCase();

  try {
    const s = supa();
    let path = '/payments?select=*&order=created_at.desc&limit=200';
    if (source === 'clover' || source === 'stripe') path += '&payment_source=eq.' + source;

    const res = await fetch(s.url + path, { headers: s.headers, cache: 'no-store' });
    if (!res.ok) throw new Error('Supabase error ' + res.status + ': ' + (await res.text()).slice(0, 200));
    let rows = (await res.json()).map(normalizePayment);

    if (q) {
      rows = rows.filter(function (p) {
        return [p.name, p.email, p.last4, p.amount.toFixed(2), p.ref]
          .filter(Boolean)
          .some(function (v) { return String(v).toLowerCase().includes(q); });
      });
    }
    rows = rows.slice(0, 100);

    const existing = await getReceiptsByPaymentRefs(rows.map(function (p) { return p.ref; }));
    const origin = req.nextUrl.origin;
    const payments = rows.map(function (p) {
      const r = existing[p.ref];
      return { ...p, receipt: r ? { url: receiptLink(r, origin), number: r.receipt_number } : null };
    });

    return NextResponse.json({ payments: payments });
  } catch (err) {
    console.error('Receipts list failed', err);
    return NextResponse.json({ error: err.message || 'Could not load payments.' }, { status: 500 });
  }
}
