import { centsToDisplay } from './money';

/** @typedef {'en'|'es'} MessageLocale */

/**
 * @param {string} token
 * @returns {string}
 */
export function portalUrl(token) {
  const base = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'https://my.erendirasboutique.com';
  return `${base.replace(/\/$/, '')}/portal/${token}`;
}

/**
 * The Thursday-night Messenger text. No total math, no item list — the
 * portal carries all of it, and it stays correct if anything changes.
 *
 * @param {Object} opts
 * @param {MessageLocale} opts.locale
 * @param {string|null} [opts.customerName]
 * @param {number} opts.basketNumber
 * @param {number} opts.itemCount
 * @param {number} opts.totalCents
 * @param {string} opts.portalToken
 * @param {string|null} [opts.dueLabel]
 * @returns {string}
 */
export function basketMessage(opts) {
  const {
    locale,
    customerName,
    basketNumber,
    itemCount,
    totalCents,
    portalToken,
    dueLabel: due,
  } = opts;

  const link = portalUrl(portalToken);
  const total = centsToDisplay(totalCents, locale);
  const firstName = customerName?.trim().split(/\s+/)[0] ?? '';

  if (locale === 'es') {
    return [
      firstName ? `¡Hola ${firstName}!` : '¡Hola!',
      '',
      `Tu canasta #${basketNumber} tiene ${itemCount} ${
        itemCount === 1 ? 'artículo' : 'artículos'
      } — total ${total}.`,
      '',
      `Mira tus fotos y paga aquí: ${link}`,
      due ? `Puedes pagar hasta el ${due}.` : null,
      '',
      'Enviamos el sábado. ¡Gracias! 🤍',
    ]
      .filter((line) => line !== null)
      .join('\n');
  }

  return [
    firstName ? `Hi ${firstName}!` : 'Hi!',
    '',
    `Your basket #${basketNumber} has ${itemCount} ${
      itemCount === 1 ? 'item' : 'items'
    } — total ${total}.`,
    '',
    `See your photos and pay here: ${link}`,
    due ? `You have until ${due} to pay.` : null,
    '',
    'We ship Saturday. Thank you! 🤍',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

/**
 * Friday reminder for anything still unpaid.
 *
 * @param {Object} opts
 * @param {MessageLocale} opts.locale
 * @param {string|null} [opts.customerName]
 * @param {number} opts.basketNumber
 * @param {number} opts.totalCents
 * @param {string} opts.portalToken
 * @returns {string}
 */
export function reminderMessage(opts) {
  const { locale, customerName, basketNumber, totalCents, portalToken } = opts;
  const link = portalUrl(portalToken);
  const total = centsToDisplay(totalCents, locale);
  const firstName = customerName?.trim().split(/\s+/)[0] ?? '';

  if (locale === 'es') {
    return [
      firstName ? `Hola ${firstName} —` : 'Hola —',
      `Tu canasta #${basketNumber} (${total}) todavía está esperando.`,
      `Paga aquí antes de esta noche para que salga el sábado: ${link}`,
    ].join('\n');
  }

  return [
    firstName ? `Hi ${firstName} —` : 'Hi —',
    `Your basket #${basketNumber} (${total}) is still waiting.`,
    `Pay here by tonight and it ships Saturday: ${link}`,
  ].join('\n');
}

/**
 * @param {string|null} iso
 * @param {MessageLocale} locale
 * @returns {string|null}
 */
export function dueLabel(iso, locale) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(locale === 'es' ? 'es-US' : 'en-US', {
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
  });
}
