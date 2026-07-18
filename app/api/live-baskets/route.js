import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Live sale baskets for the signed-in customer.
 *
 * Mirrors /api/customer-shipments: the browser sends its Supabase access
 * token, this route verifies it and reads the email OUT OF THE TOKEN.
 *
 * That last part is the security of the whole thing. The email is never a
 * parameter the caller supplies — otherwise anyone could ask for anyone's
 * baskets by typing a different address.
 *
 * The shipping portal is a separate Supabase project, so we can't query
 * those tables. We ask it over HTTP with a shared secret that stays here
 * on the server and never reaches the page.
 */
export async function GET(req) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    // Not signed in isn't an error — the component renders nothing.
    if (!token) return NextResponse.json({ baskets: [] });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user?.email) return NextResponse.json({ baskets: [] });

    const base = (process.env.LIVE_API_URL || 'https://ship.erendirasboutique.com').replace(
      /\/+$/,
      ''
    );
    const secret = process.env.LIVE_API_SECRET;

    if (!secret) {
      console.error('[live-baskets] LIVE_API_SECRET is not set');
      return NextResponse.json({ baskets: [] });
    }

    const res = await fetch(
      `${base}/api/live/external/baskets?email=${encodeURIComponent(user.email)}`,
      {
        headers: { 'x-live-secret': secret },
        cache: 'no-store',
      }
    );

    const json = await res.json();

    if (!res.ok) {
      // Log it, but don't break the portal over it. Their shipments,
      // receipts and gift cards should still render.
      console.error('[live-baskets] shipping portal said:', json?.error);
      return NextResponse.json({ baskets: [] });
    }

    return NextResponse.json({ baskets: json.baskets || [] });
  } catch (err) {
    console.error('[live-baskets]', err?.message);
    return NextResponse.json({ baskets: [] });
  }
}
