import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Returns the logged-in customer's shipments from the SHIPPING portal's
// Supabase, matched strictly by the email on their verified session.
//
// Security model:
//   1. The browser sends its Supabase access token (Authorization: Bearer ...)
//   2. We verify that token against THIS project's Supabase -> trusted email
//   3. We query the shipping project with a service key, filtered to that email
// Customers can never request another email's shipments.
//
// Env vars required in the BILLING portal's Vercel project:
//   SHIPPING_SUPABASE_URL
//   SHIPPING_SUPABASE_SERVICE_ROLE_KEY
// (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY already exist.)

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const billingUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const billingAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const shippingUrl = process.env.SHIPPING_SUPABASE_URL;
  const shippingKey = process.env.SHIPPING_SUPABASE_SERVICE_ROLE_KEY;

  if (!shippingUrl || !shippingKey) {
    return NextResponse.json({ shipments: [], configured: false });
  }

  // 1. Verify the token belongs to a real session on the billing project
  const billing = createClient(billingUrl, billingAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await billing.auth.getUser(token);
  if (userError || !userData || !userData.user || !userData.user.email) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
  const email = userData.user.email;

  // 2. Query the shipping project by the verified email only
  const shipping = createClient(shippingUrl, shippingKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await shipping
    .from('shipping_orders')
    .select(
      'order_number, carrier, mail_class, tracking_number, status, refund_status, to_city, to_state, created_at, updated_at'
    )
    .ilike('to_email', email)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const shipments = (data || []).map((s) => ({
    order_number: s.order_number,
    carrier: s.carrier,
    mail_class: s.mail_class,
    tracking_number: s.tracking_number,
    status: s.status,
    refund_status: s.refund_status,
    city: s.to_city,
    state: s.to_state,
    created_at: s.created_at,
    tracking_url: s.tracking_number
      ? 'https://track.erendirasboutique.com/?tracking=' + s.tracking_number
      : null,
  }));

  return NextResponse.json({ shipments, configured: true });
}
