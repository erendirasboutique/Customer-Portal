import { NextResponse } from "next/server";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";

export async function POST(request, { params }) {
  const { id } = await params;
  const auth = await requireChecksAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    const { reason } = await request.json();
    const cleanReason = String(reason || "").trim();

    if (!cleanReason) {
      return NextResponse.json({ error: "A void reason is required." }, { status: 400 });
    }

    const { data: check, error } = await auth.supabase
      .from("checks")
      .select("id, status")
      .eq("id", id)
      .single();

    if (error || !check) {
      return NextResponse.json({ error: "Check not found." }, { status: 404 });
    }

    if (["void", "cleared"].includes(check.status)) {
      return NextResponse.json(
        { error: `A ${check.status} check cannot be voided.` },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const { data, error: updateError } = await auth.supabase
      .from("checks")
      .update({
        status: "void",
        void_reason: cleanReason,
        voided_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw new Error(updateError.message);

    await auth.supabase.from("check_events").insert({
      check_id: id,
      event_type: "voided",
      performed_by: auth.user.id,
      details: { reason: cleanReason },
    });

    return NextResponse.json({ check: data });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to void check." }, { status: 400 });
  }
}
