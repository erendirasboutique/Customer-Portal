import Link from "next/link";
import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { formatMoney } from "@/lib/checks/amount-to-words";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";

export const dynamic = "force-dynamic";

/* ============================================================
   Erendira's Boutique — Admin Studio · Checks
   Server component. AdminShell is a client component, but it can
   receive server-rendered children, so the table stays on the server.
   ============================================================ */

function statusPill(status) {
  if (status === "cleared" || status === "mailed") return "eba-pill ok";
  if (status === "void") return "eba-pill off";
  return "eba-pill mid";
}

export default async function ChecksPage() {
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

  const { data: checks, error } = await auth.supabase
    .from("checks")
    .select("id, check_number, payee, amount_cents, check_date, memo, status, created_at")
    .order("check_number", { ascending: false })
    .limit(250);

  const rows = checks || [];
  const outstanding = rows.filter(function (c) {
    return c.status !== "cleared" && c.status !== "void";
  });
  const outstandingTotal = outstanding.reduce(function (sum, c) {
    return sum + Number(c.amount_cents || 0);
  }, 0);
  const drafts = rows.filter(function (c) { return c.status === "draft"; }).length;
  const printed = rows.filter(function (c) { return c.status === "printed"; }).length;

  return (
    <AdminShell
      admin={admin}
      active="checks"
      eyebrow="ADMIN STUDIO"
      title="Checks"
      subtitle="Create, print, void, and track business checks."
      heroStat={{ label: "Outstanding", value: outstanding.length, caption: "not cleared yet" }}
      tip={{
        label: "Quick tip",
        body: "A check number is reserved the moment you create the record, so create it only when you plan to write it.",
      }}
    >
      <section className="eba-stats" aria-label="Summary">
        <div className="eba-stat">
          <span className="lb">Checks</span>
          <b>{rows.length}</b>
          <span className="cap">Most recent 250</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Outstanding</span>
          <b>{formatMoney(outstandingTotal)}</b>
          <span className="cap">Written, not cleared</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Drafts</span>
          <b>{drafts}</b>
          <span className="cap">Waiting on approval</span>
        </div>
        <div className="eba-stat">
          <span className="lb">Printed</span>
          <b>{printed}</b>
          <span className="cap">Ready to mail</span>
        </div>
      </section>

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">START HERE</p>
            <h2>Write a Check</h2>
          </div>
        </div>
        <Link className="eba-cta" href="/admin/checks/new" style={{ textDecoration: "none" }}>
          <span>
            <h3>New check</h3>
            <p>Pick the account, payee, and amount &mdash; the number is reserved for you</p>
          </span>
          <span className="go">Start &rarr;</span>
        </Link>
      </div>

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">LEDGER</p>
            <h2>All Checks</h2>
          </div>
        </div>

        {error ? <div className="eba-err">{error.message}</div> : null}

        {!rows.length ? (
          <div className="eba-empty">No checks yet. Write the first one above.</div>
        ) : (
          <div className="eba-tablewrap">
            <table className="eba-table">
              <thead>
                <tr>
                  <th>Check</th>
                  <th>Payee</th>
                  <th>Date</th>
                  <th>Memo</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(function (check) {
                  return (
                    <tr key={check.id}>
                      <td>#{check.check_number}</td>
                      <td><div className="eba-clip">{check.payee}</div></td>
                      <td>{check.check_date}</td>
                      <td><div className="eba-clip">{check.memo || "\u2014"}</div></td>
                      <td>{formatMoney(check.amount_cents)}</td>
                      <td><span className={statusPill(check.status)}>{check.status}</span></td>
                      <td>
                        <Link className="eba-btn mini" href={`/admin/checks/${check.id}`}>
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
