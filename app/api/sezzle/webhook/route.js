// app/api/sezzle/webhook/route.js
// Register this URL once via POST /webhooks (see note at bottom).
import { NextResponse } from 'next/server';
import { getOrder } from '@/lib/sezzle';

export async function POST(req) {
  let event;
  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 });
  }

  const eventType = event?.event_type ?? event?.event ?? '';
  const orderUuid = event?.object?.uuid ?? event?.order_uuid ?? event?.object_uuid;

  if (!orderUuid) return NextResponse.json({ ok: true }); // nothing to do

  try {
    // Never trust the webhook body alone — re-fetch the order from Sezzle as
    // the source of truth before you mark anything paid.
    const order = await getOrder(orderUuid);
    const captured = !!(order?.authorization?.captures?.length);

    switch (eventType) {
      case 'order.captured':
        // Money is actually in. Mark the order paid + fulfill.
        // await markOrderPaid(order.reference_id, orderUuid);
        break;
      case 'order.authorized':
        // Authorized only. If you used intent:AUTH, capture now or at ship time.
        // await markOrderAuthorized(order.reference_id, orderUuid);
        break;
      case 'order.refunded':
        // await markOrderRefunded(order.reference_id, orderUuid);
        break;
      default:
        break;
    }

    void captured; // belt-and-suspenders flag if you want it

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Sezzle webhook error:', err);
    // Return 500 so Sezzle retries.
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/*
ONE-TIME SETUP — register the webhook (run once, e.g. a protected admin route or script):

  POST {SEZZLE_BASE_URL}/webhooks
  Authorization: Bearer <token>
  {
    "url": "https://my.erendirasboutique.com/api/sezzle/webhook",
    "events": ["order.authorized", "order.captured", "order.refunded", "customer.tokenized"]
  }
*/
