// app/api/sezzle/create-checkout/route.js
import { NextResponse } from 'next/server';
import { createCheckout } from '@/lib/sezzle';

export async function POST(req) {
  try {
    const { orderId, amountInCents, items, customer, mode } = await req.json();

    // Always verify/recompute the amount against your own DB in real code.
    // Never trust an amount that came straight from the browser.
    if (!orderId || !amountInCents || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing orderId, amountInCents, or items' },
        { status: 400 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL; // e.g. https://my.erendirasboutique.com

    const result = await createCheckout({
      referenceId: orderId,
      amount: { amount_in_cents: amountInCents, currency: 'USD' },
      items: items.map((i) => ({
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        price: { amount_in_cents: i.priceInCents, currency: 'USD' },
      })),
      customer,
      // 'CAPTURE' = charge now. Switch to 'AUTH' if you capture on ship.
      intent: 'CAPTURE',
      completeUrl: `${origin}/checkout/sezzle/complete?order=${encodeURIComponent(orderId)}`,
      cancelUrl: `${origin}/checkout/sezzle/cancel?order=${encodeURIComponent(orderId)}`,

      // PAYMENT-LINK MODE: pass mode:'link' + contact info and Sezzle will
      // email/SMS the checkout URL to the customer for you.
      sendCheckoutUrl:
        mode === 'link' && customer
          ? { to_email: customer.email, to_sms_phone: customer.phone, language: 'en' }
          : undefined,
    });

    // TODO: persist result.orderUuid + result.sessionUuid against the order in Supabase,
    // keyed by orderId, so the webhook / complete page can reconcile later.
    // await supabase.from('orders').update({
    //   sezzle_order_uuid: result.orderUuid,
    //   sezzle_session_uuid: result.sessionUuid,
    //   payment_provider: 'sezzle',
    // }).eq('id', orderId);

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl, // redirect the buyer here (or shorten via dub.co)
      orderUuid: result.orderUuid,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Sezzle error' }, { status: 500 });
  }
}
