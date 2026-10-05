import { NextResponse } from "next/server";
import crypto from "crypto";
import { db, requireAdmin, DOCS_BUCKET } from "@/lib/studio/server";
import { DOC_CATEGORIES, DOC_TYPES, MAX_DOC_MB, safeFileName } from "@/lib/studio/document-types";

export const dynamic = "force-dynamic";

/* ============================================================
   POST /api/admin/documents   (admins only)

   Files go straight from the browser to a PRIVATE Supabase Storage
   bucket (so big PDFs and phone photos aren't limited by Vercel),
   using a one-time upload link this route hands out.

   { action: "upload-url", fileName, type, size }  → { path, uploadUrl }
   { action: "create", path, fileName, type, size, ...details }
   { action: "update", id, ...details }
   { action: "delete", id }
   ============================================================ */

function str(v, max) {
  const s = String(v == null ? "" : v).trim().slice(0, max);
  return s || null;
}

function details(b) {
  const title = str(b.title, 140);
  if (!title) return { error: "Give the document a name." };
  const expires = str(b.expires_on, 10);
  if (expires && !/^\d{4}-\d{2}-\d{2}$/.test(expires)) return { error: "Pick a valid expiration date." };
  const remind = Math.round(Number(b.remind_days ?? 30));
  return {
    row: {
      title: title,
      category: DOC_CATEGORIES.includes(b.category) ? b.category : "Other",
      expires_on: expires,
      remind_days: Number.isFinite(remind) && remind >= 0 && remind <= 365 ? remind : 30,
      issued_by: str(b.issued_by, 120),
      number: str(b.number, 80),
      notes: str(b.notes, 1000),
      updated_at: new Date().toISOString(),
    },
  };
}

export async function POST(req) {
  const me = await requireAdmin();
  if (!me.ok) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await req.json().catch(function () { return {}; });
  const storage = db().storage.from(DOCS_BUCKET);

  try {
    if (b.action === "upload-url") {
      if (!DOC_TYPES[b.type]) return NextResponse.json({ error: "That file type isn't supported. Use PDF, a photo, Word or Excel." }, { status: 400 });
      if (!(Number(b.size) > 0) || Number(b.size) > MAX_DOC_MB * 1024 * 1024) {
        return NextResponse.json({ error: "Files can be up to " + MAX_DOC_MB + " MB." }, { status: 400 });
      }
      const path = crypto.randomUUID() + "/" + safeFileName(b.fileName);
      const { data, error } = await storage.createSignedUploadUrl(path);
      if (error) throw error;
      return NextResponse.json({ path: data.path || path, uploadUrl: data.signedUrl });
    }

    if (b.action === "create") {
      const d = details(b);
      if (d.error) return NextResponse.json({ error: d.error }, { status: 400 });
      const path = String(b.path || "");
      if (!/^[0-9a-f-]{36}\/[\w.\- ]{1,100}$/.test(path)) return NextResponse.json({ error: "Upload the file first." }, { status: 400 });

      // Make sure the file really landed in storage.
      const folder = path.split("/")[0];
      const { data: files } = await storage.list(folder);
      if (!files || !files.length) return NextResponse.json({ error: "The upload didn't finish. Try again." }, { status: 400 });

      const { data, error } = await db().from("studio_documents").insert({
        ...d.row,
        file_path: path,
        file_name: str(b.fileName, 200),
        file_type: DOC_TYPES[b.type] ? b.type : null,
        file_size: Math.round(Number(b.size) || 0),
        uploaded_by: me.email,
      }).select().single();
      if (error) throw error;
      return NextResponse.json({ doc: data });
    }

    if (b.action === "update") {
      const d = details(b);
      if (d.error) return NextResponse.json({ error: d.error }, { status: 400 });
      const { data, error } = await db().from("studio_documents").update(d.row).eq("id", b.id).select().single();
      if (error) throw error;
      return NextResponse.json({ doc: data });
    }

    if (b.action === "delete") {
      const { data: doc } = await db().from("studio_documents").select("id, file_path").eq("id", b.id).maybeSingle();
      if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });
      if (doc.file_path) await storage.remove([doc.file_path]);
      const { error } = await db().from("studio_documents").delete().eq("id", doc.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    const msg = /Bucket not found/i.test(e.message || "")
      ? "The document storage isn't set up yet. Run the SQL from the zip in Supabase."
      : e.message || "Something went wrong.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
