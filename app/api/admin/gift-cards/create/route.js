import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const group = (n) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  return `EB-${group(4)}-${group(2)}-${group(4)}`;
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

    if (!amountNumber || amountNumber < 1) {
      return NextResponse.json({ error: 'Gift card amount must be at least $1.' }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = getSupabaseAdmin();

    const code = (customCode || generateCode()).trim().toUpperCase();
    const finalName = customerName || '';
    const amountCents = Math.round(amountNumber * 100);

    const coupon = await stripe.coupons.create({
      amount_off: amountCents,
      currency: 'usd',
      duration: 'once',
      name: `Gift Card ${code}`,
      metadata: {
        created_from: 'erendiras_billing_portal',
        gift_card_code: code,
        customer_name: finalName,
      },
    });

    const promoParams = new URLSearchParams();
    promoParams.append('promotion[type]', 'coupon');
    promoParams.append('promotion[coupon]', coupon.id);
    promoParams.append('code', code);
    promoParams.append('active', 'true');
    promoParams.append('max_redemptions', '1');
    promoParams.append('metadata[created_from]', 'erendiras_billing_portal');
    promoParams.append('metadata[gift_card_code]', code);
    promoParams.append('metadata[customer_name]', finalName);

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

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
    const giftCardUrl = `${siteUrl}/gift-card/${encodeURIComponent(code)}`;
    const pdfUrl = `${siteUrl}/api/gift-card/pdf?code=${encodeURIComponent(code)}`;

    const { data, error } = await supabase
      .from('gift_cards')
      .insert({
        stripe_coupon_id: coupon.id,
        stripe_promotion_code_id: promotionCode.id,
        code,
        amount: amountNumber,
        customer_name: finalName,
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
          error: 'Stripe gift card was created, but Supabase could not save it.',
          details: error.message,
          code,
          giftCardUrl,
          pdfUrl,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      giftCard: data,
      code,
      giftCardUrl,
      pdfUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Could not create gift card.' },
      { status: 500 }
    );
  }
}
