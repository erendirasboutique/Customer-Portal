import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.json({ paid: true, name: 'Boutique Payment', productName: 'Boutique Payment' });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY.' }, { status: 500 });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'line_items.data.price.product'],
    });

    const item = session.line_items?.data?.[0];
    const product = item?.price?.product;
    const productName =
      typeof product === 'object' && product?.name ? product.name : item?.description || 'Boutique Payment';
    const name = session.customer_details?.name || session.customer?.name || productName || 'Customer';

    // Live-sale payments carry the basket id in metadata (set by the
    // checkout route). If present, ask the shipping portal for that
    // basket's number and the customer's name — that data lives in the
    // shipping Supabase, a different project, so we go over the shared
    // secret bridge. Best-effort: if it's not a basket payment, or the
    // lookup fails, we just fall back to the Stripe details above.
    let basketNumber = null;
    let customerName = name;

    const basketId = session.metadata?.basket_id;
    if (basketId) {
      const info = await fetchBasketInfo(basketId);
      if (info) {
        if (info.basket_number != null) basketNumber = info.basket_number;
        if (info.customer_name) customerName = info.customer_name;
      }
    }

    return NextResponse.json({
      paid: session.payment_status === 'paid' || session.status === 'complete',
      status: session.status,
      payment_status: session.payment_status,
      name,
      // The customer's name, preferring the boutique record over Stripe's.
      customerName,
      productName,
      // Basket number when this payment was for a live-sale basket.
      basketNumber,
      email: session.customer_details?.email || session.customer?.email || '',
      amount: session.amount_total ? session.amount_total / 100 : null,
      currency: session.currency || 'usd',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not load confirmation.' }, { status: 500 });
  }
}

/**
 * Ask the shipping portal for a basket's number and customer name.
 *
 * Server-to-server, authenticated with the shared secret. Returns null on
 * any problem — the confirmation page still shows the amount and the Stripe
 * name, so a lookup failure never breaks the page.
 */
async function fetchBasketInfo(basketId) {
  try {
    const base = (process.env.LIVE_API_URL || 'https://ship.erendirasboutique.com').replace(/\/+$/, '');
    const secret = process.env.LIVE_API_SECRET;
    if (!secret) return null;

    const res = await fetch(
      `${base}/api/live/external/basket-info?basket_id=${encodeURIComponent(basketId)}`,
      { headers: { 'x-live-secret': secret }, cache: 'no-store' }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
