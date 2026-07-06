import CustomerPortal from '@/components/CustomerPortal';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export default async function CustomerPage() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return <CustomerPortal initialUser={null} initialPayments={[]} />;
  }

  const adminSupabase = getSupabaseAdmin();

  const { data: payments } = await adminSupabase
    .from('payments')
    .select('*')
    .eq('customer_email', user.email.toLowerCase())
    .order('created_at', { ascending: false });

  return (
    <CustomerPortal
      initialUser={user}
      initialPayments={payments || []}
    />
  );
}
