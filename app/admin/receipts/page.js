'use client';

/* ============================================================
   /admin/receipts — make a branded receipt + short link for any payment
   already in the ledger (e.g. in-store Clover sales that came in through
   "Sync Clover"). Uses the same passcode lock as the card terminals.
   ============================================================ */

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';

const T = {
  en: {
    eyebrow: 'ADMIN STUDIO',
    title: 'Receipts',
    sub: 'Send a branded receipt for any payment, including in-store Clover sales.',
    heroLabel: 'Without receipt',
    heroCap: 'in this list',
    tipLabel: 'Quick tip',
    tipBody: 'In-store sales show up here after you press “Sync Clover” on the dashboard.',
    lockedEyebrow: 'LOCKED',
    lockedTitle: 'Enter Passcode',
    lockedSub: 'Same passcode as the card terminals. Stays unlocked on this device for 12 hours.',
    passcode: 'Passcode',
    unlock: 'Unlock',
    unlocking: 'Checking…',
    listEyebrow: 'PAYMENTS',
    listTitle: 'Recent Payments',
    search: 'Search name, email, amount, last 4…',
    clover: 'Clover (in store)',
    stripe: 'Stripe',
    all: 'All payments',
    loading: 'Loading payments…',
    empty: 'No payments match. Sync Clover on the dashboard to bring in new sales.',
    walkIn: 'Walk-in customer',
    cash: 'Cash',
    ready: 'Receipt ready',
    refunded: 'Refunded',
    create: 'Create receipt',
    cancel: 'Cancel',
    creating: 'Creating…',
    name: 'Customer name',
    email: 'Email',
    note: 'For',
    optional: 'optional',
    notePh: 'optional — e.g. Pink dress, size M',
    formHint: 'Name and email appear on the receipt. They’re also saved on the payment if it didn’t have them.',
    receiptLabel: 'Receipt link',
    copy: 'Copy',
    copied: 'Copied!',
    text: 'Text',
    emailIt: 'Email',
    open: 'Open',
    longLinkNote: 'Short link unavailable — this is the full receipt link.',
    msgBody: 'Hi{name}! Here is your receipt from Erendira’s Boutique: {url}',
    mailSubject: 'Your receipt from Erendira’s Boutique',
    locale: 'en-US',
  },
  es: {
    eyebrow: 'ADMIN STUDIO',
    title: 'Recibos',
    sub: 'Envía un recibo con tu marca para cualquier pago, incluyendo ventas en tienda con Clover.',
    heroLabel: 'Sin recibo',
    heroCap: 'en esta lista',
    tipLabel: 'Consejo',
    tipBody: 'Las ventas en tienda aparecen aquí después de presionar “Sincronizar Clover” en el panel.',
    lockedEyebrow: 'BLOQUEADO',
    lockedTitle: 'Escribe el Código',
    lockedSub: 'El mismo código de las terminales. Queda desbloqueado en este dispositivo por 12 horas.',
    passcode: 'Código',
    unlock: 'Desbloquear',
    unlocking: 'Revisando…',
    listEyebrow: 'PAGOS',
    listTitle: 'Pagos Recientes',
    search: 'Buscar nombre, correo, monto, últimos 4…',
    clover: 'Clover (en tienda)',
    stripe: 'Stripe',
    all: 'Todos los pagos',
    loading: 'Cargando pagos…',
    empty: 'Ningún pago coincide. Sincroniza Clover en el panel para traer ventas nuevas.',
    walkIn: 'Clienta en tienda',
    cash: 'Efectivo',
    ready: 'Recibo listo',
    refunded: 'Reembolsado',
    create: 'Crear recibo',
    cancel: 'Cancelar',
    creating: 'Creando…',
    name: 'Nombre de la clienta',
    email: 'Correo',
    note: 'Concepto',
    optional: 'opcional',
    notePh: 'opcional — ej. Vestido rosa, talla M',
    formHint: 'El nombre y el correo aparecen en el recibo. También se guardan en el pago si no los tenía.',
    receiptLabel: 'Enlace del recibo',
    copy: 'Copiar',
    copied: '¡Copiado!',
    text: 'Mensaje',
    emailIt: 'Correo',
    open: 'Abrir',
    longLinkNote: 'Enlace corto no disponible — este es el enlace completo del recibo.',
    msgBody: '¡Hola{name}! Aquí está tu recibo de Erendira’s Boutique: {url}',
    mailSubject: 'Tu recibo de Erendira’s Boutique',
    locale: 'es-MX',
  },
};

const LANG_KEY = 'eb-lang';

function money(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function when(iso, locale) {
  if (!iso) return '';
  return new Intl.DateTimeFormat(locale, { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

export default function ReceiptsPage(props) {
  const admin = props && props.admin;
  const [lang, setLang] = useState('en');
  const t = T[lang] || T.en;

  const [locked, setLocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const [source, setSource] = useState('clover');
  const [q, setQ] = useState('');
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState('');

  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', note: '' });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(function () {
    try {
      const saved = window.localStorage.getItem(LANG_KEY);
      if (saved === 'en' || saved === 'es') setLang(saved);
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(function () {
    const timer = setTimeout(load, q ? 300 : 0);
    return function () { clearTimeout(timer); };
  }, [source, q]);

  async function load() {
    setError('');
    try {
      const res = await fetch('/api/admin/receipts/payments?source=' + source + '&q=' + encodeURIComponent(q), { cache: 'no-store' });
      const data = await res.json();
      if (res.status === 401) { setLocked(true); setPayments([]); return; }
      if (!res.ok) { setError(data.error || 'Could not load payments.'); setPayments([]); return; }
      setLocked(false);
      setPayments(data.payments || []);
    } catch (e) {
      setError('Could not load payments.');
      setPayments([]);
    }
  }

  async function unlock(e) {
    e.preventDefault();
    if (!passcode) return;
    setUnlocking(true);
    setError('');
    try {
      const res = await fetch('/api/admin/clover-terminal/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Wrong passcode.'); setUnlocking(false); return; }
      setPasscode('');
      setUnlocking(false);
      setPayments(null);
      load();
    } catch (err) {
      setError('Could not unlock.');
      setUnlocking(false);
    }
  }

  function startCreate(p) {
    setOpenId(p.id);
    setFormError('');
    setForm({ name: p.name || '', email: p.email || '', note: '' });
  }

  async function create(e, p) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    setFormError('');
    try {
      const res = await fetch('/api/admin/receipts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: p.id, name: form.name, email: form.email, note: form.note }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.locked) setLocked(true);
        setFormError(data.error || 'Could not create the receipt.');
        setCreating(false);
        return;
      }
      setPayments(function (list) {
        return list.map(function (x) {
          if (x.id !== p.id) return x;
          return { ...x, name: x.name || form.name, email: x.email || form.email, receipt: { url: data.url, number: data.number, short: data.short }, justMade: true };
        });
      });
      setCreating(false);
    } catch (err) {
      setFormError('Could not create the receipt.');
      setCreating(false);
    }
  }

  function message(p) {
    const first = String(p.name || form.name || '').trim().split(' ')[0];
    return t.msgBody.replace('{name}', first ? ' ' + first : '').replace('{url}', p.receipt.url);
  }

  async function copy(p) {
    try {
      await navigator.clipboard.writeText(p.receipt.url);
    } catch (e) {
      window.prompt(t.receiptLabel, p.receipt.url);
      return;
    }
    setCopiedId(p.id);
    setTimeout(function () { setCopiedId(null); }, 2000);
  }

  function methodText(p) {
    if (p.last4 || p.brand) return [p.brand ? String(p.brand).toUpperCase() : '', p.last4 ? '•••• ' + p.last4 : ''].filter(Boolean).join(' ');
    if (p.method === 'cash') return t.cash;
    return p.method && p.method !== 'card' ? p.method : '';
  }

  const waiting = (payments || []).filter(function (p) { return !p.receipt; }).length;

  return (
    <AdminShell
      admin={admin}
      active="receipts"
      lang={lang}
      onLang={setLang}
      eyebrow={t.eyebrow}
      title={t.title}
      subtitle={t.sub}
      heroStat={{ label: t.heroLabel, value: payments ? String(waiting) : '—', caption: t.heroCap }}
      tip={{ label: t.tipLabel, body: t.tipBody }}
    >
      <style>{css}</style>

      {locked ? (
        <form className="eba-panel ebr-narrow" onSubmit={unlock}>
          <p className="eba-eyebrow">{t.lockedEyebrow}</p>
          <h2>{t.lockedTitle}</h2>
          <p className="eba-muted ebr-gap">{t.lockedSub}</p>
          <div className="eba-field">
            <label className="eba-lb" htmlFor="ebr-pass">{t.passcode}</label>
            <input id="ebr-pass" className="eba-in" type="password" autoComplete="off" value={passcode} onChange={function (e) { setPasscode(e.target.value); }} autoFocus />
          </div>
          <div className="eba-actions">
            <button className="eba-btn eba-btn-dark" type="submit" disabled={unlocking || !passcode}>{unlocking ? t.unlocking : t.unlock}</button>
          </div>
          {error && <div className="eba-err" role="alert">{error}</div>}
        </form>
      ) : (
        <div className="eba-panel">
          <div className="eba-panelhead">
            <div>
              <p className="eba-eyebrow">{t.listEyebrow}</p>
              <h2>{t.listTitle}</h2>
            </div>
          </div>

          <div className="eba-toolbar">
            <label className="eba-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input value={q} placeholder={t.search} onChange={function (e) { setQ(e.target.value); }} />
            </label>
            <select className="eba-select" value={source} onChange={function (e) { setSource(e.target.value); setPayments(null); }}>
              <option value="clover">{t.clover}</option>
              <option value="stripe">{t.stripe}</option>
              <option value="all">{t.all}</option>
            </select>
          </div>

          {error && <div className="eba-err" role="alert">{error}</div>}

          <div className="eba-rows ebr-list">
            {payments === null && <div className="eba-empty">{t.loading}</div>}
            {payments && payments.length === 0 && !error && <div className="eba-empty">{t.empty}</div>}

            {payments && payments.map(function (p) {
              const open = openId === p.id;
              return (
                <div key={p.id} className={'ebr-item' + (open ? ' open' : '')}>
                  <div className="eba-row">
                    <div className="eba-who">
                      <span className="n">{p.name || t.walkIn}</span>
                      <span className="s">{[when(p.created_at, t.locale), methodText(p), p.email].filter(Boolean).join(' · ')}</span>
                    </div>
                    {p.status === 'refunded' && <span className="eba-pill off">{t.refunded}</span>}
                    {p.receipt && <span className="eba-pill ok">{t.ready}</span>}
                    <span className="eba-amt">{money(p.amount)}</span>
                    <div className="eba-rowbtns">
                      {p.receipt ? (
                        <>
                          <button className="eba-btn mini" type="button" onClick={function () { copy(p); }}>{copiedId === p.id ? t.copied : t.copy}</button>
                          <button className="eba-btn mini" type="button" onClick={function () { setOpenId(open ? null : p.id); }}>{open ? t.cancel : t.open + '…'}</button>
                        </>
                      ) : (
                        <button className="eba-btn mini eba-btn-dark" type="button" onClick={function () { open ? setOpenId(null) : startCreate(p); }}>
                          {open ? t.cancel : t.create}
                        </button>
                      )}
                    </div>
                  </div>

                  {open && !p.receipt && (
                    <form className="ebr-panel" onSubmit={function (e) { create(e, p); }}>
                      <div className="eba-formrow even">
                        <div className="eba-field">
                          <label className="eba-lb" htmlFor={'n-' + p.id}>{t.name}</label>
                          <input id={'n-' + p.id} className="eba-in" placeholder={t.optional} value={form.name} onChange={function (e) { setForm({ ...form, name: e.target.value }); }} autoComplete="off" />
                        </div>
                        <div className="eba-field">
                          <label className="eba-lb" htmlFor={'e-' + p.id}>{t.email}</label>
                          <input id={'e-' + p.id} className="eba-in" type="email" placeholder={t.optional} value={form.email} onChange={function (e) { setForm({ ...form, email: e.target.value }); }} autoComplete="off" />
                        </div>
                      </div>
                      <div className="eba-field">
                        <label className="eba-lb" htmlFor={'f-' + p.id}>{t.note}</label>
                        <input id={'f-' + p.id} className="eba-in" placeholder={t.notePh} value={form.note} onChange={function (e) { setForm({ ...form, note: e.target.value }); }} autoComplete="off" />
                      </div>
                      <p className="ebr-hint">{t.formHint}</p>
                      <div className="eba-actions">
                        <button className="eba-btn eba-btn-dark" type="submit" disabled={creating}>{creating ? t.creating : t.create}</button>
                      </div>
                      {formError && <div className="eba-err" role="alert">{formError}</div>}
                    </form>
                  )}

                  {open && p.receipt && (
                    <div className="ebr-panel">
                      <span className="eba-lb">{t.receiptLabel}</span>
                      <div className="ebr-linkrow">
                        <a className="ebr-link" href={p.receipt.url} target="_blank" rel="noopener noreferrer">{p.receipt.url.replace(/^https?:\/\//, '')}</a>
                      </div>
                      {p.receipt.short === false && <p className="ebr-hint">{t.longLinkNote}</p>}
                      <div className="eba-actions">
                        <button className="eba-btn eba-btn-dark" type="button" onClick={function () { copy(p); }}>{copiedId === p.id ? t.copied : t.copy}</button>
                        <a className="eba-btn" href={'sms:?&body=' + encodeURIComponent(message(p))}>{t.text}</a>
                        <a className="eba-btn" href={'mailto:' + encodeURIComponent(String(p.email || '').trim()) + '?subject=' + encodeURIComponent(t.mailSubject) + '&body=' + encodeURIComponent(message(p))}>{t.emailIt}</a>
                        <a className="eba-btn" href={p.receipt.url} target="_blank" rel="noopener noreferrer">{t.open}</a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

/* Only the bits AdminShell doesn't already style. */
const css = '' +
'.ebr-narrow { max-width:520px; }' +
'.ebr-gap { margin:-8px 0 16px; }' +
'.ebr-list { margin-top:16px; }' +
'.ebr-item.open > .eba-row { border-color:var(--line); background:var(--card); border-radius:20px 20px 0 0; }' +
'.ebr-panel { background:var(--card); border:1px solid var(--line); border-top:0; border-radius:0 0 20px 20px; padding:16px 18px 18px; margin-top:-10px; }' +
'.ebr-hint { margin:8px 0 0; font-size:11.5px; color:var(--sand); }' +
'.ebr-linkrow { background:var(--wash); border:1px solid var(--line); border-radius:14px; padding:12px 14px; }' +
'.ebr-link { font-size:15px; color:var(--taupe); text-decoration:underline; text-underline-offset:3px; overflow-wrap:anywhere; }' +
'.ebr-panel .eba-formrow > .eba-field { margin-top:0; }';
