import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY.' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const {
      title,
      description = '',
      amount,
      customerChoosesAmount = false,
      minimumAmount = '',
      maximumAmount = '',
      collectName = true,
      collectShipping = true,
      collectBilling = true,
      requirePhone = true,
      allowPromotionCodes = true,
      redirectAfterPayment = true,
      redirectUrl = '',
    } = await req.json();

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: 'Product/payment title is required.' }, { status: 400 });
    }

    const amountNumber = Number(amount);
    const minimumAmountNumber = Number(minimumAmount);
    const maximumAmountNumber = maximumAmount ? Number(maximumAmount) : null;

    if (!customerChoosesAmount && (!amountNumber || amountNumber < 0.5)) {
      return NextResponse.json({ error: 'Amount must be at least $0.50.' }, { status: 400 });
    }

    if (customerChoosesAmount && (!minimumAmountNumber || minimumAmountNumber < 0.5)) {
      return NextResponse.json({ error: 'Minimum amount must be at least $0.50.' }, { status: 400 });
    }

    const priceData = {
      currency: 'usd',
      product_data: {
        name: String(title).trim(),
        description: description ? String(description).trim() : undefined,
      },
    };

    if (customerChoosesAmount) {
      priceData.custom_unit_amount = {
        enabled: true,
        minimum: Math.round(minimumAmountNumber * 100),
        ...(maximumAmountNumber ? { maximum: Math.round(maximumAmountNumber * 100) } : {}),
      };
    } else {
      priceData.unit_amount = Math.round(amountNumber * 100);
    }

    const cleanRedirectUrl = String(redirectUrl || '').trim();

    const payload = {
      line_items: [{ quantity: 1, price_data: priceData }],
      allow_promotion_codes: Boolean(allowPromotionCodes),
      billing_address_collection: collectBilling ? 'required' : 'auto',
      customer_creation: 'always',
      metadata: {
        created_from: 'erendiras_billing_portal',
        description: description || '',
        customer_chooses_amount: customerChoosesAmount ? 'true' : 'false',
      },
      payment_intent_data: {
        metadata: {
          created_from: 'erendiras_billing_portal',
          description: description || '',
          customer_chooses_amount: customerChoosesAmount ? 'true' : 'false',
        },
      },
      custom_text: {
        submit: { message: 'Erendira’s Boutique will receive your payment securely through Stripe.' },
      },
      after_completion:
        redirectAfterPayment && cleanRedirectUrl
          ? { type: 'redirect', redirect: { url: cleanRedirectUrl } }
          : {
              type: 'hosted_confirmation',
              hosted_confirmation: { custom_message: 'Thank you for your payment! Erendira’s Boutique has received your order.' },
            },
    };

    if (collectShipping) payload.shipping_address_collection = { allowed_countries: ['US'] };
    if (requirePhone) payload.phone_number_collection = { enabled: true };
    if (collectName) payload.name_collection = { individual: { enabled: true, optional: false } };

    const paymentLink = await stripe.paymentLinks.create(payload);

    const supabase = getSupabaseAdmin();
    const { error: saveError } = await supabase.from('payment_links').upsert(
      {
        stripe_payment_link_id: paymentLink.id,
        url: paymentLink.url,
        title: String(title).trim(),
        description: description || '',
        amount: customerChoosesAmount ? null : amountNumber,
        minimum_amount: customerChoosesAmount ? minimumAmountNumber : null,
        maximum_amount: customerChoosesAmount ? maximumAmountNumber : null,
        customer_chooses_amount: Boolean(customerChoosesAmount),
        collect_name: Boolean(collectName),
        collect_shipping: Boolean(collectShipping),
        collect_billing: Boolean(collectBilling),
        require_phone: Boolean(requirePhone),
        allow_promotion_codes: Boolean(allowPromotionCodes),
        redirect_after_payment: Boolean(redirectAfterPayment),
        redirect_url: cleanRedirectUrl,
        status: 'pending',
        raw: paymentLink,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_payment_link_id' }
    );

    if (saveError) {
      return NextResponse.json(
        { error: 'Stripe link was created, but it could not be saved in Supabase.', details: saveError.message, url: paymentLink.url, id: paymentLink.id },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: paymentLink.id, url: paymentLink.url });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not create payment link.' }, { status: 500 });
  }
}
