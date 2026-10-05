import { cookies } from "next/headers";
import PublicGiveaway from "@/components/studio/PublicGiveaway";
import { db } from "@/lib/studio/server";
import { COOKIE, tokenValid, pinConfigured } from "@/lib/studio/giveaway-pin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Giveaway Wheel · Erendira's Boutique",
  robots: { index: false, follow: false },
};

/* ============================================================
   /giveaway-wheel — the wheel without the admin login.
   Staff enter the PIN (GIVEAWAY_PIN) once per device.
   Winners save to the same history as /admin/giveaway.
   ============================================================ */

export default async function GiveawayWheelPage() {
  const jar = await cookies();
  const unlocked = tokenValid(jar.get(COOKIE)?.value);

  let history = [];
  if (unlocked) {
    try {
      const { data } = await db()
        .from("studio_giveaways")
        .select("id, title, winner, entries, picked_by, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      history = data || [];
    } catch (e) {}
  }

  return <PublicGiveaway unlocked={unlocked} configured={pinConfigured()} history={history} />;
}
