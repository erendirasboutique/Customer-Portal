
export function giftCardHtml(giftCard = {}) {
  const amount = Number(giftCard.amount || 0).toFixed(0);
  const code = giftCard.code || '';
  const customerName = giftCard.customer_name || '';
  const message = giftCard.message || '';
  const portalUrl = giftCard.gift_card_url || '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: 8.5in 11in; margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f6f4f1;
      color: #1f1a16;
      font-family: Georgia, serif;
    }
    .page {
      width: 8.5in;
      height: 11in;
      padding: .55in .6in;
      background: #f6f4f1;
      text-align: center;
    }
    .logo-pill {
      border: 1.5px solid #957f67;
      border-radius: 999px;
      padding: 18px 28px;
      height: 78px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,.55);
      margin-bottom: 28px;
    }
    .logo-pill img {
      max-height: 48px;
      max-width: 210px;
      object-fit: contain;
    }
    h1 {
      font-size: 30px;
      font-weight: 400;
      margin: 10px 0 24px;
      color: #1f1a16;
    }
    .gift-card {
      width: 4.75in;
      height: 2.75in;
      border-radius: 22px;
      margin: 0 auto 28px;
      background: #fffdf9;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 24px rgba(40,30,20,.12);
      border: 1px solid #e0d5c8;
    }
    .gift-card .brand {
      position: absolute;
      top: 22px;
      left: 28px;
      font-size: 18px;
      font-weight: 700;
      color: #1f1a16;
    }
    .gift-card .amount {
      position: absolute;
      top: 62px;
      left: 28px;
      font-size: 28px;
      font-weight: 700;
      color: #1f1a16;
    }
    .gift-card .title {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 58px;
      line-height: .82;
      color: #1f1a16;
      font-weight: 400;
    }
    .ribbon-h {
      position: absolute;
      right: 0;
      top: 62px;
      width: 2.3in;
      height: 34px;
      background: #cfbda9;
    }
    .ribbon-v {
      position: absolute;
      right: .58in;
      top: 0;
      width: 34px;
      height: 100%;
      background: #cfbda9;
    }
    .bow {
      position: absolute;
      right: 12px;
      top: 52px;
      width: 92px;
      height: 56px;
      border: 5px solid #957f67;
      border-radius: 50%;
      opacity: .75;
    }
    .code-pill {
      width: 5.45in;
      margin: 0 auto 24px;
      border: 1.5px solid #957f67;
      border-radius: 999px;
      background: rgba(255,255,255,.65);
      padding: 14px 16px;
      font-size: 24px;
      letter-spacing: .03em;
    }
    .qr {
      width: 1.65in;
      height: 1.65in;
      margin: 0 auto 22px;
      background: white;
      border: 1px solid #cfbda9;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr img {
      width: 1.52in;
      height: 1.52in;
    }
    h2 {
      font-size: 17px;
      margin: 0 0 22px;
      color: #1f1a16;
    }
    .instructions {
      width: 4.45in;
      margin: 0 auto;
      font-size: 17px;
      line-height: 1.3;
    }
    .never {
      margin-top: 28px;
      font-size: 17px;
    }
    .small {
      margin-top: 10px;
      font-size: 11px;
      color: #957f67;
      word-break: break-all;
    }
    .message {
      margin: 0 auto 14px;
      width: 4.8in;
      color: #957f67;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="logo-pill">
      <img src="${process.env.NEXT_PUBLIC_SITE_URL || ''}/logo.png" />
    </div>

    <h1>Here’s your e-gift card!</h1>

    ${customerName ? `<div class="message">For ${customerName}</div>` : ''}
    ${message ? `<div class="message">${message}</div>` : ''}

    <div class="gift-card">
      <div class="ribbon-h"></div>
      <div class="ribbon-v"></div>
      <div class="bow"></div>
      <div class="brand">Erendira's Boutique</div>
      <div class="amount">$${amount}</div>
      <div class="title">Gift<br/>Card</div>
    </div>

    <div class="code-pill">${code}</div>

    <div class="qr">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(portalUrl || code)}" />
    </div>

    <h2>How to Redeem Your Gift Card</h2>

    <div class="instructions">
      To redeem your gift card, simply send a screenshot or photo of this gift card through Messenger, or bring it with you in person. You may also use it at checkout.
    </div>

    <div class="never">This gift card never expires</div>
    ${portalUrl ? `<div class="small">${portalUrl}</div>` : ''}
  </div>
</body>
</html>`;
}
