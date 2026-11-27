// lib/account/resolve.js
//
// Works out whose account a request is for. One customer account, two ways in:
//   1) Personal link   /account?t=<portal_token>   (no sign-in needed)
//   2) Signed in       Supabase session from /customer sign-in: a code by
//                      email or by text, or a passkey (Face ID).
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

export function phoneDigits(value) {
  const d = String(value || "").replace(/\D/g, "");
  return d.length > 10 ? d.slice(-10) : d;
}

// Who is signed in: { email, phone } ("" when not signed in).
// email is set when they signed in with an email code or a passkey on an
// email account; phone (last 10 digits) when they signed in with a text code.
async function sessionIdentity(request) {
  const none = { email: "", phone: "" };
  const header = request.headers.get("authorization") || "";
  const accessToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!accessToken) return none;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return none;
    const auth = createClient(url, anon, { auth: NO_SESSION });
    const { data, error } = await auth.auth.getUser(accessToken);
    if (error || !data || !data.user) return none;
    return {
      email: data.user.email ? String(data.user.email).trim().toLowerCase() : "",
      phone: data.user.phone ? phoneDigits(data.user.phone) : "",
    };
  } catch (e) {
    return none;
  }
}

/* Returns one of:
     { error, status }
     { mode: "link" | "session", customer, signedInEmail, verified, db }

   customer       the shipping_customers row, or null (signed in, no record yet)
   signedInEmail  the Supabase session email, or ""
   signedInPhone  the Supabase session phone (10 digits), or ""
   verified       true when we know the account's EMAIL belongs to this person:
                  signed in with that email (on a personal link: it matches).
                  A text-code sign-in proves the phone, not the email, so it
                  stays false there (full gift card codes need the email). */
export async function resolveAccount(request, bodyToken) {
  const url = new URL(request.url);
  const token = String(bodyToken != null ? bodyToken : url.searchParams.get("t") || "").trim();
  const who = await sessionIdentity(request);
  const signedInEmail = who.email;
  const signedInPhone = who.phone;
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
      signedInPhone,
      verified: Boolean(signedInEmail && linkEmail && signedInEmail === linkEmail),
      db,
    };
  }

  if (!signedInEmail && !signedInPhone) return { error: "not_signed_in", status: 401 };

  const base = () =>
    db.from(CUSTOMERS_TABLE)
      .select("*")
      .or("archived.is.null,archived.eq.false")
      .is("merged_into", null);

  let list = [];
  if (signedInEmail) {
    const { data: rows, error } = await base().ilike("email", exactLike(signedInEmail)).limit(10);
    if (error) {
      console.error("resolveAccount email lookup:", error);
      return { error: "server_error", status: 500 };
    }
    list = rows || [];
  } else {
    // Phones are saved in many formats ("9096814522", "(909) 681-4522"...):
    // narrow by the last 4 digits, then compare all 10 digits here.
    const { data: rows, error } = await base().ilike("phone", "%" + signedInPhone.slice(-4) + "%").limit(50);
    if (error) {
      console.error("resolveAccount phone lookup:", error);
      return { error: "server_error", status: 500 };
    }
    list = (rows || []).filter(function (r) { return phoneDigits(r.phone) === signedInPhone; });
  }

  // Several records: prefer one that has an address.
  const customer =
    list.find(function (r) { return r && r.street1; }) || list[0] || null;

  return {
    mode: "session",
    customer,
    signedInEmail,
    signedInPhone,
    verified: Boolean(signedInEmail),
    db,
  };
}

// The email to find payments and gift cards with.
export function walletEmail(account) {
  if (account.mode === "session" && account.signedInEmail) return account.signedInEmail;
  return String((account.customer && account.customer.email) || "").trim().toLowerCase();
}
