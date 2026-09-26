import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

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

async function shorten(longUrl) {
  const key = process.env.DUB_API_KEY;
  if (!key) return null;
  try {
    const body = { url: longUrl };
    if (process.env.DUB_DOMAIN) body.domain = process.env.DUB_DOMAIN;
    const r = await fetch('https://api.dub.co/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
    if (!r.ok) return null;
    const d = await r.json().catch(() => ({}));
    return d.shortLink || null;
  } catch (e) {
    return null;
  }
}

export async function POST(request) {
  try {
    const base = (process.env.SEZZLE_BASE || DEFAULT_BASE).replace(/\/+$/, '');
    const publicKey = process.env.SEZZLE_PUBLIC_KEY;
    const privateKey = process.env.SEZZLE_PRIVATE_KEY;
    const portal = (process.env.SEZZLE_PORTAL_URL || '').replace(/\/+$/, '');

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

    const name = (body.customerName || '').trim();
    const parts = name ? name.split(/\s+/) : [];
    const firstName = parts.shift() || name || undefined;
    const lastName = parts.join(' ') || undefined;

    const q = `ref=${encodeURIComponent(reference)}&amt=${amountCents}`;
    let completeHref, cancelHref;
    if (body.customRedirect && body.redirectUrl) {
      completeHref = body.redirectUrl; cancelHref = body.redirectUrl;
    } else if (portal) {
      completeHref = `${portal}/sezzle-complete?${q}`; cancelHref = `${portal}/sezzle-complete?${q}`;
    } else {
      completeHref = 'https://ebtq.io/cc'; cancelHref = 'https://ebtq.io/cc';
    }

    const token = await getToken(base, publicKey, privateKey);

    const order = {
      intent: 'CAPTURE',
      reference_id: reference,
      description,
      order_amount: { amount_in_cents: amountCents, currency: 'USD' },
      requires_shipping_info: Boolean(body.collectShipping),
    };
    if (body.send && (body.phone || body.email)) {
      order.send_checkout_url = {};
      if (body.phone) order.send_checkout_url.to_sms_phone = String(body.phone);
      if (body.email) order.send_checkout_url.to_email = String(body.email);
    }

    const payload = { cancel_url: { href: cancelHref }, complete_url: { href: completeHref }, order };
    if (firstName || body.email || body.phone) {
      payload.customer = { first_name: firstName, last_name: lastName, email: body.email || undefined, phone: body.phone || undefined };
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

    const checkoutUrl = data.order && data.order.checkout_url;
    const shortUrl = checkoutUrl ? await shorten(checkoutUrl) : null;

       const db = getSupabaseAdmin();
    if (db) {
      try {
        await db.from('sezzle_links').insert({
          reference,
          order_uuid: (data.order && data.order.uuid) || null,
          title: body.title || null,
          description: body.description || null,
          amount_cents: amountCents,
          currency: 'USD',
          customer_name: name || null,
          email: body.email || null,
          phone: body.phone || null,
          checkout_url: checkoutUrl,
          short_url: shortUrl,
          status: body.send ? 'sent' : 'created',
        });
      } catch (e) { /* ignore DB errors */ }
    }

    return Response.json({
      url: shortUrl || checkoutUrl,
      long_url: checkoutUrl,
      shortened: Boolean(shortUrl),
      uuid: data.order && data.order.uuid,
      reference,
    });
  } catch (e) {
    return Response.json({ error: e.message || 'Unexpected error' }, { status: 500 });
  }
}
