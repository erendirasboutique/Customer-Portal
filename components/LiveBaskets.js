'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';
import { money, formatDate } from '@/lib/format';
import styles from './CustomerPortal.module.css';

/**
 * Live sale baskets, inside the customer portal.
 *
 * Imports CustomerPortal.module.css rather than carrying its own styles —
 * CSS modules can be shared, and this way the section can't drift from the
 * shipments and gift cards it sits between.
 *
 * Same shape as the shipments fetch: get the session token, send it as a
 * Bearer header, let the server work out who that is. The email is never
 * sent from here — that's the security of the whole thing.
 *
 * Renders nothing when there are no baskets, so it's safe on the page of a
 * customer who has never shopped a live.
 */

const T = {
  en: {
    title: 'My live sale baskets',
    basket: 'Basket',
    from: 'From the live on',
    order: 'Order',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    total: 'Total',
    track: 'Track package',
    payCard: 'Pay by card',
    each: 'each',
    statusOpen: 'Still adding',
    statusFinalized: 'Ready to pay',
    statusPaid: 'Paid',
    statusShipped: 'Shipped',
  },
  es: {
    title: 'Mis canastas del live',
    basket: 'Canasta',
    from: 'Del live del',
    order: 'Pedido',
    subtotal: 'Subtotal',
    shipping: 'Envío',
    total: 'Total',
    track: 'Rastrear paquete',
    payCard: 'Pagar con tarjeta',
    each: 'c/u',
    statusOpen: 'Todavía agregando',
    statusFinalized: 'Lista para pagar',
    statusPaid: 'Pagada',
    statusShipped: 'Enviada',
  },
};

export default function LiveBaskets({ lang }) {
  const [baskets, setBaskets] = useState(null);
  const supabase = getSupabaseBrowser();
  const t = T[lang] || T.en;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (!token) {
          if (!cancelled) setBaskets([]);
          return;
        }

        const res = await fetch('/api/live-baskets', {
          headers: { Authorization: 'Bearer ' + token },
          cache: 'no-store',
        });
        const json = await res.json();
        if (!cancelled) setBaskets(json.baskets || []);
      } catch {
        if (!cancelled) setBaskets([]);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nothing yet, or nothing at all — say nothing. A customer who's never
  // been on a live shouldn't see an empty "baskets" card.
  if (!baskets || baskets.length === 0) return null;

  function statusPill(status) {
    if (status === 'paid' || status === 'shipped') {
      return (
        <span className={styles.pill + ' ' + styles.pillGreen}>
          {status === 'paid' ? t.statusPaid : t.statusShipped}
        </span>
      );
    }
    if (status === 'finalized') return <span className={styles.pill}>{t.statusFinalized}</span>;
    return <span className={styles.pill}>{t.statusOpen}</span>;
  }

  return (
    <>
      <p className={styles.sectionTitle}>{t.title}</p>

      {baskets.map(function (b) {
        return (
          <div className={styles.card} key={b.id}>
            {/* Their own basket, photographed on the night. It's what they
                recognise — not a catalog shot. */}
            {b.photo_url && (
              <img
                src={b.photo_url}
                alt=""
                style={{
                  width: '100%',
                  aspectRatio: '4 / 3',
                  objectFit: 'cover',
                  borderRadius: 8,
                  display: 'block',
                  marginBottom: 14,
                }}
              />
            )}

            <div className={styles.shipTop}>
              <div>
                <h3 className={styles.shipTitle}>
                  {b.order_number
                    ? t.order + ' #' + b.order_number
                    : t.basket + ' #' + b.basket_number}
                </h3>
                <p className={styles.shipMeta}>
                  {t.basket} #{b.basket_number}
                  {b.paid_at ? ' · ' + formatDate(b.paid_at) : ''}
                </p>
              </div>
              {statusPill(b.status)}
            </div>

            <div className={styles.list} style={{ marginTop: 12 }}>
              {b.items.map(function (i) {
                return (
                  <div className={styles.row} key={i.id}>
                    <div>
                      <p className={styles.rowTitle}>
                        {lang === 'es' && i.description_es ? i.description_es : i.description}
                      </p>
                      {i.quantity > 1 && (
                        <p className={styles.rowMeta}>
                          ×{i.quantity} · {money(i.unit_price_cents / 100)} {t.each}
                        </p>
                      )}
                    </div>
                    <div className={styles.rowRight}>
                      <span>{money((i.unit_price_cents * i.quantity) / 100)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.row} style={{ borderTop: '1px solid rgba(128,106,82,0.16)' }}>
              <div>
                <p className={styles.rowTitle}>{t.total}</p>
                {b.shipping_cents > 0 && (
                  <p className={styles.rowMeta}>
                    {t.subtotal} {money(b.subtotal_cents / 100)} · {t.shipping}{' '}
                    {money(b.shipping_cents / 100)}
                  </p>
                )}
              </div>
              <div className={styles.rowRight}>
                <strong>{money(b.total_cents / 100)}</strong>
              </div>
            </div>

            {(b.tracking_number || b.pay_url) && (
              <div className={styles.btnRow}>
                {b.pay_url && (
                  <a className={styles.btnSolid} href={b.pay_url}>
                    {t.payCard}
                  </a>
                )}
                {b.tracking_number && (
                  <a
                    className={styles.btnGhost}
                    href={
                      b.tracking_url ||
                      'https://track.erendirasboutique.com/?tracking=' +
                        encodeURIComponent(b.tracking_number)
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.track}
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
