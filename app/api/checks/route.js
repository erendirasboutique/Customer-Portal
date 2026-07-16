import { NextResponse } from "next/server";
import { dollarsToCheckWords } from "@/lib/checks/amount-to-words";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";

export const dynamic = "force-dynamic";

function parseAmountToCents(value) {
  const normalized = String(value ?? "").trim();

  if (!/^\d{1,9}(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Enter a valid amount with no more than two decimal places.");
  }

  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

  if (!Number.isSafeInteger(cents) || cents <= 0) {
    throw new Error("The amount must be greater than zero.");
  }

  return cents;
}

export async function GET() {
  const auth = await requireChecksAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { data, error } = await auth.supabase
    .from("checks")
    .select("*")
    .order("check_number", { ascending: false })
    .limit(250);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ checks: data });
}

export async function POST(request) {
  const auth = await requireChecksAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    const body = await request.json();
    const payee = String(body.payee || "").trim();
    const accountId = String(body.accountId || "").trim();
    const checkDate = String(body.checkDate || "").trim();

    if (!accountId) throw new Error("Choose a bank account.");
    if (!payee) throw new Error("Enter the payee.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkDate)) throw new Error("Enter a valid check date.");

    const amountCents = parseAmountToCents(body.amount);
    const amountWords = dollarsToCheckWords(amountCents);

    const { data, error } = await auth.supabase.rpc("create_business_check", {
      p_account_id: accountId,
      p_payee: payee,
      p_amount_cents: amountCents,
      p_amount_words: amountWords,
      p_check_date: checkDate,
      p_memo: String(body.memo || "").trim() || null,
      p_mailing_address: String(body.mailingAddress || "").trim() || null,
      p_internal_notes: String(body.internalNotes || "").trim() || null,
      p_related_type: body.relatedType || null,
      p_related_id: String(body.relatedId || "").trim() || null,
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ check: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to create the check." },
      { status: 400 }
    );
  }
}
