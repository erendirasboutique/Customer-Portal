import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function generateCode() {
  return (
    'EB-' +
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    '-' +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
}

export async function POST(req) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const {
      amount,
      customerName = '',
      customerEmail = '',
      message = '',
      customCode = '',
    } = await req.json();

    const value = Number(amount);

    if (!value || value < 1) {
      return NextResponse.json(
        { error: 'Gift card amount must be at least $1.' },
        { status: 400 }
      );
    }

    const code = (customCode || generateCode()).toUpperCase();

    //
    // CREATE STRIPE COUPON
    //
    const coupon = await stripe.coupons.create({
      amount_off: Math.round(value * 100),
      currency: 'usd',
      duration: 'once',
      name: `Gift Card ${code}`,
    });

    //
    // CREATE PROMOTION CODE
    //
  
  const finalName = recipientName || customerName || '';
    
  const promoParams = new URLSearchParams();

promoParams.append('promotion[type]', 'coupon');
promoParams.append('promotion[coupon]', coupon.id);
promoParams.append('code', code);
promoParams.append('active', 'true');
promoParams.append('max_redemptions', '1');
promoParams.append('metadata[created_from]', 'erendiras_billing_portal');
promoParams.append('metadata[gift_card_code]', code);
promoParams.append('metadata[recipient_name]', finalName);

const promoRes = await fetch('https://api.stripe.com/v1/promotion_codes', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: promoParams.toString(),
});

const promotionCode = await promoRes.json();

if (!promoRes.ok) {
  return NextResponse.json(
    { error: promotionCode.error?.message || 'Could not create Stripe promotion code.' },
    { status: 500 }
  );
}

    const site =
      (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

    const portalUrl = `${site}/gift-card/${code}`;
    const pdfUrl = `${site}/api/gift-card/pdf?code=${code}`;

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('gift_cards')
      .insert({
        stripe_coupon_id: coupon.id,
        stripe_promotion_code_id: promotionCode.id,
        code,
        amount: value,
        customer_name: customerName,
        customer_email: customerEmail,
        message,
        status: 'active',
        gift_card_url: portalUrl,
        pdf_url: pdfUrl,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      giftCard: data,
      code,
      portalUrl,
      pdfUrl,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err.message,
      },
      { status: 500 }
    );
  }
}
