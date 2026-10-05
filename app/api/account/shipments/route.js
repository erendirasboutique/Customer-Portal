// app/api/account/shipments/route.js

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* GET /api/account/shipments?t=<portal_token>
   Returns the shipments for the customer that owns this link.
   Only safe fields go back to the browser (status, carrier, tracking,
   dates, item count) — never addresses, prices or other customers. */

const CUSTOMERS_TABLE = "shipping_customers";
const CUSTOMER_TOKEN_COL = "portal_token";
const CUSTOMER_ID_COL = "id";

const ORDERS_TABLE = "shipping_orders";
// The column in shipping_orders that points to shipping_customers.id.
// Change this if yours is named differently.
const ORDER_CUSTOMER_COL = "customer_id";

const MAX_ROWS = 200; // fetched, then the newest 50 are returned
const MAX_RETURN = 50;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getDatabase() {
  const supabaseUrl = process.env.SHIPPING_SUPABASE_URL;
  const serviceRoleKey = process.env.SHIPPING_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SHIPPING_SUPABASE_URL or SHIPPING_SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  const supabasePackage = await import("@supabase/supabase-js");
  const createClient = supabasePackage.createClient;

  if (typeof createClient !== "function") {
    throw new Error("@supabase/supabase-js did not provide createClient");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function jsonError(error, status) {
  return NextResponse.json({ error }, { status });
}

// First value that exists among several possible column names.
function pick(row, keys) {
  for (let i = 0; i < keys.length; i++) {
    const v = row[keys[i]];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

function itemCount(row) {
  const n = pick(row, ["items_count", "item_count", "quantity", "qty"]);
  if (n !== null && !isNaN(Number(n))) return Number(n);
  const items = pick(row, ["items", "line_items"]);
  if (Array.isArray(items)) {
    return items.reduce(function (sum, it) {
      return sum + (Number(it && (it.quantity || it.qty)) || 1);
    }, 0);
  }
  return null;
}

function description(row) {
  const d = pick(row, ["description", "items_summary", "item_summary", "contents", "order_name"]);
  if (d) return String(d).slice(0, 120);
  const items = pick(row, ["items", "line_items"]);
  if (Array.isArray(items)) {
    const names = items
      .map(function (it) { return it && (it.name || it.title || it.description); })
      .filter(Boolean);
    if (names.length) return names.slice(0, 3).join(" + ").slice(0, 120);
  }
  return null;
}

function isHidden(row) {
  if (row.archived === true || row.deleted === true) return true;
  if (row.deleted_at) return true;
  const s = String(pick(row, ["status", "label_status"]) || "").toLowerCase();
  return /(void|cancel|refunded_label|draft)/.test(s);
}

function toShipment(row) {
  return {
    id: String(pick(row, ["id", "tracking_number"]) || ""),
    status: pick(row, ["tracking_status", "status", "label_status"]),
    carrier: pick(row, ["carrier", "provider", "carrier_name"]),
    tracking_number: pick(row, ["tracking_number", "tracking", "tracking_code"]),
    tracking_url: pick(row, ["tracking_url", "tracking_url_provider", "public_tracking_url"]),
    shipped_at: pick(row, ["shipped_at", "ship_date", "label_created_at", "created_at"]),
    eta: pick(row, ["eta", "estimated_delivery", "estimated_delivery_date", "delivery_eta"]),
    delivered_at: pick(row, ["delivered_at"]),
    items_count: itemCount(row),
    description: description(row),
  };
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("t") ?? "";

    if (!UUID_RE.test(token)) {
      return jsonError("invalid_link", 400);
    }

    const supabase = await getDatabase();

    // 1) Who owns this link (same rules as /api/account).
    const { data: customer, error: customerError } = await supabase
      .from(CUSTOMERS_TABLE)
      .select(CUSTOMER_ID_COL)
      .eq(CUSTOMER_TOKEN_COL, token)
      .or("archived.is.null,archived.eq.false")
      .is("merged_into", null)
      .maybeSingle();

    if (customerError) {
      console.error("Shipments customer lookup error:", customerError);
      return jsonError("server_error", 500);
    }

    if (!customer) {
      return jsonError("not_found", 404);
    }

    const customerId = customer[CUSTOMER_ID_COL];

    // 2) Include older customer records that were merged into this one,
    //    so their past shipments show up too.
    const ids = [customerId];
    const { data: merged, error: mergedError } = await supabase
      .from(CUSTOMERS_TABLE)
      .select(CUSTOMER_ID_COL)
      .eq("merged_into", customerId);

    if (!mergedError && Array.isArray(merged)) {
      merged.forEach(function (m) {
        if (m && m[CUSTOMER_ID_COL] != null) ids.push(m[CUSTOMER_ID_COL]);
      });
    }

    // 3) Their shipments.
    const { data: rows, error: ordersError } = await supabase
      .from(ORDERS_TABLE)
      .select("*")
      .in(ORDER_CUSTOMER_COL, ids)
      .limit(MAX_ROWS);

    if (ordersError) {
      console.error("Shipments orders error:", ordersError);
      return jsonError("server_error", 500);
    }

    const shipments = (rows || [])
      .filter(function (row) { return !isHidden(row); })
      .map(toShipment)
      .sort(function (a, b) {
        return new Date(b.shipped_at || 0) - new Date(a.shipped_at || 0);
      })
      .slice(0, MAX_RETURN);

    return NextResponse.json(
      { shipments },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Shipments GET error:", error);
    return jsonError("server_error", 500);
  }
}
