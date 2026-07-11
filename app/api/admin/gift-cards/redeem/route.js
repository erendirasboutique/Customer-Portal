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

    const { id, note = '' } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing gift card id.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: card, error: loadError } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (loadError || !card) {
      return NextResponse.json({ error: 'Gift card not found.' }, { status: 404 });
    }

    if (card.status === 'redeemed') {
      return NextResponse.json({ error: 'This gift card is already marked as redeemed.' }, { status: 400 });
    }

    // Deactivate the promotion code in Stripe so it cannot also be used online.
    if (card.stripe_promotion_code_id) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      try {
        await stripe.promotionCodes.update(card.stripe_promotion_code_id, { active: false });
      } catch (stripeError) {
        return NextResponse.json(
          { error: 'Could not deactivate the code in Stripe: ' + stripeError.message },
          { status: 500 }
        );
      }
    }

    const { data, error } = await supabase
      .from('gift_cards')
      .update({
        status: 'redeemed',
        redeemed_count: Number(card.redeemed_count || 0) + 1,
        total_redeemed: Number(card.total_redeemed || 0) + Number(card.amount || 0),
        redeemed_at: new Date().toISOString(),
        redeemed_note: note || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Stripe code was deactivated, but Supabase did not save the redemption: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, giftCard: data });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not redeem gift card.' }, { status: 500 });
  }
}
