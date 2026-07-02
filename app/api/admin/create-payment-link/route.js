import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Missing STRIPE_SECRET_KEY.' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const {
      customerName = '',
      customerEmail = '',
      customerPhone = '',
      title,
      description = '',
      amount,
      quantity = 1,
      collectName = true,
      collectShipping = true,
      collectBilling = true,
      requirePhone = true,
      allowPromotionCodes = true,
      redirectAfterPayment = true,
      redirectUrl = '',
    } = await req.json();

    if (!title || !String(title).trim()) {
      return NextResponse.json(
        { error: 'Product/payment title is required.' },
        { status: 400 }
      );
    }

    const amountNumber = Number(amount);

    if (!amountNumber || amountNumber < 0.5) {
      return NextResponse.json(
        { error: 'Amount must be at least $0.50.' },
        { status: 400 }
      );
    }

    const cleanRedirectUrl = String(redirectUrl || '').trim();

    const payload = {
      line_items: [
        {
          quantity: Math.max(1, Number(quantity || 1)),
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amountNumber * 100),
            product_data: {
              name: String(title).trim(),
              description: description ? String(description).trim() : undefined,
            },
          },
        },
      ],
      allow_promotion_codes: Boolean(allowPromotionCodes),
      billing_address_collection: collectBilling ? 'required' : 'auto',
      customer_creation: 'always',
      metadata: {
        created_from: 'erendiras_billing_portal',
        customer_name: customerName || '',
        customer_email: customerEmail || '',
        customer_phone: customerPhone || '',
        description: description || '',
      },
      payment_intent_data: {
        metadata: {
          created_from: 'erendiras_billing_portal',
          customer_name: customerName || '',
          customer_email: customerEmail || '',
          customer_phone: customerPhone || '',
          description: description || '',
        },
      },
      custom_text: {
        submit: {
          message: 'Erendira’s Boutique will receive your payment securely through Stripe.',
        },
      },
      after_completion:
        redirectAfterPayment && cleanRedirectUrl
          ? {
              type: 'redirect',
              redirect: {
                url: cleanRedirectUrl,
              },
            }
          : {
              type: 'hosted_confirmation',
              hosted_confirmation: {
                custom_message:
                  'Thank you for your payment! Erendira’s Boutique has received your order.',
              },
            },
    };

    if (collectShipping) {
      payload.shipping_address_collection = {
        allowed_countries: ['US'],
      };
    }

    if (requirePhone) {
      payload.phone_number_collection = {
        enabled: true,
      };
    }

    if (collectName) {
      payload.name_collection = {
        individual: {
          enabled: true,
          optional: false,
        },
      };
    }

    const paymentLink = await stripe.paymentLinks.create(payload);

    return NextResponse.json({
      success: true,
      id: paymentLink.id,
      url: paymentLink.url,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Could not create payment link.' },
      { status: 500 }
    );
  }
}
