import { NextResponse } from "next/server";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";
import { db, siteUrl } from "@/lib/shop/service";
import { fulfillBySession, deliverEmails } from "@/lib/shop/gift-card-shop";

export const dynamic = "force-dynamic";

/* ============================================================
   POST /api/admin/gift-card-sales   (admins only)
   { action: "retry",  id }  finish a paid order that failed
   { action: "resend", id }  email the card again now
   ============================================================ */

export async function POST(req) {
  const auth = await requireChecksAdmin();
  if (!auth || !auth.ok) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(function () { return {}; });
  const { data: order } = await db().from("gift_card_orders").select("*").eq("id", body.id).maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const site = siteUrl(req);

  if (body.action === "retry") {
    // Re-check with Stripe that it was paid before making anything.
    const result = order.stripe_session_id
      ? await fulfillBySession(order.stripe_session_id, site)
      : { state: "invalid" };
    if (result.state === "fulfilled") return NextResponse.json({ message: "Gift card created." });
    if (result.state === "unpaid") return NextResponse.json({ error: "Stripe says this order isn't paid." }, { status: 400 });
    if (result.state === "working") return NextResponse.json({ message: "Already in progress — refresh in a moment." });
    const { data: again } = await db().from("gift_card_orders").select("error").eq("id", order.id).single();
    return NextResponse.json({ error: "Still failing: " + ((again && again.error) || "unknown error") }, { status: 500 });
  }

  if (body.action === "resend") {
    if (order.status !== "fulfilled") return NextResponse.json({ error: "This order doesn't have a card yet." }, { status: 400 });
    const r = await deliverEmails(order, site, { force: true, buyerReceipt: !order.recipient_email });
    if (r.email_status === "sent") return NextResponse.json({ message: "Email sent." });
    if (r.email_status === "off") return NextResponse.json({ error: "Email isn't set up (RESEND_API_KEY)." }, { status: 400 });
    return NextResponse.json({ error: "Email failed. Check the error on this row." }, { status: 500 });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
