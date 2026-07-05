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
    const productName = typeof product === 'object' && product?.name ? product.name : item?.description || 'Boutique Payment';
    const name = session.customer_details?.name || session.customer?.name || productName || 'Customer';

    return NextResponse.json({
      paid: session.payment_status === 'paid' || session.status === 'complete',
      status: session.status,
      payment_status: session.payment_status,
      name,
      productName,
      email: session.customer_details?.email || session.customer?.email || '',
      amount: session.amount_total ? session.amount_total / 100 : null,
      currency: session.currency || 'usd',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not load confirmation.' }, { status: 500 });
  }
}
