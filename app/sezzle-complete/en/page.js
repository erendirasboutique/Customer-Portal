'use client';
import { useEffect, useState } from 'react';

function money(cents, cur) {
  if (cents == null || isNaN(cents)) return null;
  const s = '$' + (Number(cents) / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return cur && cur !== 'USD' ? `${s} ${cur}` : s;
}

export default function Page() {
  const [time, setTime] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
    tick();
    const timer = setInterval(tick, 1000);
    fetch('/api/sezzle/order-status' + (window.location.search || ''), { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setData({ status: 'received', approved: null }); setLoading(false); });
    return () => clearInterval(timer);
  }, []);

  const status = (data?.status || '').toLowerCase();
  const approved = data?.approved;
  const paid = approved === true || status === 'complete';
  const declined = approved === false || status === 'denied';

  let overline = 'Pending', title = 'Order Received', sub = 'We are confirming your payment with Sezzle.', badge = 'wait', badgeText = 'Pending', tone = 'wait';
  if (paid) { overline = 'Confirmed'; title = 'Payment Complete'; sub = 'Thank you — your order is confirmed.'; badge = 'ok'; badgeText = 'Approved'; tone = 'ok'; }
  else if (declined) { overline = 'Not Approved'; title = 'Payment Not Approved'; sub = 'Sezzle was not able to approve this order. Please try another payment method or contact us.'; badge = 'bad'; badgeText = 'Declined'; tone = 'bad'; }

  const amt = data ? money(data.amount_cents, data.currency) : null;
  const store = data?.store_url;

  return (
    <main className="eblPage">
      <section className="eblShell">
        <div className="eblVideoWrap">
          <video className="eblVideo" poster="/landing-gradient-poster.jpg" autoPlay muted loop playsInline preload="auto">
            <source src="/landing-gradient.webm" type="video/webm" />
            <source src="/landing-gradient.mp4" type="video/mp4" />
          </video>
          <div className="eblScrimTop" />
          <div className="eblScrimBottom" />
          <div className="eblTop">
            <span className="eblTime">{time}</span>
            <span className="eblTopLabel">Payment Confirmation</span>
          </div>
        </div>

        <section className="eblCard">
          {loading ? (
            <p className="eblLoad">Confirming your order…</p>
          ) : (
            <>
              <p className={`eblOverline tone-${tone}`}>{overline}</p>
              <h1 className="eblTitle">{title}</h1>
              <p className="eblSub">{sub}</p>
              <div className="eblReceipt">
                {data?.reference_id && (<div className="eblRow"><span className="k">Order</span><span className="v">{data.reference_id}</span></div>)}
                <div className="eblRow"><span className="k">Status</span><span className="v"><span className={`eblBadge ${badge}`}>{badgeText}</span></span></div>
                {amt && <div className="eblRow"><span className="k">Amount</span><span className="v">{amt}</span></div>}
                {paid && amt && (<div className="eblRow"><span className="k">Plan</span><span className="v">4 payments with Sezzle</span></div>)}
              </div>
              {store && <a className="eblBtn" href={store}>Return to store</a>}
              <p className="eblFoot">Questions? Contact Erendira&#8217;s Boutique.</p>
            </>
          )}
        </section>
      </section>

      <style jsx global>{`
        @font-face { font-family:'La Luxes Serif'; src:url('/fonts/la_luxes_serif.otf') format('opentype'); font-weight:400; font-style:normal; font-display:swap; }
        @font-face { font-family:'Recoleta'; src:url('/fonts/recoleta-regular.otf') format('opentype'); font-weight:400; font-style:normal; font-display:swap; }
      `}</style>
      <style jsx>{`
        .eblPage { min-height:100vh; margin:0; padding:24px 16px 48px; display:flex; justify-content:center; align-items:center; background:#f5f3ef; font-family:'Recoleta', Georgia, serif; color:#3d3428; }
        .eblShell { width:100%; max-width:480px; background:#f5f3ef; border-radius:28px; overflow:hidden; box-shadow:0 24px 60px -28px rgba(61,52,40,.35); }
        .eblVideoWrap { position:relative; width:100%; height:clamp(230px,44vh,360px); background:#bda891 url('/landing-gradient-poster.jpg') center / cover; overflow:hidden; }
        .eblVideo { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
        .eblScrimTop { position:absolute; top:0; left:0; right:0; height:96px; background:linear-gradient(to bottom, rgba(45,37,28,.34), rgba(45,37,28,0)); pointer-events:none; }
        .eblScrimBottom { position:absolute; bottom:0; left:0; right:0; height:120px; background:linear-gradient(to top,#f5f3ef 6%, rgba(245,243,239,0)); pointer-events:none; }
        .eblTop { position:absolute; top:0; left:0; right:0; z-index:2; display:flex; justify-content:space-between; align-items:center; padding:16px 22px; color:#fdfcfa; }
        .eblTime { font-family:'La Luxes Serif', Georgia, serif; font-size:17px; letter-spacing:.5px; }
        .eblTopLabel { font-size:12.5px; letter-spacing:.4px; opacity:.92; }
        .eblCard { position:relative; z-index:3; margin-top:-34px; padding:0 26px 34px; }
        .eblLoad { padding:20px 0; color:#bda891; font-size:14px; }
        .eblOverline { margin:0 0 8px; font-size:11px; letter-spacing:2.4px; text-transform:uppercase; color:#bda891; }
        .eblOverline.tone-ok { color:#4C8C6B; }
        .eblOverline.tone-bad { color:#a03535; }
        .eblTitle { margin:0 0 4px; font-family:'La Luxes Serif', Georgia, serif; font-weight:400; font-size:clamp(30px,8vw,44px); line-height:1.02; color:#806a52; }
        .eblSub { margin:0 0 22px; font-size:14px; color:#8a7c6a; }
        .eblReceipt { border:1px solid #e2d9cc; border-radius:16px; overflow:hidden; background:rgba(255,255,255,.55); }
        .eblRow { display:flex; justify-content:space-between; align-items:baseline; gap:14px; padding:14px 20px; font-size:14px; }
        .eblRow + .eblRow { border-top:1px solid #e8e0d3; }
        .eblRow .k { color:#8a7c6a; }
        .eblRow .v { color:#3d3428; }
        .eblBadge { display:inline-flex; align-items:center; font-size:11px; letter-spacing:.1em; text-transform:uppercase; padding:5px 11px; border-radius:999px; }
        .eblBadge.ok { background:#E7EFE6; color:#4C8C6B; }
        .eblBadge.bad { background:#f6e9e7; color:#a03535; }
        .eblBadge.wait { background:rgba(189,168,145,.28); color:#806a52; }
        .eblBtn { display:inline-block; margin-top:22px; text-decoration:none; color:#fdfcfa; background:#806a52; padding:13px 28px; border-radius:999px; font-size:15px; }
        .eblFoot { margin-top:18px; font-size:12px; color:#bda891; }
        @media (min-width:720px) { .eblShell { max-width:560px; } .eblVideoWrap { height:clamp(300px,40vh,440px); } .eblCard { padding:0 40px 42px; margin-top:-40px; } }
        @media (prefers-reduced-motion: reduce) { .eblVideo { display:none; } }
      `}</style>
    </main>
  );
}
