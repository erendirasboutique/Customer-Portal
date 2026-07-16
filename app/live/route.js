// app/live/route.js
// Public redirect. This is what live.erendirasboutique.com hits.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FALLBACK_URL, normalizeLiveUrl } from '@/lib/liveLink';

// Never let Next cache this — the whole point is that it changes weekly.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET() {
  let target = FALLBACK_URL;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data, error } = await supabase
      .from('live_link')
      .select('url')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data?.url) {
      // Re-validate on the way out. If someone edited the row directly in the
      // Supabase dashboard and fat-fingered it, we still won't redirect off-site.
      const checked = normalizeLiveUrl(data.url);
      if (checked.ok) target = checked.url;
    }
  } catch {
    // Any failure falls through to the boutique's Facebook page.
    // A customer tapping "Watch the live" should never see an error screen.
  }

  // 302, not 301. A 301 gets cached by browsers permanently and you would be
  // stuck sending customers to last week's video forever.
  return NextResponse.redirect(target, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}
