'use client';

/* ============================================================
   /admin/clover-terminal — take a card payment by hand (phone orders).
   Renders inside AdminShell like every other admin page.
   Card numbers are typed into Clover's secure fields (iframes), so they
   never touch this site. The server only receives a one-time token.
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import AdminShell from '@/components/AdminShell';

const T = {
  en: {
    eyebrow: 'ADMIN STUDIO',
    title: 'Card Terminal',
    sub: 'Take a card payment by phone. Charges go through Clover.',
    heroLabel: 'Charge',
    heroCap: 'ready to run',
    tipLabel: 'Quick tip',
    tipBody: 'Read the amount back to the customer before you press Charge. Refunds are done in your Clover dashboard.',
    sandbox: 'SANDBOX MODE — test cards only, no real money moves.',
    lockedEyebrow: 'LOCKED',
    lockedTitle: 'Enter Passcode',
    lockedSub: 'The terminal stays unlocked on this device for 12 hours.',
    passcode: 'Passcode',
    unlock: 'Unlock',
    unlocking: 'Checking…',
    lock: 'Lock terminal',
    detailsEyebrow: 'PHONE ORDER',
    detailsTitle: 'New Charge',
    amount: 'Amount',
    name: 'Customer name',
    email: 'Email for receipt',
    emailPh: 'optional',
    note: 'Note',
    notePh: 'optional — e.g. Order #1042, pink dress',
    card: 'Card',
    cardNumber: 'Card number',
    exp: 'Expiration',
    cvv: 'CVV',
    zip: 'ZIP',
    charge: 'Charge',
    charging: 'Charging…',
    loading: 'Loading secure card fields…',
    secure: 'Card details go straight to Clover and are never stored here.',
    successEyebrow: 'APPROVED',
    successTitle: 'Payment Approved',
    successSub: 'charged to',
    savedLedger: 'Saved to the payment ledger.',
    syncing: 'Adding it to the payment ledger…',
    synced: 'Added to the payment ledger.',
    syncLater: 'Press “Sync Clover” on the dashboard to see it in the ledger.',
    newCharge: 'New charge',
    toDashboard: 'Back to dashboard',
    needAmount: 'Enter the amount to charge.',
    needName: 'Enter the customer’s name.',
    fixCard: 'Check the card details.',
    confirm: 'Charge {amt} to this card?',
    sdkFail: 'Could not load Clover’s card fields. Check your connection and reload.',
    limit: 'Limit per charge:',
  },
  es: {
    eyebrow: 'ADMIN STUDIO',
    title: 'Terminal de Tarjeta',
    sub: 'Cobra con tarjeta por teléfono. Los cobros pasan por Clover.',
    heroLabel: 'Cobro',
    heroCap: 'listo para cobrar',
    tipLabel: 'Consejo',
    tipBody: 'Confírmale el monto a la clienta antes de cobrar. Los reembolsos se hacen en tu panel de Clover.',
    sandbox: 'MODO SANDBOX — solo tarjetas de prueba, no se mueve dinero real.',
    lockedEyebrow: 'BLOQUEADA',
    lockedTitle: 'Escribe el Código',
    lockedSub: 'La terminal queda desbloqueada en este dispositivo por 12 horas.',
    passcode: 'Código',
    unlock: 'Desbloquear',
    unlocking: 'Revisando…',
    lock: 'Bloquear terminal',
    detailsEyebrow: 'PEDIDO POR TELÉFONO',
    detailsTitle: 'Nuevo Cobro',
    amount: 'Monto',
    name: 'Nombre de la clienta',
    email: 'Correo para recibo',
    emailPh: 'opcional',
    note: 'Nota',
    notePh: 'opcional — ej. Pedido #1042, vestido rosa',
    card: 'Tarjeta',
    cardNumber: 'Número de tarjeta',
    exp: 'Vencimiento',
    cvv: 'CVV',
    zip: 'Código postal',
    charge: 'Cobrar',
    charging: 'Cobrando…',
    loading: 'Cargando campos seguros…',
    secure: 'Los datos de la tarjeta van directo a Clover y nunca se guardan aquí.',
    successEyebrow: 'APROBADO',
    successTitle: 'Pago Aprobado',
    successSub: 'cobrado a',
    savedLedger: 'Guardado en el libro de pagos.',
    syncing: 'Agregándolo al libro de pagos…',
    synced: 'Agregado al libro de pagos.',
    syncLater: 'Presiona “Sincronizar Clover” en el panel para verlo.',
    newCharge: 'Nuevo cobro',
    toDashboard: 'Volver al panel',
    needAmount: 'Escribe el monto a cobrar.',
    needName: 'Escribe el nombre de la clienta.',
    fixCard: 'Revisa los datos de la tarjeta.',
    confirm: '¿Cobrar {amt} a esta tarjeta?',
    sdkFail: 'No se pudieron cargar los campos de Clover. Revisa tu conexión y recarga.',
    limit: 'Límite por cobro:',
  },
};

// Same key AdminShell uses, so the language matches every other admin page.
const LANG_KEY = 'eb-lang';

function money(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function loadScript(src) {
  return new Promise(function (resolve, reject) {
    if (typeof window !== 'undefined' && window.Clover) return resolve();
    const existing = document.querySelector('script[data-clover-sdk]');
    if (existing) {
      existing.addEventListener('load', function () { resolve(); });
      existing.addEventListener('error', reject);
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.setAttribute('data-clover-sdk', '1');
    s.onload = function () { resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function newKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now()) + Math.random().toString(16).slice(2);
}

export default function CloverTerminalPage(props) {
  const admin = props && props.admin;
  const [lang, setLang] = useState('en');
  const t = T[lang] || T.en;

  const [config, setConfig] = useState(null);   // null = loading
  const [error, setError] = useState('');
  const [passcode, setPasscode] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');

  const [fieldsReady, setFieldsReady] = useState(false);
  const [charging, setCharging] = useState(false);
  const [result, setResult] = useState(null);
  const [ledgerMsg, setLedgerMsg] = useState('');

  const cloverRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(function () {
    try {
      const saved = window.localStorage.getItem(LANG_KEY);
      if (saved === 'en' || saved === 'es') setLang(saved);
    } catch (e) { /* ignore */ }
    loadConfig();
  }, []);

  async function loadConfig() {
    setError('');
    try {
      const res = await fetch('/api/admin/clover-terminal/config', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not load terminal.'); setConfig({ unlocked: false, broken: true }); return; }
      setConfig(data);
    } catch (e) {
      setError('Could not load terminal.');
      setConfig({ unlocked: false, broken: true });
    }
  }

  // Draw Clover's secure card fields once unlocked.
  useEffect(function () {
    if (!config || !config.unlocked || mountedRef.current || result) return;
    let cancelled = false;
    loadScript(config.sdkUrl)
      .then(function () {
        if (cancelled || mountedRef.current) return;
        const clover = new window.Clover(config.publicKey, { merchantId: config.merchantId });
        const elements = clover.elements();
        const styles = {
          body: { fontFamily: 'Georgia, serif' },
          input: { fontSize: '15px', color: '#da5e16' },
        };
        elements.create('CARD_NUMBER', styles).mount('#ebt-card-number');
        elements.create('CARD_DATE', styles).mount('#ebt-card-date');
        elements.create('CARD_CVV', styles).mount('#ebt-card-cvv');
        elements.create('CARD_POSTAL_CODE', styles).mount('#ebt-card-zip');
        cloverRef.current = clover;
        mountedRef.current = true;
        setFieldsReady(true);
      })
      .catch(function () { setError(t.sdkFail); });
    return function () { cancelled = true; };
  }, [config, result]);

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
      loadConfig();
    } catch (err) {
      setError('Could not unlock.');
      setUnlocking(false);
    }
  }

  async function lock() {
    await fetch('/api/admin/clover-terminal/unlock', { method: 'DELETE' });
    window.location.reload();
  }

  async function charge(e) {
    e.preventDefault();
    if (charging) return;
    setError('');

    const amt = Number(String(amount).replace(/[^0-9.]/g, ''));
    if (!amt || amt <= 0) { setError(t.needAmount); return; }
    if (!name.trim()) { setError(t.needName); return; }
    if (!cloverRef.current) { setError(t.loading); return; }
    if (!window.confirm(t.confirm.replace('{amt}', money(amt)))) return;

    setCharging(true);
    try {
      const tok = await cloverRef.current.createToken();
      const errs = tok && tok.errors ? Object.values(tok.errors).filter(Boolean) : [];
      if (!tok || !tok.token) {
        const first = errs.find(function (x) { return x && x.error; });
        setError(first ? first.error : t.fixCard);
        setCharging(false);
        return;
      }

      const res = await fetch('/api/admin/clover-terminal/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tok.token,
          amount: amt,
          name: name,
          email: email,
          note: note,
          idempotencyKey: newKey(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.locked) { setConfig({ unlocked: false }); mountedRef.current = false; setFieldsReady(false); }
        setError(data.error || 'The charge did not go through.');
        setCharging(false);
        return;
      }

      setResult(data);
      setCharging(false);

      if (data.recorded) {
        setLedgerMsg(t.savedLedger);
      } else {
        // Pull it in with the normal Clover sync.
        setLedgerMsg(t.syncing);
        setTimeout(async function () {
          try {
            const s = await fetch('/api/admin/clover-sync', { method: 'POST' });
            setLedgerMsg(s.ok ? t.synced : t.syncLater);
          } catch (err) { setLedgerMsg(t.syncLater); }
        }, 3000);
      }
    } catch (err) {
      setError('Something went wrong. Check the dashboard before charging again.');
      setCharging(false);
    }
  }

  function startOver() {
    // Clover's card fields can't be cleared safely, so reload for a fresh set.
    window.location.reload();
  }

  const amtNum = Number(String(amount).replace(/[^0-9.]/g, '')) || 0;

  return (
    <AdminShell
      admin={admin}
      active="card-terminal"
      lang={lang}
      onLang={setLang}
      eyebrow={t.eyebrow}
      title={t.title}
      subtitle={t.sub}
      heroStat={{ label: t.heroLabel, value: amtNum ? money(amtNum) : '$0.00', caption: t.heroCap }}
      tip={{ label: t.tipLabel, body: t.tipBody }}
    >
      <style>{css}</style>

      {config && config.sandbox && <div className="eba-notice">{t.sandbox}</div>}

      {config === null && (
        <div className="eba-panel"><p className="eba-muted">{t.loading}</p></div>
      )}

      {/* ---------- Locked ---------- */}
      {config && !config.unlocked && !config.broken && (
        <form className="eba-panel ebt-narrow" onSubmit={unlock}>
          <p className="eba-eyebrow">{t.lockedEyebrow}</p>
          <h2>{t.lockedTitle}</h2>
          <p className="eba-muted ebt-gap">{t.lockedSub}</p>
          <div className="eba-field">
            <label className="eba-lb" htmlFor="ebt-pass">{t.passcode}</label>
            <input
              id="ebt-pass"
              className="eba-in"
              type="password"
              autoComplete="off"
              value={passcode}
              onChange={function (e) { setPasscode(e.target.value); }}
              autoFocus
            />
          </div>
          <div className="eba-actions">
            <button className="eba-btn eba-btn-dark" type="submit" disabled={unlocking || !passcode}>
              {unlocking ? t.unlocking : t.unlock}
            </button>
          </div>
          {error && <div className="eba-err" role="alert">{error}</div>}
        </form>
      )}

      {/* ---------- Success ---------- */}
      {result && (
        <div className="eba-panel ebt-success">
          <div className="ebt-check" aria-hidden="true">{'✓'}</div>
          <p className="eba-eyebrow">{t.successEyebrow}</p>
          <h2>{t.successTitle}</h2>
          <p className="ebt-big eba-display">{money(result.amount)}</p>
          <p className="eba-muted">
            {t.successSub} {result.brand ? String(result.brand).toUpperCase() : ''} {result.last4 ? '•••• ' + result.last4 : ''}
            {name ? ' · ' + name : ''}
          </p>
          {ledgerMsg && <div className="eba-notice">{ledgerMsg}</div>}
          <div className="eba-actions ebt-center">
            <button className="eba-btn eba-btn-dark" type="button" onClick={startOver}>{t.newCharge}</button>
            <a className="eba-btn" href="/admin">{t.toDashboard}</a>
          </div>
        </div>
      )}

      {/* ---------- Charge form ---------- */}
      {config && config.unlocked && !result && (
        <form className="eba-panel" onSubmit={charge}>
          <div className="eba-panelhead">
            <div>
              <p className="eba-eyebrow">{t.detailsEyebrow}</p>
              <h2>{t.detailsTitle}</h2>
            </div>
            <button className="eba-btn mini" type="button" onClick={lock}>{t.lock}</button>
          </div>

          <div className="eba-field">
            <label className="eba-lb" htmlFor="ebt-amt">{t.amount}</label>
            <div className="ebt-amt">
              <span className="eba-display">$</span>
              <input
                id="ebt-amt"
                className="eba-display"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={function (e) { setAmount(e.target.value.replace(/[^0-9.]/g, '')); }}
              />
            </div>
            {config.maxDollars ? <p className="ebt-hint">{t.limit} {money(config.maxDollars)}</p> : null}
          </div>

          <div className="eba-formrow even">
            <div className="eba-field">
              <label className="eba-lb" htmlFor="ebt-name">{t.name}</label>
              <input id="ebt-name" className="eba-in" value={name} onChange={function (e) { setName(e.target.value); }} autoComplete="off" />
            </div>
            <div className="eba-field">
              <label className="eba-lb" htmlFor="ebt-email">{t.email}</label>
              <input id="ebt-email" className="eba-in" type="email" placeholder={t.emailPh} value={email} onChange={function (e) { setEmail(e.target.value); }} autoComplete="off" />
            </div>
          </div>

          <div className="eba-field">
            <label className="eba-lb" htmlFor="ebt-note">{t.note}</label>
            <input id="ebt-note" className="eba-in" placeholder={t.notePh} value={note} onChange={function (e) { setNote(e.target.value); }} autoComplete="off" />
          </div>

          <div className="ebt-cardbox">
            <p className="eba-eyebrow">{t.card}</p>
            {!fieldsReady && <p className="eba-muted">{t.loading}</p>}
            <div className={'ebt-cardfields' + (fieldsReady ? '' : ' hidden')}>
              <div className="ebt-field wide">
                <span className="eba-lb">{t.cardNumber}</span>
                <div id="ebt-card-number" className="ebt-frame" />
              </div>
              <div className="ebt-field">
                <span className="eba-lb">{t.exp}</span>
                <div id="ebt-card-date" className="ebt-frame" />
              </div>
              <div className="ebt-field">
                <span className="eba-lb">{t.cvv}</span>
                <div id="ebt-card-cvv" className="ebt-frame" />
              </div>
              <div className="ebt-field">
                <span className="eba-lb">{t.zip}</span>
                <div id="ebt-card-zip" className="ebt-frame" />
              </div>
            </div>
            <p className="ebt-hint">{'🔒 '}{t.secure}</p>
          </div>

          <button className="eba-cta ebt-charge" type="submit" disabled={charging || !fieldsReady}>
            <span><h3>{charging ? t.charging : t.charge + (amtNum ? ' ' + money(amtNum) : '')}</h3></span>
            <span className="go">{'→'}</span>
          </button>

          {error && <div className="eba-err" role="alert">{error}</div>}
        </form>
      )}

      {config && config.broken && error && (
        <div className="eba-panel"><div className="eba-err" role="alert">{error}</div></div>
      )}
    </AdminShell>
  );
}

/* Only the bits AdminShell doesn't already style. */
const css = '' +
'.ebt-narrow { max-width:520px; }' +
'.ebt-gap { margin:-8px 0 16px; }' +
'.ebt-hint { margin:6px 0 0; font-size:11.5px; color:var(--sand); }' +
'.ebt-amt { display:flex; align-items:baseline; gap:6px; border-bottom:1px dashed var(--line); padding-bottom:6px; }' +
'.ebt-amt span { font-size:34px; color:var(--sand); }' +
'.ebt-amt input { border:0; outline:0; background:transparent; width:100%; min-width:0; font-size:46px; line-height:1.1; color:var(--taupe); }' +
'.eba .ebt-amt input:focus-visible { outline:0; }' +
'.ebt-amt:focus-within { border-bottom-color:var(--taupe); }' +
'.eba-formrow > .eba-field { margin-top:0; }' +
'.ebt-cardbox .eba-eyebrow { margin-bottom:12px; }' +
'.ebt-amt input::placeholder { color:var(--line); }' +
'.ebt-cardbox { margin-top:20px; padding:18px; background:var(--wash); border:1px solid var(--line); border-radius:20px; }' +
'.ebt-cardfields { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }' +
'.ebt-cardfields.hidden { visibility:hidden; height:0; overflow:hidden; }' +
'.ebt-field.wide { grid-column:1 / -1; }' +
'.ebt-frame { height:46px; border:1px solid var(--line); border-radius:14px; background:var(--card); padding:0 12px; overflow:hidden; }' +
'.ebt-frame iframe { width:100% !important; height:44px !important; border:0; }' +
'.ebt-charge { margin-top:18px; }' +
'.ebt-charge:disabled { opacity:.55; cursor:default; }' +
'.ebt-success { text-align:center; }' +
'.ebt-check { width:54px; height:54px; border-radius:50%; background:var(--accent); color:var(--cream); display:flex;' +
'  align-items:center; justify-content:center; font-size:26px; margin:0 auto 14px; }' +
'.ebt-big { margin:0 0 6px; font-size:52px; line-height:1; color:var(--taupe); }' +
'.ebt-center { justify-content:center; }' +
'@media (max-width:560px) {' +
' .ebt-cardfields { grid-template-columns:repeat(2,minmax(0,1fr)); }' +
' .ebt-field:last-child { grid-column:1 / -1; }' +
' .ebt-amt input { font-size:38px; }' +
'}';
