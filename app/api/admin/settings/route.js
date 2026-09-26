import { NextResponse } from "next/server";
import { requireAdmin, serviceClient, cleanSettings, SETTINGS_DEFAULTS } from "@/lib/admin/account-settings";

export const dynamic = "force-dynamic";

/* ============================================================
   POST /api/admin/settings
   Body: { key: "branding" | "business" | "preferences", value: {...} }
   Only fields listed in SETTINGS_DEFAULTS are saved.
   ============================================================ */

export async function POST(req) {
  const me = await requireAdmin();
  if (!me.ok) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const key = body && body.key;
  if (!SETTINGS_DEFAULTS[key]) {
    return NextResponse.json({ error: "Unknown settings section." }, { status: 400 });
  }

  const value = cleanSettings(key, body.value || {});

  try {
    const { data, error } = await serviceClient()
      .from("admin_settings")
      .upsert(
        { key: key, value: value, updated_at: new Date().toISOString(), updated_by: me.user?.email || null },
        { onConflict: "key" }
      )
      .select("key, value, updated_at, updated_by")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ setting: data });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Could not save." }, { status: 500 });
  }
}
