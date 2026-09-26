import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { requireAdmin } from "@/lib/admin/account-settings";

export const dynamic = "force-dynamic";

/* ============================================================
   Erendira's Boutique — Admin Studio · Integrations
   Server component. Reads which environment variables are set in
   Vercel and shows a status for each service. Only yes/no is ever
   sent to the browser, never the keys themselves.

   Add or rename a variable: edit INTEGRATIONS below. Where a service
   has used more than one name, any of the names counts.
   ============================================================ */

function has(names) {
  return names.some(function (n) { return Boolean(process.env[n]); });
}
function first(names) {
  for (const n of names) if (process.env[n]) return process.env[n];
  return "";
}

const INTEGRATIONS = [
  {
    key: "stripe",
    name: "Stripe",
    what: "Card payments, payment links, and gift card promo codes.",
    dashboard: "https://dashboard.stripe.com",
    required: [["STRIPE_SECRET_KEY"]],
    optional: [["STRIPE_WEBHOOK_SECRET"]],
    mode: function () {
      const k = first(["STRIPE_SECRET_KEY"]);
      if (k.startsWith("sk_live") || k.startsWith("rk_live")) return "Live";
      if (k.startsWith("sk_test") || k.startsWith("rk_test")) return "Test mode";
      return null;
    },
  },
  {
    key: "sezzle",
    name: "Sezzle",
    what: "Buy now, pay later checkout links.",
    dashboard: "https://dashboard.sezzle.com",
    required: [["SEZZLE_PUBLIC_KEY"], ["SEZZLE_PRIVATE_KEY"]],
    optional: [["SEZZLE_BASE_URL", "SEZZLE_BASE"]],
    mode: function () {
      const base = first(["SEZZLE_BASE_URL", "SEZZLE_BASE"]);
      if (!base) return null;
      return /sandbox/i.test(base) ? "Sandbox" : "Live";
    },
  },
  {
    key: "clover",
    name: "Clover",
    what: "In-store payments pulled in by Sync Clover on the dashboard.",
    dashboard: "https://www.clover.com/dashboard",
    required: [["CLOVER_API_TOKEN", "CLOVER_ACCESS_TOKEN", "CLOVER_TOKEN"], ["CLOVER_MERCHANT_ID", "CLOVER_MID"]],
    optional: [],
  },
  {
    key: "supabase",
    name: "Supabase",
    what: "Database and sign-in for the portal and admin.",
    dashboard: "https://supabase.com/dashboard",
    required: [["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"], ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"]],
    optional: [["SUPABASE_SERVICE_ROLE_KEY"]],
  },
  {
    key: "dub",
    name: "Dub.co",
    what: "Branded short links for payment and portal links.",
    dashboard: "https://app.dub.co",
    required: [["DUB_API_KEY", "DUB_TOKEN"]],
    optional: [],
  },
  {
    key: "checks",
    name: "Check printing (MICR)",
    what: "Removes the TEST ONLY banner once your bank confirms the MICR line.",
    dashboard: null,
    required: [],
    optional: [],
    custom: function () {
      return process.env.CHECK_MICR_READY === "true"
        ? { state: "ok", label: "Ready" }
        : { state: "mid", label: "Test only" };
    },
  },
  {
    key: "site",
    name: "Site URL",
    what: "Used for redirects after payment and invite emails.",
    dashboard: null,
    required: [["NEXT_PUBLIC_SITE_URL"]],
    optional: [],
    detail: function () {
      return first(["NEXT_PUBLIC_SITE_URL"]) || null;
    },
  },
];

function statusFor(item) {
  if (item.custom) return item.custom();

  const missing = item.required.filter(function (names) { return !has(names); });
  if (missing.length === item.required.length && item.required.length) {
    return { state: "off", label: "Not connected", missing: missing };
  }
  if (missing.length) return { state: "mid", label: "Incomplete", missing: missing };

  const mode = item.mode ? item.mode() : null;
  if (mode && mode !== "Live") return { state: "mid", label: mode, missing: [] };
  return { state: "ok", label: mode || "Connected", missing: [] };
}

const pageCss = '' +
'.eai-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr)); gap:14px; }' +
'.eai-card { background:var(--wash); border:1px solid var(--line); border-radius:22px; padding:18px 18px 16px;' +
'  display:flex; flex-direction:column; gap:10px; min-width:0; }' +
'.eai-top { display:flex; align-items:center; justify-content:space-between; gap:10px; }' +
'.eai-name { margin:0; font-size:17px; color:var(--ink); }' +
'.eai-what { margin:0; font-size:12.5px; line-height:1.5; color:var(--mute); }' +
'.eai-vars { margin:0; padding:0; list-style:none; display:grid; gap:4px; }' +
'.eai-vars li { font-size:11px; color:var(--mute); overflow-wrap:anywhere; }' +
'.eai-vars code { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:10.5px; }' +
'.eai-dot { display:inline-block; width:7px; height:7px; border-radius:50%; margin-right:7px; vertical-align:1px; }' +
'.eai-dot.y { background:var(--sand); }' +
'.eai-dot.n { background:transparent; border:1px solid var(--sand); }' +
'.eai-foot { margin-top:auto; display:flex; flex-wrap:wrap; gap:6px; }';

function VarList(props) {
  if (!props.groups.length) return null;
  return (
    <ul className="eai-vars">
      {props.groups.map(function (names) {
        const set = has(names);
        return (
          <li key={names.join("|")}>
            <span className={set ? "eai-dot y" : "eai-dot n"} />
            <code>{names.join(" or ")}</code>
            {props.optional ? " (optional)" : ""}
            {set ? "" : " — not set"}
          </li>
        );
      })}
    </ul>
  );
}

export default async function IntegrationsPage() {
  const me = await requireAdmin();
  if (!me.ok) redirect("/login");

  const items = INTEGRATIONS.map(function (item) {
    return { item: item, status: statusFor(item), detail: item.detail ? item.detail() : null };
  });

  const connected = items.filter(function (x) { return x.status.state === "ok"; }).length;
  const attention = items.filter(function (x) { return x.status.state === "mid"; }).length;
  const off = items.filter(function (x) { return x.status.state === "off"; }).length;

  return (
    <AdminShell
      admin={me.admin}
      active="integrations"
      eyebrow="ADMIN STUDIO"
      title="Integrations"
      subtitle="Which services are hooked up, and what's missing."
      heroStat={{ label: "Connected", value: connected + " / " + items.length, caption: "services ready" }}
      tip={{
        label: "Quick tip",
        body: "Keys live in Vercel → Settings → Environment Variables. Redeploy after changing one so it takes effect.",
      }}
    >
      <style>{pageCss}</style>

      <section className="eba-stats" aria-label="Summary">
        <div className="eba-stat">
          <span className="lb">Connected</span>
          <b>{connected}</b>
          <span className="cap">Live and ready</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Needs a look</span>
          <b>{attention}</b>
          <span className="cap">Test mode or incomplete</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Not connected</span>
          <b>{off}</b>
          <span className="cap">No keys found</span>
        </div>
      </section>

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">SERVICES</p>
            <h2>Connections</h2>
          </div>
        </div>

        <div className="eai-grid">
          {items.map(function (x) {
            const item = x.item;
            return (
              <div className="eai-card" key={item.key}>
                <div className="eai-top">
                  <h3 className="eai-name">{item.name}</h3>
                  <span className={"eba-pill " + x.status.state}>{x.status.label}</span>
                </div>
                <p className="eai-what">{item.what}</p>
                {x.detail && <p className="eai-what" style={{ overflowWrap: "anywhere" }}>{x.detail}</p>}
                <VarList groups={item.required} />
                <VarList groups={item.optional} optional />
                {item.key === "checks" && (
                  <ul className="eai-vars">
                    <li>
                      <span className={process.env.CHECK_MICR_READY === "true" ? "eai-dot y" : "eai-dot n"} />
                      <code>CHECK_MICR_READY=true</code>
                    </li>
                  </ul>
                )}
                {item.dashboard && (
                  <div className="eai-foot">
                    <a className="eba-btn mini" href={item.dashboard} target="_blank" rel="noopener noreferrer">
                      Open {item.name} &#8599;
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">GOOD TO KNOW</p>
            <h2>Changing a Key</h2>
          </div>
        </div>
        <div className="eba-cells">
          <div className="eba-cell">
            <span className="lb">Where keys live</span>
            In Vercel, open the project, then Settings &rarr; Environment Variables. Nothing on this page can change them.
          </div>
          <div className="eba-cell">
            <span className="lb">After you change one</span>
            Redeploy from the Deployments tab. The old value stays in use until you do.
          </div>
          <div className="eba-cell">
            <span className="lb">Test vs. live</span>
            Stripe keys starting with sk_test and a Sezzle base URL with &ldquo;sandbox&rdquo; mean no real money moves.
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
