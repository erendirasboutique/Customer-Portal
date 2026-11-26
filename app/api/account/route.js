// app/api/account/route.js
// The customer account, opened by personal link (?t=) or by magic-link sign-in.

import { NextResponse } from "next/server";
import { sendEmail, emailEnabled } from "@/lib/shop/service";
import { resolveAccount } from "@/lib/account/resolve";

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, maxLength) {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

function jsonError(error, status) {
  return NextResponse.json({ error }, { status });
}

function publicProfile(row, account) {
  const r = row || {};
  return {
    mode: account.mode,
    verified: account.verified,
    hasRecord: Boolean(row),
    name: r[COLS.name] ?? "",
    email: r[COLS.email] || (account.mode === "session" ? account.signedInEmail : ""),
    phone: r[COLS.phone] ?? "",
    address1: r[COLS.address1] ?? "",
    address2: r[COLS.address2] ?? "",
    city: r[COLS.city] ?? "",
    state: r[COLS.state] ?? "",
    zip: r[COLS.zip] ?? "",
  };
}

/* GET /api/account?t=<portal_token>
   GET /api/account  with "Authorization: Bearer <supabase access token>"
   Same answer either way, so both ways in show the same account. */
export async function GET(request) {
  try {
    const account = await resolveAccount(request);
    if (account.error) return jsonError(account.error, account.status);
    return NextResponse.json(publicProfile(account.customer, account), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Account GET error:", error);
    return jsonError("server_error", 500);
  }
}

/* POST /api/account  { t?, name, email, phone, address1, address2, city, state, zip }
   Email rule: an email can be ADDED from a personal link, but an email that is
   already on file can only change by signing in with it (or by the shop).
   Payments and gift cards are found by email, so this stops anyone with a
   link from pointing the account at someone else's inbox. */
export async function POST(request) {
  try {
    let body;

    try {
      body = await request.json();
    } catch {
      return jsonError("bad_request", 400);
    }

    const account = await resolveAccount(request, body.t != null && body.t !== "" ? String(body.t) : null);
    if (account.error) return jsonError(account.error, account.status);

    const name = clean(body.name, 120);
    let email = clean(body.email, 254).toLowerCase();
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

    const before = account.customer;
    const emailOnFile = String((before && before[COLS.email]) || "").trim().toLowerCase();

    if (account.mode === "session") {
      // Signed in: the account's email is the one they signed in with.
      email = emailOnFile || account.signedInEmail;
    } else if (emailOnFile && email !== emailOnFile) {
      return jsonError("email_locked", 403);
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

    const supabase = account.db;

    // Signed in with no shipping record yet: make one.
    if (!before) {
      const { error: insertError } = await supabase
        .from(TABLE)
        .insert({ ...updateData, [COLS.token]: crypto.randomUUID() });
      if (insertError) {
        console.error("Account POST insert error:", insertError);
        return jsonError("server_error", 500);
      }
      return NextResponse.json({ ok: true });
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(updateData)
      .eq("id", before.id)
      .select("id")
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
