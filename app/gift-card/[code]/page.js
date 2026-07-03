
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

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
      <main className="page">
        <div className="shell">
          <section className="card loginCard">
            <img src="/logo.png" className="logo" alt="Erendira's Boutique" />
            <h1>Gift card not found</h1>
            <p>Please check the gift card code and try again.</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="page giftCardPublicPage">
      <div className="shell giftCardShell">
        <section className="card giftCardPublicCard">
          <img src="/logo.png" className="giftCardPublicLogo" alt="Erendira's Boutique" />

          <p className="eyebrow">Gift Card</p>
          <h1>Here’s your e-gift card!</h1>

          {giftCard.customer_name && <p className="mutedText">For {giftCard.customer_name}</p>}
          {giftCard.message && <p className="giftCardMessage">{giftCard.message}</p>}

          <div className="giftCardPreviewArt">
            <div className="giftRibbonH"></div>
            <div className="giftRibbonV"></div>
            <div className="giftBrand">Erendira&apos;s Boutique</div>
            <div className="giftAmount">${Number(giftCard.amount || 0).toFixed(0)}</div>
            <div className="giftTitle">Gift<br />Card</div>
          </div>

          <div className="giftCodeBox">{giftCard.code}</div>

          <div className="giftCardStatus">
            Status: <span className="pill">{giftCard.status || 'active'}</span>
          </div>

          <h2>How to Redeem Your Gift Card</h2>
          <p>
            To redeem your gift card, simply send a screenshot or photo of this gift card through Messenger,
            or bring it with you in person. You may also use it at checkout by entering the code as a promo code.
          </p>

          <p>This gift card never expires.</p>

          <div className="paymentLinkActions">
            <a className="button secondary" href={`/api/gift-card/pdf?code=${encodeURIComponent(giftCard.code)}`} target="_blank" rel="noopener noreferrer">
              View PDF
            </a>
            <a className="button ghost" href="/">
              Back to Billing Portal
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
