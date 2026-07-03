
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { id, stripePromotionCodeId, active } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing gift card id.' }, { status: 400 });
    }

    if (stripePromotionCodeId && process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      await stripe.promotionCodes.update(stripePromotionCodeId, {
        active: Boolean(active),
      });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('gift_cards')
      .update({
        status: active ? 'active' : 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not update gift card.' }, { status: 500 });
  }
}
