/* ============================================================
   "Find my account" (server only)

   A customer without email or phone on file can get back to their
   account page by giving three things only they're likely to know:
     - their last name
     - their ZIP code
     - an order number (EB-2441) or the last 4+ digits of a
       tracking number from one of their packages
   All three must match the same customer, and that customer must
   have an order with that number. Guessing is limited per device
   and per name+ZIP (see LIMITS), every try is recorded, and the
   error never says which part was wrong.
   ============================================================ */

import crypto from "crypto";

export const LIMITS = {
  perDeviceHour: 10, // tries per device (IP) per hour
  perPersonHour: 5, // wrong tries for one last name + ZIP per hour
};

// "José Ángel  Ruíz-López" -> ["jose", "angel", "ruiz", "lopez"]
export function words(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function cleanZip(zip) {
  const m = String(zip || "").match(/\d{5}/);
  return m ? m[0] : "";
}

// "EB-2441" -> { order: 2441 } ; "8507" or "9400 1000 0000 1718 507" -> { digits: "1718507" }
export function cleanCode(code) {
  const raw = String(code || "").trim();
  const eb = raw.match(/^eb\s*-?\s*(\d{1,7})$/i);
  if (eb) return { order: Number(eb[1]), digits: null };
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return null;
  // Only the end of a tracking number is needed; keep at most the last 10.
  return { order: digits.length <= 7 ? Number(digits) : null, digits: digits.slice(-10) };
}

// The last name the customer typed must be one of the words of the name on file
// (so "Lopez" finds "Maria Lopez" and "Ana Ruiz Lopez"), at least 2 letters.
export function nameMatches(nameOnFile, lastName) {
  const typed = words(lastName);
  if (!typed.length || typed.join("").length < 2) return false;
  const onFile = words(nameOnFile);
  return typed.every(function (w) { return onFile.includes(w); });
}

export function orderMatches(order, code) {
  if (!order || !code) return false;
  if (code.order != null && Number(order.order_number) === code.order) return true;
  if (code.digits && order.tracking_number) {
    const tn = String(order.tracking_number).replace(/\D/g, "");
    return tn.length >= code.digits.length && tn.endsWith(code.digits);
  }
  return false;
}

// Hash IPs and names before saving them, so the log holds no personal details.
export function hashKey(kind, value) {
  const salt = process.env.LOOKUP_SALT || process.env.SHIPPING_SUPABASE_SERVICE_ROLE_KEY || "eb";
  return kind + ":" + crypto.createHash("sha256").update(salt + "|" + kind + "|" + value).digest("hex").slice(0, 32);
}

export function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for") || "";
  return fwd.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}
