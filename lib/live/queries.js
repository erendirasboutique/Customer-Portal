import { liveDb } from './supabase';

/**
 * @typedef {import('./types').LiveSale} LiveSale
 * @typedef {import('./types').Basket} Basket
 * @typedef {import('./types').BasketDetail} BasketDetail
 * @typedef {import('./types').LiveItemWithStock} LiveItemWithStock
 * @typedef {import('./types').RecentClaim} RecentClaim
 */

/** Set this to whatever your customers table is actually called. */
const CUSTOMERS_TABLE = 'customers';

/** @returns {Promise<LiveSale[]>} */
export async function listSales() {
  const { data, error } = await liveDb()
    .from('live_sales')
    .select('*')
    .order('sale_date', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * @param {string} saleId
 * @returns {Promise<LiveSale|null>}
 */
export async function getSale(saleId) {
  const { data, error } = await liveDb()
    .from('live_sales')
    .select('*')
    .eq('id', saleId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

/**
 * @param {string} saleId
 * @returns {Promise<LiveItemWithStock[]>}
 */
export async function getCatalog(saleId) {
  const db = liveDb();

  const [items, stock] = await Promise.all([
    db
      .from('live_items')
      .select('*')
      .eq('live_sale_id', saleId)
      .order('sort_order', { ascending: true })
      .order('code', { ascending: true }),
    db.from('live_item_stock').select('*').eq('live_sale_id', saleId),
  ]);

  if (items.error) throw new Error(items.error.message);
  if (stock.error) throw new Error(stock.error.message);

  const stockByItem = new Map((stock.data ?? []).map((s) => [s.live_item_id, s]));

  return (items.data ?? []).map((item) => {
    const s = stockByItem.get(item.id);
    return {
      ...item,
      quantity_claimed: s?.quantity_claimed ?? 0,
      quantity_remaining: s?.quantity_remaining ?? item.quantity,
    };
  });
}

/**
 * @param {string} saleId
 * @returns {Promise<Array<Object>>}
 */
export async function getBasketTotals(saleId) {
  const { data, error } = await liveDb()
    .from('basket_totals')
    .select('*')
    .eq('live_sale_id', saleId)
    .order('basket_number', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Finds basket N in this sale, creating it if the number hasn't been used
 * yet. Race-safe: two fast claims for the same new basket won't create
 * duplicates, thanks to the (live_sale_id, basket_number) unique index.
 *
 * @param {string} saleId
 * @param {number} basketNumber
 * @returns {Promise<Basket>}
 */
export async function ensureBasket(saleId, basketNumber) {
  const db = liveDb();

  const existing = await db
    .from('baskets')
    .select('*')
    .eq('live_sale_id', saleId)
    .eq('basket_number', basketNumber)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data;

  const sale = await getSale(saleId);

  const created = await db
    .from('baskets')
    .insert({
      live_sale_id: saleId,
      basket_number: basketNumber,
      shipping_cents: sale?.default_shipping_cents ?? 0,
    })
    .select('*')
    .single();

  if (created.error) {
    // Lost the race — someone else just created it. Read it back.
    const retry = await db
      .from('baskets')
      .select('*')
      .eq('live_sale_id', saleId)
      .eq('basket_number', basketNumber)
      .single();

    if (retry.error) throw new Error(created.error.message);
    return retry.data;
  }

  return created.data;
}

/**
 * The undo rail on the claims screen.
 *
 * @param {string} saleId
 * @param {number} [limit]
 * @returns {Promise<RecentClaim[]>}
 */
export async function getRecentClaims(saleId, limit = 8) {
  const { data, error } = await liveDb()
    .from('basket_items')
    .select(
      `id, description, unit_price_cents, quantity, created_at,
       baskets!inner ( basket_number, live_sale_id ),
       live_items ( code )`
    )
    .eq('baskets.live_sale_id', saleId)
    .is('voided_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    basket_number: row.baskets.basket_number,
    code: row.live_items?.code ?? null,
    description: row.description,
    unit_price_cents: row.unit_price_cents,
    quantity: row.quantity,
    created_at: row.created_at,
  }));
}

/**
 * @param {string} basketId
 * @returns {Promise<BasketDetail|null>}
 */
export async function getBasketDetail(basketId) {
  const db = liveDb();

  const [basket, totals, items] = await Promise.all([
    db.from('baskets').select('*').eq('id', basketId).maybeSingle(),
    db.from('basket_totals').select('*').eq('basket_id', basketId).maybeSingle(),
    db
      .from('basket_items')
      .select('*')
      .eq('basket_id', basketId)
      .is('voided_at', null)
      .order('created_at', { ascending: true }),
  ]);

  if (basket.error) throw new Error(basket.error.message);
  if (!basket.data) return null;
  if (items.error) throw new Error(items.error.message);

  const detail = {
    ...basket.data,
    subtotal_cents: totals.data?.subtotal_cents ?? 0,
    total_cents: totals.data?.total_cents ?? 0,
    item_count: totals.data?.item_count ?? 0,
    items: items.data ?? [],
    customer: null,
  };

  if (basket.data.customer_id) {
    const c = await db
      .from(CUSTOMERS_TABLE)
      .select('id, name, email, portal_token')
      .eq('id', basket.data.customer_id)
      .maybeSingle();
    if (!c.error && c.data) detail.customer = c.data;
  }

  return detail;
}

/**
 * Every basket for one customer's portal token, newest sale first.
 *
 * @param {string} token
 * @returns {Promise<BasketDetail[]>}
 */
export async function getBasketsForPortalToken(token) {
  const db = liveDb();

  const customer = await db
    .from(CUSTOMERS_TABLE)
    .select('id, name, email, portal_token')
    .eq('portal_token', token)
    .maybeSingle();

  if (customer.error || !customer.data) return [];

  const baskets = await db
    .from('baskets')
    .select('*')
    .eq('customer_id', customer.data.id)
    .not('status', 'in', '("void")')
    .order('created_at', { ascending: false })
    .limit(10);

  if (baskets.error || !baskets.data?.length) return [];

  const details = await Promise.all(baskets.data.map((b) => getBasketDetail(b.id)));

  return details.filter((d) => d !== null);
}
