/* ============================================================
   Staff PIN for the giveaway wheel (server-only).
   Set GIVEAWAY_PIN in Vercel. Entering it once unlocks the wheel
   on that phone/iPad for 30 days. Changing the PIN locks every
   device again.
   ============================================================ */

import crypto from "crypto";
import { db } from "@/lib/studio/server";

export const COOKIE = "eb_giveaway";
export const DAYS = 30;
const MAX_TRIES = 8;          // wrong PINs allowed...
const WINDOW_MIN = 15;        // ...per this many minutes, per device/network

function key() {
  const pin = process.env.GIVEAWAY_PIN || "";
  return crypto.createHash("sha256").update("eb-giveaway|" + pin + "|" + (process.env.SUPABASE_SERVICE_ROLE_KEY || "")).digest();
}

export function pinConfigured() {
  return String(process.env.GIVEAWAY_PIN || "").trim().length >= 4;
}

export function makeToken() {
  const exp = Date.now() + DAYS * 86400000;
  const sig = crypto.createHmac("sha256", key()).update("gw|" + exp).digest("hex");
  return exp + "." + sig;
}

export function tokenValid(token) {
  if (!pinConfigured() || !token) return false;
  const [expStr, sig] = String(token).split(".");
  const exp = Number(expStr);
  if (!exp || exp < Date.now() || !sig) return false;
  const expected = crypto.createHmac("sha256", key()).update("gw|" + exp).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function pinMatches(input) {
  if (!pinConfigured()) return false;
  const a = crypto.createHash("sha256").update(String(input || "").trim()).digest();
  const b = crypto.createHash("sha256").update(String(process.env.GIVEAWAY_PIN).trim()).digest();
  return crypto.timingSafeEqual(a, b);
}

function visitor(req) {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  return crypto.createHash("sha256").update("gw|" + ip).digest("hex").slice(0, 40);
}

export async function tooManyTries(req) {
  try {
    const since = new Date(Date.now() - WINDOW_MIN * 60000).toISOString();
    const { count } = await db().from("giveaway_pin_attempts")
      .select("id", { count: "exact", head: true })
      .eq("visitor", visitor(req)).gte("created_at", since);
    return (count || 0) >= MAX_TRIES;
  } catch (e) {
    return false;
  }
}

export async function recordFailure(req) {
  try {
    await db().from("giveaway_pin_attempts").insert({ visitor: visitor(req) });
  } catch (e) {}
}

export function cookieOptions() {
  return { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: DAYS * 86400 };
}
