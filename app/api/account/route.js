```js
// app/api/account/route.js
// Token-based customer lookup + customer details update.
// No Supabase Auth session required.
//
// Requires env vars in THIS portal's Vercel project, copied from the
// SHIPPING portal's Supabase project:
//
//   SHIPPING_SUPABASE_URL
//   SHIPPING_SUPABASE_SERVICE_ROLE_KEY

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ── CONFIG ──────────────────────────────────────────────────────────────
const TABLE = "shipping_customers";

const COLS = {
  token: "portal_token",
  name: "name",
  email: "email",
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
    process.env.SHIPPING_SUPABASE_URL,
    process.env.SHIPPING_SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/account?t=<token>
// Returns only the customer fields that can be edited.
export async function GET(req) {
  const token = req.nextUrl.searchParams.get("t") ?? "";

  if (!UUID_RE.test(token)) {
    return NextResponse.json(
      { error: "invalid_link" },
      { status: 400 }
    );
  }

  const { data, error } = await db()
    .from(TABLE)
    .select(
      [
        COLS.name,
        COLS.email,
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
    console.error("Account GET error:", error);

    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "not_found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    name: data[COLS.name] ?? "",
    email: data[COLS.email] ?? "",
    phone: data[COLS.phone] ?? "",
    address1: data[COLS.address1] ?? "",
    address2: data[COLS.address2] ?? "",
    city: data[COLS.city] ?? "",
    state: data[COLS.state] ?? "",
    zip: data[COLS.zip] ?? "",
  });
}

// POST /api/account
// Body:
// {
//   t,
//   name,
//   email,
//   phone,
//   address1,
//   address2,
//   city,
//   state,
//   zip
// }
export async function POST(req) {
  let body;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request" },
      { status: 400 }
    );
  }

  const token = String(body.t ?? "");

  if (!UUID_RE.test(token)) {
    return NextResponse.json(
      { error: "invalid_link" },
      { status: 400 }
    );
  }

  const clean = (value, maxLength) =>
    String(value ?? "").trim().slice(0, maxLength);

  const name = clean(body.name, 120);
  const email = clean(body.email, 254).toLowerCase();
  const phone = clean(body.phone, 40);
  const address1 = clean(body.address1, 120);
  const address2 = clean(body.address2, 120);
  const city = clean(body.city, 80);
  const state = clean(body.state, 40);
  const zip = clean(body.zip, 20);

  if (!address1 || !city || !state || !zip) {
    return NextResponse.json(
      { error: "missing_fields" },
      { status: 422 }
    );
  }

  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "invalid_email" },
      { status: 422 }
    );
  }

  const update = {
    [COLS.name]: name,
    [COLS.email]: email,
    [COLS.phone]: phone,
    [COLS.address1]: address1,
    [COLS.address2]: address2,
    [COLS.city]: city,
    [COLS.state]: state,
    [COLS.zip]: zip,
  };

  // The portal token is the customer's identity.
  // A customer ID is never accepted from the browser.
  const { data, error } = await db()
    .from(TABLE)
    .update(update)
    .eq(COLS.token, token)
    .or("archived.is.null,archived.eq.false")
    .is("merged_into", null)
    .select(COLS.token)
    .maybeSingle();

  if (error) {
    console.error("Account POST error:", error);

    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "not_found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
```
