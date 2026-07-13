// app/api/account/route.js
// Token-based customer lookup + address update. No Supabase Auth session required.
// Requires env vars (already in your Vercel project if the portal uses Supabase):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (server-only, never exposed to the client)

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ── CONFIG ──────────────────────────────────────────────────────────────
const TABLE = "shipping_customers";
const COLS = {
  token: "portal_token",
  name: "name",
  phone: "phone",
  address1: "street1",
  address2: "street2",
  city: "city",
  state: "state",
  zip: "zip",
};
// ────────────────────────────────────────────────────────────────────────

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/account?t=<token>  → returns editable fields only
export async function GET(req) {
  const token = req.nextUrl.searchParams.get("t") ?? "";
  if (!UUID_RE.test(token)) {
    return NextResponse.json({ error: "invalid_link" }, { status: 400 });
  }

  const { data, error } = await db()
    .from(TABLE)
    .select(
      [
        COLS.name,
        COLS.phone,
        COLS.address1,
        COLS.address2,
        COLS.city,
        COLS.state,
        COLS.zip,
      ].join(",")
    )
    .eq(COLS.token, token)
    .or("archived.is.null,archived.eq.false")
    .is("merged_into", null)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "server_error", detail: error.message, hint: (process.env.NEXT_PUBLIC_SUPABASE_URL || "no url set") }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    name: data[COLS.name] ?? "",
    phone: data[COLS.phone] ?? "",
    address1: data[COLS.address1] ?? "",
    address2: data[COLS.address2] ?? "",
    city: data[COLS.city] ?? "",
    state: data[COLS.state] ?? "",
    zip: data[COLS.zip] ?? "",
  });
}

// POST /api/account  body: { t, phone, address1, address2, city, state, zip }
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const token = String(body.t ?? "");
  if (!UUID_RE.test(token)) {
    return NextResponse.json({ error: "invalid_link" }, { status: 400 });
  }

  const clean = (v, max) => String(v ?? "").trim().slice(0, max);

  const address1 = clean(body.address1, 120);
  const city = clean(body.city, 80);
  const state = clean(body.state, 40);
  const zip = clean(body.zip, 20);

  if (!address1 || !city || !state || !zip) {
    return NextResponse.json({ error: "missing_fields" }, { status: 422 });
  }

  const update = {
    [COLS.phone]: clean(body.phone, 40),
    [COLS.address1]: address1,
    [COLS.address2]: clean(body.address2, 120),
    [COLS.city]: city,
    [COLS.state]: state,
    [COLS.zip]: zip,
  };

  // The token IS the identity — we never accept a customer id from the client.
  const { data, error } = await db()
    .from(TABLE)
    .update(update)
    .eq(COLS.token, token)
    .or("archived.is.null,archived.eq.false")
    .is("merged_into", null)
    .select(COLS.token)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "server_error", detail: error.message, hint: (process.env.NEXT_PUBLIC_SUPABASE_URL || "no url set") }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
