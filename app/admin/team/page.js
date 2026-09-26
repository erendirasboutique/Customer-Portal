import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import TeamManager from "@/components/account/TeamManager";
import { requireAdmin, serviceClient, canManageTeam, formatDate } from "@/lib/admin/account-settings";

export const dynamic = "force-dynamic";

/* ============================================================
   Erendira's Boutique — Admin Studio · Team & permissions
   Server component. The roster loads here; adding, role changes
   and removals happen in TeamManager (client) via /api/admin/team.
   ============================================================ */

export default async function TeamPage() {
  const me = await requireAdmin();
  if (!me.ok) redirect("/login");

  const myEmail = String(me.user?.email || "").toLowerCase();
  let rows = [];
  let loadError = null;

  try {
    const db = serviceClient();
    const { data, error } = await db
      .from("admin_team")
      .select("id, email, name, role, status, invited_by, invited_at")
      .order("invited_at", { ascending: true });

    if (error) throw error;
    rows = data || [];

    // First visit: nobody on the roster yet, so whoever opens this page becomes the owner.
    if (!rows.length && myEmail) {
      const { data: first } = await db
        .from("admin_team")
        .insert({ email: myEmail, name: me.admin?.name || null, role: "owner", status: "active" })
        .select()
        .single();
      if (first) rows = [first];
    }

    // Signing in counts as accepting the invite.
    const mine = rows.find(function (r) { return r.email.toLowerCase() === myEmail; });
    if (mine && mine.status === "invited") {
      await db.from("admin_team").update({ status: "active" }).eq("id", mine.id);
      mine.status = "active";
    }
  } catch (e) {
    loadError = e.message || "Could not load the team.";
  }

  const myRole = (rows.find(function (r) { return r.email.toLowerCase() === myEmail; }) || {}).role || null;
  const owners = rows.filter(function (r) { return r.role === "owner"; }).length;
  const admins = rows.filter(function (r) { return r.role === "admin"; }).length;
  const pending = rows.filter(function (r) { return r.status === "invited"; }).length;

  const members = rows.map(function (r) {
    return { ...r, invited_label: formatDate(r.invited_at) };
  });

  return (
    <AdminShell
      admin={me.admin}
      active="team"
      eyebrow="ADMIN STUDIO"
      title="Team"
      subtitle="Invite people, set what they can do, and remove access."
      heroStat={{ label: "Members", value: rows.length, caption: pending ? pending + " invite pending" : "on the team" }}
      tip={{
        label: "Quick tip",
        body: "Give staff the Staff role. Only owners and admins can invite people or change roles.",
      }}
    >
      <section className="eba-stats" aria-label="Summary">
        <div className="eba-stat">
          <span className="lb">Members</span>
          <b>{rows.length}</b>
          <span className="cap">Everyone on the roster</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Owners</span>
          <b>{owners}</b>
          <span className="cap">Full control</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Admins</span>
          <b>{admins}</b>
          <span className="cap">Can manage the team</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Pending</span>
          <b>{pending}</b>
          <span className="cap">Haven&rsquo;t signed in yet</span>
        </div>
      </section>

      {loadError ? (
        <div className="eba-panel">
          <div className="eba-err">
            {loadError} If this is the first time, run supabase/account.sql and add SUPABASE_SERVICE_ROLE_KEY in Vercel.
          </div>
        </div>
      ) : (
        <TeamManager members={members} myEmail={myEmail} myRole={myRole} canManage={canManageTeam(myRole)} />
      )}

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">GOOD TO KNOW</p>
            <h2>What Each Role Can Do</h2>
          </div>
        </div>
        <div className="eba-cells">
          <div className="eba-cell">
            <span className="lb">Owner</span>
            Everything, including adding or removing other owners. The team always keeps at least one.
          </div>
          <div className="eba-cell">
            <span className="lb">Admin</span>
            Everything an owner can do, except change owners. Can invite people and change roles.
          </div>
          <div className="eba-cell">
            <span className="lb">Staff</span>
            Can use the admin pages but can&rsquo;t change who is on the team.
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
