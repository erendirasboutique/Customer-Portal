// app/api/account/route.js

import { NextResponse } from "next/server";
import { sendEmail, emailEnabled } from "@/lib/shop/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

async function getDatabase() {
  const supabaseUrl = process.env.SHIPPING_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SHIPPING_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SHIPPING_SUPABASE_URL or SHIPPING_SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  const supabasePackage = await import("@supabase/supabase-js");
  const createClient = supabasePackage.createClient;

  if (typeof createClient !== "function") {
    throw new Error(
      "@supabase/supabase-js did not provide createClient"
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
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

function jsonError(error, status) {
  return NextResponse.json(
    {
      error,
    },
    {
      status,
    }
  );
}

// GET /api/account?t=<portal_token>
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("t") ?? "";

    if (!UUID_RE.test(token)) {
      return jsonError("invalid_link", 400);
    }

    const supabase = await getDatabase();

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

    const { data, error } = await supabase
      .from(TABLE)
      .select(selectedColumns)
      .eq(COLS.token, token)
      .or("archived.is.null,archived.eq.false")
      .is("merged_into", null)
      .maybeSingle();

    if (error) {
      console.error("Account GET Supabase error:", error);
      return jsonError("server_error", 500);
    }

    if (!data) {
      return jsonError("not_found", 404);
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
  } catch (error) {
    console.error("Account GET error:", error);
    return jsonError("server_error", 500);
  }
}

// POST /api/account
export async function POST(request) {
  try {
    let body;

    try {
      body = await request.json();
    } catch {
      return jsonError("bad_request", 400);
    }

    const token = String(body.t ?? "");

    if (!UUID_RE.test(token)) {
      return jsonError("invalid_link", 400);
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
      return jsonError("missing_fields", 422);
    }

    if (email && !EMAIL_RE.test(email)) {
      return jsonError("invalid_email", 422);
    }

    const updateData = {
      [COLS.name]: name,
      [COLS.email]: email,
      [COLS.phone]: phone,
      [COLS.address1]: address1,
      [COLS.address2]: address2,
      [COLS.city]: city,
      [COLS.state]: state,
      [COLS.zip]: zip,
    };

    const supabase = await getDatabase();

    // The address before this save, to tell if it changed (see flagAddressChange).
    const { data: before } = await supabase
      .from(TABLE)
      .select("id, " + [COLS.address1, COLS.address2, COLS.city, COLS.state, COLS.zip].join(","))
      .eq(COLS.token, token)
      .maybeSingle();

    const { data, error } = await supabase
      .from(TABLE)
      .update(updateData)
      .eq(COLS.token, token)
      .or("archived.is.null,archived.eq.false")
      .is("merged_into", null)
      .select(COLS.token)
      .maybeSingle();

    if (error) {
      console.error("Account POST Supabase error:", error);
      return jsonError("server_error", 500);
    }

    if (!data) {
      return jsonError("not_found", 404);
    }

    await flagAddressChange(supabase, before, { name, address1, address2, city, state, zip });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Account POST error:", error);
    return jsonError("server_error", 500);
  }
}

/* If the address changed within 30 days of the customer getting in through
   "Find my account" (name + ZIP + order number, no email or phone), let the
   shop know before the next label goes out. Never blocks the save. */
async function flagAddressChange(supabase, before, after) {
  try {
    if (!before || !before.id) return;
    const norm = function (v) { return String(v || "").trim().toLowerCase(); };
    const fields = [[COLS.address1, "address1"], [COLS.address2, "address2"], [COLS.city, "city"], [COLS.state, "state"], [COLS.zip, "zip"]];
    const changed = fields.some(function (f) { return norm(before[f[0]]) !== norm(after[f[1]]); });
    if (!changed) return;

    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: lookups, error } = await supabase
      .from("portal_lookups")
      .select("id")
      .eq("customer_id", before.id)
      .gte("created_at", since)
      .limit(1);
    if (error || !lookups || !lookups.length) return;

    const oldText = [before[COLS.address1], before[COLS.address2], [before[COLS.city], before[COLS.state]].filter(Boolean).join(", "), before[COLS.zip]].filter(Boolean).join(" · ");
    const newText = [after.address1, after.address2, [after.city, after.state].filter(Boolean).join(", "), after.zip].filter(Boolean).join(" · ");

    await supabase.from("portal_address_alerts").insert({
      customer_id: before.id,
      old_address: oldText,
      new_address: newText,
    });

    if (emailEnabled()) {
      const esc = function (v) { return String(v || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
      await sendEmail({
        to: process.env.ADDRESS_ALERT_EMAIL || "info@erendirasboutique.com",
        subject: "Address changed: " + (after.name || "a customer") + " (check before shipping)",
        html:
          "<p><b>" + esc(after.name || "A customer") + "</b> changed their shipping address after finding their account with name, ZIP and order number (no email or phone on file).</p>" +
          "<p>Before: " + esc(oldText) + "<br>Now: " + esc(newText) + "</p>" +
          "<p>If this wasn't them, change it back in the shipping portal before printing their next label.</p>",
      });
    }
  } catch (e) {
    console.error("Address change flag error:", e);
  }
}
