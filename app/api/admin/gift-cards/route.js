
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function giftCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const group = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `EB-${group(4)}-${group(2)}-${group(4)}`;
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('gift_cards').select('*').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message || 'Could not load gift cards.' }, { status: 500 });
    return NextResponse.json({ success: true, giftCards: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not load gift cards.' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY.' }, { status: 500 });
    const { amount, recipientName = '', customerName = '', customerEmail = '', note = '', message = '', neverExpires = true, customCode = '' } = await req.json();
    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber < 1) return NextResponse.json({ error: 'Gift card amount must be at least $1.' }, { status: 400 });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = getSupabaseAdmin();
    const code = (customCode || giftCode()).trim().toUpperCase();
    const finalName = recipientName || customerName || '';
    const finalMessage = note || message || '';
    const amountCents = Math.round(amountNumber * 100);
    const coupon = await stripe.coupons.create({
      amount_off: amountCents,
      currency: 'usd',
      duration: 'once',
      name: `Gift Card ${code}`,
      metadata: { created_from: 'erendiras_billing_portal', gift_card_code: code, recipient_name: finalName },
    });
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
    {
      error: promotionCode.error?.message || 'Could not create Stripe promotion code.',
    },
    { status: 500 }
  );
},
    });
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
    const giftCardUrl = `${siteUrl}/gift-card/${encodeURIComponent(code)}`;
    const pdfUrl = `${siteUrl}/api/gift-card/pdf?code=${encodeURIComponent(code)}`;
    const { data, error } = await supabase.from('gift_cards').insert({
      code,
      amount: amountNumber,
      currency: 'usd',
      recipient_name: finalName,
      customer_name: finalName,
      customer_email: customerEmail || '',
      note: finalMessage,
      message: finalMessage,
      never_expires: Boolean(neverExpires),
      status: 'active',
      active: true,
      gift_card_url: giftCardUrl,
      pdf_url: pdfUrl,
      stripe_coupon_id: coupon.id,
      stripe_promotion_code_id: promotionCode.id,
      raw: { coupon, promotionCode },
      updated_at: new Date().toISOString(),
    }).select('*').single();
    if (error) return NextResponse.json({ error: 'Stripe gift card was created, but Supabase could not save it.', details: error.message, code, giftCardUrl, pdfUrl }, { status: 500 });
    return NextResponse.json({ success: true, giftCard: data, code, giftCardUrl, pdfUrl });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not create gift card.' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY.' }, { status: 500 });
    const { id, active } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing gift card id.' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { data: giftCard, error: readError } = await supabase.from('gift_cards').select('*').eq('id', id).single();
    if (readError || !giftCard) return NextResponse.json({ error: readError?.message || 'Gift card not found.' }, { status: 404 });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    if (giftCard.stripe_promotion_code_id) await stripe.promotionCodes.update(giftCard.stripe_promotion_code_id, { active: Boolean(active) });
    const { error } = await supabase.from('gift_cards').update({ active: Boolean(active), status: active ? 'active' : 'inactive', updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message || 'Could not update gift card.' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not update gift card.' }, { status: 500 });
  }
}
