/** Everything in this module is integer cents. Never floats. */

/**
 * @param {number} cents
 * @param {'en'|'es'} [locale]
 * @returns {string}
 */
export function centsToDisplay(cents, locale = 'en') {
  return new Intl.NumberFormat(locale === 'es' ? 'es-US' : 'en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/**
 * Parses whatever a person types into a price field: "24", "24.5",
 * "$24.50", "24,50". Returns null if it isn't a usable number.
 *
 * @param {string} input
 * @returns {number|null}
 */
export function parsePriceToCents(input) {
  const cleaned = String(input).trim().replace(/[$\s]/g, '').replace(',', '.');
  if (!cleaned) return null;
  if (!/^\d*\.?\d*$/.test(cleaned)) return null;

  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;

  return Math.round(value * 100);
}

/**
 * Normalizes a tag code so "a3 " and "A3" are the same item.
 * @param {string} code
 * @returns {string}
 */
export function normalizeCode(code) {
  return String(code).trim().toUpperCase();
}

/**
 * @param {string} iso  A date-only string, e.g. "2026-07-15"
 * @param {'en'|'es'} [locale]
 * @returns {string}
 */
export function formatSaleDate(iso, locale = 'en') {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(
    locale === 'es' ? 'es-US' : 'en-US',
    { weekday: 'long', month: 'long', day: 'numeric' }
  );
}
