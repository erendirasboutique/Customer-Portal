'use client';

import { useEffect, useState } from 'react';

function money(cents, cur) {
  if (cents == null || isNaN(cents)) return null;
  const s = '$' + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return cur && cur !== 'USD' ? `${s} ${cur}` : s;
}

const css = `
.pay { --cream:#F2F0EB; --card:#FFFFFF; --wash:#FAF8F4; --sand:#bda891; --taupe:#806a52; --ink:#3d3428; --mute:#8b7a64; --line:#e8e2d8;
  --ok:#4C8C6B; --okw:#E7EFE6; --bad:#a03535; --badw:#f6e9e7;
  min-height:100vh; margin:0; background:var(--cream); color:var(--ink);
  font-family:"Recoleta", Georgia, serif; display:grid; place-items:center; padding:24px; }
.pay * { box-sizing:border-box; }
.pay-card { width:100%; max-width:440px; background:var(--card); border-radius:30px; padding:38px 30px; text-align:center;
  box-shadow:0 1px 2px rgba(61,52,40,.04), 0 18px 44px rgba(61,52,40,.10); }
.pay-brand { font-size:11px; letter-spacing:.26em; text-transform:uppercase; color:var(--sand); margin:0 0 22px; }
.pay-ic { width:76px; height:76px; border-radius:50%; margin:0 auto 18px; display:grid; place-items:center; font-size:34px; }
.pay-ic.ok { background:var(--okw); color:var(--ok); }
.pay-ic.bad { background:var(--badw); color:var(--bad); }
.pay-ic.wait { background:rgba(189,168,145,.22); color:var(--taupe); }
.pay h1 { margin:0; font-size:30px; line-height:1.05; color:var(--taupe); font-weight:400; }
.pay .lead { margin:10px 0 0; font-size:14.5px; color:var(--mute); font-family:system-ui,-apple-system,"Segoe UI",sans-serif; }
.pay-receipt { margin:24px 0 0; border:1px solid var(--line); border-radius:18px; overflow:hidden; text-align:left;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif; }
.pay-row { display:flex; justify-content:space-between; align-items:baseline; padding:13px 18px; font-size:13.5px; }
.pay-row + .pay-row { border-top:1px solid var(--line); }
.pay-row .k { color:var(--mute); }
.pay-row .v { color:var(--ink); font-weight:600; }
.pay-badge { display:inline-flex; align-items:center; gap:6px; font-size:11px; letter-spacing:.08em; text-transform:uppercase;
  font-weight:600; padding:5px 11px; border-radius:999px; }
.pay-badge.ok { background:var(--okw); color:var(--ok); }
.pay-badge.bad { background:var(--badw); color:var(--bad); }
.pay-badge.wait { background:rgba(189,168,145,.28); color:var(--taupe); }
.pay-btn { display:inline-block; margin-top:24px; text-decoration:none; color:var(--cream); background:var(--taupe);
  padding:13px 28px; border-radius:999px; font-size:15px; }
.pay-foot { margin-top:18px; font-size:11.5px; color:var(--sand); font-family:system-ui,-apple-system,sans-serif; }
.pay-load { padding:24px 0; color:var(--sand); font-size:14px; font-family:system-ui,sans-serif; }
`;

export default function PayCompletePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = typeof window !== 'undefined' ? window.location.search : '';
    fetch('/api/sezzle/order-status' + qs, { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setData({ status: 'received', approved: null }); setLoading(false); });
  }, []);

  const status = (data?.status || '').toLowerCase();
  const approved = data?.approved;
  const paid = approved === true || status === 'complete';
  const declined = approved === false || status === 'denied';

  let icon = 'wait', iconChar = '⏳', title = 'Order received', lead = 'Thank you! We\u2019re confirming your payment with Sezzle.', badge = 'wait', badgeText = 'Pending';
  if (paid) {
    icon = 'ok'; iconChar = '✓'; title = 'Payment complete'; lead = 'Thank you — your order is confirmed.'; badge = 'ok'; badgeText = 'Approved';
  } else if (declined) {
    icon = 'bad'; iconChar = '✕'; title = 'Payment not approved';
    lead = 'Sezzle wasn\u2019t able to approve this order. Please try another payment method or contact us and we\u2019ll help.';
    badge = 'bad'; badgeText = 'Declined';
  }

  const amt = data ? money(data.amount_cents, data.currency) : null;
  const store = data?.store_url;

  return (
    <main className="pay">
      <style>{css}</style>
      <div className="pay-card">
        <p className="pay-brand">Erendira&#8217;s Boutique</p>

        {loading ? (
          <div className="pay-load">Confirming your order…</div>
        ) : (
          <>
            <div className={`pay-ic ${icon}`}>{iconChar}</div>
            <h1>{title}</h1>
            <p className="lead">{lead}</p>

            <div className="pay-receipt">
              {data?.reference_id && (
                <div className="pay-row"><span className="k">Order</span><span className="v">{data.reference_id}</span></div>
              )}
              <div className="pay-row"><span className="k">Status</span><span className="v"><span className={`pay-badge ${badge}`}>{badgeText}</span></span></div>
              {amt && (
                <div className="pay-row"><span className="k">Amount</span><span className="v">{amt}</span></div>
              )}
            </div>

            {store && <a className="pay-btn" href={store}>Return to store</a>}
            <p className="pay-foot">Questions? Contact Erendira&#8217;s Boutique.</p>
          </>
        )}
      </div>
    </main>
  );
}
