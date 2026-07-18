'use client';

import { useEffect, useState } from 'react';

/**
 * Live sale baskets, for the BILLING portal (my.erendirasboutique.com).
 *
 * JavaScript, matching that repo's convention.
 *
 * The billing portal can't read the shipping portal's Supabase — different
 * project. So it asks the shipping portal over HTTP, through a server
 * route that holds the shared secret.
 *
 * Usage on a page where the customer is already signed in:
 *
 *   import LiveBaskets from '@/components/LiveBaskets';
 *   <LiveBaskets />
 *
 * It reads the session's email from your own /api/live-baskets route —
 * see the file this ships next to.
 */
export default function LiveBaskets() {
  const [baskets, setBaskets] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/live-baskets', { cache: 'no-store' });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? 'Could not load your baskets.');
          return;
        }
        setBaskets(json.baskets ?? []);
      } catch {
        if (!cancelled) setError('Could not load your baskets.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing to show is nothing to show — don't put an empty card on the
  // page of a customer who has never shopped a live.
  if (error || !baskets || baskets.length === 0) return null;

  const money = (cents) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <h2 style={{ fontFamily: "'La Luxes Serif', Georgia, serif", fontWeight: 400, margin: 0 }}>
        Live sale baskets
      </h2>

      {baskets.map((b) => (
        <article
          key={b.id}
          style={{
            border: '1px solid rgba(128,106,82,0.16)',
            borderRadius: 4,
            overflow: 'hidden',
            background: '#fffdfa',
          }}
        >
          {b.photo_url && (
            <img
              src={b.photo_url}
              alt=""
              style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block' }}
            />
          )}

          <div style={{ padding: 16, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <strong style={{ fontWeight: 400 }}>Basket #{b.basket_number}</strong>
              {b.order_number && (
                <span style={{ fontFamily: 'ui-monospace, monospace', color: '#806a52' }}>
                  {b.order_number}
                </span>
              )}
            </div>

            {b.items.map((i) => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: '0.9375rem' }}>{i.description}</span>
                <span style={{ fontFamily: 'ui-monospace, monospace' }}>
                  {money(i.unit_price_cents * i.quantity)}
                </span>
              </div>
            ))}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(128,106,82,0.16)',
                paddingTop: 10,
                marginTop: 4,
                fontSize: '1.125rem',
              }}
            >
              <span>Total</span>
              <span style={{ fontFamily: 'ui-monospace, monospace' }}>{money(b.total_cents)}</span>
            </div>

            {b.tracking_number && (
              <a
                href={
                  b.tracking_url ||
                  `https://track.erendirasboutique.com/?tracking=${encodeURIComponent(
                    b.tracking_number
                  )}`
                }
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.875rem', color: '#806a52' }}
              >
                {b.carrier ? `${b.carrier} · ` : ''}
                {b.tracking_number} — track
              </a>
            )}

            {b.pay_url && (
              <a
                href={b.pay_url}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: 11,
                  background: '#3d3428',
                  color: '#f5f3ef',
                  borderRadius: 4,
                  textDecoration: 'none',
                  marginTop: 6,
                }}
              >
                Pay by card
              </a>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
