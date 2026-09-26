/* ============================================================
   Erendira's Boutique — Admin Studio · Account helpers
   Server-only. Used by the Team, Branding, Integrations, Settings
   and Help pages and by /api/admin/team and /api/admin/settings.

   Access still goes through your existing requireChecksAdmin(),
   so these pages are gated exactly like Checks.

   Database reads/writes use the Supabase service role key. The
   admin_team and admin_settings tables have RLS on with no
   policies, so customers signed in to the portal can never read
   or change them, even with their own Supabase session.
   ============================================================ */

import { createClient } from "@supabase/supabase-js";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";

/* ---------------- auth ---------------- */
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

  return { ok: true, auth: auth, user: user, admin: admin };
}

/* ---------------- service client ---------------- */
let cached = null;

export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Vercel.");
  }
  if (!cached) {
    cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return cached;
}

/* ---------------- settings schema ----------------
   Every saved setting lives in admin_settings as { key, value(jsonb) }.
   Only the keys and fields listed here can be saved. */
export const SETTINGS_DEFAULTS = {
  branding: {
    logo_url: "",
    brand_color: "#eda033",
    accent_color: "#da5e16",
    button_text_color: "#ffffff",
    checkout_headline: "Thank you for shopping with us",
    checkout_message: "",
    support_email: "",
  },
  business: {
    display_name: "Erendira's Boutique",
    legal_name: "",
    email: "",
    phone: "",
    website: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  },
  preferences: {
    default_language: "en",
    timezone: "America/Los_Angeles",
    currency: "USD",
    receipt_footer: "",
  },
};

const COLOR_FIELDS = ["brand_color", "accent_color", "button_text_color"];

export function cleanSettings(key, input) {
  const defaults = SETTINGS_DEFAULTS[key];
  if (!defaults) return null;

  const out = {};
  Object.keys(defaults).forEach(function (field) {
    let v = input && input[field] != null ? String(input[field]).trim().slice(0, 500) : defaults[field];
    if (COLOR_FIELDS.includes(field) && !/^#[0-9a-fA-F]{6}$/.test(v)) v = defaults[field];
    if (field === "default_language" && v !== "en" && v !== "es") v = "en";
    if (field === "logo_url" && v && !/^https?:\/\//i.test(v) && !v.startsWith("/")) v = "";
    out[field] = v;
  });
  return out;
}

export async function getSettings(keys) {
  const wanted = keys || Object.keys(SETTINGS_DEFAULTS);
  const result = { _updated: {} };
  wanted.forEach(function (k) { result[k] = { ...SETTINGS_DEFAULTS[k] }; });

  const { data, error } = await serviceClient()
    .from("admin_settings")
    .select("key, value, updated_at, updated_by")
    .in("key", wanted);

  if (error) return { ...result, _error: error.message };

  (data || []).forEach(function (row) {
    result[row.key] = { ...SETTINGS_DEFAULTS[row.key], ...(row.value || {}) };
    result._updated[row.key] = { at: row.updated_at, by: row.updated_by };
  });
  return result;
}

/* ---------------- team roles ---------------- */
export const ROLES = ["owner", "admin", "staff"];

export async function getMyRole(email) {
  if (!email) return null;
  const { data } = await serviceClient()
    .from("admin_team")
    .select("role")
    .ilike("email", email)
    .maybeSingle();
  return data?.role || null;
}

export function canManageTeam(role) {
  return role === "owner" || role === "admin";
}

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
