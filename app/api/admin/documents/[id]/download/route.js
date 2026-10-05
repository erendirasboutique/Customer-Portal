import { NextResponse } from "next/server";
import { db, requireAdmin, DOCS_BUCKET } from "@/lib/studio/server";

export const dynamic = "force-dynamic";

/* ============================================================
   GET /api/admin/documents/:id/download   (admins only)
   ?view=1 opens it in the browser instead of downloading.
   Sends a link that only works for 2 minutes, so a copied or
   forwarded link stops working right away.
   ============================================================ */

export async function GET(req, ctx) {
  const me = await requireAdmin();
  if (!me.ok) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const params = await ctx.params;
  const { data: doc } = await db().from("studio_documents").select("file_path, file_name").eq("id", params.id).maybeSingle();
  if (!doc || !doc.file_path) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const view = new URL(req.url).searchParams.get("view") === "1";
  const { data, error } = await db()
    .storage.from(DOCS_BUCKET)
    .createSignedUrl(doc.file_path, 120, view ? undefined : { download: doc.file_name || true });

  if (error || !data) return NextResponse.json({ error: (error && error.message) || "Could not open the file." }, { status: 500 });
  return NextResponse.redirect(data.signedUrl, { headers: { "Cache-Control": "no-store" } });
}
