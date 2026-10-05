import { redirect } from "next/navigation";
import GiveawayAdmin from "@/components/studio/GiveawayAdmin";
import { db, requireAdmin } from "@/lib/studio/server";

export const dynamic = "force-dynamic";

/* ============================================================
   Erendira's Boutique — Admin Studio · Giveaway wheel (EN / ES)
   Server component. Loads the winners history; the page itself
   (and the language switch) lives in GiveawayAdmin.
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

  return <GiveawayAdmin admin={me.admin} history={history} thisMonth={thisMonth} loadError={loadError} />;
}
