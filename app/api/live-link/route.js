// app/api/live-link/route.js
// Admin-only read/write for the current live link.
//
// Auth matches app/admin/page.js: Supabase session cookie + an active row in the
// `admins` table. Cookies ride along with fetch automatically, so the client
// doesn't send anything special.

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAdminUser } from '@/lib/requireAdmin';
import { normalizeLiveUrl } from '@/lib/liveLink';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Sign in to view this.' }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('live_link')
    .select('url, updated_at, updated_by')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    url: data?.url ?? '',
    updated_at: data?.updated_at ?? null,
    updated_by: data?.updated_by ?? null,
  });
}

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Sign in to save changes.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const checked = normalizeLiveUrl(body?.url);

  if (!checked.ok) {
    return NextResponse.json({ error: checked.error }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('live_link')
    .upsert(
      {
        id: 1,
        url: checked.url,
        updated_at: new Date().toISOString(),
        updated_by: admin.email ?? null,
      },
      { onConflict: 'id' }
    )
    .select('url, updated_at, updated_by')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
