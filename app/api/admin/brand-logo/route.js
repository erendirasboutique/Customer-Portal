import { NextResponse } from "next/server";
import { requireAdmin, serviceClient } from "@/lib/admin/account-settings";
import { BRAND_BUCKET } from "@/lib/siteBrand";

export const dynamic = "force-dynamic";

/* ============================================================
   POST /api/admin/brand-logo   (multipart, field "file")
   Stores a new site logo in the private documents bucket and
   returns { logo_url: "storage:site-brand/<file>" }. The Branding
   page puts that in the form; it's live once you press Save.
   PNG, JPG or WebP, up to 3 MB.
   ============================================================ */

const TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const MAX_MB = 3;

export async function POST(req) {
  const me = await requireAdmin();
  if (!me.ok) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let file;
  try {
    const form = await req.formData();
    file = form.get("file");
  } catch (e) {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  if (!file || typeof file === "string") return NextResponse.json({ error: "Choose a logo file." }, { status: 400 });

  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Use a PNG, JPG or WebP image." }, { status: 400 });
  if (file.size > MAX_MB * 1024 * 1024) return NextResponse.json({ error: "Logos can be up to " + MAX_MB + " MB." }, { status: 400 });

  const path = "site-brand/logo-" + Date.now() + "." + ext;
  try {
    const { error } = await serviceClient()
      .storage.from(BRAND_BUCKET)
      .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
    if (error) {
      const missing = /bucket/i.test(error.message || "");
      return NextResponse.json(
        { error: missing ? "File storage isn't set up yet. Paste a logo link instead, or run the documents SQL in Supabase." : error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ logo_url: "storage:" + path });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Could not upload." }, { status: 500 });
  }
}
