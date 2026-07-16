// lib/requireAdmin.js
//
// The same two checks app/admin/page.js does: a valid Supabase session, then an
// active row in the `admins` table. Pulled out so pages and API routes can share
// it instead of each rolling their own.
//
// Returns the admin row, or null. Callers decide what to do with null — pages
// redirect, API routes return 401.

import { getSupabaseServer } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function getAdminUser() {
  const supabaseAuth = await getSupabaseServer();
  const { data: userData, error: userError } = await supabaseAuth.auth.getUser();

  if (userError || !userData?.user?.email) return null;

  const email = userData.user.email.toLowerCase();
  const supabase = getSupabaseAdmin();

  const { data: adminUser, error: adminError } = await supabase
    .from('admins')
    .select('id,email,role,language,active')
    .eq('email', email)
    .eq('active', true)
    .maybeSingle();

  if (adminError || !adminUser) return null;
  return adminUser;
}
