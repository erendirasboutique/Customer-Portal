// app/api/admin/create-sezzle-link/route.js
// Sezzle counterpart to your Stripe create-payment-link route.
// Same shape: POST a form payload, get back { url }.
//
// Env vars (add in Vercel):
//   SEZZLE_PUBLIC_KEY, SEZZLE_PRIVATE_KEY
//   SEZZLE_BASE       (optional) https://gateway.sezzle.com [default] or the sandbox URL
//   SEZZLE_PORTAL_URL (optional) fallback redirect if the form doesn't send one

export const runtime = 'nodejs';

const DEFAULT_BASE = 'https://gateway.sezzle.com';

async function getToken(base, publicKey, privateKey) {
  const r = await fetch(`${base}/v2/authentication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ public_key: publicKey, private_key: privateKey }),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    throw new Error(`Sezzle auth failed (${r.status}) ${detail}`);
  }
  return (await r.json()).token;
}

export async function POST(request) {
  try {
    const base = process.env.SEZZLE_BASE || DEFAULT_BASE;
    const publicKey = process.env.SEZZLE_PUBLIC_KEY;
    const privateKey = process.env.SEZZLE_PRIVATE_KEY;
    const portal = process.env.SEZZLE_PORTAL_URL || '';

    if (!publicKey || !privateKey) {
      return Response.json({ error: 'Sezzle keys are not configured.' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const amountCents = Math.round(Number(body.amount) * 100);
    if (!amountCents || amountCents < 100) {
      return Response.json({ error: 'Enter a valid amount (minimum $1.00).' }, { status: 400 });
    }

    const reference = `EB-${Date.now()}`;
    const description = [body.title, body.description].filter(Boolean).join(' — ')
      || `Erendira’s Boutique #${reference}`;

    // Where the customer goes after paying. Sezzle requires absolute URLs.
    const redirect = (body.redirectAfterPayment && body.redirectUrl)
      ? body.redirectUrl
      : (portal ? `${portal}/admin/payment-links` : 'https://ebtq.io/cc');

    const token = await getToken(base, publicKey, privateKey);

    const payload = {
      cancel_url: { href: redirect },
      complete_url: { href: redirect },
      order: {
        intent: 'CAPTURE',
        reference_id: reference,
        description,
        order_amount: { amount_in_cents: amountCents, currency: 'USD' },
        requires_shipping_info: Boolean(body.collectShipping),
      },
    };

    const r = await fetch(`${base}/v2/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return Response.json({ error: 'Sezzle could not create the link.', detail: data }, { status: r.status });
    }

    return Response.json({
      url: data.order && data.order.checkout_url,
      uuid: data.order && data.order.uuid,
      reference,
      processor: 'sezzle',
    });
  } catch (e) {
    return Response.json({ error: e.message || 'Unexpected error' }, { status: 500 });
  }
}
