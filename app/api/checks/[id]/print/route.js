import { NextResponse } from "next/server";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";

export async function POST(_request, { params }) {
  const { id } = await params;
  const auth = await requireChecksAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { data: check, error } = await auth.supabase
    .from("checks")
    .select("id, status, printed_at")
    .eq("id", id)
    .single();

  if (error || !check) {
    return NextResponse.json({ error: "Check not found." }, { status: 404 });
  }

  if (!["approved", "printed", "mailed"].includes(check.status)) {
    return NextResponse.json(
      { error: "Approve this check before printing it." },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const updates =
    check.status === "approved"
      ? { status: "printed", printed_at: check.printed_at || now, updated_at: now }
      : { updated_at: now };

  const { error: updateError } = await auth.supabase
    .from("checks")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await auth.supabase.from("check_events").insert({
    check_id: id,
    event_type: check.printed_at ? "reprinted" : "printed",
    performed_by: auth.user.id,
  });

  return NextResponse.json({ ok: true });
}
