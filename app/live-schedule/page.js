import LiveSchedule from "@/components/live/LiveSchedule";
import { db } from "@/lib/shop/service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Live Schedule · Erendira's Boutique",
  description: "Upcoming Erendira's Boutique lives. Add them to your calendar so you never miss a drop.",
};

/* Public page: /live-schedule */
export default async function LiveSchedulePage() {
  let events = [];
  try {
    const since = new Date(Date.now() - 10 * 3600000).toISOString();
    const { data } = await db()
      .from("live_events")
      .select("id, title, starts_at, duration_minutes, description, platform, watch_url")
      .eq("is_published", true)
      .gte("starts_at", since)
      .order("starts_at", { ascending: true })
      .limit(40);
    const now = Date.now();
    events = (data || []).filter(function (e) {
      return new Date(e.starts_at).getTime() + (e.duration_minutes || 90) * 60000 > now;
    });
  } catch (e) {
    console.error("[live-schedule]", e);
  }

  return <LiveSchedule events={events} />;
}
