import Link from "next/link";
import { redirect } from "next/navigation";
import styles from "@/components/checks/checks.module.css";
import { formatMoney } from "@/lib/checks/amount-to-words";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";

export const dynamic = "force-dynamic";

function statusClass(status) {
  const map = {
    draft: styles.statusDraft,
    approved: styles.statusApproved,
    printed: styles.statusPrinted,
    mailed: styles.statusMailed,
    cleared: styles.statusCleared,
    void: styles.statusVoid,
  };

  return `${styles.status} ${map[status] || ""}`;
}

export default async function ChecksPage() {
  const auth = await requireChecksAdmin();
  if (!auth.ok) redirect("/login");

  const { data: checks, error } = await auth.supabase
    .from("checks")
    .select("id, check_number, payee, amount_cents, check_date, memo, status, created_at")
    .order("check_number", { ascending: false })
    .limit(250);

  return (
    <main className={styles.shell}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Checks</h1>
          <p className={styles.subtitle}>Create, print, void, and track business checks.</p>
        </div>
        <Link className={styles.button} href="/admin/checks/new">
          + New check
        </Link>
      </div>

      <section className={styles.card}>
        {error ? <div className={styles.error}>{error.message}</div> : null}

        {!checks?.length ? (
          <div className={styles.empty}>No checks have been created yet.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
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
                {checks.map((check) => (
                  <tr key={check.id}>
                    <td>#{check.check_number}</td>
                    <td className={styles.payeeCell}>{check.payee}</td>
                    <td>{check.check_date}</td>
                    <td className={styles.payeeCell}>{check.memo || "—"}</td>
                    <td>{formatMoney(check.amount_cents)}</td>
                    <td><span className={statusClass(check.status)}>{check.status}</span></td>
                    <td>
                      <Link className={styles.secondaryButton} href={`/admin/checks/${check.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
