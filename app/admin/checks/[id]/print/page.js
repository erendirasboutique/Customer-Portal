import { notFound, redirect } from "next/navigation";
import CheckPrintSheet from "@/components/checks/CheckPrintSheet";
import PrintControls from "@/components/checks/PrintControls";
import { requireChecksAdmin } from "@/lib/checks/supabase-server";

export const dynamic = "force-dynamic";

export default async function PrintCheckPage({ params }) {
  const { id } = await params;
  const auth = await requireChecksAdmin();
  if (!auth.ok) redirect("/login");

  const { data: check, error } = await auth.supabase
    .from("checks")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !check) notFound();

  const canPrint = ["approved", "printed", "mailed"].includes(check.status);

  return (
    <>
      <PrintControls checkId={check.id} canPrint={canPrint} />
      <CheckPrintSheet check={check} />
    </>
  );
}
