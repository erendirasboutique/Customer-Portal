import { NextResponse } from "next/server";
import { db } from "@/lib/studio/server";
import { COOKIE, makeToken, tokenValid, pinMatches, pinConfigured, tooManyTries, recordFailure, cookieOptions } from "@/lib/studio/giveaway-pin";

export const dynamic = "force-dynamic";

/* ============================================================
   POST /api/giveaway-wheel   (no admin login — staff PIN instead)
   { action: "unlock", pin }                   PIN → unlocks this device
   { action: "lock" }                          locks this device again
   { action: "save", title, winner, entries }  needs an unlocked device
   { action: "delete", id }                    only spins from the last 15 minutes
                                               ("Doesn't count · spin again")
   ============================================================ */

export async function POST(req) {
  const b = await req.json().catch(function () { return {}; });

  if (b.action === "unlock") {
    if (!pinConfigured()) return NextResponse.json({ error: "The wheel PIN isn't set up yet (GIVEAWAY_PIN in Vercel)." }, { status: 503 });
    if (await tooManyTries(req)) return NextResponse.json({ error: "Too many wrong tries. Wait 15 minutes." }, { status: 429 });
    if (!pinMatches(b.pin)) {
      await recordFailure(req);
      return NextResponse.json({ error: "That PIN isn't right." }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, makeToken(), cookieOptions());
    return res;
  }

  if (b.action === "lock") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, "", { ...cookieOptions(), maxAge: 0 });
    return res;
  }

  if (!tokenValid(req.cookies.get(COOKIE)?.value)) {
    return NextResponse.json({ error: "This device is locked. Enter the PIN again." }, { status: 401 });
  }

  try {
    if (b.action === "save") {
      const winner = String(b.winner || "").trim().slice(0, 120);
      if (!winner) return NextResponse.json({ error: "No winner to save." }, { status: 400 });
      const { data, error } = await db().from("studio_giveaways").insert({
        title: String(b.title || "").trim().slice(0, 140) || "Giveaway",
        winner: winner,
        entries: Math.max(0, Math.min(100000, Math.round(Number(b.entries) || 0))),
        picked_by: "Wheel (staff PIN)",
      }).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data });
    }

    if (b.action === "delete") {
      const since = new Date(Date.now() - 15 * 60000).toISOString();
      const { data, error } = await db().from("studio_giveaways").delete()
        .eq("id", b.id).gte("created_at", since).select("id");
      if (error) throw error;
      if (!data || !data.length) return NextResponse.json({ error: "Only a spin from the last 15 minutes can be undone here." }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Something went wrong." }, { status: 500 });
  }
}
