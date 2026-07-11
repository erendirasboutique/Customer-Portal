import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function displayAmount(value) {
  const n = Number(value || 0);
  return n % 1 === 0 ? '$' + n.toFixed(0) : '$' + n.toFixed(2);
}

var css = '' +
'.eb-gift-page { min-height: 100vh; background: #e9e3d9; color: #332b23; font-family: inherit; display: flex; align-items: center; justify-content: center; padding: 40px 16px; }' +
'.eb-gift-card { background: #fff; border: 0.5px solid rgba(128,106,82,0.3); border-radius: 28px; padding: 44px 32px; max-width: 640px; width: 100%; text-align: center; }' +
'.eb-gift-card img.eb-logo { width: 170px; height: auto; margin: 0 auto; display: block; }' +
'.eb-eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: 0.3em; color: #806a52; margin: 24px 0 0; }' +
'.eb-gift-card h1 { font-size: 38px; color: #806a52; font-weight: 400; margin: 6px 0 0; line-height: 1.15; }' +
'.eb-for { font-size: 14px; color: rgba(51,43,35,0.65); margin: 10px 0 0; }' +
'.eb-msg { font-size: 14px; font-style: italic; color: #5c4d3b; background: #e9e3d9; border-radius: 16px; padding: 12px 18px; margin: 14px auto 0; max-width: 420px; }' +
'.eb-art { position: relative; width: 100%; max-width: 420px; margin: 26px auto 0; aspect-ratio: 8 / 5; background: #806a52; border-radius: 20px; box-shadow: 0 10px 30px rgba(90,74,58,0.35); overflow: hidden; }' +
'.eb-art .inner { position: absolute; inset: 12px; border: 1px dashed rgba(233,227,217,0.55); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px; }' +
'.eb-art .brand { font-size: 15px; letter-spacing: 0.08em; color: #f2ede4; }' +
'.eb-art .sub { font-size: 11px; font-style: italic; letter-spacing: 0.25em; text-transform: uppercase; color: rgba(242,237,228,0.75); margin-top: 3px; }' +
'.eb-art .amt { font-size: 62px; line-height: 1; color: #f2ede4; margin-top: 12px; }' +
'.eb-art .never { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(242,237,228,0.6); margin-top: 12px; }' +
'.eb-art svg.fl { position: absolute; width: 44px; height: 44px; color: rgba(233,227,217,0.35); }' +
'.eb-art svg.tl { top: 18px; left: 18px; }' +
'.eb-art svg.br { bottom: 18px; right: 18px; transform: rotate(20deg); }' +
'.eb-code { display: inline-block; border: 0.5px solid rgba(128,106,82,0.45); border-radius: 999px; padding: 12px 30px; margin-top: 22px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 18px; letter-spacing: 0.15em; color: #332b23; }' +
'.eb-status { font-size: 13px; color: rgba(51,43,35,0.65); margin-top: 12px; }' +
'.eb-pill { display: inline-block; border: 0.5px solid rgba(88,128,82,0.5); background: rgba(120,150,110,0.12); color: #4c6a44; border-radius: 999px; padding: 2px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-left: 4px; }' +
'.eb-pill.off { border-color: rgba(128,106,82,0.4); background: #e9e3d9; color: #5c4d3b; }' +
'.eb-how { font-size: 24px; color: #806a52; font-weight: 400; margin: 30px 0 0; }' +
'.eb-gift-card p.body { font-size: 14px; line-height: 1.7; color: rgba(51,43,35,0.8); max-width: 480px; margin: 10px auto 0; }' +
'.eb-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 24px; }' +
'.eb-btn { border-radius: 999px; padding: 12px 26px; font-size: 13px; text-decoration: none; display: inline-block; font-family: inherit; }' +
'.eb-btn.solid { background: #806a52; color: #e9e3d9; }' +
'.eb-btn.line { background: #fff; color: #806a52; border: 0.5px solid rgba(128,106,82,0.4); }';

function Flower({ className }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <ellipse cx="20" cy="11" rx="5.5" ry="8.5" fill="currentColor" />
      <ellipse cx="20" cy="11" rx="5.5" ry="8.5" fill="currentColor" transform="rotate(90 20 20)" />
      <ellipse cx="20" cy="11" rx="5.5" ry="8.5" fill="currentColor" transform="rotate(180 20 20)" />
      <ellipse cx="20" cy="11" rx="5.5" ry="8.5" fill="currentColor" transform="rotate(270 20 20)" />
      <circle cx="20" cy="20" r="3.5" fill="currentColor" />
    </svg>
  );
}

export default async function GiftCardPortal({ params }) {
  const { code } = await params;
  const supabase = getSupabaseAdmin();

  const { data: giftCard } = await supabase
    .from('gift_cards')
    .select('*')
    .eq('code', String(code || '').toUpperCase())
    .maybeSingle();

  if (!giftCard) {
    return (
      <main className="eb-gift-page">
        <style>{css}</style>
        <section className="eb-gift-card">
          <img src="/logo2.png" className="eb-logo" alt="Erendira&#8217;s Boutique" />
          <h1>Gift card not found</h1>
          <p className="body">Please check the gift card code and try again.</p>
        </section>
      </main>
    );
  }

  const active = (giftCard.status || 'active') === 'active';

  return (
    <main className="eb-gift-page">
      <style>{css}</style>
      <section className="eb-gift-card">
        <img src="/logo2.png" className="eb-logo" alt="Erendira&#8217;s Boutique" />
        <p className="eb-eyebrow">Gift Card</p>
        <h1>Here&#8217;s your e-gift card!</h1>
        {giftCard.customer_name && <p className="eb-for">For {giftCard.customer_name}</p>}
        {giftCard.message && <p className="eb-msg">&ldquo;{giftCard.message}&rdquo;</p>}

        <div className="eb-art">
          <Flower className="fl tl" />
          <Flower className="fl br" />
          <div className="inner">
            <div className="brand">Erendira&#8217;s Boutique</div>
            <div className="sub">Gift Card</div>
            <div className="amt">{displayAmount(giftCard.amount)}</div>
            <div className="never">Never expires</div>
          </div>
        </div>

        <div className="eb-code">{giftCard.code}</div>
        <p className="eb-status">
          Status:
          <span className={active ? 'eb-pill' : 'eb-pill off'}>{giftCard.status || 'active'}</span>
        </p>

        <h2 className="eb-how">How to Redeem Your Gift Card</h2>
        <p className="body">
          To redeem your gift card, simply send a screenshot or photo of this gift card through Messenger,
          or bring it with you in person. You may also use it at checkout by entering the code as a promo code.
        </p>
        <p className="body">This gift card never expires.</p>

        <div className="eb-actions">
          <a
            className="eb-btn solid"
            href={'/api/gift-card/pdf?code=' + encodeURIComponent(giftCard.code)}
            target="_blank"
            rel="noopener noreferrer"
          >
            View PDF
          </a>
          <a className="eb-btn line" href="/">Back to Billing Portal</a>
        </div>
      </section>
    </main>
  );
}
