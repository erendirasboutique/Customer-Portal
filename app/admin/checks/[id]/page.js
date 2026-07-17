import Link from "next/link";
import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import CheckActions from "@/components/checks/CheckActions";
import { formatMoney } from "@/lib/checks/amount-to-words";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";

export const dynamic = "force-dynamic";

/* ============================================================
   Erendira's Boutique — Admin Studio · Check details
   Server component rendering inside AdminShell.
   ============================================================ */

function statusPill(status) {
  if (status === "cleared" || status === "mailed") return "eba-pill ok";
  if (status === "void") return "eba-pill off";
  return "eba-pill mid";
}

function adminFrom(auth) {
  const user = auth.user || auth.session?.user || null;
  if (!user) return null;
  return {
    name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
    email: user.email,
    avatar_url: user.user_metadata?.avatar_url || null,
  };
}

// Timestamps come back as ISO strings; plain dates are already readable.
function stamp(value) {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function Cell({ label, value, wrap }) {
  return (
    <div className="eba-cell">
      <span className="lb">{label}</span>
      <span style={wrap ? { whiteSpace: "pre-line" } : undefined}>{value || "\u2014"}</span>
    </div>
  );
}

export default async function CheckDetailsPage({ params }) {
  const { id } = await params;
  const auth = await requireChecksAdmin();
  if (!auth.ok) redirect("/login");

  const admin = adminFrom(auth);

  const { data: check, error } = await auth.supabase
    .from("checks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !check) {
    return (
      <AdminShell
        admin={admin}
        active="checks"
        eyebrow="ADMIN STUDIO"
        title={error ? "Something broke" : "Check not found"}
        subtitle={error ? "Supabase couldn't read this record." : "It may have been deleted, or your account can't read it."}
      >
        <div className="eba-panel">
          {error ? <div className="eba-err">{error.message}</div> : null}
          <div className="eba-actions">
            <Link className="eba-btn eba-btn-dark" href="/admin/checks">Back to checks</Link>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      admin={admin}
      active="checks"
      eyebrow={"CHECK #" + check.check_number}
      title={check.payee}
      subtitle={check.memo || "No memo on this check."}
      heroStat={{ label: "Amount", value: formatMoney(check.amount_cents), caption: check.check_date }}
    >
      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">THE CHECK</p>
            <h2>Details</h2>
          </div>
          <Link className="eba-btn" href="/admin/checks">Back to checks</Link>
        </div>

        <div className="eba-cells">
          <Cell label="Check number" value={"#" + check.check_number} />
          <Cell label="Status" value={<span className={statusPill(check.status)}>{check.status}</span>} />
          <Cell label="Payee" value={check.payee} />
          <Cell label="Amount" value={formatMoney(check.amount_cents)} />
          <Cell label="Date" value={check.check_date} />
          <Cell label="Memo" value={check.memo} wrap />
        </div>

        <div style={{ marginTop: 18 }}>
          <CheckActions checkId={check.id} status={check.status} />
        </div>

        {check.void_reason ? (
          <div className="eba-err">Void reason: {check.void_reason}</div>
        ) : null}
      </div>

      <div className="eba-panel">
        <p className="eba-eyebrow">RECORD</p>
        <h2>Everything Else</h2>

        <div className="eba-cells">
          <Cell label="Mailing address" value={check.mailing_address} wrap />
          <Cell label="Internal notes" value={check.internal_notes} wrap />
          <Cell label="Related type" value={check.related_type} />
          <Cell label="Related ID" value={check.related_id} />
          <Cell label="Printed" value={stamp(check.printed_at)} />
          <Cell label="Voided" value={stamp(check.voided_at)} />
        </div>
      </div>
    </AdminShell>
  );
}
