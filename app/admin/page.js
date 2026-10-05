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

  // The admins table has no name or photo, so take them from the login
  // (Google etc.). Falls back to the first part of the email.
  const meta = userData.user.user_metadata || {};
  const admin = {
    ...adminUser,
    name: meta.full_name || meta.name || email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }),
    avatar_url: meta.avatar_url || meta.picture || null,
  };

  const { data: payments = [] } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  // Optional extras for the insights. If a table doesn't exist yet,
  // the dashboard just leaves that part out.
  let lives = [];
  let giftCardSales = [];
  try {
    const since = new Date(Date.now() - 800 * 86400000).toISOString();
    const { data, error } = await supabase
      .from('live_events')
      .select('starts_at')
      .gte('starts_at', since)
      .lte('starts_at', new Date().toISOString());
    if (!error) lives = (data || []).map(function (l) { return l.starts_at; });
  } catch (e) {}
  try {
    const { data, error } = await supabase
      .from('gift_card_orders')
      .select('amount, buyer_name, buyer_email, fulfilled_at, created_at')
      .eq('status', 'fulfilled');
    if (!error) giftCardSales = data || [];
  } catch (e) {}

  return (
    <AdminDashboard
      payments={payments || []}
      admin={admin}
      lives={lives}
      giftCardSales={giftCardSales}
    />
  );
}
