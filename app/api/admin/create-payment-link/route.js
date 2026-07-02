import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const {
      name,
      description,
      amount,
      quantity = 1,
      customerEmail,
    } = await req.json();

    if (!name || !amount) {
      return NextResponse.json(
        { error: 'Product name and amount are required.' },
        { status: 400 }
      );
    }

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          quantity: Number(quantity || 1),
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(Number(amount) * 100),
            product_data: {
              name,
              description: description || undefined,
            },
          },
        },
      ],
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      customer_creation: 'always',
      metadata: {
        created_from: 'billing_portal_admin',
        customer_email: customerEmail || '',
      },
      after_completion: {
        type: 'hosted_confirmation',
        hosted_confirmation: {
          custom_message: 'Thank you for your payment! Erendira’s Boutique has received your order.',
        },
      },
    });

    return NextResponse.json({
      success: true,
      url: paymentLink.url,
      id: paymentLink.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Could not create payment link.' },
      { status: 500 }
    );
  }
}
