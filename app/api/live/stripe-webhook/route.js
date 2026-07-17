import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { liveDb } from '@/lib/live/supabase';

export const dynamic = 'force-dynamic';

/**
 * Marks a basket paid the moment Stripe says so — nobody watches for
 * payments on Friday.
 *
 * This repo almost certainly already has a Stripe webhook. If so, DON'T
 * register a second endpoint in Stripe. Keep this file (for the exported
 * markBasketPaid) and copy the call into your existing
 * checkout.session.completed handler instead. See the README.
 *
 * If you don't have one: Stripe Dashboard → Developers → Webhooks
 *   URL:    https://my.erendirasboutique.com/api/live/stripe-webhook
 *   Events: checkout.session.completed
 * Then put the signing secret in STRIPE_LIVE_WEBHOOK_SECRET.
 */
export async function POST(req) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_LIVE_WEBHOOK_SECRET;

  if (!secret || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe keys are not set in this environment.' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secret);
  const signature = req.headers.get('stripe-signature');
  const raw = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature ?? '', webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature check failed: ${err.message}` },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const basketId = session.metadata?.basket_id;
    if (basketId) await markBasketPaid(basketId);
  }

  return NextResponse.json({ received: true });
}

/**
 * The one call to copy if you're merging this into an existing webhook.
 * @param {string} basketId
 */
export async function markBasketPaid(basketId) {
  const { error } = await liveDb()
    .from('baskets')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', basketId)
    .neq('status', 'paid');

  if (error) console.error('[live] could not mark basket paid', basketId, error.message);
}
