import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import GiveawayWheel from "@/components/studio/GiveawayWheel";
import { db, requireAdmin } from "@/lib/studio/server";

export const dynamic = "force-dynamic";

/* ============================================================
   Erendira's Boutique — Admin Studio · Giveaway wheel
   Server component. Type in customer names, spin, and every
   winner is saved so you can see who already won.
   ============================================================ */

export default async function GiveawayPage() {
  const me = await requireAdmin();
  if (!me.ok) redirect("/login");

  let history = [];
  let loadError = null;
  try {
    const { data, error } = await db()
      .from("studio_giveaways")
      .select("id, title, winner, entries, picked_by, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    history = data || [];
  } catch (e) {
    loadError = e.message;
  }

  const monthAgo = Date.now() - 30 * 86400000;
  const thisMonth = history.filter(function (h) { return new Date(h.created_at).getTime() > monthAgo; }).length;

  return (
    <AdminShell
      admin={me.admin}
      active="giveaway"
      eyebrow="ADMIN STUDIO"
      title="Giveaway Wheel"
      subtitle="Add your customers' names, spin, and let the wheel pick a winner."
      heroStat={{ label: "Winners", value: thisMonth, caption: "picked in the last 30 days" }}
      tip={{
        label: "Quick tip",
        body: "Press Full screen and share your screen on the live so everyone sees the wheel spin.",
      }}
    >
      {loadError && (
        <div className="eba-panel">
          <div className="eba-err">
            {loadError} The wheel still works, but winners won&rsquo;t be saved until you run the SQL from the zip in Supabase.
          </div>
        </div>
      )}
      <GiveawayWheel history={history} />
    </AdminShell>
  );
}
