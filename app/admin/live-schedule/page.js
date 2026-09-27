import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import LiveScheduleManager from "@/components/live/LiveScheduleManager";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";
import { db } from "@/lib/shop/service";

export const dynamic = "force-dynamic";

/* ============================================================
   Erendira's Boutique — Admin Studio · Live schedule
   Server component. Add, edit and hide upcoming lives.
   Customers see them at /live-schedule.
   ============================================================ */

export default async function LiveSchedulePage() {
  const auth = await requireChecksAdmin();
  if (!auth.ok) redirect("/login");

  const user = auth.user || auth.session?.user || null;
  const admin = user
    ? {
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || null,
      }
    : null;

  let events = [];
  let loadError = null;
  try {
    const since = new Date(Date.now() - 45 * 86400000).toISOString();
    const { data, error } = await db()
      .from("live_events")
      .select("*")
      .gte("starts_at", since)
      .order("starts_at", { ascending: true })
      .limit(200);
    if (error) throw error;
    events = data || [];
  } catch (e) {
    loadError = e.message;
  }

  const now = Date.now();
  const upcoming = events.filter(function (e) {
    return new Date(e.starts_at).getTime() + (e.duration_minutes || 90) * 60000 > now;
  });
  const published = upcoming.filter(function (e) { return e.is_published; });
  const next = published[0];
  const nextLabel = next
    ? new Date(next.starts_at).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric" })
    : "—";

  return (
    <AdminShell
      admin={admin}
      active="live-schedule"
      eyebrow="ADMIN STUDIO"
      title="Live Schedule"
      subtitle="Plan your lives so customers can add them to their calendar."
      heroStat={{ label: "Next live", value: nextLabel, caption: next ? next.title : "nothing scheduled" }}
      tip={{
        label: "Quick tip",
        body: "Post my.erendirasboutique.com/live-schedule in your bio. Customers can add each live to their phone calendar with one tap.",
      }}
    >
      <section className="eba-stats" aria-label="Summary">
        <div className="eba-stat">
          <span className="lb">Upcoming</span>
          <b>{published.length}</b>
          <span className="cap">Showing to customers</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Hidden</span>
          <b>{upcoming.length - published.length}</b>
          <span className="cap">Drafts only you see</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Past 45 days</span>
          <b>{events.length - upcoming.length}</b>
          <span className="cap">Lives already done</span>
        </div>
      </section>

      {loadError ? (
        <div className="eba-panel">
          <div className="eba-err">{loadError} If this is the first time, run the SQL from the zip in Supabase.</div>
        </div>
      ) : (
        <LiveScheduleManager events={events} />
      )}
    </AdminShell>
  );
}
