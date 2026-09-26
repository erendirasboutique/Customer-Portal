// app/api/sezzle/order-status/route.js
// PUBLIC endpoint used by the customer confirmation page (/pay/complete).
// Reads a Sezzle order's status so the page can show Approved / Declined.

export const runtime = 'nodejs';

const DEFAULT_BASE = 'https://gateway.sezzle.com';

async function getToken(base, publicKey, privateKey) {
  const r = await fetch(`${base}/v2/authentication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ public_key: publicKey, private_key: privateKey }),
  });
  if (!r.ok) throw new Error(`auth failed: ${r.status}`);
  return (await r.json()).token;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const base = (process.env.SEZZLE_BASE || DEFAULT_BASE).replace(/\/+$/, '');
  const publicKey = process.env.SEZZLE_PUBLIC_KEY;
  const privateKey = process.env.SEZZLE_PRIVATE_KEY;
  const storeUrl = process.env.STORE_URL || null;

  let uuid = searchParams.get('uuid') || searchParams.get('order_uuid') || searchParams.get('order_id') || searchParams.get('id') || '';
  const ref = searchParams.get('ref') || searchParams.get('reference_id') || searchParams.get('external_reference_id') || '';
  const amtHint = searchParams.get('amt') ? parseInt(searchParams.get('amt'), 10) : null;
  const curHint = searchParams.get('cur') || 'USD';

  if (!publicKey || !privateKey) {
    return Response.json({
      status: 'received', approved: null,
      reference_id: ref || null, amount_cents: amtHint, currency: curHint, store_url: storeUrl,
    });
  }

  try {
    const token = await getToken(base, publicKey, privateKey);

    if (!uuid && ref) {
      const now = new Date();
      const start = new Date(now.getTime() - 3 * 86400000);
      const fmt = (d) => d.toISOString().slice(0, 10);
      const rr = await fetch(`${base}/v2/order-reports?start-date=${fmt(start)}&end-date=${fmt(now)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (rr.ok) {
        const bodyJson = await rr.json().catch(() => []);
        const list = Array.isArray(bodyJson) ? bodyJson : (bodyJson.orders || bodyJson.data || []);
        const hit = list.find((o) => (o.external_reference_id || o.reference_id) === ref);
        if (hit) uuid = hit.order_uuid || hit.uuid || '';
      }
    }

    if (uuid) {
      const r = await fetch(`${base}/v2/order/${uuid}`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const o = await r.json().catch(() => ({}));
        const amt = o.order_amount || {};
        return Response.json({
          status: o.checkout_status || 'unknown',
          approved: !!(o.authorization && o.authorization.approved),
          reference_id: o.reference_id || ref || null,
          amount_cents: amt.amount_in_cents != null ? amt.amount_in_cents : amtHint,
          currency: amt.currency || curHint,
          store_url: storeUrl,
        });
      }
    }

    return Response.json({
      status: 'received', approved: null,
      reference_id: ref || null, amount_cents: amtHint, currency: curHint, store_url: storeUrl,
    });
  } catch (e) {
    return Response.json({
      status: 'received', approved: null,
      reference_id: ref || null, amount_cents: amtHint, currency: curHint, store_url: storeUrl,
    });
  }
}
