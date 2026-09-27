/* ============================================================
   Erendira's Boutique — gift card balance lookup
   Server-only. Used by /api/gift-card-balance.

   Reads your existing gift_cards table (the same one the admin
   Gift cards page uses) with the Supabase service role key, and
   double-checks the Stripe promotion code so a card used at
   checkout shows as used even if the table hasn't caught up.

   Only the balance and status ever leave the server. The customer's
   name, email, message and Stripe IDs are never sent to the browser.
   ============================================================ */

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Change these if your table or columns are named differently.
const TABLE = "gift_cards";
const LIMIT_TABLE = "gift_card_balance_checks";
const MAX_CHECKS = 8;        // lookups allowed...
const WINDOW_MINUTES = 10;   // ...per this many minutes, per visitor

let cached = null;
function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  if (!cached) cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}

/* ---------------- code cleanup ----------------
   Accepts "eb-ab12-cd34", "EB AB12 CD34", "ebab12cd34", etc. */
export function codeVariants(input) {
  const raw = String(input || "").toUpperCase().trim().replace(/\s+/g, "");
  if (!raw || raw.length > 40 || !/^[A-Z0-9-]+$/.test(raw)) return [];

  const variants = new Set([raw]);
  const bare = raw.replace(/-/g, "");
  variants.add(bare);
  if (/^EB[A-Z0-9]{8}$/.test(bare)) {
    variants.add("EB-" + bare.slice(2, 6) + "-" + bare.slice(6));
  }
  return Array.from(variants);
}

export function maskCode(code) {
  const c = String(code || "");
  if (c.length <= 6) return c;
  // Keep the first 2 and last 4 characters: EB-••••-7K2P
  return c.slice(0, 2) + c.slice(2, -4).replace(/[A-Z0-9]/gi, "•") + c.slice(-4);
}

/* ---------------- rate limit ----------------
   Stops someone from guessing codes one after another. */
function visitorHash(req) {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY || "eb";
  return crypto.createHash("sha256").update(ip + "|" + salt).digest("hex").slice(0, 40);
}

export async function checkRateLimit(req) {
  const hash = visitorHash(req);
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  try {
    const { count, error } = await db()
      .from(LIMIT_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("visitor", hash)
      .gte("created_at", since);
    if (error) throw error;
    if ((count || 0) >= MAX_CHECKS) return { ok: false };

    await db().from(LIMIT_TABLE).insert({ visitor: hash });

    // Tidy up old rows now and then.
    if (Math.random() < 0.05) {
      const old = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await db().from(LIMIT_TABLE).delete().lt("created_at", old);
    }
    return { ok: true };
  } catch (e) {
    // If the SQL hasn't been run yet, don't break the page — just skip the limit.
    console.warn("[gift-card-balance] rate limit skipped:", e.message);
    return { ok: true };
  }
}

/* ---------------- Stripe double-check ---------------- */
async function stripePromo(id) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !id) return null;
  try {
    const res = await fetch("https://api.stripe.com/v1/promotion_codes/" + encodeURIComponent(id), {
      headers: { Authorization: "Bearer " + key },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

/* ---------------- the lookup ---------------- */
export async function lookupBalance(code) {
  const variants = codeVariants(code);
  if (!variants.length) return { found: false };

  const { data, error } = await db().from(TABLE).select("*").in("code", variants).limit(1);
  if (error) throw new Error(error.message);

  const card = data && data[0];
  if (!card) return { found: false };

  const original = Number(card.amount || 0);
  const used = Number(card.total_redeemed || 0);
  let balance = Math.max(0, Math.round((original - used) * 100) / 100);

  let status = "active";
  if (card.status === "redeemed") status = "used";
  else if (card.status && card.status !== "active") status = "inactive";

  const expires = card.expires_at || null;
  if (status === "active" && expires && new Date(expires) < new Date()) status = "expired";

  if (status === "active") {
    const promo = await stripePromo(card.stripe_promotion_code_id);
    if (promo) {
      const maxed = promo.max_redemptions && promo.times_redeemed >= promo.max_redemptions;
      if (maxed) status = "used";
      else if (promo.active === false) status = "inactive";
      if (promo.expires_at && promo.expires_at * 1000 < Date.now()) status = "expired";
    }
  }

  if (status === "used") balance = 0;
  if (status === "active" && balance <= 0) status = "used";

  return {
    found: true,
    code: maskCode(card.code),
    status: status,
    balance: status === "active" ? balance : 0,
    original: original,
    currency: (card.currency || "usd").toUpperCase(),
    expires_at: expires,
  };
}
