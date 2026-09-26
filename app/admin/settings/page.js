import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import SettingsSection from "@/components/account/SettingsSection";
import { requireAdmin, getSettings, formatDate } from "@/lib/admin/account-settings";

export const dynamic = "force-dynamic";

/* ============================================================
   Erendira's Boutique — Admin Studio · Settings
   Server component. Two sections saved to admin_settings:
   "business" and "preferences". Read them anywhere on the server
   with getSettings(["business", "preferences"]).
   ============================================================ */

const BUSINESS_FIELDS = [
  { name: "display_name", label: "Business name", half: true },
  { name: "legal_name", label: "Legal name (optional)", half: true },
  { name: "email", label: "Business email", type: "email", half: true },
  { name: "phone", label: "Phone", type: "tel", half: true },
  { name: "website", label: "Website", type: "url", placeholder: "https://erendirasboutique.com" },
  { name: "address_line1", label: "Street address" },
  { name: "address_line2", label: "Suite / unit (optional)" },
  { name: "city", label: "City", half: true },
  { name: "state", label: "State", half: true },
  { name: "postal_code", label: "ZIP code", half: true },
  { name: "country", label: "Country", half: true },
];

const PREFERENCE_FIELDS = [
  {
    name: "default_language",
    label: "Default admin language",
    type: "select",
    half: true,
    options: [
      { value: "en", label: "English" },
      { value: "es", label: "Español" },
    ],
  },
  {
    name: "timezone",
    label: "Time zone",
    type: "select",
    half: true,
    options: [
      { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
      { value: "America/Denver", label: "Mountain (Denver)" },
      { value: "America/Phoenix", label: "Arizona (Phoenix)" },
      { value: "America/Chicago", label: "Central (Chicago)" },
      { value: "America/New_York", label: "Eastern (New York)" },
      { value: "America/Mexico_City", label: "Mexico City" },
    ],
  },
  {
    name: "currency",
    label: "Currency",
    type: "select",
    options: [
      { value: "USD", label: "US dollar (USD)" },
      { value: "MXN", label: "Mexican peso (MXN)" },
    ],
  },
  {
    name: "receipt_footer",
    label: "Receipt footer (optional)",
    type: "textarea",
    placeholder: "All sales final after 14 days. Thank you for supporting a small business!",
  },
];

export default async function SettingsPage() {
  const me = await requireAdmin();
  if (!me.ok) redirect("/login");

  let settings;
  let loadError = null;
  try {
    settings = await getSettings(["business", "preferences"]);
    loadError = settings._error || null;
  } catch (e) {
    loadError = e.message;
  }

  const updates = Object.values(settings?._updated || {})
    .map(function (u) { return u.at; })
    .filter(Boolean)
    .sort();
  const lastSaved = updates.length ? updates[updates.length - 1] : null;

  const business = settings?.business || {};
  const addressDone = Boolean(business.address_line1 && business.city && business.state && business.postal_code);

  return (
    <AdminShell
      admin={me.admin}
      active="settings"
      eyebrow="ADMIN STUDIO"
      title="Settings"
      subtitle="Business details and the defaults the admin uses."
      heroStat={{ label: "Last saved", value: lastSaved ? formatDate(lastSaved) : "—", caption: "business & defaults" }}
      tip={{
        label: "Quick tip",
        body: "Fill in your business address once here so every page that needs it pulls from the same place.",
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
          <section className="eba-stats" aria-label="Summary">
            <div className="eba-stat">
              <span className="lb">Business</span>
              <b style={{ fontSize: 24 }}>{business.display_name || "—"}</b>
              <span className="cap">Shown to customers</span>
            </div>
            <div className="eba-stat">
              <span className="lb">Address</span>
              <b>{addressDone ? "Done" : "Missing"}</b>
              <span className="cap">{addressDone ? business.city + ", " + business.state : "Add it below"}</span>
            </div>
            <div className="eba-stat">
              <span className="lb">Language</span>
              <b>{(settings.preferences.default_language || "en").toUpperCase()}</b>
              <span className="cap">Admin default</span>
            </div>
            <div className="eba-stat">
              <span className="lb">Currency</span>
              <b>{settings.preferences.currency || "USD"}</b>
              <span className="cap">For totals and receipts</span>
            </div>
          </section>

          <div className="eba-cols wide-left">
            <SettingsSection
              sectionKey="business"
              eyebrow="START HERE"
              title="Business Profile"
              fields={BUSINESS_FIELDS}
              initial={settings.business}
              saveLabel="Save business profile"
            />
            <SettingsSection
              sectionKey="preferences"
              eyebrow="DEFAULTS"
              title="Preferences"
              fields={PREFERENCE_FIELDS}
              initial={settings.preferences}
              saveLabel="Save preferences"
            />
          </div>
        </>
      )}
    </AdminShell>
  );
}
