import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED_ADMINS = [
  'hello@shoperendirasboutique.com',
];

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/';

  if (!code) {
    return NextResponse.redirect(
      new URL(next.startsWith('/admin') ? '/admin/login?error=missing_code' : '/', url.origin)
    );
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user?.email) {
    const message = encodeURIComponent(error?.message || 'No user returned.');
    return NextResponse.redirect(
      new URL(next.startsWith('/admin') ? `/admin/login?error=session_failed&details=${message}` : '/', url.origin)
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
        new URL(`/admin/login?error=admin_upsert_failed&details=${encodeURIComponent(upsertError.message)}`, url.origin)
      );
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
