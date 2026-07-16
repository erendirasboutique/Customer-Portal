'use client';

import { useEffect, useMemo, useState } from 'react';

/* ============================================================
   Erendira's Boutique — Admin Studio · Gift cards
   "Atelier" design: espresso sidebar, ruled ledger content.
   Same endpoints: /api/admin/gift-cards/list, /create,
   /deactivate, /redeem, POST /api/auth/logout.
   Requires /public/logo2.png (light logo, shown on espresso).
   ============================================================ */

function money(value) {
  return '$' + Number(value || 0).toFixed(2);
}

/* ---------------- Translations ---------------- */
const T = {
  en: {
    adminStudio: 'ADMIN STUDIO',
    overview: 'Overview',
    paymentLinks: 'Payment links',
    giftCards: 'Gift cards',
    orders: 'Orders',
    shipping: 'Shipping',
    logOut: 'Log out',
    title: 'Gift cards',
    sumCards: 'cards',
    sumActive: 'active',
    sumRedemptions: 'redemptions',
    sumRedeemed: 'redeemed',
    newCard: 'NEW GIFT CARD',
    amount: 'Amount',
    customCode: 'Custom code (optional)',
    customerName: 'Customer name',
    customerEmail: 'Customer email',
    messageLabel: 'Message (printed on the PDF)',
    create: 'Create gift card',
    hint: 'Gift cards work as Stripe promotion codes \u2014 payment links must have \u201cAllow promotion codes\u201d enabled.',
    latest: 'LATEST GIFT CARD',
    latestPlaceholder: 'Create a gift card to see its code, portal link, and PDF here.',
    copyCode: 'Copy code',
    copied: 'Copied!',
    openPortal: 'Open portal',
    viewPdf: 'View PDF',
    saved: 'Saved cards',
    refresh: 'Refresh',
    noCards: 'No gift cards yet.',
    createdWord: 'Created',
    redeemedWord: 'Redeemed',
    totalWord: 'Total',
    active: 'Active',
    redeemed: 'Redeemed',
    deactivated: 'Deactivated',
    codeBtn: 'Code',
    portalBtn: 'Portal',
    openBtn: 'Open',
    pdfBtn: 'PDF',
    markRedeemed: 'Mark redeemed',
    deactivate: 'Deactivate',
    activate: 'Activate',
    msgAmount: 'Enter a gift card amount of at least $1.00.',
    msgCreating: 'Creating gift card...',
    msgCreateFailed: 'Could not create gift card.',
    msgCreated: 'Gift card created.',
    msgLoadFailed: 'Could not load gift cards.',
    msgUpdateFailed: 'Could not update gift card.',
    msgActivated: 'Gift card activated.',
    msgDeactivated: 'Gift card deactivated.',
    msgRedeemFailed: 'Could not redeem gift card.',
    msgRedeemed: 'marked as redeemed.',
    confirmRedeem1: 'Mark the',
    confirmRedeem2: 'gift card',
    confirmRedeem3: 'as redeemed? This deactivates the code so it cannot be used again.',
    promptNote: 'Optional note (e.g. "Redeemed in store 7/10"):',
    giftCardWord: 'Gift card',
  },
  es: {
    adminStudio: 'ADMIN STUDIO',
    overview: 'Resumen',
    paymentLinks: 'Enlaces de pago',
    giftCards: 'Tarjetas de regalo',
    orders: 'Pedidos',
    shipping: 'Env\u00edos',
    logOut: 'Cerrar sesi\u00f3n',
    title: 'Tarjetas de regalo',
    sumCards: 'tarjetas',
    sumActive: 'activas',
    sumRedemptions: 'canjes',
    sumRedeemed: 'canjeado',
    newCard: 'NUEVA TARJETA DE REGALO',
    amount: 'Monto',
    customCode: 'C\u00f3digo personalizado (opcional)',
    customerName: 'Nombre de la clienta',
    customerEmail: 'Correo de la clienta',
    messageLabel: 'Mensaje (impreso en el PDF)',
    create: 'Crear tarjeta de regalo',
    hint: 'Las tarjetas de regalo funcionan como c\u00f3digos promocionales de Stripe \u2014 los enlaces de pago deben tener \u201cPermitir c\u00f3digos promocionales\u201d activado.',
    latest: '\u00daLTIMA TARJETA DE REGALO',
    latestPlaceholder: 'Crea una tarjeta de regalo para ver su c\u00f3digo, enlace del portal y PDF aqu\u00ed.',
    copyCode: 'Copiar c\u00f3digo',
    copied: '\u00a1Copiado!',
    openPortal: 'Abrir portal',
    viewPdf: 'Ver PDF',
    saved: 'Tarjetas guardadas',
    refresh: 'Actualizar',
    noCards: 'A\u00fan no hay tarjetas de regalo.',
    createdWord: 'Creada',
    redeemedWord: 'Canjeada',
    totalWord: 'Total',
    active: 'Activa',
    redeemed: 'Canjeada',
    deactivated: 'Desactivada',
    codeBtn: 'C\u00f3digo',
    portalBtn: 'Portal',
    openBtn: 'Abrir',
    pdfBtn: 'PDF',
    markRedeemed: 'Marcar canjeada',
    deactivate: 'Desactivar',
    activate: 'Activar',
    msgAmount: 'Escribe un monto de al menos $1.00.',
    msgCreating: 'Creando tarjeta de regalo...',
    msgCreateFailed: 'No se pudo crear la tarjeta.',
    msgCreated: 'Tarjeta de regalo creada.',
    msgLoadFailed: 'No se pudieron cargar las tarjetas.',
    msgUpdateFailed: 'No se pudo actualizar la tarjeta.',
    msgActivated: 'Tarjeta activada.',
    msgDeactivated: 'Tarjeta desactivada.',
    msgRedeemFailed: 'No se pudo canjear la tarjeta.',
    msgRedeemed: 'marcada como canjeada.',
    confirmRedeem1: '\u00bfMarcar la tarjeta de',
    confirmRedeem2: 'con c\u00f3digo',
    confirmRedeem3: 'como canjeada? Esto desactiva el c\u00f3digo para que no pueda usarse otra vez.',
    promptNote: 'Nota opcional (ej. "Canjeada en tienda 7/10"):',
    giftCardWord: 'Tarjeta de regalo',
  },
};

const dateLocale = { en: 'en-US', es: 'es-MX' };

/* ---------------- Icons ---------------- */
function Icon(props) {
  return (
    <svg width={props.size || 17} height={props.size || 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {props.children}
    </svg>
  );
}
const IconHome = function () { return (<Icon><path d="M5 12l7-8 7 8" /><path d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9" /></Icon>); };
const IconLink = function () { return (<Icon><path d="M9 15l6-6" /><path d="M11 6l.5-.5a4.95 4.95 0 017 7L18 13" /><path d="M13 18l-.5.5a4.95 4.95 0 01-7-7L6 11" /></Icon>); };
const IconGift = function () { return (<Icon><path d="M3 9h18v3H3z" /><path d="M12 9v12" /><path d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" /><path d="M7.5 9a2.5 2.5 0 010-5C11 4 12 9 12 9s1-5 4.5-5a2.5 2.5 0 010 5" /></Icon>); };
const IconBox = function () { return (<Icon><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M12 12l8-4.5" /><path d="M12 12v9" /><path d="M12 12L4 7.5" /></Icon>); };
const IconTruck = function () { return (<Icon><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M5 17H3V6a1 1 0 011-1h9v12M9 17h6M15 8h4l2 3v6h-2" /></Icon>); };
const IconExternal = function () { return (<Icon size={11}><path d="M7 17L17 7" /><path d="M8 7h9v9" /></Icon>); };
const IconLogout = function () { return (<Icon><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></Icon>); };

/* ---------------- Styles ---------------- */
var css = '' +
'.eba { min-height: 100vh; background: #F5F3EF; color: #3d3128; }' +
'.eba * { box-sizing: border-box; }' +
'.eba a { color: inherit; text-decoration: none; }' +
'.eba button, .eba input, .eba select, .eba textarea { font-family: inherit; }' +
'.eba button { cursor: pointer; }' +
'.eba-shell { min-height: 100vh; display: grid; grid-template-columns: 236px minmax(0,1fr); }' +
'.eba-side { position: sticky; top: 0; height: 100vh; background: #3d3128; padding: 26px 16px 18px; display: flex; flex-direction: column; z-index: 30; }' +
'.eba-logo { width: 138px; height: auto; display: block; object-fit: contain; }' +
'.eba-side-eyebrow { margin: 14px 0 20px; font-size: 9px; letter-spacing: 0.3em; color: #bda891; }' +
'.eba-nav { display: grid; gap: 4px; }' +
'.eba-nav a, .eba-nav button { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 10px; color: #bda891; font-size: 13.5px; border: 0; background: transparent; width: 100%; text-align: left; transition: background .15s ease, color .15s ease; }' +
'.eba-nav a:hover, .eba-nav button:hover { background: rgba(245,243,239,0.07); color: #e3d9cc; }' +
'.eba-nav a.on { background: #806a52; color: #F5F3EF; }' +
'.eba-nav .ic { width: 18px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }' +
'.eba-nav .ext { margin-left: auto; opacity: .7; display: inline-flex; }' +
'.eba-side-div { border-top: 1px solid #5a4c3c; margin: 12px 4px; }' +
'.eba-side-spacer { flex: 1; }' +
'.eba-side-bottom { border-top: 1px solid #5a4c3c; padding-top: 10px; }' +
'.eba-main { min-width: 0; }' +
'.eba-content { max-width: 1240px; margin: 0 auto; padding: 30px 36px 72px; }' +
'.eba-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }' +
'.eba-head h1 { margin: 0; font-size: 34px; font-weight: 400; font-style: italic; color: #3d3128; line-height: 1.1; }' +
'.eba-head .sub { margin: 5px 0 0; font-size: 12px; color: #a08a71; }' +
'.eba-langs { display: flex; border: 1px solid #cbb9a4; border-radius: 999px; overflow: hidden; flex-shrink: 0; }' +
'.eba-langs button { border: 0; background: transparent; padding: 7px 14px; font-size: 10px; letter-spacing: 1.5px; color: #806a52; }' +
'.eba-langs button.on { background: #3d3128; color: #F5F3EF; }' +
'.eba-rule { border-top: 2px solid #3d3128; margin-top: 16px; }' +

/* form + latest */
'.eba-grid2 { display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 20px; }' +
'@media (min-width: 940px) { .eba-grid2 { grid-template-columns: 1.55fr 1fr; } }' +
'.eba-eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: 0.24em; color: #806a52; margin: 0; }' +
'.eba-panel { background: #EDEAE3; border-radius: 16px; padding: 20px; }' +
'.eba-panel.self { align-self: start; background: #fff; border: 1px solid #d8d2c8; }' +
'.eba-formrow { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }' +
'@media (max-width: 560px) { .eba-formrow { grid-template-columns: 1fr; } }' +
'.eba-lb { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: #806a52; margin: 0 0 4px; }' +
'.eba-in { border: 1px solid #d8d2c8; border-radius: 12px; background: #fff; padding: 10px 14px; font-size: 13px; color: #3d3128; outline: none; width: 100%; }' +
'.eba-in:focus { border-color: #806a52; }' +
'textarea.eba-in { resize: vertical; }' +
'.eba-btn { border: 1px solid #d8d2c8; border-radius: 999px; padding: 10px 18px; font-size: 12.5px; background: #fff; color: #6b5638; text-decoration: none; display: inline-block; }' +
'.eba-btn:hover { background: #F5F3EF; }' +
'.eba-btn-dark { background: #3d3128; border-color: #3d3128; color: #F5F3EF; }' +
'.eba-btn-dark:hover { background: #2c241c; }' +
'.eba-btn.mini { padding: 6px 13px; font-size: 11px; }' +
'.eba-notice { margin-top: 12px; background: #fff; border: 1px solid #d8d2c8; border-radius: 12px; padding: 10px 15px; font-size: 12.5px; color: #806a52; }' +
'.eba-hint { margin: 14px 0 0; padding-top: 12px; border-top: 1px dotted #bda891; font-size: 12px; color: #a08a71; }' +
'.eba-sum-amt { font-size: 30px; color: #3d3128; margin: 8px 0 0; font-weight: 400; }' +
'.eba-code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; letter-spacing: 0.08em; }' +
'.eba-codechip { display: inline-block; background: #EDEAE3; border-radius: 8px; padding: 3px 8px; margin-top: 4px; }' +
'.eba-panel.self .eba-codechip { background: #F5F3EF; }' +
'.eba-linkbox { border: 1px dashed #bda891; border-radius: 12px; padding: 14px; margin-top: 14px; font-size: 12px; color: #a08a71; text-align: center; }' +
'.eba-linkbox.ready { text-align: left; border-style: solid; border-color: #806a52; color: #3d3128; background: #F5F3EF; }' +

/* saved list */
'.eba-listhead { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 10px; margin-top: 30px; border-bottom: 1px solid #cbb9a4; padding-bottom: 10px; }' +
'.eba-listhead h2 { margin: 0; font-size: 19px; font-weight: 400; font-style: italic; color: #806a52; }' +
'.eba-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; padding: 14px 4px; border-bottom: 1px dotted #bda891; }' +
'.eba-row.off { opacity: 0.55; }' +
'.eba-who { min-width: 220px; flex: 1; }' +
'.eba-who .n { display: block; font-size: 14.5px; color: #3d3128; }' +
'.eba-who .s { display: block; margin-top: 2px; font-size: 11px; color: #a08a71; }' +
'.eba-pill { border-radius: 999px; padding: 3px 10px; font-size: 9px; letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; }' +
'.eba-pill.ok { background: #e7efe0; color: #3b5a2a; }' +
'.eba-pill.off { background: #fff; border: 1px solid #d8d2c8; color: #806a52; }' +
'.eba-pill.used { background: #3d3128; color: #F5F3EF; }' +
'.eba-rowbtns { display: flex; flex-wrap: wrap; gap: 6px; }' +
'.eba-empty { padding: 44px 18px; text-align: center; font-size: 13.5px; color: #a08a71; border-bottom: 1px dotted #bda891; }' +

/* responsive */
'@media (max-width: 1050px) { .eba-shell { grid-template-columns: 200px minmax(0,1fr); } .eba-content { padding: 24px 20px 60px; } .eba-head h1 { font-size: 28px; } }' +
'@media (max-width: 760px) {' +
' .eba-shell { display: block; }' +
' .eba-side { position: static; height: auto; padding: 14px 12px; }' +
' .eba-logo { width: 108px; }' +
' .eba-side-eyebrow { margin: 8px 0 10px; }' +
' .eba-nav { display: flex; overflow-x: auto; padding-bottom: 3px; }' +
' .eba-nav a, .eba-nav button { white-space: nowrap; padding: 8px 11px; width: auto; }' +
' .eba-side-div, .eba-side-spacer { display: none; }' +
' .eba-side-bottom { border-top: 0; padding-top: 6px; }' +
' .eba-content { padding: 18px 14px 52px; }' +
' .eba-head h1 { font-size: 25px; }' +
' .eba-panel { padding: 16px; }' +
' .eba-row { padding: 12px 2px; row-gap: 8px; }' +
' .eba-who { flex: 1 1 100%; min-width: 0; }' +
' .eba-rowbtns { flex: 1 1 100%; }' +
' .eba-rowbtns .eba-btn { flex: 1; text-align: center; }' +
'}';

/* ============================================================ */
export default function GiftCardsAdminPage() {
  const [lang, setLangState] = useState('en');
  const t = T[lang];

  const [form, setForm] = useState({
    amount: '',
    customerName: '',
    customerEmail: '',
    message: '',
    customCode: '',
  });
  const [message, setMessage] = useState('');
  const [giftCards, setGiftCards] = useState([]);
  const [createdGiftCard, setCreatedGiftCard] = useState(null);
  const [copiedId, setCopiedId] = useState('');

  useEffect(function () {
    const saved = localStorage.getItem('eb-lang');
    if (saved === 'en' || saved === 'es') setLangState(saved);
  }, []);
  function setLang(l) {
    setLangState(l);
    localStorage.setItem('eb-lang', l);
    document.documentElement.lang = l;
  }

  function formatDate(value) {
    if (!value) return '\u2014';
    return new Date(value).toLocaleString(dateLocale[lang], {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }

  function updateForm(field, value) {
    setForm(function (current) {
      return { ...current, [field]: value };
    });
  }

  const stats = useMemo(function () {
    const active = giftCards.filter(function (c) { return c.status === 'active'; }).length;
    const redeemed = giftCards.reduce(function (sum, c) { return sum + Number(c.redeemed_count || 0); }, 0);
    const total = giftCards.reduce(function (sum, c) { return sum + Number(c.total_redeemed || 0); }, 0);
    return { count: giftCards.length, active: active, redeemed: redeemed, total: total };
  }, [giftCards]);

  async function loadGiftCards() {
    const res = await fetch('/api/admin/gift-cards/list', { cache: 'no-store' });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || t.msgLoadFailed);
      return;
    }

    setGiftCards(data.giftCards || []);
  }

  useEffect(function () {
    loadGiftCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createGiftCard(e) {
    e.preventDefault();

    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount < 1) {
      setMessage(t.msgAmount);
      return;
    }

    setMessage(t.msgCreating);
    setCreatedGiftCard(null);

    const res = await fetch('/api/admin/gift-cards/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || t.msgCreateFailed);
      return;
    }

    setCreatedGiftCard(data.giftCard);
    setMessage(t.msgCreated);
    setForm({ amount: '', customerName: '', customerEmail: '', message: '', customCode: '' });
    await loadGiftCards();
  }

  async function toggleGiftCard(card) {
    const nextActive = card.status !== 'active';

    const res = await fetch('/api/admin/gift-cards/deactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: card.id,
        stripePromotionCodeId: card.stripe_promotion_code_id,
        active: nextActive,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || t.msgUpdateFailed);
      return;
    }

    setMessage(nextActive ? t.msgActivated : t.msgDeactivated);
    await loadGiftCards();
  }

  async function redeemGiftCard(card) {
    const ok = confirm(
      t.confirmRedeem1 + ' ' + money(card.amount) + ' ' + t.confirmRedeem2 + ' ' + card.code + ' ' + t.confirmRedeem3
    );
    if (!ok) return;

    const note = prompt(t.promptNote, '') || '';

    const res = await fetch('/api/admin/gift-cards/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: card.id, note: note }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || t.msgRedeemFailed);
      return;
    }

    setMessage(t.giftCardWord + ' ' + card.code + ' ' + t.msgRedeemed);
    await loadGiftCards();
  }

  async function copyText(text, id) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(function () { setCopiedId(''); }, 1800);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  const SHIP = 'https://ship.erendirasboutique.com';

  /* ============================================================ */
  return (
    <main className="eba">
      <style>{css}</style>

      <div className="eba-shell">
        <aside className="eba-side no-print">
          <a href="/admin" aria-label="Erendira's Boutique admin home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo2.png" alt="Erendira&#8217;s Boutique" className="eba-logo" />
          </a>
          <p className="eba-side-eyebrow">{t.adminStudio}</p>

          <nav className="eba-nav" aria-label="Admin navigation">
            <a href="/admin"><span className="ic"><IconHome /></span><span>{t.overview}</span></a>
            <a href="/admin/payment-links"><span className="ic"><IconLink /></span><span>{t.paymentLinks}</span></a>
            <a className="on" href="/admin/gift-cards"><span className="ic"><IconGift /></span><span>{t.giftCards}</span></a>
          </nav>
          <div className="eba-side-div" />
          <nav className="eba-nav" aria-label="Shipping portal">
            <a href={SHIP + '/orders'} target="_blank" rel="noopener noreferrer"><span className="ic"><IconBox /></span><span>{t.orders}</span><span className="ext"><IconExternal /></span></a>
            <a href={SHIP} target="_blank" rel="noopener noreferrer"><span className="ic"><IconTruck /></span><span>{t.shipping}</span><span className="ext"><IconExternal /></span></a>
          </nav>

          <div className="eba-side-spacer" />

          <div className="eba-side-bottom">
            <nav className="eba-nav">
              <button onClick={logout}><span className="ic"><IconLogout /></span><span>{t.logOut}</span></button>
            </nav>
          </div>
        </aside>

        <section className="eba-main">
          <div className="eba-content">
            <div className="eba-head">
              <div>
                <h1>{t.title}</h1>
                <p className="sub">
                  {stats.count} {t.sumCards}{' \u00b7 '}{stats.active} {t.sumActive}{' \u00b7 '}{stats.redeemed} {t.sumRedemptions}{' \u00b7 '}{money(stats.total)} {t.sumRedeemed}
                </p>
              </div>
              <div className="eba-langs" role="group" aria-label="Language">
                {['en', 'es'].map(function (l) {
                  return (
                    <button key={l} className={lang === l ? 'on' : ''} onClick={function () { setLang(l); }}>
                      {l.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="eba-rule" />

            <div className="eba-grid2">
              <form className="eba-panel" onSubmit={createGiftCard}>
                <p className="eba-eyebrow" style={{ marginBottom: 14 }}>{t.newCard}</p>

                <div className="eba-formrow">
                  <div>
                    <span className="eba-lb">{t.amount}</span>
                    <input className="eba-in" type="number" min="1" step="0.01" value={form.amount} onChange={function (e) { updateForm('amount', e.target.value); }} required />
                  </div>
                  <div>
                    <span className="eba-lb">{t.customCode}</span>
                    <input className="eba-in" value={form.customCode} onChange={function (e) { updateForm('customCode', e.target.value.toUpperCase()); }} placeholder="EB-XXXX-XXXX" />
                  </div>
                </div>

                <div className="eba-formrow" style={{ marginTop: 10 }}>
                  <div>
                    <span className="eba-lb">{t.customerName}</span>
                    <input className="eba-in" value={form.customerName} onChange={function (e) { updateForm('customerName', e.target.value); }} />
                  </div>
                  <div>
                    <span className="eba-lb">{t.customerEmail}</span>
                    <input className="eba-in" type="email" value={form.customerEmail} onChange={function (e) { updateForm('customerEmail', e.target.value); }} />
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <span className="eba-lb">{t.messageLabel}</span>
                  <textarea className="eba-in" rows={2} value={form.message} onChange={function (e) { updateForm('message', e.target.value); }} />
                </div>

                <div style={{ marginTop: 16 }}>
                  <button className="eba-btn eba-btn-dark" type="submit">{t.create}</button>
                </div>

                {message && <div className="eba-notice">{message}</div>}

                <p className="eba-hint">{t.hint}</p>
              </form>

              <aside className="eba-panel self">
                <p className="eba-eyebrow">{t.latest}</p>

                {createdGiftCard ? (
                  <div>
                    <p className="eba-sum-amt">{money(createdGiftCard.amount)}</p>
                    <span className="eba-code eba-codechip">{createdGiftCard.code}</span>
                    <div className="eba-linkbox ready">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button className="eba-btn eba-btn-dark mini" type="button" onClick={function () { copyText(createdGiftCard.code, 'created-code'); }}>
                          {copiedId === 'created-code' ? t.copied : t.copyCode}
                        </button>
                        <a className="eba-btn mini" href={createdGiftCard.gift_card_url} target="_blank" rel="noopener noreferrer">{t.openPortal}</a>
                        <a className="eba-btn mini" href={createdGiftCard.pdf_url} target="_blank" rel="noopener noreferrer">{t.viewPdf}</a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="eba-linkbox">{t.latestPlaceholder}</div>
                )}
              </aside>
            </div>

            <div className="eba-listhead">
              <h2>{t.saved}</h2>
              <button className="eba-btn" type="button" onClick={loadGiftCards}>{t.refresh}</button>
            </div>

            <div>
              {giftCards.map(function (card) {
                const active = card.status === 'active';
                const redeemed = card.status === 'redeemed';
                const subParts = [];
                if (card.customer_name) subParts.push(card.customer_name);
                if (card.customer_email) subParts.push(card.customer_email);
                subParts.push(t.createdWord + ' ' + formatDate(card.created_at));
                if (redeemed && card.redeemed_at) {
                  subParts.push(t.redeemedWord + ' ' + formatDate(card.redeemed_at));
                } else {
                  subParts.push(t.redeemedWord + ' ' + (card.redeemed_count || 0));
                }
                subParts.push(t.totalWord + ' ' + money(card.total_redeemed || 0));
                if (card.redeemed_note) subParts.push(card.redeemed_note);
                return (
                  <div className={active ? 'eba-row' : 'eba-row off'} key={card.id}>
                    <span className="eba-who">
                      <span className="n">{money(card.amount)} {t.giftCardWord}</span>
                      <span className="s">{subParts.join(' \u00b7 ')}</span>
                      <span className="eba-code eba-codechip">{card.code}</span>
                    </span>
                    <span className={redeemed ? 'eba-pill used' : active ? 'eba-pill ok' : 'eba-pill off'}>
                      {redeemed ? t.redeemed : active ? t.active : t.deactivated}
                    </span>
                    <span className="eba-rowbtns">
                      <button className="eba-btn eba-btn-dark mini" onClick={function () { copyText(card.code, card.id + '-code'); }}>
                        {copiedId === card.id + '-code' ? t.copied : t.codeBtn}
                      </button>
                      <button className="eba-btn mini" onClick={function () { copyText(card.gift_card_url, card.id + '-url'); }}>
                        {copiedId === card.id + '-url' ? t.copied : t.portalBtn}
                      </button>
                      <a className="eba-btn mini" href={card.gift_card_url} target="_blank" rel="noopener noreferrer">{t.openBtn}</a>
                      <a className="eba-btn mini" href={card.pdf_url} target="_blank" rel="noopener noreferrer">{t.pdfBtn}</a>
                      {active && (
                        <button className="eba-btn mini" onClick={function () { redeemGiftCard(card); }}>{t.markRedeemed}</button>
                      )}
                      {!redeemed && (
                        <button className="eba-btn mini" onClick={function () { toggleGiftCard(card); }}>
                          {active ? t.deactivate : t.activate}
                        </button>
                      )}
                    </span>
                  </div>
                );
              })}
              {giftCards.length === 0 && <div className="eba-empty">{t.noCards}</div>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
