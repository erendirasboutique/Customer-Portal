import { NextResponse } from 'next/server';
import { getSupabaseRoute } from '@/lib/supabaseRoute';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED_ADMINS = [
  'hello@shoperendirasboutique.com',
  'erendira@erendiramoreno.com',
  'dylan@dylanmontoya.com',
];

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/customer';

  const res = NextResponse.redirect(new URL(next, url.origin));

  if (!code) {
    return NextResponse.redirect(
      new URL(next.startsWith('/admin') ? '/admin/login?error=missing_code' : '/', url.origin)
    );
  }

  const supabase = getSupabaseRoute(req, res);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user?.email) {
    const message = encodeURIComponent(error?.message || 'No user returned.');
    return NextResponse.redirect(
      new URL(
        next.startsWith('/admin')
          ? `/admin/login?error=session_failed&details=${message}`
          : '/',
        url.origin
      )
    );
  }

  if (next.startsWith('/admin')) {
    const email = data.user.email.toLowerCase();

    if (!ALLOWED_ADMINS.includes(email)) {
      return NextResponse.redirect(
        new URL(`/admin/login?error=unauthorized&email=${encodeURIComponent(email)}`, url.origin)
      );
    }

    const adminSupabase = getSupabaseAdmin();

    const { error: upsertError } = await adminSupabase.from('admins').upsert(
      {
        id: data.user.id,
        email,
        role: 'owner',
        language: 'en',
        active: true,
      },
      { onConflict: 'email' }
    );

    if (upsertError) {
      return NextResponse.redirect(
        new URL(
          `/admin/login?error=admin_upsert_failed&details=${encodeURIComponent(upsertError.message)}`,
          url.origin
        )
      );
    }
  }

  return res;
}
