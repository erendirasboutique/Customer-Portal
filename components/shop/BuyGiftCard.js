'use client';

// components/shop/BuyGiftCard.js
// The /buy-gift-card form: amount, who it's for, message, delivery date,
// a live preview of the card, then off to Stripe Checkout.

import { useEffect, useState } from 'react';
import { LOGO_SRC, publicCss, readLang, saveLang } from '@/components/shop/publicStyles';

const T = {
  en: {
    eyebrow: "ERENDIRA'S BOUTIQUE",
    title: 'Give a Gift Card',
    sub: 'Pick an amount, add a note, and we’ll take care of the rest.',
    amount: 'Amount',
    custom: 'Other amount',
    customHint: function (min, max) { return 'Any whole dollar amount from $' + min + ' to $' + max + '.'; },
    whoFor: 'Who is it for?',
    me: 'Me',
    someone: 'Someone else',
    recipientName: 'Their name',
    recipientEmail: 'Their email (optional)',
    recipientEmailHint: 'We’ll email the gift card to them. Leave blank to send it yourself.',
    recipientEmailHintOff: 'You’ll get the gift card by email and on screen to pass along.',
    deliverOn: 'Send it on',
    deliverHint: 'Leave as today to send right away, or pick a birthday or holiday.',
    message: 'Message (optional)',
    messagePh: 'Happy birthday! Treat yourself ♥',
    yourName: 'Your name',
    yourEmail: 'Your email',
    yourEmailHint: 'Your receipt and a copy of the card go here.',
    preview: 'PREVIEW',
    forWord: 'For',
    pay: function (a) { return 'Continue to payment · ' + a; },
    paying: 'Opening secure checkout...',
    secure: 'Secure checkout by Stripe.',
    canceled: 'Checkout was canceled. Your details are still here if you want to try again.',
    balanceLink: 'Already have a card? Check your balance',
    errors: {
      amount: 'Choose an amount between the limits.',
      buyerName: 'Enter your name.',
      buyerEmail: 'Enter a valid email for your receipt.',
      recipientName: 'Enter their name.',
      recipientEmail: 'Their email doesn’t look right.',
      deliverOn: 'Pick a date from today to one year out.',
      server: 'Something went wrong. Please try again.',
    },
  },
  es: {
    eyebrow: "ERENDIRA'S BOUTIQUE",
    title: 'Regala una Tarjeta',
    sub: 'Elige un monto, agrega un mensaje y nosotros hacemos el resto.',
    amount: 'Monto',
    custom: 'Otro monto',
    customHint: function (min, max) { return 'Cualquier monto en dólares enteros de $' + min + ' a $' + max + '.'; },
    whoFor: '¿Para quién es?',
    me: 'Para mí',
    someone: 'Para alguien más',
    recipientName: 'Su nombre',
    recipientEmail: 'Su correo (opcional)',
    recipientEmailHint: 'Le enviaremos la tarjeta por correo. Déjalo vacío para enviarla tú.',
    recipientEmailHintOff: 'Recibirás la tarjeta por correo y en pantalla para compartirla.',
    deliverOn: 'Enviarla el',
    deliverHint: 'Déjalo en hoy para enviarla ya, o elige un cumpleaños o día festivo.',
    message: 'Mensaje (opcional)',
    messagePh: '¡Feliz cumpleaños! Date un gusto ♥',
    yourName: 'Tu nombre',
    yourEmail: 'Tu correo',
    yourEmailHint: 'Aquí llegan tu recibo y una copia de la tarjeta.',
    preview: 'VISTA PREVIA',
    forWord: 'Para',
    pay: function (a) { return 'Continuar al pago · ' + a; },
    paying: 'Abriendo pago seguro...',
    secure: 'Pago seguro con Stripe.',
    canceled: 'Se canceló el pago. Tus datos siguen aquí si quieres intentar otra vez.',
    balanceLink: '¿Ya tienes una tarjeta? Consulta tu saldo',
    errors: {
      amount: 'Elige un monto dentro de los límites.',
      buyerName: 'Escribe tu nombre.',
      buyerEmail: 'Escribe un correo válido para tu recibo.',
      recipientName: 'Escribe su nombre.',
      recipientEmail: 'Su correo no parece correcto.',
      deliverOn: 'Elige una fecha de hoy a un año.',
      server: 'Algo salió mal. Intenta de nuevo.',
    },
  },
};

function todayLocal() {
  const d = new Date();
  const p = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

const STORE_KEY = 'eb-giftcard-draft';

export default function BuyGiftCard(props) {
  const [lang, setLangState] = useState('en');
  const t = T[lang];

  const [preset, setPreset] = useState(props.presets[1] || props.presets[0]);
  const [custom, setCustom] = useState('');
  const [forSomeoneElse, setForSomeoneElse] = useState(true);
  const [form, setForm] = useState({
    recipientName: '', recipientEmail: '', message: '', buyerName: '', buyerEmail: '', deliverOn: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [canceled, setCanceled] = useState(false);

  useEffect(function () {
    const l = readLang();
    if (l) setLangState(l);
    const q = new URLSearchParams(window.location.search);
    if (q.get('canceled')) {
      setCanceled(true);
      try {
        const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
        if (saved) {
          setForm(saved.form);
          setForSomeoneElse(saved.forSomeoneElse);
          if (saved.custom) setCustom(saved.custom); else setPreset(saved.preset);
        }
      } catch (e) {}
    }
    const a = Number(q.get('amount'));
    if (a && props.presets.includes(a)) setPreset(a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setLang(l) { setLangState(l); saveLang(l); }
  function update(field, value) {
    setForm(function (f) { return { ...f, [field]: value }; });
    setError('');
  }

  const amount = custom ? Number(custom) : preset;
  const amountOk = Number.isInteger(amount) && amount >= props.min && amount <= props.max;
  const amountLabel = amountOk ? '$' + amount : '$—';
  const showDate = props.canEmail && forSomeoneElse && form.recipientEmail.trim() !== '';

  async function submit(e) {
    e.preventDefault();
    if (!amountOk) { setError('amount'); return; }
    setBusy(true);
    setError('');
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ form: form, forSomeoneElse: forSomeoneElse, preset: preset, custom: custom })); } catch (err) {}
    try {
      const res = await fetch('/api/gift-card-shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          forSomeoneElse: forSomeoneElse,
          recipientName: form.recipientName,
          recipientEmail: form.recipientEmail,
          message: form.message,
          buyerName: form.buyerName,
          buyerEmail: form.buyerEmail,
          deliverOn: showDate && form.deliverOn && form.deliverOn !== todayLocal() ? form.deliverOn : '',
          lang: lang,
        }),
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok || !data.url) {
        setError(data.error && t.errors[data.error] ? data.error : 'server');
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError('server');
      setBusy(false);
    }
  }

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

        <div className="ebp-card glow">
          <p className="ebp-eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p className="ebp-sub">{t.sub}</p>

          <p className="ebp-lb">{t.preview}</p>
          <div className="ebp-gift" aria-hidden="true">
            <span className="brand">ERENDIRA&rsquo;S BOUTIQUE</span>
            <span className="amt">{amountLabel}</span>
            <span>
              <span className="to" style={{ display: 'block' }}>
                {forSomeoneElse && form.recipientName ? t.forWord + ' ' + form.recipientName : ' '}
              </span>
              {form.message && <span className="note">&ldquo;{form.message}&rdquo;</span>}
            </span>
          </div>
        </div>

        <form className="ebp-card" onSubmit={submit} noValidate>
          <span className="ebp-lb">{t.amount}</span>
          <div className="ebp-chips">
            {props.presets.map(function (p) {
              return (
                <button key={p} type="button" className={!custom && preset === p ? 'ebp-chip on' : 'ebp-chip'}
                  onClick={function () { setPreset(p); setCustom(''); setError(''); }}>
                  ${p}
                </button>
              );
            })}
          </div>
          <div className="ebp-field" style={{ marginTop: 12 }}>
            <span className="ebp-lb">{t.custom}</span>
            <input className="ebp-in" inputMode="numeric" value={custom} placeholder={'$' + props.min + ' – $' + props.max}
              onChange={function (e) { setCustom(e.target.value.replace(/[^0-9]/g, '').slice(0, 4)); setError(''); }} />
            <p className="ebp-hint">{t.customHint(props.min, props.max)}</p>
          </div>

          <div className="ebp-field" style={{ marginTop: 20 }}>
            <span className="ebp-lb">{t.whoFor}</span>
            <div className="ebp-seg" role="group">
              <button type="button" className={forSomeoneElse ? 'on' : ''} onClick={function () { setForSomeoneElse(true); }}>{t.someone}</button>
              <button type="button" className={!forSomeoneElse ? 'on' : ''} onClick={function () { setForSomeoneElse(false); }}>{t.me}</button>
            </div>
          </div>

          {forSomeoneElse && (
            <>
              <div className="ebp-row" style={{ marginTop: 12 }}>
                <div>
                  <span className="ebp-lb">{t.recipientName}</span>
                  <input className="ebp-in" value={form.recipientName} maxLength={120} autoComplete="off"
                    onChange={function (e) { update('recipientName', e.target.value); }} />
                </div>
                <div>
                  <span className="ebp-lb">{t.recipientEmail}</span>
                  <input className="ebp-in" type="email" value={form.recipientEmail} maxLength={200} autoComplete="off"
                    onChange={function (e) { update('recipientEmail', e.target.value); }} />
                </div>
              </div>
              <p className="ebp-hint">{props.canEmail ? t.recipientEmailHint : t.recipientEmailHintOff}</p>

              {showDate && (
                <div className="ebp-field" style={{ marginTop: 12 }}>
                  <span className="ebp-lb">{t.deliverOn}</span>
                  <input className="ebp-in" type="date" min={todayLocal()} value={form.deliverOn || todayLocal()}
                    onChange={function (e) { update('deliverOn', e.target.value); }} />
                  <p className="ebp-hint">{t.deliverHint}</p>
                </div>
              )}
            </>
          )}

          <div className="ebp-field" style={{ marginTop: 12 }}>
            <span className="ebp-lb">{t.message}</span>
            <textarea className="ebp-in" rows={3} maxLength={300} value={form.message} placeholder={t.messagePh}
              onChange={function (e) { update('message', e.target.value); }} />
          </div>

          <div className="ebp-row" style={{ marginTop: 20 }}>
            <div>
              <span className="ebp-lb">{t.yourName}</span>
              <input className="ebp-in" value={form.buyerName} maxLength={120} autoComplete="name"
                onChange={function (e) { update('buyerName', e.target.value); }} />
            </div>
            <div>
              <span className="ebp-lb">{t.yourEmail}</span>
              <input className="ebp-in" type="email" value={form.buyerEmail} maxLength={200} autoComplete="email"
                onChange={function (e) { update('buyerEmail', e.target.value); }} />
            </div>
          </div>
          <p className="ebp-hint">{t.yourEmailHint}</p>

          <button className="ebp-btn" type="submit" disabled={busy}>{busy ? t.paying : t.pay(amountLabel)}</button>
          <p className="ebp-hint" style={{ textAlign: 'center', marginTop: 10 }}>{t.secure}</p>

          {error && <div className="ebp-msg err" role="alert">{t.errors[error] || t.errors.server}</div>}
          {canceled && !error && <div className="ebp-msg">{t.canceled}</div>}
        </form>

        <p className="ebp-foot"><a href="/gift-card-balance">{t.balanceLink}</a></p>
      </div>
    </main>
  );
}
