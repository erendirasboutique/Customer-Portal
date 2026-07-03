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
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      active: true,
    });

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
