import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

/**
 * BILLING PORTAL route: app/api/live-checkout/route.js
 *
 * Mints a Stripe Checkout session for a live-sale basket's exact total and
 * returns the URL. The shipping portal calls this (it has the basket but
 * not the Stripe keys); this repo has the keys but not the basket, so the
 * shipping side passes the amount and a label, authenticated with the same
 * shared secret used for the baskets bridge.
 *
 * Buy-now-pay-later needs NO code here: enable Klarna / Affirm / Afterpay /
 * Zip once in the Stripe Dashboard. Checkout automatically shows each
 * customer whichever methods they're eligible for, based on the amount.
 *
 * Env (billing portal):
 *   STRIPE_SECRET_KEY      already here for the rest of billing
 *   LIVE_API_SECRET        same value as the shipping portal
 */
export async function POST(req) {
  try {
    const secret = process.env.LIVE_API_SECRET;
    if (!secret) {
      console.error('[live-checkout] LIVE_API_SECRET not set on billing portal');
      return NextResponse.json(
        { error: 'billing: LIVE_API_SECRET not set' },
        { status: 500 }
      );
    }
    if (req.headers.get('x-live-secret') !== secret) {
      return NextResponse.json({ error: 'billing: secret mismatch' }, { status: 401 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error('[live-checkout] STRIPE_SECRET_KEY not set on billing portal');
      return NextResponse.json(
        { error: 'billing: STRIPE_SECRET_KEY not set' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount_cents);
    const label = typeof body.label === 'string' ? body.label : 'Live sale basket';
    const email = typeof body.email === 'string' ? body.email : undefined;
    const successUrl = body.success_url || 'https://order.erendirasboutique.com';

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { error: `billing: bad amount_cents (${body.amount_cents})` },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeKey);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // No automatic_payment_methods here — that parameter belongs to the
      // Payment Intents API and Checkout rejects it. Checkout already shows
      // every method enabled in the Dashboard (card + Klarna/Affirm/
      // Afterpay/Zip once you turn them on), chosen by amount. Nothing to
      // pass; enabling them in Settings → Payment methods is the whole job.
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: { name: label },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: successUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Surface Stripe's actual message and type, so a 500 says WHY. Stripe
    // errors carry .type (e.g. StripeAuthenticationError) and .raw.message.
    const detail = err?.raw?.message || err?.message || String(err);
    const type = err?.type || err?.name || 'error';
    console.error('[live-checkout]', type, detail);
    return NextResponse.json({ error: `billing: ${type} — ${detail}` }, { status: 500 });
  }
}
