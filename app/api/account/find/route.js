// app/api/account/find/route.js
// POST { lastName, zip, code } -> { token } when exactly one customer matches.
// See lib/findAccount.js for the rules. Needs supabase/find-account.sql.

import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  LIMITS,
  cleanZip,
  cleanCode,
  nameMatches,
  orderMatches,
  hashKey,
  clientIp,
  words,
} from "@/lib/findAccount";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getDatabase() {
  const url = process.env.SHIPPING_SUPABASE_URL;
  const key = process.env.SHIPPING_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SHIPPING_SUPABASE_URL or SHIPPING_SUPABASE_SERVICE_ROLE_KEY");
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

function reply(body, status) {
  return NextResponse.json(body, { status: status || 200, headers: { "Cache-Control": "no-store" } });
}

// Same answer, after the same short pause, whatever was wrong.
async function notFound() {
  await new Promise(function (r) { setTimeout(r, 600); });
  return reply({ error: "not_found" }, 404);
}

async function countSince(db, key, sinceIso, onlyFailed) {
  let q = db.from("portal_lookup_attempts").select("id", { count: "exact", head: true }).eq("key", key).gte("created_at", sinceIso);
  if (onlyFailed) q = q.eq("ok", false);
  const { count, error } = await q;
  if (error) throw error;
  return count || 0;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return reply({ error: "bad_request" }, 400);
  }

  const lastName = String(body.lastName || "").slice(0, 60);
  const zip = cleanZip(body.zip);
  const code = cleanCode(String(body.code || "").slice(0, 40));
  if (words(lastName).join("").length < 2 || !zip || !code) return reply({ error: "missing_fields" }, 422);

  let db;
  try {
    db = await getDatabase();
  } catch (e) {
    console.error("find account db", e);
    return reply({ error: "server_error" }, 500);
  }

  const deviceKey = hashKey("ip", clientIp(request));
  const personKey = hashKey("person", zip + "|" + words(lastName).join(" "));
  const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString();

  try {
    const [byDevice, byPerson] = await Promise.all([
      countSince(db, deviceKey, hourAgo, false),
      countSince(db, personKey, hourAgo, true),
    ]);
    if (byDevice >= LIMITS.perDeviceHour || byPerson >= LIMITS.perPersonHour) {
      return reply({ error: "too_many" }, 429);
    }
  } catch (e) {
    // Without the attempts table there's no limit, so don't allow lookups at all.
    console.error("find account limits (run supabase/find-account.sql)", e);
    return reply({ error: "server_error" }, 500);
  }

  async function record(ok) {
    await db.from("portal_lookup_attempts").insert([
      { key: deviceKey, ok: ok },
      { key: personKey, ok: ok },
    ]);
  }

  try {
    // Everyone in that ZIP whose name has the last name in it.
    const { data: people, error } = await db
      .from("shipping_customers")
      .select("id, name, portal_token")
      .like("zip", zip + "%")
      .or("archived.is.null,archived.eq.false")
      .is("merged_into", null)
      .limit(500);
    if (error) throw error;
    const candidates = (people || []).filter(function (p) { return nameMatches(p.name, lastName); });
    if (!candidates.length) {
      await record(false);
      return notFound();
    }

    // Their orders, including ones on older customer records merged into them.
    const ids = candidates.map(function (c) { return c.id; });
    const { data: merged } = await db.from("shipping_customers").select("id, merged_into").in("merged_into", ids);
    const ownerOf = {};
    ids.forEach(function (id) { ownerOf[id] = id; });
    (merged || []).forEach(function (m) { ownerOf[m.id] = m.merged_into; });

    const { data: orders, error: ordersError } = await db
      .from("shipping_orders")
      .select("customer_id, order_number, tracking_number")
      .in("customer_id", Object.keys(ownerOf))
      .limit(5000);
    if (ordersError) throw ordersError;

    const matchedIds = new Set();
    (orders || []).forEach(function (o) {
      if (orderMatches(o, code)) matchedIds.add(ownerOf[o.customer_id]);
    });

    if (matchedIds.size !== 1) {
      await record(false);
      return notFound();
    }

    const customer = candidates.find(function (c) { return matchedIds.has(c.id); });
    let token = customer.portal_token;
    if (!token) {
      token = crypto.randomUUID();
      const { error: tokErr } = await db.from("shipping_customers").update({ portal_token: token }).eq("id", customer.id).is("portal_token", null);
      if (tokErr) throw tokErr;
      // Read it back in case another request gave them a token at the same moment.
      const { data: fresh } = await db.from("shipping_customers").select("portal_token").eq("id", customer.id).maybeSingle();
      token = (fresh && fresh.portal_token) || token;
    }

    await record(true);
    // Remember this, so an address change soon after gets flagged (app/api/account).
    await db.from("portal_lookups").insert({ customer_id: customer.id });
    return reply({ token: token });
  } catch (e) {
    console.error("find account", e);
    return reply({ error: "server_error" }, 500);
  }
}
