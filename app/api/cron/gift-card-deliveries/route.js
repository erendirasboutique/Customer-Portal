import { NextResponse } from "next/server";
import { db, todayPT, siteUrl } from "@/lib/shop/service";
import { deliverEmails } from "@/lib/shop/gift-card-shop";

export const dynamic = "force-dynamic";

/* ============================================================
   GET /api/cron/gift-card-deliveries
   Runs once a day (see README for the vercel.json lines) and emails
   gift cards that were scheduled for today or earlier.
   Vercel sends "Authorization: Bearer <CRON_SECRET>" automatically.
   ============================================================ */

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: due, error } = await db()
    .from("gift_card_orders")
    .select("*")
    .eq("status", "fulfilled")
    .eq("email_status", "scheduled")
    .lte("deliver_on", todayPT())
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const site = siteUrl(req);
  let sent = 0;
  for (const order of due || []) {
    const r = await deliverEmails(order, site, { force: true });
    if (r.email_status === "sent") sent++;
  }
  return NextResponse.json({ due: (due || []).length, sent: sent });
}
