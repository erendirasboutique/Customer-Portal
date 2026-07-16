import Link from "next/link";
import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import NewCheckForm from "@/components/checks/NewCheckForm";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";

export const dynamic = "force-dynamic";

export default async function NewCheckPage() {
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

  const { data: accounts, error } = await auth.supabase
    .from("check_accounts")
    .select("id, name, bank_name, last_check_number")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const next = accounts?.length ? Number(accounts[0].last_check_number || 0) + 1 : "\u2014";

  return (
    <AdminShell
      admin={admin}
      active="checks"
      eyebrow="ADMIN STUDIO"
      title="New Check"
      subtitle="The next check number is reserved when you create the record."
      heroStat={{ label: "Next number", value: '#' + next, caption: "reserved on save" }}
      tip={{
        label: "Quick tip",
        body: "Check numbers come from the account you pick, so make sure the paper in the printer matches.",
      }}
    >
      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">DETAILS</p>
            <h2>Write It Out</h2>
          </div>
          <Link className="eba-btn" href="/admin/checks">Back to checks</Link>
        </div>

        {error ? <div className="eba-err">{error.message}</div> : null}

        {!accounts?.length ? (
          <div className="eba-err">
            No active check account exists. Run the included Supabase SQL and insert your first account.
          </div>
        ) : (
          <NewCheckForm accounts={accounts} />
        )}
      </div>
    </AdminShell>
  );
}
