import { NextResponse } from "next/server";
import { requireAdmin, serviceClient, getMyRole, canManageTeam, ROLES } from "@/lib/admin/account-settings";

export const dynamic = "force-dynamic";

/* ============================================================
   /api/admin/team
   POST   { email, name, role, sendInvite }  add someone to the roster
   PATCH  { id, role }                       change a role
   DELETE { id }                             remove from the roster

   Only owners and admins can manage the team, and only owners can
   hand out the owner role. You can't remove yourself or the last owner.
   ============================================================ */

async function gate() {
  const me = await requireAdmin();
  if (!me.ok) return { res: NextResponse.json({ error: "Not signed in." }, { status: 401 }) };

  const role = await getMyRole(me.user?.email);
  if (!canManageTeam(role)) {
    return { res: NextResponse.json({ error: "Only owners and admins can manage the team." }, { status: 403 }) };
  }
  return { me: me, role: role };
}

async function ownerCount(db) {
  const { count } = await db.from("admin_team").select("id", { count: "exact", head: true }).eq("role", "owner");
  return count || 0;
}

export async function POST(req) {
  const g = await gate();
  if (g.res) return g.res;

  const body = await req.json().catch(function () { return {}; });
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim().slice(0, 120);
  const role = ROLES.includes(body.role) ? body.role : "staff";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (role === "owner" && g.role !== "owner") {
    return NextResponse.json({ error: "Only an owner can add another owner." }, { status: 403 });
  }

  const db = serviceClient();

  const { data: existing } = await db.from("admin_team").select("id").ilike("email", email).maybeSingle();
  if (existing) return NextResponse.json({ error: "That email is already on the team." }, { status: 409 });

  const { data: member, error } = await db
    .from("admin_team")
    .insert({ email: email, name: name || null, role: role, status: "invited", invited_by: g.me.user?.email || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let inviteNote = "";
  if (body.sendInvite) {
    const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
    const { error: inviteError } = await db.auth.admin.inviteUserByEmail(email, {
      redirectTo: site ? site + "/admin" : undefined,
      data: name ? { full_name: name } : undefined,
    });
    if (inviteError) {
      inviteNote = /registered|exists/i.test(inviteError.message)
        ? "They already have a login, so no invite email was needed."
        : "Added, but the invite email failed: " + inviteError.message;
    } else {
      inviteNote = "Invite email sent.";
    }
  }

  return NextResponse.json({ member: member, note: inviteNote });
}

export async function PATCH(req) {
  const g = await gate();
  if (g.res) return g.res;

  const body = await req.json().catch(function () { return {}; });
  const role = body.role;
  if (!body.id || !ROLES.includes(role)) {
    return NextResponse.json({ error: "Pick a valid role." }, { status: 400 });
  }

  const db = serviceClient();
  const { data: target } = await db.from("admin_team").select("id, email, role").eq("id", body.id).maybeSingle();
  if (!target) return NextResponse.json({ error: "Team member not found." }, { status: 404 });

  if ((role === "owner" || target.role === "owner") && g.role !== "owner") {
    return NextResponse.json({ error: "Only an owner can change owner roles." }, { status: 403 });
  }
  if (target.role === "owner" && role !== "owner" && (await ownerCount(db)) <= 1) {
    return NextResponse.json({ error: "The team needs at least one owner." }, { status: 400 });
  }

  const { data, error } = await db
    .from("admin_team")
    .update({ role: role, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}

export async function DELETE(req) {
  const g = await gate();
  if (g.res) return g.res;

  const body = await req.json().catch(function () { return {}; });
  if (!body.id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const db = serviceClient();
  const { data: target } = await db.from("admin_team").select("id, email, role").eq("id", body.id).maybeSingle();
  if (!target) return NextResponse.json({ error: "Team member not found." }, { status: 404 });

  if (target.email.toLowerCase() === String(g.me.user?.email || "").toLowerCase()) {
    return NextResponse.json({ error: "You can't remove yourself." }, { status: 400 });
  }
  if (target.role === "owner") {
    if (g.role !== "owner") return NextResponse.json({ error: "Only an owner can remove an owner." }, { status: 403 });
    if ((await ownerCount(db)) <= 1) return NextResponse.json({ error: "The team needs at least one owner." }, { status: 400 });
  }

  const { error } = await db.from("admin_team").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
