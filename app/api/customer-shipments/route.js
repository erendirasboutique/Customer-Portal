import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Returns the logged-in customer's shipments (from the SHIPPING portal's
// Supabase), plus their gift cards and address on file (from the BILLING
// portal's own database). Everything is keyed off the verified session
// email - never off anything the browser sends.
//
// Env vars required in the BILLING portal's Vercel project:
//   SHIPPING_SUPABASE_URL
//   SHIPPING_SUPABASE_SERVICE_ROLE_KEY
//   SUPABASE_SERVICE_ROLE_KEY   (billing project's own service key)

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

  const billingAuth = createClient(billingUrl, billingAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await billingAuth.auth.getUser(token);
  if (userError || !userData || !userData.user || !userData.user.email) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
  const email = userData.user.email;

  const result = {
    shipments: [],
    giftCards: [],
    addressOnFile: null,
    configured: Boolean(shippingUrl && shippingKey),
  };

  let billingDb = null;
  if (billingServiceKey) {
    billingDb = createClient(billingUrl, billingServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  // ---- Customer's payment addresses (for matching + address on file) ----
  let addresses = [];
  if (billingDb) {
    const { data: myPayments } = await billingDb
      .from('payments')
      .select('shipping_address, created_at')
      .ilike('customer_email', email)
      .not('shipping_address', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    const seen = new Set();
    for (const p of myPayments || []) {
      const addr = p.shipping_address || {};
      const line1 = addr.line1 || addr.address_line1 || '';
      const zip = addr.postal_code || addr.zip || '';
      if (!result.addressOnFile && line1) {
        result.addressOnFile = addr;
      }
      if (!line1 || !zip) continue;
      const key = normalizeStreet(line1) + '|' + zip;
      if (seen.has(key)) continue;
      seen.add(key);
      addresses.push({ line1: line1, zip: String(zip).trim() });
    }
  }

  // ---- Shipments from the shipping portal ----
  if (shippingUrl && shippingKey) {
    const shipping = createClient(shippingUrl, shippingKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const found = new Map();

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

    result.shipments = Array.from(found.values())
      .sort(function (a, b) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .map(toPublic);
  }

  // ---- Gift cards from the billing portal ----
  if (billingDb) {
    const { data: cards } = await billingDb
      .from('gift_cards')
      .select('code, amount, total_redeemed, status, last_redeemed_at, created_at')
      .ilike('customer_email', email)
      .order('created_at', { ascending: false })
      .limit(20);

    result.giftCards = (cards || []).map(function (c) {
      const amount = Number(c.amount || 0);
      const redeemed = Number(c.total_redeemed || 0);
      const remaining = Math.max(0, Math.round((amount - redeemed) * 100) / 100);
      return {
        code: c.code,
        amount: amount,
        remaining: remaining,
        status: c.status,
        last_redeemed_at: c.last_redeemed_at,
        created_at: c.created_at,
      };
    });
  }

  return NextResponse.json(result);
}
