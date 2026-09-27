import { NextResponse } from "next/server";
import { checkRateLimit, lookupBalance } from "@/lib/gift-card-balance";

export const dynamic = "force-dynamic";

/* ============================================================
   POST /api/gift-card-balance
   Body: { code }
   Public on purpose (customers aren't signed in), so it's rate
   limited and only returns the balance and status.
   ============================================================ */

export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const code = String(body.code || "").trim();
  if (!code) return NextResponse.json({ error: "missing_code" }, { status: 400 });

  const limit = await checkRateLimit(req);
  if (!limit.ok) return NextResponse.json({ error: "too_many" }, { status: 429 });

  try {
    const result = await lookupBalance(code);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[gift-card-balance]", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
