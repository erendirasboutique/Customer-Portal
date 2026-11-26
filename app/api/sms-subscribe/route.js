// app/api/sms-subscribe/route.js
// Public. The /sms sign-up form posts here.
// Saves the customer's consent (exact wording, time, IP, browser) in
// sms_subscribers — the shipping portal only texts numbers in that table —
// then sends the welcome text through Telnyx if it's set up here.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { SMS_CONSENT_ES, SMS_WELCOME, toE164 } from "@/lib/smsConsent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function sendWelcome(to) {
  const key = process.env.TELNYX_API_KEY;
  const from = process.env.TELNYX_FROM;
  if (!key || !from) return;
  const payload = { from, to, text: SMS_WELCOME, type: "SMS" };
  if (process.env.TELNYX_MESSAGING_PROFILE_ID) payload.messaging_profile_id = process.env.TELNYX_MESSAGING_PROFILE_ID;
  const res = await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.errors?.[0]?.detail || data?.errors?.[0]?.title || "Telnyx " + res.status);
  }
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (body.website) return NextResponse.json({ ok: true }); // bot filled the hidden field

  const phone = toE164(body.phone);
  const name = String(body.name || "").trim().slice(0, 120) || null;
  if (!phone) return NextResponse.json({ error: "Escribe un número de celular de EE. UU. de 10 dígitos." }, { status: 400 });
  if (body.consent !== true) return NextResponse.json({ error: "Marca la casilla para aceptar los mensajes de texto." }, { status: 400 });

  let db;
  try {
    db = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: "No pudimos guardar tu número. Intenta de nuevo." }, { status: 500 });
  }

  const { data: existing } = await db.from("sms_subscribers").select("opted_in_at, opted_out_at").eq("phone", phone).maybeSingle();
  // Signed up again within 10 minutes: save, but don't text them twice.
  const recent =
    existing && !existing.opted_out_at && existing.opted_in_at && Date.now() - new Date(existing.opted_in_at).getTime() < 10 * 60 * 1000;

  const { error } = await db.from("sms_subscribers").upsert(
    {
      phone,
      name,
      opted_in_at: new Date().toISOString(),
      opted_out_at: null,
      source: "web:my.erendirasboutique.com/sms",
      consent_text: SMS_CONSENT_ES,
      ip: (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null,
      user_agent: (req.headers.get("user-agent") || "").slice(0, 300) || null,
    },
    { onConflict: "phone" }
  );
  if (error) {
    console.error("[sms-subscribe]", error.message);
    return NextResponse.json({ error: "No pudimos guardar tu número. Intenta de nuevo." }, { status: 500 });
  }

  if (!recent) {
    try {
      await sendWelcome(phone);
    } catch (e) {
      console.error("[sms-subscribe] welcome text failed", e?.message);
    }
  }
  return NextResponse.json({ ok: true });
}
