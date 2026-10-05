import { NextResponse } from "next/server";
import { db, requireAdmin } from "@/lib/studio/server";

export const dynamic = "force-dynamic";

/* ============================================================
   POST /api/admin/giveaways   (admins only)
   { action: "save", title, winner, entries }   record a winner
   { action: "delete", id }                     remove a record (re-spin)
   ============================================================ */

export async function POST(req) {
  const me = await requireAdmin();
  if (!me.ok) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await req.json().catch(function () { return {}; });

  try {
    if (b.action === "save") {
      const winner = String(b.winner || "").trim().slice(0, 120);
      if (!winner) return NextResponse.json({ error: "No winner to save." }, { status: 400 });
      const { data, error } = await db().from("studio_giveaways").insert({
        title: String(b.title || "").trim().slice(0, 140) || "Giveaway",
        winner: winner,
        entries: Math.max(0, Math.min(100000, Math.round(Number(b.entries) || 0))),
        picked_by: me.email,
      }).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data });
    }

    if (b.action === "delete") {
      const { error } = await db().from("studio_giveaways").delete().eq("id", b.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Something went wrong." }, { status: 500 });
  }
}
