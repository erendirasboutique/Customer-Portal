import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import BrandingForm from "@/components/account/BrandingForm";
import SiteBrandForm from "@/components/account/SiteBrandForm";
import { requireAdmin, getSettings, formatDate } from "@/lib/admin/account-settings";

export const dynamic = "force-dynamic";

/* ============================================================
   Erendira's Boutique — Admin Studio · Branding
   Server component. Two sections:
   - "Your brand on every site" → admin_settings key "site_brand",
     served to every site from /brand/ (see lib/siteBrand.js).
   - "After checkout" page → admin_settings key "branding".
   ============================================================ */

export default async function BrandingPage() {
  const me = await requireAdmin();
  if (!me.ok) redirect("/login");

  let settings;
  let loadError = null;
  try {
    settings = await getSettings(["site_brand", "branding"]);
    loadError = settings._error || null;
  } catch (e) {
    loadError = e.message;
  }

  const branding = settings?.branding || null;
  const siteBrand = settings?.site_brand || null;
  const updatedList = [settings?._updated?.branding, settings?._updated?.site_brand].filter(Boolean);
  const updated = updatedList.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); })[0] || null;

  return (
    <AdminShell
      admin={me.admin}
      active="branding"
      eyebrow="ADMIN STUDIO"
      title="Branding"
      subtitle="Your logo and colors on every site, plus the page customers see after they pay."
      heroStat={{
        label: "Last saved",
        value: updated ? formatDate(updated.at) : "—",
        caption: updated?.by ? "by " + updated.by : "not saved yet",
      }}
      tip={{
        label: "Quick tip",
        body: "Use a PNG logo with a see-through background so it sits cleanly on any color.",
      }}
    >
      {loadError ? (
        <div className="eba-panel">
          <div className="eba-err">
            {loadError} If this is the first time, run supabase/account.sql and add SUPABASE_SERVICE_ROLE_KEY in Vercel.
          </div>
        </div>
      ) : (
        <>
          <SiteBrandForm initial={siteBrand} />
          <div style={{ height: 28 }} />
          <BrandingForm initial={branding} />
        </>
      )}
    </AdminShell>
  );
}
