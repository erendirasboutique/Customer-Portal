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
 * Zip once in the Stripe Dashboard, and with automatic_payment_methods on,
 * Checkout shows each customer whichever they're eligible for based on the
 * amount. That's why the button can say "tarjeta o a plazos" — Stripe
 * decides the menu.
 *
 * Env (billing portal):
 *   STRIPE_SECRET_KEY      already here for the rest of billing
 *   LIVE_API_SECRET        same value as the shipping portal
 */
export async function POST(req) {
  try {
    const secret = process.env.LIVE_API_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'LIVE_API_SECRET not set' }, { status: 500 });
    }
    if (req.headers.get('x-live-secret') !== secret) {
      return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount_cents);
    const label = typeof body.label === 'string' ? body.label : 'Live sale basket';
    const email = typeof body.email === 'string' ? body.email : undefined;
    const successUrl = body.success_url || 'https://order.erendirasboutique.com';

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: 'A positive amount_cents is required.' }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Let Stripe present card + whatever BNPL the amount qualifies for.
      automatic_payment_methods: { enabled: true },
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
      // A fresh session every time means the amount is always current — an
      // old link can never charge a stale total.
      success_url: successUrl,
      cancel_url: successUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[live-checkout]', err?.message);
    return NextResponse.json({ error: err?.message ?? 'Checkout failed' }, { status: 500 });
  }
}
