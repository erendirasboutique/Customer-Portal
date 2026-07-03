import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req) {
  const { email, password } = await req.json();

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session?.access_token || !data.user?.email) {
    return NextResponse.json({ error: 'Wrong admin email or password.' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: adminUser } = await supabase
    .from('admins')
    .select('email,active')
    .eq('email', data.user.email.toLowerCase())
    .eq('active', true)
    .maybeSingle();

  if (!adminUser) {
    return NextResponse.json({ error: 'This account is not approved as an admin.' }, { status: 403 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set('eb_admin_access_token', data.session.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: data.session.expires_in || 3600,
  });

  return res;
}
