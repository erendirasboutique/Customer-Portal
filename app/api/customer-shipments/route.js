import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Returns the logged-in customer's shipments from the SHIPPING portal's
// Supabase. Matches by:
//   1. Verified session email  ->  shipping_orders.to_email
//   2. Shipping addresses on the customer's own payment records
//      (billing payments.shipping_address)  ->  shipping_orders street + zip
// The email always comes from the verified token, never from the request,
// so customers can only ever surface shipments tied to their own identity.
//
// Env vars required in the BILLING portal's Vercel project:
//   SHIPPING_SUPABASE_URL
//   SHIPPING_SUPABASE_SERVICE_ROLE_KEY
//   SUPABASE_SERVICE_ROLE_KEY   (billing project's own service key -
//                                likely already there for the Stripe webhook)

export const dynamic = 'force-dynamic';

const SAFE_FIELDS =
  'id, order_number, carrier, mail_class, tracking_number, status, refund_status, to_city, to_state, created_at';

function normalizeStreet(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function streetsMatch(a, b) {
  const na = normalizeStreet(a);
  const nb = normalizeStreet(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Same house number + one contains the other
  // (handles "123 Main St" vs "123 Main Street Apt 4")
  const numA = (String(a).match(/^\s*(\d+)/) || [])[1];
  const numB = (String(b).match(/^\s*(\d+)/) || [])[1];
  if (numA && numB && numA !== numB) return false;
  return na.startsWith(nb) || nb.startsWith(na);
}

function toPublic(s) {
  return {
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
  };
}

export async function GET(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const billingUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const billingAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const billingServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const shippingUrl = process.env.SHIPPING_SUPABASE_URL;
  const shippingKey = process.env.SHIPPING_SUPABASE_SERVICE_ROLE_KEY;

  if (!shippingUrl || !shippingKey) {
    return NextResponse.json({ shipments: [], configured: false });
  }

  // 1. Verify the token belongs to a real session on the billing project
  const billingAuth = createClient(billingUrl, billingAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await billingAuth.auth.getUser(token);
  if (userError || !userData || !userData.user || !userData.user.email) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
  const email = userData.user.email;

  const shipping = createClient(shippingUrl, shippingKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const found = new Map();

  // 2. Match by email
  const { data: byEmail, error: emailError } = await shipping
    .from('shipping_orders')
    .select(SAFE_FIELDS)
    .ilike('to_email', email)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(100);

  if (emailError) {
    return NextResponse.json({ error: emailError.message }, { status: 500 });
  }
  for (const s of byEmail || []) {
    found.set(s.id, s);
  }

  // 3. Match by the customer's own payment shipping addresses
  if (billingServiceKey) {
    const billingDb = createClient(billingUrl, billingServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: myPayments } = await billingDb
      .from('payments')
      .select('shipping_address')
      .ilike('customer_email', email)
      .not('shipping_address', 'is', null)
      .limit(100);

    // Collect the unique street + zip pairs this customer has paid with
    const addresses = [];
    const seen = new Set();
    for (const p of myPayments || []) {
      const addr = p.shipping_address || {};
      const line1 = addr.line1 || addr.address_line1 || '';
      const zip = addr.postal_code || addr.zip || '';
      if (!line1 || !zip) continue;
      const key = normalizeStreet(line1) + '|' + zip;
      if (seen.has(key)) continue;
      seen.add(key);
      addresses.push({ line1: line1, zip: String(zip).trim() });
    }

    if (addresses.length) {
      const zips = addresses.map(function (a) {
        return a.zip;
      });
      const { data: byZip } = await shipping
        .from('shipping_orders')
        .select(SAFE_FIELDS + ', to_street1, to_zip')
        .in('to_zip', zips)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(200);

      for (const s of byZip || []) {
        if (found.has(s.id)) continue;
        const hit = addresses.some(function (a) {
          return (
            String(s.to_zip).trim() === a.zip && streetsMatch(s.to_street1, a.line1)
          );
        });
        if (hit) found.set(s.id, s);
      }
    }
  }

  // 4. Newest first, strip internal fields
  const shipments = Array.from(found.values())
    .sort(function (a, b) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .map(toPublic);

  return NextResponse.json({ shipments, configured: true });
}
