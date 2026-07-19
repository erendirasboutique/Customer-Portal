import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

/**
 * BILLING PORTAL: app/api/live-webhook/route.js
 *
 * Stripe calls this when a Checkout session completes. This is the ONLY
 * trustworthy signal that a basket was paid — the success_url redirect is
 * not, because a customer can close the tab before it loads, or open the
 * URL without paying. Payment state must come from a verified webhook.
 *
 * Flow: verify Stripe's signature -> read basket_id from the session's
 * metadata -> tell the shipping portal to mark that basket paid, over the
 * same shared-secret bridge.
 *
 * Env (billing portal):
 *   STRIPE_SECRET_KEY
 *   STRIPE_LIVE_WEBHOOK_SECRET   the signing secret for THIS endpoint
 *   LIVE_API_URL                 https://ship.erendirasboutique.com
 *   LIVE_API_SECRET              same value as the shipping portal
 *
 * Stripe needs the raw request body to verify the signature, so this route
 * reads req.text() and must NOT be behind any body-parsing middleware.
 */
export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers.get('stripe-signature');
  const whSecret = process.env.STRIPE_LIVE_WEBHOOK_SECRET;

  let event;
  try {
    const raw = await req.text();
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (err) {
    // Signature didn't verify — could be a forged request. Reject.
    console.error('[live-webhook] bad signature:', err?.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // We only care about a completed checkout.
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;

  // Only act on actually-paid sessions (BNPL can complete as processing).
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    return NextResponse.json({ received: true, note: 'not paid yet' });
  }

  const basketId = session.metadata?.basket_id;
  if (!basketId) {
    // Not one of our live-sale sessions, or metadata missing. Nothing to do.
    return NextResponse.json({ received: true, note: 'no basket_id' });
  }

  try {
    const base = (process.env.LIVE_API_URL || 'https://ship.erendirasboutique.com').replace(
      /\/+$/,
      ''
    );
    const secret = process.env.LIVE_API_SECRET;

    const res = await fetch(`${base}/api/live/external/mark-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-live-secret': secret },
      cache: 'no-store',
      body: JSON.stringify({
        basket_id: basketId,
        method: 'card',
        // Stripe's session id, so the basket can carry a payment reference.
        reference: session.id,
        amount_cents: session.amount_total,
      }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      console.error('[live-webhook] mark-paid failed:', j?.error);
      // Tell Stripe to retry by returning non-2xx.
      return NextResponse.json({ error: 'mark-paid failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true, marked: true });
  } catch (err) {
    console.error('[live-webhook]', err?.message);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
