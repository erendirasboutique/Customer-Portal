import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import CustomerPortal from '@/components/CustomerPortal';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;
  let user = null;
  let payments = [];

  if (token) {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.auth.getUser(token);
    user = data?.user || null;

    if (user?.email) {
      const { data: rows = [] } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_email', user.email.toLowerCase())
        .order('created_at', { ascending: false });
      payments = rows || [];
    }
  }

  return <CustomerPortal initialUser={user} initialPayments={payments} />;
}
