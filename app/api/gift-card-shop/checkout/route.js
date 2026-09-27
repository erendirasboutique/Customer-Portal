import { NextResponse } from "next/server";
import { validateOrder, createCheckout } from "@/lib/shop/gift-card-shop";
import { siteUrl } from "@/lib/shop/service";

export const dynamic = "force-dynamic";

/* POST /api/gift-card-shop/checkout — public. Returns { url } for Stripe Checkout. */
export async function POST(req) {
  const body = await req.json().catch(function () { return null; });
  if (!body) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const checked = validateOrder(body);
  if (checked.error) return NextResponse.json({ error: checked.error }, { status: 400 });

  try {
    const url = await createCheckout(checked.order, siteUrl(req));
    return NextResponse.json({ url: url });
  } catch (e) {
    console.error("[gift-card-shop] checkout", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
