import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { requireAdmin } from "@/lib/admin/account-settings";

export const dynamic = "force-dynamic";

/* ============================================================
   Erendira's Boutique — Admin Studio · Help
   Server component. Plain content — edit FAQS, LINKS and
   SUPPORT_EMAIL below to change what shows.
   ============================================================ */

const SUPPORT_EMAIL = "dylan@dylanmontoya.com";

const FAQS = [
  {
    area: "Payment links",
    q: "A customer says their gift card code doesn't work on a payment link.",
    a: "Gift cards are Stripe promo codes, so they only work on links with Promo codes turned on. Edit can't change that setting, so archive the link and make a new one with Promo codes checked.",
  },
  {
    area: "Payment links",
    q: "How do I change the price on a link?",
    a: "Stripe doesn't allow changing the amount on an existing link. Archive it and create a new one with the right amount.",
  },
  {
    area: "Sezzle",
    q: "Can I reuse a Sezzle link for another customer?",
    a: "No. Each Sezzle link is a one-time checkout for one order. Make a new link for every customer and every order.",
  },
  {
    area: "Gift cards",
    q: "What's the difference between Deactivate and Mark redeemed?",
    a: "Deactivate pauses the code and you can turn it back on later. Mark redeemed turns it off for good and records when it was used. Use Mark redeemed when the customer spends it in store.",
  },
  {
    area: "Live link",
    q: "Customers are hitting a Facebook login screen.",
    a: "The video has to be set to Public on Facebook. Friends-only videos ask customers to sign in. Change the video's audience, then paste the link again.",
  },
  {
    area: "Live link",
    q: "When should I update the live link?",
    a: "Right after each live ends. Customers keep opening live.erendirasboutique.com for days, and it sends them wherever the link points.",
  },
  {
    area: "Checks",
    q: "Why did a check number get used up without printing?",
    a: "The number is reserved the moment you create the check. If you won't write it, void it so the ledger shows why the number was skipped.",
  },
  {
    area: "Checks",
    q: "How do I get rid of the TEST ONLY banner on checks?",
    a: "Once your bank confirms the MICR line prints correctly, set CHECK_MICR_READY to true in Vercel and redeploy. Integrations shows whether it's on.",
  },
  {
    area: "Dashboard",
    q: "In-store sales aren't showing up.",
    a: "Clover payments only appear after a sync. Press Sync Clover on the dashboard, ideally once at the end of each day.",
  },
  {
    area: "Team",
    q: "Someone I invited can't get in.",
    a: "Check that the invite email didn't land in spam, and that they signed in with the same email you added. Their status switches from Invited to Active the first time they open the Team page.",
  },
];

const LINKS = [
  { label: "Stripe dashboard", href: "https://dashboard.stripe.com", note: "Payments, refunds, payouts" },
  { label: "Sezzle dashboard", href: "https://dashboard.sezzle.com", note: "BNPL orders and settlements" },
  { label: "Clover dashboard", href: "https://www.clover.com/dashboard", note: "In-store sales" },
  { label: "Shipping portal", href: "https://ship.erendirasboutique.com", note: "Orders and labels" },
  { label: "Vercel", href: "https://vercel.com/dashboard", note: "Keys and deployments" },
  { label: "Supabase", href: "https://supabase.com/dashboard", note: "Database and logins" },
];

const pageCss = '' +
'.eah-faq { display:grid; gap:10px; }' +
'.eah-faq details { background:var(--wash); border:1px solid transparent; border-radius:20px; padding:0 18px;' +
'  transition:border-color .16s ease, background .16s ease; }' +
'.eah-faq details[open] { background:var(--card); border-color:var(--line); }' +
'.eah-faq summary { list-style:none; cursor:pointer; display:flex; align-items:center; gap:12px; padding:15px 0;' +
'  font-size:14.5px; color:var(--ink); }' +
'.eah-faq summary::-webkit-details-marker { display:none; }' +
'.eah-faq summary .q { flex:1; min-width:0; }' +
'.eah-faq summary .plus { flex-shrink:0; width:24px; height:24px; border-radius:50%; display:inline-flex;' +
'  align-items:center; justify-content:center; background:var(--line); color:var(--taupe); font-size:15px;' +
'  transition:transform .16s ease; }' +
'.eah-faq details[open] summary .plus { transform:rotate(45deg); }' +
'.eah-faq .a { margin:0; padding:0 0 16px; font-size:13px; line-height:1.6; color:var(--mute); }' +
'.eah-area { display:block; font-size:9px; letter-spacing:.18em; text-transform:uppercase; color:var(--sand); margin-bottom:3px; }' +
'.eah-links { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr)); gap:10px; }' +
'.eah-link { display:block; background:var(--wash); border:1px solid transparent; border-radius:18px; padding:14px 16px; }' +
'.eah-link:hover { border-color:var(--line); background:var(--card); }' +
'.eah-link b { display:block; font-weight:400; font-size:14px; color:var(--ink); }' +
'.eah-link span { display:block; margin-top:3px; font-size:11.5px; color:var(--mute); }';

export default async function HelpPage() {
  const me = await requireAdmin();
  if (!me.ok) redirect("/login");

  const areas = Array.from(new Set(FAQS.map(function (f) { return f.area; })));
  const mailto =
    "mailto:" + SUPPORT_EMAIL +
    "?subject=" + encodeURIComponent("Admin Studio help") +
    "&body=" + encodeURIComponent("Page:\nWhat happened:\nWhat I expected:\n\nFrom: " + (me.user?.email || ""));

  return (
    <AdminShell
      admin={me.admin}
      active="help"
      eyebrow="ADMIN STUDIO"
      title="Help"
      subtitle="Answers to common questions, and how to reach support."
      heroStat={{ label: "Answers", value: FAQS.length, caption: "across " + areas.length + " areas" }}
      tip={{
        label: "Quick tip",
        body: "When you report a problem, say which page you were on and what you clicked last. It makes fixes much faster.",
      }}
    >
      <style>{pageCss}</style>

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">START HERE</p>
            <h2>Contact Support</h2>
          </div>
        </div>
        <a className="eba-cta" href={mailto} style={{ textDecoration: "none" }}>
          <span>
            <h3>Email support</h3>
            <p>Opens an email with a short template &mdash; just fill in what happened</p>
          </span>
          <span className="go">Write &rarr;</span>
        </a>
      </div>

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">FAQ</p>
            <h2>Common Questions</h2>
          </div>
        </div>
        <div className="eah-faq">
          {FAQS.map(function (f, i) {
            return (
              <details key={i}>
                <summary>
                  <span className="q">
                    <span className="eah-area">{f.area}</span>
                    {f.q}
                  </span>
                  <span className="plus" aria-hidden="true">+</span>
                </summary>
                <p className="a">{f.a}</p>
              </details>
            );
          })}
        </div>
      </div>

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">QUICK LINKS</p>
            <h2>Other Dashboards</h2>
          </div>
        </div>
        <div className="eah-links">
          {LINKS.map(function (l) {
            return (
              <a className="eah-link" key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                <b>{l.label} &#8599;</b>
                <span>{l.note}</span>
              </a>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}
