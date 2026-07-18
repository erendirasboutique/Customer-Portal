import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * BILLING PORTAL route. Lives at app/api/live-baskets/route.js in the
 * my.erendirasboutique.com repo.
 *
 * Stands between your signed-in customer and the shipping portal's API.
 * Two jobs:
 *
 *   1. Work out who's asking, from YOUR session — not from a query param.
 *   2. Hold the shared secret server-side, so it never reaches a browser.
 *
 * That second point is the whole design. The shipping portal's endpoint
 * trusts whoever holds the secret to have authenticated the customer. If
 * the secret ever ships to the client, anyone can read anyone's baskets by
 * changing an email. Keep it here.
 *
 * ⚠️ YOU MUST EDIT getEmail() BELOW — I don't know how this repo reads its
 * session. It's the only part that isn't finished.
 */

async function getEmail(req) {
  // ------------------------------------------------------------------
  // REPLACE THIS with however the billing portal identifies the customer.
  //
  // If it uses @supabase/ssr like the shipping portal does, it's roughly:
  //
  //   import { createServerClient } from '@supabase/ssr';
  //   import { cookies } from 'next/headers';
  //
  //   const cookieStore = cookies();
  //   const supabase = createServerClient(
  //     process.env.NEXT_PUBLIC_SUPABASE_URL,
  //     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  //     { cookies: { getAll: () => cookieStore.getAll() } }
  //   );
  //   const { data: { user } } = await supabase.auth.getUser();
  //   return user?.email ?? null;
  //
  // Send me the billing portal's auth setup and I'll write this properly.
  // ------------------------------------------------------------------
  throw new Error('getEmail() is not implemented yet — see the comment in this file.');
}

export async function GET(req) {
  try {
    const email = await getEmail(req);

    // Not signed in isn't an error worth shouting about — the component
    // renders nothing when the list is empty.
    if (!email) return NextResponse.json({ baskets: [] });

    const base = process.env.LIVE_API_URL ?? 'https://ship.erendirasboutique.com';
    const secret = process.env.LIVE_API_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: 'LIVE_API_SECRET is not set on the billing portal.' },
        { status: 500 }
      );
    }

    const res = await fetch(
      `${base}/api/live/external/baskets?email=${encodeURIComponent(email)}`,
      {
        headers: { 'x-live-secret': secret },
        cache: 'no-store',
      }
    );

    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: json.error ?? 'Lookup failed' }, { status: res.status });
    }

    return NextResponse.json({ baskets: json.baskets ?? [] });
  } catch (err) {
    return NextResponse.json({ error: err?.message ?? 'Lookup failed' }, { status: 500 });
  }
}
