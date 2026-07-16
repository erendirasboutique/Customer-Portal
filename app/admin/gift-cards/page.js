'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminShell from '@/components/AdminShell';

/* ============================================================
   Erendira's Boutique — Admin Studio · Gift cards
   Same endpoints: /api/admin/gift-cards/list, /create,
   /deactivate, /redeem.
   ============================================================ */

function money(value) {
  return '$' + Number(value || 0).toFixed(2);
}

/* ---------------- Translations ---------------- */
const T = {
  en: {
    eyebrow: 'ADMIN STUDIO',
    title: 'Gift Cards',
    sub: 'Issue codes, print the PDF, and mark them redeemed in store.',
    heroLabel: 'Active',
    heroCap: 'codes ready to use',
    statCards: 'Cards',
    statCardsCap: 'Issued all-time',
    statActive: 'Active',
    statActiveCap: 'Still usable',
    statRedemptions: 'Redemptions',
    statRedemptionsCap: 'Times used',
    statRedeemed: 'Redeemed',
    statRedeemedCap: 'Value used up',
    newCard: 'START HERE',
    newCardTitle: 'New Gift Card',
    amount: 'Amount',
    customCode: 'Custom code (optional)',
    customerName: 'Customer name',
    customerEmail: 'Customer email',
    messageLabel: 'Message (printed on the PDF)',
    create: 'Create gift card',
    hint: 'Gift cards work as Stripe promotion codes \u2014 payment links must have \u201cAllow promotion codes\u201d turned on.',
    latest: 'JUST CREATED',
    latestTitle: 'Latest Card',
    latestPlaceholder: 'Create a gift card and its code, portal link, and PDF land here.',
    copyCode: 'Copy code',
    copied: 'Copied',
    openPortal: 'Open portal',
    viewPdf: 'View PDF',
    saved: 'LIBRARY',
    savedTitle: 'Saved Cards',
    refresh: 'Refresh',
    noCards: 'No gift cards yet. Create the first one above.',
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
    tipLabel: 'Quick tip',
    tipBody: 'Marking a card redeemed turns the code off for good. Use Deactivate if you only need to pause it.',
  },
  es: {
    eyebrow: 'ADMIN STUDIO',
    title: 'Tarjetas de Regalo',
    sub: 'Crea c\u00f3digos, imprime el PDF y m\u00e1rcalos canjeados en tienda.',
    heroLabel: 'Activas',
    heroCap: 'c\u00f3digos listos',
    statCards: 'Tarjetas',
    statCardsCap: 'Creadas en total',
    statActive: 'Activas',
    statActiveCap: 'A\u00fan se pueden usar',
    statRedemptions: 'Canjes',
    statRedemptionsCap: 'Veces usadas',
    statRedeemed: 'Canjeado',
    statRedeemedCap: 'Valor consumido',
    newCard: 'EMPIEZA AQU\u00cd',
    newCardTitle: 'Nueva Tarjeta',
    amount: 'Monto',
    customCode: 'C\u00f3digo personalizado (opcional)',
    customerName: 'Nombre de la clienta',
    customerEmail: 'Correo de la clienta',
    messageLabel: 'Mensaje (impreso en el PDF)',
    create: 'Crear tarjeta de regalo',
    hint: 'Las tarjetas funcionan como c\u00f3digos promocionales de Stripe \u2014 los enlaces de pago deben tener \u201cPermitir c\u00f3digos promocionales\u201d activado.',
    latest: 'REC\u00c9N CREADA',
    latestTitle: '\u00daltima Tarjeta',
    latestPlaceholder: 'Crea una tarjeta y aqu\u00ed aparecen su c\u00f3digo, enlace del portal y PDF.',
    copyCode: 'Copiar c\u00f3digo',
    copied: 'Copiado',
    openPortal: 'Abrir portal',
    viewPdf: 'Ver PDF',
    saved: 'BIBLIOTECA',
    savedTitle: 'Tarjetas Guardadas',
    refresh: 'Actualizar',
    noCards: 'A\u00fan no hay tarjetas. Crea la primera arriba.',
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
    tipLabel: 'Tip r\u00e1pido',
    tipBody: 'Marcar canjeada apaga el c\u00f3digo para siempre. Usa Desactivar si solo quieres pausarlo.',
  },
};

const dateLocale = { en: 'en-US', es: 'es-MX' };

const pageCss = '' +
'.ebg-amt { font-size:46px; line-height:1.05; color:#806a52; margin:14px 0 10px;' +
'  font-family:"La Luxes Serif","Recoleta",Georgia,serif; font-weight:400; }' +
'.ebg-code { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12.5px; letter-spacing:.08em;' +
'  display:inline-block; background:rgba(189,168,145,.22); color:#806a52; border-radius:10px; padding:5px 10px; margin-top:4px; }' +
'.ebg-box { border:1px dashed #e8e2d8; border-radius:20px; padding:16px; margin-top:16px; font-size:12.5px;' +
'  color:#bda891; text-align:center; }' +
'.ebg-btnrow { display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; }' +
'.ebg-hint { margin:16px 0 0; padding-top:14px; border-top:1px solid #e8e2d8; font-size:12.5px; color:#8b7a64; }';

/* ============================================================ */
export default function GiftCardsAdminPage() {
  const [lang, setLang] = useState('en');
  const t = T[lang];

  const [admin, setAdmin] = useState(null);
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
    if (saved === 'en' || saved === 'es') setLang(saved);
  }, []);

  // Optional: fills the sidebar profile if you expose the signed-in admin.
  useEffect(function () {
    let cancelled = false;
    fetch('/api/admin/me', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (!cancelled && d) setAdmin(d.admin || d); })
      .catch(function () {});
    return function () { cancelled = true; };
  }, []);

  function formatDate(value) {
    if (!value) return '\u2014';
    return new Date(value).toLocaleString(dateLocale[lang], {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }

  function updateForm(field, value) {
    setForm(function (current) { return { ...current, [field]: value }; });
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
    if (!res.ok) { setMessage(data.error || t.msgLoadFailed); return; }
    setGiftCards(data.giftCards || []);
  }

  useEffect(function () {
    loadGiftCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createGiftCard(e) {
    e.preventDefault();

    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount < 1) { setMessage(t.msgAmount); return; }

    setMessage(t.msgCreating);
    setCreatedGiftCard(null);

    const res = await fetch('/api/admin/gift-cards/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) { setMessage(data.error || t.msgCreateFailed); return; }

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
    if (!res.ok) { setMessage(data.error || t.msgUpdateFailed); return; }

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
    if (!res.ok) { setMessage(data.error || t.msgRedeemFailed); return; }

    setMessage(t.giftCardWord + ' ' + card.code + ' ' + t.msgRedeemed);
    await loadGiftCards();
  }

  async function copyText(text, id) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(function () { setCopiedId(''); }, 1800);
  }

  /* ============================================================ */
  return (
    <AdminShell
      admin={admin}
      active="gift-cards"
      lang={lang}
      onLang={setLang}
      eyebrow={t.eyebrow}
      title={t.title}
      subtitle={t.sub}
      heroStat={{ label: t.heroLabel, value: stats.active, caption: t.heroCap }}
      tip={{ label: t.tipLabel, body: t.tipBody }}
    >
      <style>{pageCss}</style>

      <section className="eba-stats" aria-label="Summary">
        <div className="eba-stat">
          <span className="lb">{t.statCards}</span>
          <b>{stats.count}</b>
          <span className="cap">{t.statCardsCap}</span>
        </div>
        <div className="eba-stat">
          <span className="lb">{t.statActive}</span>
          <b>{stats.active}</b>
          <span className="cap">{t.statActiveCap}</span>
        </div>
        <div className="eba-stat">
          <span className="lb">{t.statRedemptions}</span>
          <b>{stats.redeemed}</b>
          <span className="cap">{t.statRedemptionsCap}</span>
        </div>
        <div className="eba-stat">
          <span className="lb">{t.statRedeemed}</span>
          <b>{money(stats.total)}</b>
          <span className="cap">{t.statRedeemedCap}</span>
        </div>
      </section>

      <div className="eba-cols wide-left">
        <form className="eba-panel" onSubmit={createGiftCard}>
          <p className="eba-eyebrow">{t.newCard}</p>
          <h2>{t.newCardTitle}</h2>

          <div className="eba-formrow even">
            <div>
              <span className="eba-lb">{t.amount}</span>
              <input className="eba-in" type="number" min="1" step="0.01" value={form.amount} onChange={function (e) { updateForm('amount', e.target.value); }} required />
            </div>
            <div>
              <span className="eba-lb">{t.customCode}</span>
              <input className="eba-in" value={form.customCode} onChange={function (e) { updateForm('customCode', e.target.value.toUpperCase()); }} placeholder="EB-XXXX-XXXX" />
            </div>
          </div>

          <div className="eba-formrow even" style={{ marginTop: 12 }}>
            <div>
              <span className="eba-lb">{t.customerName}</span>
              <input className="eba-in" value={form.customerName} onChange={function (e) { updateForm('customerName', e.target.value); }} />
            </div>
            <div>
              <span className="eba-lb">{t.customerEmail}</span>
              <input className="eba-in" type="email" value={form.customerEmail} onChange={function (e) { updateForm('customerEmail', e.target.value); }} />
            </div>
          </div>

          <div className="eba-field" style={{ marginTop: 12 }}>
            <span className="eba-lb">{t.messageLabel}</span>
            <textarea className="eba-in" rows={2} value={form.message} onChange={function (e) { updateForm('message', e.target.value); }} />
          </div>

          <div className="eba-actions">
            <button className="eba-btn eba-btn-dark" type="submit">{t.create}</button>
          </div>

          {message && <div className="eba-notice">{message}</div>}

          <p className="ebg-hint">{t.hint}</p>
        </form>

        <aside className="eba-panel">
          <p className="eba-eyebrow">{t.latest}</p>
          <h2>{t.latestTitle}</h2>

          {createdGiftCard ? (
            <div>
              <p className="ebg-amt">{money(createdGiftCard.amount)}</p>
              <span className="ebg-code">{createdGiftCard.code}</span>
              <div className="ebg-btnrow">
                <button className="eba-btn eba-btn-dark mini" type="button" onClick={function () { copyText(createdGiftCard.code, 'created-code'); }}>
                  {copiedId === 'created-code' ? t.copied : t.copyCode}
                </button>
                <a className="eba-btn mini" href={createdGiftCard.gift_card_url} target="_blank" rel="noopener noreferrer">{t.openPortal}</a>
                <a className="eba-btn mini" href={createdGiftCard.pdf_url} target="_blank" rel="noopener noreferrer">{t.viewPdf}</a>
              </div>
            </div>
          ) : (
            <div className="ebg-box">{t.latestPlaceholder}</div>
          )}
        </aside>
      </div>

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">{t.saved}</p>
            <h2>{t.savedTitle}</h2>
          </div>
          <button className="eba-btn" type="button" onClick={loadGiftCards}>{t.refresh}</button>
        </div>

        <div className="eba-rows">
          {giftCards.map(function (card) {
            const active = card.status === 'active';
            const redeemed = card.status === 'redeemed';
            const subParts = [];
            if (card.customer_name) subParts.push(card.customer_name);
            if (card.customer_email) subParts.push(card.customer_email);
            subParts.push(t.createdWord + ' ' + formatDate(card.created_at));
            if (redeemed && card.redeemed_at) subParts.push(t.redeemedWord + ' ' + formatDate(card.redeemed_at));
            else subParts.push(t.redeemedWord + ' ' + (card.redeemed_count || 0));
            subParts.push(t.totalWord + ' ' + money(card.total_redeemed || 0));
            if (card.redeemed_note) subParts.push(card.redeemed_note);
            return (
              <div className={active ? 'eba-row' : 'eba-row off'} key={card.id}>
                <span className="eba-who">
                  <span className="n">{money(card.amount)} {t.giftCardWord}</span>
                  <span className="s">{subParts.join(' \u00b7 ')}</span>
                  <span className="ebg-code">{card.code}</span>
                </span>
                <span className={redeemed ? 'eba-pill mid' : active ? 'eba-pill ok' : 'eba-pill off'}>
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
                  {active && <button className="eba-btn mini" onClick={function () { redeemGiftCard(card); }}>{t.markRedeemed}</button>}
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
    </AdminShell>
  );
}
