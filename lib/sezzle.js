// lib/sezzle.js
// Sezzle v2 API client — auth, checkout session, capture, refund, order lookup.
//
// Env vars (set these in Vercel):
//   SEZZLE_BASE_URL    -> https://sandbox.gateway.sezzle.com/v2   (prod: https://gateway.sezzle.com/v2)
//   SEZZLE_PUBLIC_KEY
//   SEZZLE_PRIVATE_KEY

const BASE = process.env.SEZZLE_BASE_URL;
const PUBLIC_KEY = process.env.SEZZLE_PUBLIC_KEY;
const PRIVATE_KEY = process.env.SEZZLE_PRIVATE_KEY;

// --- Auth (cached in-memory per server instance) ---------------------------

let cachedToken = null; // { token, expiresAt }

async function getToken() {
  if (cachedToken && cachedToken.expiresAt - 60000 > Date.now()) {
    return cachedToken.token;
  }

  const res = await fetch(`${BASE}/authentication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ public_key: PUBLIC_KEY, private_key: PRIVATE_KEY }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Sezzle auth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json(); // { token, merchant_uuid, expiration_date }
  cachedToken = {
    token: data.token,
    expiresAt: new Date(data.expiration_date).getTime(),
  };
  return data.token;
}

// --- Low-level authed fetch ------------------------------------------------

async function sezzleFetch(path, init = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(init.headers || {}),
  };
  if (init.idempotencyKey) headers['Sezzle-Request-Id'] = init.idempotencyKey;

  const res = await fetch(`${BASE}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Sezzle ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
}

// --- Public methods --------------------------------------------------------

/**
 * Create a checkout session and return its checkout URL (your payment link).
 * @param {Object} input
 * @param {string} input.referenceId               your internal order id
 * @param {{amount_in_cents:number,currency:string}} input.amount  order total
 * @param {Array<{name:string,sku:string,quantity:number,price:{amount_in_cents:number,currency:string}}>} input.items
 * @param {string} input.completeUrl               where Sezzle sends the buyer after paying
 * @param {string} input.cancelUrl                 where Sezzle sends them if they bail
 * @param {'AUTH'|'CAPTURE'} [input.intent]        default 'CAPTURE' (charge now)
 * @param {string} [input.description]
 * @param {boolean} [input.requiresShippingInfo]
 * @param {{email?:string,first_name?:string,last_name?:string,phone?:string}} [input.customer]
 * @param {{to_email?:string,to_sms_phone?:string,language?:string}} [input.sendCheckoutUrl]
 * @returns {Promise<{sessionUuid:string,orderUuid:string,checkoutUrl:string}>}
 */
export async function createCheckout(input) {
  const body = {
    cancel_url: { href: input.cancelUrl, method: 'GET' },
    complete_url: { href: input.completeUrl, method: 'GET' },
    customer: input.customer ? { ...input.customer, tokenize: false } : undefined,
    order: {
      intent: input.intent || 'CAPTURE',
      reference_id: input.referenceId,
      description: input.description,
      order_amount: input.amount,
      items: input.items,
      requires_shipping_info:
        input.requiresShippingInfo === undefined ? true : input.requiresShippingInfo,
    },
    send_checkout_url: input.sendCheckoutUrl,
  };

  const data = await sezzleFetch('/session', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return {
    sessionUuid: data.uuid,
    orderUuid: data.order.uuid,
    checkoutUrl: data.order.checkout_url,
  };
}

export async function getOrder(orderUuid) {
  return sezzleFetch(`/order/${orderUuid}`, { method: 'GET' });
}

// Capture an AUTH'd order (e.g. when the basket ships). Omit amount for full capture.
export async function captureOrder(orderUuid, amount, idempotencyKey) {
  return sezzleFetch(`/order/${orderUuid}/capture`, {
    method: 'POST',
    body: JSON.stringify(amount ? { capture_amount: amount } : {}),
    idempotencyKey,
  });
}

export async function refundOrder(orderUuid, amount, idempotencyKey) {
  return sezzleFetch(`/order/${orderUuid}/refund`, {
    method: 'POST',
    body: JSON.stringify(amount),
    idempotencyKey,
  });
}
