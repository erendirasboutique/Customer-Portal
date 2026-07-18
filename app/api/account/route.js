```js
// app/api/account/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getDatabase() {
  const supabaseUrl = process.env.SHIPPING_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SHIPPING_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SHIPPING_SUPABASE_URL or SHIPPING_SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function clean(value, maxLength) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

// GET /api/account?t=<portal_token>
export async function GET(request) {
  try {
    const token =
      request.nextUrl.searchParams.get("t") || "";

    if (!UUID_RE.test(token)) {
      return NextResponse.json(
        { error: "invalid_link" },
        { status: 400 }
      );
    }

    const supabase = getDatabase();

    const selectedColumns = [
      COLS.name,
      COLS.email,
      COLS.phone,
      COLS.address1,
      COLS.address2,
      COLS.city,
      COLS.state,
      COLS.zip,
    ].join(",");

    const result = await supabase
      .from(TABLE)
      .select(selectedColumns)
      .eq(COLS.token, token)
      .or("archived.is.null,archived.eq.false")
      .is("merged_into", null)
      .maybeSingle();

    if (result.error) {
      console.error("Account GET Supabase error:", result.error);

      return NextResponse.json(
        { error: "server_error" },
        { status: 500 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404 }
      );
    }

    const data = result.data;

    return NextResponse.json({
      name: data[COLS.name] || "",
      email: data[COLS.email] || "",
      phone: data[COLS.phone] || "",
      address1: data[COLS.address1] || "",
      address2: data[COLS.address2] || "",
      city: data[COLS.city] || "",
      state: data[COLS.state] || "",
      zip: data[COLS.zip] || "",
    });
  } catch (error) {
    console.error("Account GET error:", error);

    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }
}

// POST /api/account
export async function POST(request) {
  try {
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "bad_request" },
        { status: 400 }
      );
    }

    const token = String(body.t || "");

    if (!UUID_RE.test(token)) {
      return NextResponse.json(
        { error: "invalid_link" },
        { status: 400 }
      );
    }

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

    const updateData = {};

    updateData[COLS.name] = name;
    updateData[COLS.email] = email;
    updateData[COLS.phone] = phone;
    updateData[COLS.address1] = address1;
    updateData[COLS.address2] = address2;
    updateData[COLS.city] = city;
    updateData[COLS.state] = state;
    updateData[COLS.zip] = zip;

    const supabase = getDatabase();

    const result = await supabase
      .from(TABLE)
      .update(updateData)
      .eq(COLS.token, token)
      .or("archived.is.null,archived.eq.false")
      .is("merged_into", null)
      .select(COLS.token)
      .maybeSingle();

    if (result.error) {
      console.error("Account POST Supabase error:", result.error);

      return NextResponse.json(
        { error: "server_error" },
        { status: 500 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Account POST error:", error);

    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }
}
```
