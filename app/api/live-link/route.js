// app/api/live-link/route.js
// Admin-only read/write for the current live link.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { normalizeLiveUrl } from '@/lib/liveLink';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Confirms there's a signed-in Supabase user on this request.
async function getUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only here; the session is refreshed by middleware.
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

// Service-role client. Bypasses RLS. Server-side only — never import this
// anywhere that ships to the browser.
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function GET() {
  const user = await getUser();
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
  const user = await getUser();
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
