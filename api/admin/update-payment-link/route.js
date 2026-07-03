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
    const { id, stripePaymentLinkId, title, description, active, archived, redirectAfterPayment, redirectUrl } = await req.json();

    if (!id || !stripePaymentLinkId) {
      return NextResponse.json({ error: 'Missing payment link id.' }, { status: 400 });
    }

    const stripeUpdate = {};
    if (typeof active === 'boolean') stripeUpdate.active = active;

    if (typeof redirectAfterPayment === 'boolean') {
      stripeUpdate.after_completion =
        redirectAfterPayment && redirectUrl
          ? { type: 'redirect', redirect: { url: redirectUrl } }
          : { type: 'hosted_confirmation', hosted_confirmation: { custom_message: 'Thank you for your payment! Erendira’s Boutique has received your order.' } };
    }

    if (title || description) {
      stripeUpdate.metadata = {
        title: title || '',
        description: description || '',
        updated_from: 'erendiras_billing_portal',
      };
    }

    if (Object.keys(stripeUpdate).length > 0) {
      await stripe.paymentLinks.update(stripePaymentLinkId, stripeUpdate);
    }

    const updateRow = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateRow.title = title;
    if (description !== undefined) updateRow.description = description;
    if (archived !== undefined) updateRow.archived = Boolean(archived);
    if (active !== undefined) updateRow.status = active ? 'pending' : 'archived';
    if (redirectAfterPayment !== undefined) updateRow.redirect_after_payment = Boolean(redirectAfterPayment);
    if (redirectUrl !== undefined) updateRow.redirect_url = redirectUrl;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('payment_links').update(updateRow).eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message || 'Could not update payment link.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not update payment link.' }, { status: 500 });
  }
}
