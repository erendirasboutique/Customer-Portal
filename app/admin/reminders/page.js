import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import RemindersManager from "@/components/studio/RemindersManager";
import { db, requireAdmin, todayPT, daysBetween, money } from "@/lib/studio/server";

export const dynamic = "force-dynamic";

/* ============================================================
   Erendira's Boutique — Admin Studio · Bills & supplies
   Server component. Bills with due dates, supplies that run low
   (poly mailers, tape, labels...), and anything else to remember.
   ============================================================ */

export default async function RemindersPage() {
  const me = await requireAdmin();
  if (!me.ok) redirect("/login");

  const today = todayPT();
  let items = [];
  let log = [];
  let loadError = null;

  try {
    const { data, error } = await db().from("studio_reminders").select("*").order("next_due", { ascending: true, nullsFirst: false }).limit(500);
    if (error) throw error;
    items = data || [];

    const { data: l } = await db()
      .from("studio_reminder_log")
      .select("id, reminder_id, action, amount, qty, note, due_date, done_by, created_at")
      .order("created_at", { ascending: false })
      .limit(40);
    log = l || [];
  } catch (e) {
    loadError = e.message;
  }

  const active = items.filter(function (i) { return i.is_active; });
  const overdue = active.filter(function (i) { return i.next_due && i.next_due < today; }).length;
  const thisWeek = active.filter(function (i) {
    return i.next_due && i.next_due >= today && daysBetween(today, i.next_due) <= 7;
  }).length;
  const low = active.filter(function (i) {
    return i.kind === "supply" && i.on_hand != null && i.reorder_at != null && i.on_hand <= i.reorder_at;
  }).length;
  const monthKey = today.slice(0, 7);
  const monthBills = active
    .filter(function (i) { return i.kind === "bill" && i.next_due && i.next_due.slice(0, 7) === monthKey; })
    .reduce(function (s, i) { return s + Number(i.amount || 0); }, 0);

  const attention = overdue + low;

  return (
    <AdminShell
      admin={me.admin}
      active="reminders"
      eyebrow="ADMIN STUDIO"
      title="Bills & Supplies"
      subtitle="Bills to pay, supplies to reorder, and anything else you don't want to forget."
      heroStat={{ label: "Needs attention", value: attention, caption: attention ? "overdue or running low" : "you're all caught up" }}
      tip={{
        label: "Quick tip",
        body: "Count your poly mailers and tape once a week. When they hit the reorder number they jump to the top of this page.",
      }}
    >
      <section className="eba-stats" aria-label="Summary">
        <div className="eba-stat">
          <span className="lb">Overdue</span>
          <b>{overdue}</b>
          <span className="cap">Past the due date</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Due this week</span>
          <b>{thisWeek}</b>
          <span className="cap">Next 7 days</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Running low</span>
          <b>{low}</b>
          <span className="cap">Supplies to reorder</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Bills this month</span>
          <b>{money(monthBills) || "$0.00"}</b>
          <span className="cap">Still due in {new Date(today + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", month: "long" })}</span>
        </div>
      </section>

      {loadError ? (
        <div className="eba-panel">
          <div className="eba-err">{loadError} If this is the first time, run the SQL from the zip in Supabase.</div>
        </div>
      ) : (
        <RemindersManager items={items} log={log} today={today} />
      )}
    </AdminShell>
  );
}
