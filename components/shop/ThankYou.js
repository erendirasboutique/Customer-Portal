'use client';

// components/shop/ThankYou.js
// What the buyer sees after paying for a gift card.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LOGO_SRC, publicCss, locales, readLang, saveLang } from '@/components/shop/publicStyles';

const T = {
  en: {
    eyebrow: 'THANK YOU',
    title: 'Your Gift Card Is Ready',
    code: 'Gift card code',
    use: 'Enter this code in the promo code box at checkout.',
    copy: 'Copy code',
    copied: 'Copied',
    pdf: 'Download the gift card (PDF)',
    balance: 'Check the balance',
    another: 'Buy another gift card',
    emailedTo: function (v) { return 'We emailed it to ' + v.recipientName + '.'; },
    scheduled: function (v, date) { return 'We’ll email it to ' + v.recipientName + ' on ' + date + '.'; },
    passAlong: function (v) { return 'Send the PDF or code to ' + v.recipientName + ' however you like.'; },
    copySent: function (v) { return 'A copy and your receipt went to ' + v.buyerEmail + '.'; },
    emailFailed: 'We couldn’t send the email, but your card is ready below. Save the PDF or the code.',
    workingTitle: 'Finishing Your Gift Card',
    working: 'Your payment went through. We’re creating your card now — this page updates on its own.',
    failedTitle: 'Almost There',
    failed: 'Your payment went through, but we hit a snag creating the card. We’ve been alerted and will email your gift card shortly. You won’t be charged twice.',
    unpaidTitle: 'Payment Pending',
    unpaid: 'We haven’t received the payment yet. If you just paid, give it a minute and refresh.',
    invalidTitle: 'Link Not Found',
    invalid: 'We couldn’t find this purchase. If you were charged, reply to your Stripe receipt and we’ll help.',
    refresh: 'Refresh',
    shop: 'Back to the boutique',
  },
  es: {
    eyebrow: 'GRACIAS',
    title: 'Tu Tarjeta Está Lista',
    code: 'Código de la tarjeta',
    use: 'Escribe este código en la casilla de código promocional al pagar.',
    copy: 'Copiar código',
    copied: 'Copiado',
    pdf: 'Descargar la tarjeta (PDF)',
    balance: 'Ver el saldo',
    another: 'Comprar otra tarjeta',
    emailedTo: function (v) { return 'Se la enviamos por correo a ' + v.recipientName + '.'; },
    scheduled: function (v, date) { return 'Se la enviaremos a ' + v.recipientName + ' el ' + date + '.'; },
    passAlong: function (v) { return 'Envía el PDF o el código a ' + v.recipientName + ' como prefieras.'; },
    copySent: function (v) { return 'Una copia y tu recibo llegaron a ' + v.buyerEmail + '.'; },
    emailFailed: 'No pudimos enviar el correo, pero tu tarjeta está lista abajo. Guarda el PDF o el código.',
    workingTitle: 'Terminando Tu Tarjeta',
    working: 'Tu pago se realizó. Estamos creando tu tarjeta — esta página se actualiza sola.',
    failedTitle: 'Ya Casi',
    failed: 'Tu pago se realizó, pero hubo un problema al crear la tarjeta. Ya nos avisaron y te la enviaremos pronto. No se te cobrará dos veces.',
    unpaidTitle: 'Pago Pendiente',
    unpaid: 'Aún no recibimos el pago. Si acabas de pagar, espera un minuto y actualiza.',
    invalidTitle: 'No Encontramos Esta Compra',
    invalid: 'No encontramos esta compra. Si se te cobró, responde a tu recibo de Stripe y te ayudamos.',
    refresh: 'Actualizar',
    shop: 'Volver a la boutique',
  },
};

export default function ThankYou(props) {
  const v = props.view;
  const router = useRouter();
  const [lang, setLangState] = useState('en');
  const [copied, setCopied] = useState(false);
  const t = T[lang];

  useEffect(function () {
    const l = readLang();
    if (l) setLangState(l);
    try { sessionStorage.removeItem('eb-giftcard-draft'); } catch (e) {}
  }, []);

  useEffect(function () {
    if (v.state !== 'working' && v.state !== 'unpaid') return;
    const id = setTimeout(function () { router.refresh(); }, 3000);
    return function () { clearTimeout(id); };
  }, [v.state, router]);

  function setLang(l) { setLangState(l); saveLang(l); }

  async function copy() {
    try {
      await navigator.clipboard.writeText(v.code);
      setCopied(true);
      setTimeout(function () { setCopied(false); }, 1800);
    } catch (e) {}
  }

  const date = v.deliverOn
    ? new Date(v.deliverOn + 'T12:00:00').toLocaleDateString(locales[lang], { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  let lines = [];
  if (v.state === 'fulfilled') {
    if (v.emailStatus === 'failed') lines.push(t.emailFailed);
    else if (v.emailStatus === 'scheduled' && date) lines.push(t.scheduled(v, date));
    else if (v.recipientEmailed && v.emailStatus === 'sent') lines.push(t.emailedTo(v));
    else if (v.recipientName) lines.push(t.passAlong(v));
    if (v.emailStatus === 'sent' || v.emailStatus === 'scheduled') lines.push(t.copySent(v));
  }

  const other = {
    working: [t.workingTitle, t.working],
    unpaid: [t.unpaidTitle, t.unpaid],
    failed: [t.failedTitle, t.failed],
    error: [t.failedTitle, t.failed],
    invalid: [t.invalidTitle, t.invalid],
  }[v.state];

  return (
    <main className="ebp">
      <style>{publicCss}</style>
      <div className="ebp-wrap">
        <div className="ebp-top">
          <a href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SRC} alt="Erendira&#8217;s Boutique" className="ebp-logo" />
          </a>
          <div className="ebp-langs" role="group" aria-label="Language">
            {['en', 'es'].map(function (l) {
              return <button key={l} type="button" className={lang === l ? 'on' : ''} onClick={function () { setLang(l); }}>{l.toUpperCase()}</button>;
            })}
          </div>
        </div>

        {v.state === 'fulfilled' ? (
          <div className="ebp-card glow" style={{ textAlign: 'center' }}>
            <p className="ebp-eyebrow">{t.eyebrow}</p>
            <h1>{t.title}</h1>

            <div className="ebp-gift" style={{ margin: '22px 0 0', textAlign: 'left' }} aria-hidden="true">
              <span className="brand">ERENDIRA&rsquo;S BOUTIQUE</span>
              <span className="amt">${Number(v.amount).toFixed(0)}</span>
              <span className="to">{v.recipientName ? (lang === 'es' ? 'Para ' : 'For ') + v.recipientName : ' '}</span>
            </div>

            <p className="ebp-lb" style={{ marginTop: 22 }}>{t.code}</p>
            <span className="ebp-code">{v.code}</span>
            <p className="ebp-hint" style={{ marginTop: 10 }}>{t.use}</p>

            {lines.map(function (line) { return <p key={line} className="ebp-sub" style={{ margin: '12px 0 0' }}>{line}</p>; })}

            <a className="ebp-btn" href={v.pdfUrl} target="_blank" rel="noopener noreferrer">{t.pdf}</a>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button className="ebp-btn quiet" style={{ flex: 1, marginTop: 0 }} type="button" onClick={copy}>{copied ? t.copied : t.copy}</button>
              <a className="ebp-btn quiet" style={{ flex: 1, marginTop: 0 }} href={'/gift-card-balance?code=' + encodeURIComponent(v.code)}>{t.balance}</a>
            </div>
          </div>
        ) : (
          <div className="ebp-card glow" style={{ textAlign: 'center' }}>
            <p className="ebp-eyebrow">{t.eyebrow}</p>
            <h1>{other[0]}</h1>
            <p className="ebp-sub" style={{ marginBottom: 0 }}>{other[1]}</p>
            {(v.state === 'working' || v.state === 'unpaid') && (
              <button className="ebp-btn quiet" type="button" onClick={function () { router.refresh(); }}>{t.refresh}</button>
            )}
          </div>
        )}

        <p className="ebp-foot">
          <a href="/buy-gift-card">{t.another}</a> &nbsp;&middot;&nbsp; <a href="/">{t.shop}</a>
        </p>
      </div>
    </main>
  );
}
