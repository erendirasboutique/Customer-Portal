// lib/account/resolve.js
//
// Works out whose account a request is for. One customer account, two ways in:
//   1) Personal link   /account?t=<portal_token>   (no sign-in needed)
//   2) Magic link      Supabase session from /customer sign-in
//                      (the browser sends "Authorization: Bearer <access_token>")
//
// The shipping record (shipping_customers, in the SHIPPING Supabase) holds the
// address, email and phone. Payments and gift cards live in the BILLING
// Supabase and are found by email.
//
// Env vars:
//   SHIPPING_SUPABASE_URL, SHIPPING_SUPABASE_SERVICE_ROLE_KEY
//   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";

export const CUSTOMERS_TABLE = "shipping_customers";

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NO_SESSION = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

let shippingClient = null;
let billingClient = null;

export function getShippingDb() {
  if (shippingClient) return shippingClient;
  const url = process.env.SHIPPING_SUPABASE_URL;
  const key = process.env.SHIPPING_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SHIPPING_SUPABASE_URL or SHIPPING_SUPABASE_SERVICE_ROLE_KEY");
  }
  shippingClient = createClient(url, key, { auth: NO_SESSION });
  return shippingClient;
}

export function getBillingDb() {
  if (billingClient) return billingClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  billingClient = createClient(url, key, { auth: NO_SESSION });
  return billingClient;
}

// For ilike(): match the email exactly, not as a pattern.
export function exactLike(value) {
  return String(value || "").replace(/[\\%_]/g, function (c) { return "\\" + c; });
}

// The verified email of the signed-in customer, or "" when not signed in.
async function sessionEmail(request) {
  const header = request.headers.get("authorization") || "";
  const accessToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!accessToken) return "";
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return "";
    const auth = createClient(url, anon, { auth: NO_SESSION });
    const { data, error } = await auth.auth.getUser(accessToken);
    if (error || !data || !data.user || !data.user.email) return "";
    return String(data.user.email).trim().toLowerCase();
  } catch (e) {
    return "";
  }
}

/* Returns one of:
     { error, status }
     { mode: "link" | "session", customer, signedInEmail, verified, db }

   customer       the shipping_customers row, or null (signed in, no record yet)
   signedInEmail  the Supabase session email, or ""
   verified       true when we know the email belongs to this person:
                  signed in, and (on a personal link) the link's email matches. */
export async function resolveAccount(request, bodyToken) {
  const url = new URL(request.url);
  const token = String(bodyToken != null ? bodyToken : url.searchParams.get("t") || "").trim();
  const signedInEmail = await sessionEmail(request);
  const db = getShippingDb();

  if (token) {
    if (!UUID_RE.test(token)) return { error: "invalid_link", status: 400 };

    const { data, error } = await db
      .from(CUSTOMERS_TABLE)
      .select("*")
      .eq("portal_token", token)
      .or("archived.is.null,archived.eq.false")
      .is("merged_into", null)
      .maybeSingle();

    if (error) {
      console.error("resolveAccount token lookup:", error);
      return { error: "server_error", status: 500 };
    }
    if (!data) return { error: "not_found", status: 404 };

    const linkEmail = String(data.email || "").trim().toLowerCase();
    return {
      mode: "link",
      customer: data,
      signedInEmail,
      verified: Boolean(signedInEmail && linkEmail && signedInEmail === linkEmail),
      db,
    };
  }

  if (!signedInEmail) return { error: "not_signed_in", status: 401 };

  const { data: rows, error } = await db
    .from(CUSTOMERS_TABLE)
    .select("*")
    .ilike("email", exactLike(signedInEmail))
    .or("archived.is.null,archived.eq.false")
    .is("merged_into", null)
    .limit(10);

  if (error) {
    console.error("resolveAccount email lookup:", error);
    return { error: "server_error", status: 500 };
  }

  // Several records with the same email: prefer one that has an address.
  const list = rows || [];
  const customer =
    list.find(function (r) { return r && r.street1; }) || list[0] || null;

  return { mode: "session", customer, signedInEmail, verified: true, db };
}

// The email to find payments and gift cards with.
export function walletEmail(account) {
  if (account.mode === "session") return account.signedInEmail;
  return String((account.customer && account.customer.email) || "").trim().toLowerCase();
}
