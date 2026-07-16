import { NextResponse } from "next/server";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";

const ALLOWED_TRANSITIONS = {
  draft: ["approved", "void"],
  approved: ["printed", "void"],
  printed: ["mailed", "cleared", "void"],
  mailed: ["cleared", "void"],
  cleared: [],
  void: [],
};

export async function GET(_request, { params }) {
  const { id } = await params;
  const auth = await requireChecksAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { data, error } = await auth.supabase
    .from("checks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ check: data });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const auth = await requireChecksAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    const { status } = await request.json();

    const { data: current, error: currentError } = await auth.supabase
      .from("checks")
      .select("id, status")
      .eq("id", id)
      .single();

    if (currentError || !current) {
      return NextResponse.json({ error: "Check not found." }, { status: 404 });
    }

    if (!ALLOWED_TRANSITIONS[current.status]?.includes(status)) {
      return NextResponse.json(
        { error: `A ${current.status} check cannot be changed to ${status}.` },
        { status: 409 }
      );
    }

    const updates = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "printed") updates.printed_at = new Date().toISOString();
    if (status === "mailed") updates.mailed_at = new Date().toISOString();
    if (status === "cleared") updates.cleared_at = new Date().toISOString();

    const { data, error } = await auth.supabase
      .from("checks")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    await auth.supabase.from("check_events").insert({
      check_id: id,
      event_type: `status_${status}`,
      performed_by: auth.user.id,
      details: { previous_status: current.status },
    });

    return NextResponse.json({ check: data });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to update check." }, { status: 400 });
  }
}
