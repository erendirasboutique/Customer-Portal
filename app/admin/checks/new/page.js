import Link from "next/link";
import { redirect } from "next/navigation";
import NewCheckForm from "@/components/checks/NewCheckForm";
import styles from "@/components/checks/checks.module.css";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";

export const dynamic = "force-dynamic";

export default async function NewCheckPage() {
  const auth = await requireChecksAdmin();
  if (!auth.ok) redirect("/login");

  const { data: accounts, error } = await auth.supabase
    .from("check_accounts")
    .select("id, name, bank_name, last_check_number")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  return (
    <main className={styles.shell}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>New check</h1>
          <p className={styles.subtitle}>The next check number is reserved when you create the record.</p>
        </div>
        <Link className={styles.secondaryButton} href="/admin/checks">
          Back to checks
        </Link>
      </div>

      <section className={styles.card}>
        {error ? <div className={styles.error}>{error.message}</div> : null}
        {!accounts?.length ? (
          <div className={styles.error}>
            No active check account exists. Run the included Supabase SQL and insert your first account.
          </div>
        ) : (
          <NewCheckForm accounts={accounts} />
        )}
      </section>
    </main>
  );
}
