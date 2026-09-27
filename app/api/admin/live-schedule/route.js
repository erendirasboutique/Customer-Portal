import { NextResponse } from "next/server";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";
import { db } from "@/lib/shop/service";

export const dynamic = "force-dynamic";

/* ============================================================
   /api/admin/live-schedule   (admins only)
   POST   { title, starts_at, duration_minutes, description, platform, watch_url, is_published }
   PATCH  { id, ...same fields }
   DELETE { id }
   ============================================================ */

const PLATFORMS = ["facebook", "instagram", "tiktok", "in-store", "other"];

function cleanEvent(b) {
  const title = String(b.title || "").trim().slice(0, 120);
  const starts = new Date(b.starts_at);
  const duration = Math.round(Number(b.duration_minutes || 90));
  const watch = String(b.watch_url || "").trim().slice(0, 500);

  if (!title) return { error: "Give the live a title." };
  if (isNaN(starts.getTime())) return { error: "Pick a date and time." };
  if (!(duration >= 15 && duration <= 600)) return { error: "Length must be 15 minutes to 10 hours." };
  if (watch && !/^https?:\/\//i.test(watch)) return { error: "The watch link must start with https://" };

  return {
    event: {
      title: title,
      starts_at: starts.toISOString(),
      duration_minutes: duration,
      description: String(b.description || "").trim().slice(0, 600) || null,
      platform: PLATFORMS.includes(b.platform) ? b.platform : "facebook",
      watch_url: watch || null,
      is_published: b.is_published !== false,
      updated_at: new Date().toISOString(),
    },
  };
}

async function gate() {
  const auth = await requireChecksAdmin();
  return auth && auth.ok;
}

export async function POST(req) {
  if (!(await gate())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.json().catch(function () { return {}; });
  const c = cleanEvent(body);
  if (c.error) return NextResponse.json({ error: c.error }, { status: 400 });

  const { data, error } = await db().from("live_events").insert(c.event).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}

export async function PATCH(req) {
  if (!(await gate())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.json().catch(function () { return {}; });
  if (!body.id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const c = cleanEvent(body);
  if (c.error) return NextResponse.json({ error: c.error }, { status: 400 });

  const { data, error } = await db().from("live_events").update(c.event).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}

export async function DELETE(req) {
  if (!(await gate())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.json().catch(function () { return {}; });
  if (!body.id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const { error } = await db().from("live_events").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
