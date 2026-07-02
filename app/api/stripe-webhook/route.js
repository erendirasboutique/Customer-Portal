import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return new Response('Missing STRIPE_SECRET_KEY', { status: 500 });

  const stripe = new Stripe(key);
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    let receiptUrl = null;
    let method = '';
    let brand = '';
    let last4 = '';

    try {
      if (session.payment_intent) {
        const pi = await stripe.paymentIntents.retrieve(session.payment_intent, {
          expand: ['latest_charge', 'payment_method'],
        });
        receiptUrl = pi.latest_charge?.receipt_url || null;
        method = pi.payment_method?.type || '';
        brand = pi.payment_method?.card?.brand || '';
        last4 = pi.payment_method?.card?.last4 || '';
      }
    } catch (_) {}

    const supabase = getSupabaseAdmin();
    const email = (session.customer_details?.email || session.customer_email || '').toLowerCase();

    const { error } = await supabase.from('payments').upsert({
      payment_source: 'stripe',
      stripe_session_id: session.id,
      stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
      payment_link: typeof session.payment_link === 'string' ? session.payment_link : session.payment_link?.id || null,
      customer_name: session.customer_details?.name || session.shipping?.name || '',
      customer_email: email,
      customer_phone: session.customer_details?.phone || '',
      amount_total: (session.amount_total || 0) / 100,
      currency: session.currency || 'usd',
      payment_status: session.payment_status || 'paid',
      refund_status: 'none',
      payment_method: method || 'card',
      payment_method_brand: brand || null,
      payment_method_last4: last4 || null,
      billing_address: session.customer_details?.address || null,
      shipping_address: session.shipping?.address || session.collected_information?.shipping_details?.address || null,
      description: session.metadata?.description || session.metadata?.order || 'Stripe payment',
      receipt_url: receiptUrl,
      raw: session,
      created_at: new Date((session.created || Math.floor(Date.now()/1000)) * 1000).toISOString(),
    }, { onConflict: 'stripe_session_id' });

    if (error) {
      console.error('Supabase insert error:', error.message);
      return new Response('Supabase insert failed', { status: 500 });
    }

    if (session.payment_link) {
      const paymentLinkId = typeof session.payment_link === 'string'
        ? session.payment_link
        : session.payment_link?.id;

      if (paymentLinkId) {
        const paidAmount = (session.amount_total || 0) / 100;

        const { data: existingLink } = await supabase
          .from('payment_links')
          .select('paid_count,total_paid')
          .eq('stripe_payment_link_id', paymentLinkId)
          .maybeSingle();

        await supabase
          .from('payment_links')
          .update({
            status: 'paid',
            paid_count: Number(existingLink?.paid_count || 0) + 1,
            total_paid: Number(existingLink?.total_paid || 0) + paidAmount,
            last_paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_link_id', paymentLinkId);
      }
    }
  }

  return new Response('Success', { status: 200 });
}
