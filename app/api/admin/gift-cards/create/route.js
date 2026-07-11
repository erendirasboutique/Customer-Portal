import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function makeCode() {
  function part() {
    return Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  return 'EB-' + part() + '-' + part() + '-' + part();
}

export async function POST(req) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY.' }, { status: 500 });
    }

    const {
      amount,
      customerName = '',
      customerEmail = '',
      message = '',
      customCode = '',
    } = await req.json();

    const amountNumber = Number(amount);
    if (!amountNumber || Number.isNaN(amountNumber) || amountNumber < 1) {
      return NextResponse.json({ error: 'Gift card amount must be at least $1.' }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = getSupabaseAdmin();

    const code = (customCode || makeCode()).trim().toUpperCase();

    const coupon = await stripe.coupons.create({
      amount_off: Math.round(amountNumber * 100),
      currency: 'usd',
      duration: 'once',
      name: 'Gift Card ' + code,
      metadata: {
        gift_card_code: code,
        created_from: 'erendiras_billing_portal',
      },
    });

    // Newer Stripe API versions take the coupon nested under "promotion"
    // instead of a top-level "coupon" parameter.
    const promotionCode = await stripe.promotionCodes.create({
      promotion: {
        type: 'coupon',
        coupon: coupon.id,
      },
      code: code,
      active: true,
      metadata: {
        gift_card_code: code,
        created_from: 'erendiras_billing_portal',
      },
    });

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
    const giftCardUrl = siteUrl + '/gift-card/' + encodeURIComponent(code);
    const pdfUrl = siteUrl + '/api/gift-card/pdf?code=' + encodeURIComponent(code);

    const { data, error } = await supabase
      .from('gift_cards')
      .insert({
        stripe_coupon_id: coupon.id,
        stripe_promotion_code_id: promotionCode.id,
        code: code,
        amount: amountNumber,
        customer_name: customerName || '',
        customer_email: customerEmail || '',
        message: message || '',
        status: 'active',
        gift_card_url: giftCardUrl,
        pdf_url: pdfUrl,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: 'Stripe gift card was created, but Supabase did not save it.',
          details: error.message,
          code: code,
          giftCardUrl: giftCardUrl,
          pdfUrl: pdfUrl,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      giftCard: data,
      code: code,
      giftCardUrl: giftCardUrl,
      pdfUrl: pdfUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Could not create gift card.' },
      { status: 500 }
    );
  }
}
