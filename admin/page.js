import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import AdminDashboard from '@/components/AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabaseAuth = await getSupabaseServer();

  const { data: userData, error: userError } = await supabaseAuth.auth.getUser();

  if (userError || !userData?.user?.email) redirect('/admin/login');

  const email = userData.user.email.toLowerCase();
  const supabase = getSupabaseAdmin();

  const { data: adminUser, error: adminError } = await supabase
    .from('admins')
    .select('id,email,role,language,active')
    .eq('email', email)
    .eq('active', true)
    .maybeSingle();

  if (adminError || !adminUser) redirect('/admin/login');

  const { data: payments = [] } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  return <AdminDashboard payments={payments || []} admin={adminUser} />;
}
