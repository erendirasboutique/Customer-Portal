import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import BrandingForm from "@/components/account/BrandingForm";
import { requireAdmin, getSettings, formatDate } from "@/lib/admin/account-settings";

export const dynamic = "force-dynamic";

/* ============================================================
   Erendira's Boutique — Admin Studio · Branding
   Server component. Saved to admin_settings (key: "branding").
   Read it anywhere on the server with getSettings(["branding"]).
   ============================================================ */

export default async function BrandingPage() {
  const me = await requireAdmin();
  if (!me.ok) redirect("/login");

  let settings;
  let loadError = null;
  try {
    settings = await getSettings(["branding"]);
    loadError = settings._error || null;
  } catch (e) {
    loadError = e.message;
  }

  const branding = settings?.branding || null;
  const updated = settings?._updated?.branding || null;

  return (
    <AdminShell
      admin={me.admin}
      active="branding"
      eyebrow="ADMIN STUDIO"
      title="Branding"
      subtitle="Your logo, colors, and the words customers see after they pay."
      heroStat={{
        label: "Last saved",
        value: updated ? formatDate(updated.at) : "—",
        caption: updated?.by ? "by " + updated.by : "not saved yet",
      }}
      tip={{
        label: "Quick tip",
        body: "Use a logo with a transparent background (PNG or SVG) so it sits cleanly on any color.",
      }}
    >
      {loadError ? (
        <div className="eba-panel">
          <div className="eba-err">
            {loadError} If this is the first time, run supabase/account.sql and add SUPABASE_SERVICE_ROLE_KEY in Vercel.
          </div>
        </div>
      ) : (
        <BrandingForm initial={branding} />
      )}
    </AdminShell>
  );
}
