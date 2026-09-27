import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import GiftCardSalesActions from "@/components/shop/GiftCardSalesActions";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";
import { db, emailEnabled } from "@/lib/shop/service";

export const dynamic = "force-dynamic";

/* ============================================================
   Erendira's Boutique — Admin Studio · Gift card sales
   Server component. Every online gift card order, with Retry for
   any that got paid but didn't finish, and Resend email.
   The cards themselves also appear on /admin/gift-cards.
   ============================================================ */

function money(v) {
  return "$" + Number(v || 0).toFixed(2);
}

function when(v) {
  if (!v) return "—";
  return new Date(v).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function statusPill(o) {
  if (o.status === "fulfilled") return ["eba-pill ok", "Delivered"];
  if (o.status === "failed") return ["eba-pill mid", "Needs retry"];
  if (o.status === "fulfilling") return ["eba-pill mid", "Working"];
  return ["eba-pill off", "Not paid"];
}

function emailLabel(o) {
  if (o.email_status === "sent") return "Emailed";
  if (o.email_status === "scheduled") return "Sends " + o.deliver_on;
  if (o.email_status === "failed") return "Email failed";
  if (o.email_status === "off") return "No email (shown on screen)";
  return null;
}

export default async function GiftCardSalesPage() {
  const auth = await requireChecksAdmin();
  if (!auth.ok) redirect("/login");

  const user = auth.user || auth.session?.user || null;
  const admin = user
    ? {
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || null,
      }
    : null;

  let rows = [];
  let loadError = null;
  try {
    const { data, error } = await db()
      .from("gift_card_orders")
      .select("*")
      .neq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(250);
    if (error) throw error;
    rows = data || [];
  } catch (e) {
    loadError = e.message;
  }

  // Pending = started checkout but never paid. Only show recent ones, as a count.
  let abandoned = 0;
  try {
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const { count } = await db().from("gift_card_orders").select("id", { count: "exact", head: true })
      .eq("status", "pending").gte("created_at", since);
    abandoned = count || 0;
  } catch (e) {}

  const sold = rows.filter(function (r) { return r.status === "fulfilled"; });
  const revenue = sold.reduce(function (s, r) { return s + Number(r.amount || 0); }, 0);
  const scheduled = sold.filter(function (r) { return r.email_status === "scheduled"; }).length;
  const needsHelp = rows.filter(function (r) { return r.status === "failed" || r.email_status === "failed"; }).length;

  return (
    <AdminShell
      admin={admin}
      active="gift-card-sales"
      eyebrow="ADMIN STUDIO"
      title="Gift Card Sales"
      subtitle="Gift cards customers bought on your site."
      heroStat={{ label: "Sold online", value: sold.length, caption: money(revenue) + " total" }}
      tip={{
        label: "Quick tip",
        body: "Share my.erendirasboutique.com/buy-gift-card on your lives and in your bio, especially before holidays.",
      }}
    >
      <section className="eba-stats" aria-label="Summary">
        <div className="eba-stat">
          <span className="lb">Revenue</span>
          <b>{money(revenue)}</b>
          <span className="cap">From online gift cards</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Scheduled</span>
          <b>{scheduled}</b>
          <span className="cap">Emailing on a future date</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Needs attention</span>
          <b>{needsHelp}</b>
          <span className="cap">Retry or resend below</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Didn&rsquo;t finish</span>
          <b>{abandoned}</b>
          <span className="cap">Left checkout, last 7 days</span>
        </div>
      </section>

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">SHARE</p>
            <h2>Your Gift Card Shop</h2>
          </div>
        </div>
        <a className="eba-cta" href="/buy-gift-card" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <span>
            <h3>Open the shop</h3>
            <p>/buy-gift-card &mdash; what customers see{emailEnabled() ? "" : ". Email delivery is off until Resend is set up."}</p>
          </span>
          <span className="go">Open &rarr;</span>
        </a>
      </div>

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">ORDERS</p>
            <h2>Recent Sales</h2>
          </div>
        </div>

        {loadError ? (
          <div className="eba-err">{loadError} If this is the first time, run the SQL from the zip in Supabase.</div>
        ) : !rows.length ? (
          <div className="eba-empty">No online gift card sales yet.</div>
        ) : (
          <div className="eba-rows">
            {rows.map(function (o) {
              const pill = statusPill(o);
              const email = emailLabel(o);
              const who = o.recipient_name
                ? o.buyer_name + " → " + o.recipient_name
                : o.buyer_name + " (for themselves)";
              const sub = [o.buyer_email, when(o.created_at), o.gift_card_code, email].filter(Boolean).join(" · ");
              return (
                <div className="eba-row" key={o.id}>
                  <span className="eba-who">
                    <span className="n">{who}</span>
                    <span className="s">{sub}</span>
                    {o.message && <span className="s">&ldquo;{o.message}&rdquo;</span>}
                    {o.error && (o.status === "failed" || o.email_status === "failed") && (
                      <span className="s" style={{ color: "#8f3a3a" }}>{o.error}</span>
                    )}
                  </span>
                  <span className={pill[0]}>{pill[1]}</span>
                  <span className="eba-amt">{money(o.amount)}</span>
                  <GiftCardSalesActions order={{
                    id: o.id,
                    status: o.status,
                    email_status: o.email_status,
                    pdf_url: o.pdf_url,
                    has_email: Boolean(o.recipient_email || o.buyer_email),
                  }} canEmail={emailEnabled()} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
