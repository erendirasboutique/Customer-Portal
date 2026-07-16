import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CheckActions from "@/components/checks/CheckActions";
import styles from "@/components/checks/checks.module.css";
import { formatMoney } from "@/lib/checks/amount-to-words";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";

export const dynamic = "force-dynamic";

export default async function CheckDetailsPage({ params }) {
  const { id } = await params;
  const auth = await requireChecksAdmin();
  if (!auth.ok) redirect("/login");

  const { data: check, error } = await auth.supabase
    .from("checks")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !check) notFound();

  const details = [
    ["Check number", `#${check.check_number}`],
    ["Status", check.status],
    ["Payee", check.payee],
    ["Amount", formatMoney(check.amount_cents)],
    ["Date", check.check_date],
    ["Memo", check.memo || "—"],
    ["Related type", check.related_type || "—"],
    ["Related ID", check.related_id || "—"],
    ["Mailing address", check.mailing_address || "—"],
    ["Internal notes", check.internal_notes || "—"],
    ["Printed", check.printed_at || "—"],
    ["Voided", check.voided_at || "—"],
  ];

  return (
    <main className={styles.shell}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Check #{check.check_number}</h1>
          <p className={styles.subtitle}>{check.payee}</p>
        </div>
        <Link className={styles.secondaryButton} href="/admin/checks">
          Back to checks
        </Link>
      </div>

      <section className={styles.card}>
        <div className={styles.detailsGrid}>
          {details.map(([label, value]) => (
            <div className={styles.detail} key={label}>
              <span className={styles.detailLabel}>{label}</span>
              <span className={styles.detailValue} style={{ whiteSpace: "pre-line" }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <CheckActions checkId={check.id} status={check.status} />
        </div>

        {check.void_reason ? (
          <div className={styles.error} style={{ marginTop: 18 }}>
            Void reason: {check.void_reason}
          </div>
        ) : null}
      </section>
    </main>
  );
}
