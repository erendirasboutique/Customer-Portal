/* ============================================================
   Shared server-only helpers for the gift card shop and live schedule:
   Supabase (service role), a tiny Stripe client, Resend email,
   dates in Pacific time, and the site URL.
   ============================================================ */

import { createClient } from "@supabase/supabase-js";

/* ---------------- Supabase ---------------- */
let cached = null;
export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  if (!cached) cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}

/* ---------------- Stripe ----------------
   Plain fetch against the Stripe API, so it works whatever version
   of the stripe package you have (or none). */
function encode(params, prefix, out) {
  out = out || [];
  Object.keys(params || {}).forEach(function (k) {
    const v = params[k];
    if (v === undefined || v === null) return;
    const key = prefix ? prefix + "[" + k + "]" : k;
    if (typeof v === "object" && !Array.isArray(v)) encode(v, key, out);
    else if (Array.isArray(v)) {
      v.forEach(function (item, i) {
        if (typeof item === "object") encode(item, key + "[" + i + "]", out);
        else out.push(encodeURIComponent(key + "[" + i + "]") + "=" + encodeURIComponent(item));
      });
    } else out.push(encodeURIComponent(key) + "=" + encodeURIComponent(v));
  });
  return out;
}

export async function stripe(method, path, params, idempotencyKey) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY.");
  const headers = { Authorization: "Bearer " + key };
  let url = "https://api.stripe.com/v1" + path;
  let body;
  if (method === "GET") {
    const q = encode(params).join("&");
    if (q) url += "?" + q;
  } else {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = encode(params).join("&");
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  }
  const res = await fetch(url, { method: method, headers: headers, body: body, cache: "no-store" });
  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    const err = new Error((data.error && data.error.message) || "Stripe error " + res.status);
    err.code = data.error && data.error.code;
    throw err;
  }
  return data;
}

/* ---------------- Email (Resend) ----------------
   Optional. With RESEND_API_KEY and GIFT_CARD_FROM_EMAIL set in
   Vercel, gift cards are emailed. Without them, the buyer gets the
   card on the thank-you page and forwards it themselves. */
export function emailEnabled() {
  return Boolean(process.env.RESEND_API_KEY && process.env.GIFT_CARD_FROM_EMAIL);
}

export async function sendEmail(msg) {
  if (!emailEnabled()) return { skipped: true };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.GIFT_CARD_FROM_EMAIL,
      to: Array.isArray(msg.to) ? msg.to : [msg.to],
      subject: msg.subject,
      html: msg.html,
      reply_to: process.env.GIFT_CARD_REPLY_TO || undefined,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(function () { return {}; });
    throw new Error("Email failed: " + (data.message || res.status));
  }
  return { sent: true };
}

/* ---------------- dates & URLs ---------------- */
export const SHOP_TZ = "America/Los_Angeles";

export function todayPT() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SHOP_TZ }).format(new Date());
}

export function siteUrl(req) {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  if (env) return env;
  if (req) {
    const u = new URL(req.url);
    return u.origin;
  }
  return "";
}

export function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
