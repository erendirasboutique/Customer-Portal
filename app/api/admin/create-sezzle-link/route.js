// app/api/admin/create-sezzle-link/route.js
// Creates a Sezzle Checkout API v2 session and returns { url }.
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
    // Trim any stray slash so SEZZLE_BASE + '/v2/...' can't double up.
    const base = (process.env.SEZZLE_BASE || DEFAULT_BASE).replace(/\/+$/, '');
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

    const reference = (body.reference && String(body.reference).trim()) || `EB-${Date.now()}`;
    const description = [body.title, body.description].filter(Boolean).join(' — ')
      || `Erendira\u2019s Boutique #${reference}`;

    // Split the single name field into first / last.
    const name = (body.customerName || '').trim();
    const parts = name ? name.split(/\s+/) : [];
    const firstName = parts.shift() || name || undefined;
    const lastName = parts.join(' ') || undefined;

    // Redirect after payment (defaults to the admin page; custom overrides it).
    const redirect = (body.customRedirect && body.redirectUrl)
      ? body.redirectUrl
      : (portal ? `${portal}/admin/sezzle` : 'https://ebtq.io/cc');

    const token = await getToken(base, publicKey, privateKey);

    const order = {
      intent: 'CAPTURE',
      reference_id: reference,
      description,
      order_amount: { amount_in_cents: amountCents, currency: 'USD' },
      requires_shipping_info: Boolean(body.collectShipping),
    };

    // Ask Sezzle to text / email the hosted link to the shopper.
    if (body.send && (body.phone || body.email)) {
      order.send_checkout_url = {};
      if (body.phone) order.send_checkout_url.to_sms_phone = String(body.phone);
      if (body.email) order.send_checkout_url.to_email = String(body.email);
    }

    const payload = {
      cancel_url: { href: redirect },
      complete_url: { href: redirect },
      order,
    };

    // Include customer details when provided (improves approval + prefill).
    if (firstName || body.email || body.phone) {
      payload.customer = {
        first_name: firstName,
        last_name: lastName,
        email: body.email || undefined,
        phone: body.phone || undefined,
      };
    }

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
    });
  } catch (e) {
    return Response.json({ error: e.message || 'Unexpected error' }, { status: 500 });
  }
}
