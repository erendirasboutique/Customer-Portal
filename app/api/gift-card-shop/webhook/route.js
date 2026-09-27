import { NextResponse } from "next/server";
import { verifyStripeSignature, fulfillOrder } from "@/lib/shop/gift-card-shop";
import { siteUrl } from "@/lib/shop/service";

export const dynamic = "force-dynamic";

/* ============================================================
   POST /api/gift-card-shop/webhook
   Stripe → Developers → Webhooks → Add endpoint:
     URL:    https://YOUR-SITE/api/gift-card-shop/webhook
     Events: checkout.session.completed
   Put its signing secret in Vercel as STRIPE_GIFT_CARD_WEBHOOK_SECRET.

   Ignores every checkout that isn't an online gift card purchase,
   so it never touches your payment links or Sezzle.
   ============================================================ */

export async function POST(req) {
  const raw = await req.text();
  const ok = verifyStripeSignature(raw, req.headers.get("stripe-signature"), process.env.STRIPE_GIFT_CARD_WEBHOOK_SECRET);
  if (!ok) return NextResponse.json({ error: "bad signature" }, { status: 400 });

  let event;
  try {
    event = JSON.parse(raw);
  } catch (e) {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return NextResponse.json({ ignored: true });
  }

  const session = event.data && event.data.object;
  if (!session || !session.metadata || session.metadata.kind !== "gift_card_purchase") {
    return NextResponse.json({ ignored: true });
  }
  if (session.payment_status !== "paid") return NextResponse.json({ waiting: true });

  const result = await fulfillOrder(session.metadata.order_id, siteUrl(req), session);
  // A failed card is saved as "failed" for Retry in the admin — don't make Stripe resend forever.
  return NextResponse.json({ state: result.state });
}
