/* ============================================================
   Erendira's Boutique — Admin Studio tools (server-only)
   Shared by Bills & supplies, Document vault and Giveaway wheel.
   ============================================================ */

import { createClient } from "@supabase/supabase-js";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";

/* ---------------- database ---------------- */
let cached = null;
export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  if (!cached) cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}

export const DOCS_BUCKET = "studio-documents";

/* ---------------- sign-in (same check as Checks) ---------------- */
export async function requireAdmin() {
  const auth = await requireChecksAdmin();
  if (!auth || !auth.ok) return { ok: false };
  const user = auth.user || auth.session?.user || null;
  const admin = user
    ? {
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || null,
      }
    : null;
  return { ok: true, user: user, admin: admin, email: user?.email || null };
}

/* ---------------- dates (Pacific) ---------------- */
export const TZ = "America/Los_Angeles";

export function todayPT() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function daysBetween(fromYmd, toYmd) {
  const a = Date.UTC(+fromYmd.slice(0, 4), +fromYmd.slice(5, 7) - 1, +fromYmd.slice(8, 10));
  const b = Date.UTC(+toYmd.slice(0, 4), +toYmd.slice(5, 7) - 1, +toYmd.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

function addMonths(dateStr, months) {
  const y = +dateStr.slice(0, 4);
  const m = +dateStr.slice(5, 7) - 1;
  const day = +dateStr.slice(8, 10);
  const target = new Date(Date.UTC(y, m + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return ymd(target);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return ymd(d);
}

export const REPEATS = {
  none: "Doesn't repeat",
  weekly: "Every week",
  biweekly: "Every 2 weeks",
  monthly: "Every month",
  quarterly: "Every 3 months",
  yearly: "Every year",
  custom: "Every ___ days",
};

/* Next due date after this one is done. null = doesn't repeat. */
export function nextDue(dateStr, repeat, everyDays) {
  if (!dateStr) return null;
  switch (repeat) {
    case "weekly": return addDays(dateStr, 7);
    case "biweekly": return addDays(dateStr, 14);
    case "monthly": return addMonths(dateStr, 1);
    case "quarterly": return addMonths(dateStr, 3);
    case "yearly": return addMonths(dateStr, 12);
    case "custom": {
      const n = Math.round(Number(everyDays));
      return n >= 1 && n <= 730 ? addDays(dateStr, n) : null;
    }
    default: return null;
  }
}

/* ---------------- email (optional) ---------------- */
export function emailEnabled() {
  return Boolean(process.env.RESEND_API_KEY && (process.env.STUDIO_FROM_EMAIL || process.env.GIFT_CARD_FROM_EMAIL));
}

export async function sendEmail(msg) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.STUDIO_FROM_EMAIL || process.env.GIFT_CARD_FROM_EMAIL,
      to: Array.isArray(msg.to) ? msg.to : String(msg.to).split(",").map(function (s) { return s.trim(); }).filter(Boolean),
      subject: msg.subject,
      html: msg.html,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(function () { return {}; });
    throw new Error("Email failed: " + (data.message || res.status));
  }
}

export function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function money(v) {
  if (v == null || v === "") return "";
  return "$" + Number(v).toFixed(2);
}

export function prettyDate(ymdStr, opts) {
  if (!ymdStr) return "—";
  return new Date(ymdStr + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: opts && opts.noYear ? undefined : "numeric" });
}
