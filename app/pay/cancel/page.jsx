'use client';

const css = `
.pay { --cream:#F2F0EB; --card:#FFFFFF; --sand:#bda891; --taupe:#806a52; --ink:#3d3428; --mute:#8b7a64; --line:#e8e2d8;
  min-height:100vh; margin:0; background:var(--cream); color:var(--ink);
  font-family:"Recoleta", Georgia, serif; display:grid; place-items:center; padding:24px; }
.pay * { box-sizing:border-box; }
.pay-card { width:100%; max-width:420px; background:var(--card); border-radius:30px; padding:38px 30px; text-align:center;
  box-shadow:0 1px 2px rgba(61,52,40,.04), 0 18px 44px rgba(61,52,40,.10); }
.pay-brand { font-size:11px; letter-spacing:.26em; text-transform:uppercase; color:var(--sand); margin:0 0 20px; }
.pay-ic { width:72px; height:72px; border-radius:50%; margin:0 auto 18px; display:grid; place-items:center; font-size:32px;
  background:rgba(189,168,145,.22); color:var(--taupe); }
.pay h1 { margin:0; font-size:28px; color:var(--taupe); font-weight:400; }
.pay p { margin:10px 0 0; font-size:14px; color:var(--mute); font-family:system-ui,-apple-system,sans-serif; }
`;

export default function PayCancelPage() {
  return (
    <main className="pay">
      <style>{css}</style>
      <div className="pay-card">
        <p className="pay-brand">Erendira&#8217;s Boutique</p>
        <div className="pay-ic">↩</div>
        <h1>Checkout canceled</h1>
        <p>No worries — you weren&#8217;t charged. Your order is still here whenever you&#8217;re ready.</p>
      </div>
    </main>
  );
}
