// app/api/account/wallet/route.js
//
// GET /api/account/wallet?t=<portal_token>
// GET /api/account/wallet  with "Authorization: Bearer <access token>"
//
// The customer's payments and gift cards (BILLING Supabase), found by email.
//
// On a personal link alone (or a text-code sign-in, which proves the phone,
// not the email) we can't be sure the email on file is theirs, so
// gift card codes come back masked and receipt links are left out. Signing in
// with that email (one tap: we email them a link) shows everything.

import { NextResponse } from "next/server";
import { resolveAccount, walletEmail, getBillingDb, exactLike } from "@/lib/account/resolve";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonError(error, status) {
  return NextResponse.json({ error }, { status });
}

// "EB-AMJ4-R0GD-NKHF" -> "•••• NKHF"
function maskCode(code) {
  const s = String(code || "");
  return s ? "•••• " + s.slice(-4) : "";
}

// "dylan@dylanmontoya.com" -> "d••••@dylanmontoya.com"
function maskEmail(email) {
  const parts = String(email || "").split("@");
  if (parts.length !== 2 || !parts[0]) return "";
  return parts[0].charAt(0) + "••••@" + parts[1];
}

function safeHttps(u) {
  return typeof u === "string" && /^https:\/\//i.test(u) ? u : null;
}

export async function GET(request) {
  try {
    const account = await resolveAccount(request);
    if (account.error) return jsonError(account.error, account.status);

    const email = walletEmail(account);
    const full = account.verified;
    const result = { full, emailHint: full ? "" : maskEmail(email), payments: [], giftCards: [] };

    if (!email) {
      return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
    }

    const billing = getBillingDb();

    const { data: payRows, error: payError } = await billing
      .from("payments")
      .select("id, amount_total, currency, description, created_at, payment_method, payment_method_brand, payment_method_last4, payment_status, refund_status, receipt_url")
      .ilike("customer_email", exactLike(email))
      .order("created_at", { ascending: false })
      .limit(50);

    if (payError) {
      console.error("Wallet payments error:", payError);
    } else {
      result.payments = (payRows || []).map(function (p) {
        return {
          id: String(p.id),
          amount: Number(p.amount_total || 0),
          currency: p.currency || "usd",
          description: p.description ? String(p.description).slice(0, 120) : "",
          createdAt: p.created_at,
          brand: p.payment_method_brand || p.payment_method || "",
          last4: p.payment_method_last4 || "",
          status: p.payment_status || "",
          refunded: String(p.refund_status || "").toLowerCase() === "refunded",
          receiptUrl: full ? safeHttps(p.receipt_url) : null,
        };
      });
    }

    const { data: cards, error: cardError } = await billing
      .from("gift_cards")
      .select("id, code, amount, total_redeemed, status, last_redeemed_at, created_at")
      .ilike("customer_email", exactLike(email))
      .order("created_at", { ascending: false })
      .limit(20);

    if (cardError) {
      console.error("Wallet gift cards error:", cardError);
    } else {
      result.giftCards = (cards || []).map(function (c) {
        const amount = Number(c.amount || 0);
        const redeemed = Number(c.total_redeemed || 0);
        return {
          id: String(c.id || c.code),
          code: full ? c.code : maskCode(c.code),
          amount,
          remaining: Math.max(0, Math.round((amount - redeemed) * 100) / 100),
          status: c.status || "",
          lastUsedAt: c.last_redeemed_at,
        };
      });
    }

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Wallet GET error:", error);
    return jsonError("server_error", 500);
  }
}
