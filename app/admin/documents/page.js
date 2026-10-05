import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import DocumentVault from "@/components/studio/DocumentVault";
import { db, requireAdmin, todayPT, daysBetween } from "@/lib/studio/server";

export const dynamic = "force-dynamic";

/* ============================================================
   Erendira's Boutique — Admin Studio · Document vault
   Server component. Permits, tax forms, insurance, leases...
   Files live in a private Supabase Storage bucket; nobody can open
   one without being signed in to the admin.
   ============================================================ */

export default async function DocumentsPage() {
  const me = await requireAdmin();
  if (!me.ok) redirect("/login");

  const today = todayPT();
  let docs = [];
  let loadError = null;
  try {
    const { data, error } = await db()
      .from("studio_documents")
      .select("id, title, category, expires_on, remind_days, issued_by, number, notes, file_name, file_type, file_size, uploaded_by, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    docs = data || [];
  } catch (e) {
    loadError = e.message;
  }

  const expired = docs.filter(function (d) { return d.expires_on && d.expires_on < today; }).length;
  const soon = docs.filter(function (d) {
    if (!d.expires_on || d.expires_on < today) return false;
    return daysBetween(today, d.expires_on) <= (d.remind_days ?? 30);
  }).length;
  const next = docs
    .filter(function (d) { return d.expires_on && d.expires_on >= today; })
    .sort(function (a, b) { return a.expires_on.localeCompare(b.expires_on); })[0];

  return (
    <AdminShell
      admin={me.admin}
      active="documents"
      eyebrow="ADMIN STUDIO"
      title="Document Vault"
      subtitle="Permits, tax forms, insurance and leases, all in one safe place."
      heroStat={{
        label: "Next to renew",
        value: next ? new Date(next.expires_on + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" }) : "—",
        caption: next ? next.title : "no expiration dates yet",
      }}
      tip={{
        label: "Quick tip",
        body: "Snap a photo of a paper permit with your phone right from this page. Add the expiration date and you'll get a heads-up before it runs out.",
      }}
    >
      <section className="eba-stats" aria-label="Summary">
        <div className="eba-stat">
          <span className="lb">Documents</span>
          <b>{docs.length}</b>
          <span className="cap">Stored privately</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Renew soon</span>
          <b>{soon}</b>
          <span className="cap">Inside their reminder window</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Expired</span>
          <b>{expired}</b>
          <span className="cap">Past the expiration date</span>
        </div>
      </section>

      {loadError ? (
        <div className="eba-panel">
          <div className="eba-err">{loadError} If this is the first time, run the SQL from the zip in Supabase.</div>
        </div>
      ) : (
        <DocumentVault docs={docs} today={today} />
      )}
    </AdminShell>
  );
}
