/**
 * Shapes used across the live sale module.
 *
 * There's no TypeScript here — these are JSDoc typedefs, so VS Code and
 * the GitHub editor still autocomplete and catch typos, but nothing
 * compiles and nothing is added to your build.
 *
 * Import them in another file with:
 *   /** @typedef {import('@/lib/live/types').Basket} Basket *\/
 */

/**
 * @typedef {'draft'|'live'|'closed'|'settled'} LiveSaleStatus
 * @typedef {'open'|'finalized'|'paid'|'released'|'shipped'|'void'} BasketStatus
 * @typedef {'en'|'es'} MessageLocale
 */

/**
 * @typedef {Object} LiveSale
 * @property {string} id
 * @property {string} sale_date
 * @property {string|null} title
 * @property {LiveSaleStatus} status
 * @property {string|null} payment_due_at
 * @property {number} default_shipping_cents
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} LiveItem
 * @property {string} id
 * @property {string} live_sale_id
 * @property {string} code
 * @property {string} description
 * @property {string|null} description_es
 * @property {number} price_cents
 * @property {number} quantity
 * @property {string|null} photo_url
 * @property {number} sort_order
 * @property {string} created_at
 */

/**
 * A catalog item joined with its live stock count.
 * @typedef {LiveItem & { quantity_claimed: number, quantity_remaining: number }} LiveItemWithStock
 */

/**
 * @typedef {Object} Basket
 * @property {string} id
 * @property {string} live_sale_id
 * @property {number} basket_number
 * @property {string|null} customer_id
 * @property {string|null} order_id
 * @property {BasketStatus} status
 * @property {number} shipping_cents
 * @property {number} discount_cents
 * @property {string|null} notes
 * @property {string|null} stripe_payment_link_id
 * @property {string|null} stripe_payment_link_url
 * @property {string|null} finalized_at
 * @property {string|null} paid_at
 * @property {string|null} released_at
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} BasketItem
 * @property {string} id
 * @property {string} basket_id
 * @property {string|null} live_item_id
 * @property {string} description
 * @property {string|null} description_es
 * @property {string|null} photo_url
 * @property {number} quantity
 * @property {number} unit_price_cents
 * @property {string|null} voided_at
 * @property {string} created_at
 */

/**
 * @typedef {Object} BasketCustomer
 * @property {string} id
 * @property {string|null} name
 * @property {string|null} email
 * @property {string|null} portal_token
 */

/**
 * Basket + totals + items — the shape the admin and the portal both read.
 * @typedef {Basket & {
 *   subtotal_cents: number,
 *   total_cents: number,
 *   item_count: number,
 *   items: BasketItem[],
 *   customer: BasketCustomer|null
 * }} BasketDetail
 */

/**
 * One entry in the undo rail on the claims screen.
 * @typedef {Object} RecentClaim
 * @property {string} id
 * @property {number} basket_number
 * @property {string|null} code
 * @property {string} description
 * @property {number} unit_price_cents
 * @property {number} quantity
 * @property {string} created_at
 */

export {};
