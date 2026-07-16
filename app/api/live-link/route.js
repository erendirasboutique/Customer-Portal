// app/api/live-link/route.js
// Admin-only read/write for the current live link.
//
// Auth: the client sends its Supabase access token as a Bearer token. This works
// whether the session lives in cookies or localStorage, so it doesn't depend on
// middleware or @supabase/ssr.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeLiveUrl } from '@/lib/liveLink';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Service-role client. Bypasses RLS. Server-side only — never import anywhere
// that ships to the browser.
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// Verifies the Bearer token against Supabase and returns the user, or null.
async function getUser(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error) return null;
  return user;
}

export async function GET(request) {
  const user = await getUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Sign in to view this.' }, { status: 401 });
  }

  const { data, error } = await adminClient()
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
  const user = await getUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Sign in to save changes.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const checked = normalizeLiveUrl(body?.url);

  if (!checked.ok) {
    return NextResponse.json({ error: checked.error }, { status: 400 });
  }

  const { data, error } = await adminClient()
    .from('live_link')
    .upsert(
      {
        id: 1,
        url: checked.url,
        updated_at: new Date().toISOString(),
        updated_by: user.email ?? null,
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
