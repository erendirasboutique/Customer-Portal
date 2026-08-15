import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED_ADMINS = [
  'hello@shoperendirasboutique.com',
  'erendira@erendiramoreno.com',
  'dylan@dylanmontoya.com',
];

export async function POST(req) {
  const { access_token } = await req.json();

  if (!access_token) {
    return NextResponse.json({ error: 'Missing access token.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.auth.getUser(access_token);

  if (error || !data?.user?.email) {
    return NextResponse.json({ error: 'Could not verify Google login.' }, { status: 401 });
  }

  const email = data.user.email.toLowerCase();

  if (!ALLOWED_ADMINS.includes(email)) {
    return NextResponse.json({ error: 'This Google account is not approved as an admin.' }, { status: 403 });
  }

  await supabase.from('admins').upsert(
    {
      id: data.user.id,
      email,
      role: 'owner',
      language: 'en',
      active: true,
    },
    { onConflict: 'email' }
  );

  const res = NextResponse.json({ success: true });

  res.cookies.set('eb_admin_access_token', access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 3600,
  });

  return res;
}
