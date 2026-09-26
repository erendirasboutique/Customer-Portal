'use client';

/* ============================================================
   /admin/clover-terminal — take a card payment by hand (phone orders).
   Card numbers are typed into Clover's secure fields (iframes), so they
   never touch this site. The server only receives a one-time token.
   ============================================================ */

import { useEffect, useRef, useState } from 'react';

const T = {
  en: {
    back: '← Admin',
    eyebrow: 'ADMIN STUDIO',
    title: 'Card Terminal',
    sub: 'Take a card payment by phone. Charges go through Clover.',
    sandbox: 'SANDBOX — test cards only',
    lockedTitle: 'Terminal locked',
    lockedSub: 'Enter the terminal passcode to take payments on this device.',
    passcode: 'Passcode',
    unlock: 'Unlock',
    unlocking: 'Checking…',
    lock: 'Lock terminal',
    amount: 'Amount',
    name: 'Customer name',
    email: 'Email for receipt (optional)',
    note: 'Note (optional)',
    notePh: 'e.g. Order #1042, pink dress',
    card: 'Card',
    cardNumber: 'Card number',
    exp: 'Expiration',
    cvv: 'CVV',
    zip: 'ZIP',
    charge: 'Charge',
    charging: 'Charging…',
    loading: 'Loading secure card fields…',
    successTitle: 'Payment approved',
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
    back: '← Admin',
    eyebrow: 'ADMIN STUDIO',
    title: 'Terminal de Tarjeta',
    sub: 'Cobra con tarjeta por teléfono. Los cobros pasan por Clover.',
    sandbox: 'SANDBOX — solo tarjetas de prueba',
    lockedTitle: 'Terminal bloqueada',
    lockedSub: 'Escribe el código de la terminal para cobrar en este dispositivo.',
    passcode: 'Código',
    unlock: 'Desbloquear',
    unlocking: 'Revisando…',
    lock: 'Bloquear terminal',
    amount: 'Monto',
    name: 'Nombre de la clienta',
    email: 'Correo para recibo (opcional)',
    note: 'Nota (opcional)',
    notePh: 'ej. Pedido #1042, vestido rosa',
    card: 'Tarjeta',
    cardNumber: 'Número de tarjeta',
    exp: 'Vencimiento',
    cvv: 'CVV',
    zip: 'Código postal',
    charge: 'Cobrar',
    charging: 'Cobrando…',
    loading: 'Cargando campos seguros…',
    successTitle: 'Pago aprobado',
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

const LANG_KEY = 'ebtq-terminal-lang';

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

export default function CloverTerminalPage() {
  const [lang, setLang] = useState('en');
  const t = T[lang];

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

  function changeLang(l) {
    setLang(l);
    try { window.localStorage.setItem(LANG_KEY, l); } catch (e) { /* ignore */ }
  }

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
          body: { fontFamily: 'Helvetica, Arial, sans-serif' },
          input: { fontSize: '16px', color: '#3d3128' },
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
    <main className="ebt">
      <style>{css}</style>
      <div className="ebt-wrap">
        <div className="ebt-top">
          <a className="ebt-back" href="/admin">{t.back}</a>
          <div className="ebt-langs" role="group" aria-label="Language">
            {['en', 'es'].map(function (l) {
              return (
                <button key={l} type="button" className={lang === l ? 'on' : ''} onClick={function () { changeLang(l); }}>
                  {l.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        <p className="ebt-eyebrow">{t.eyebrow}</p>
        <h1 className="ebt-title">{t.title}</h1>
        <p className="ebt-sub">{t.sub}</p>
        <div className="ebt-rule" />

        {config && config.sandbox && <div className="ebt-sandbox">{t.sandbox}</div>}

        {config === null && <p className="ebt-muted">{t.loading}</p>}

        {/* ---------- Locked ---------- */}
        {config && !config.unlocked && !config.broken && (
          <form className="ebt-card ebt-lock" onSubmit={unlock}>
            <h2>{t.lockedTitle}</h2>
            <p className="ebt-muted">{t.lockedSub}</p>
            <label className="ebt-label" htmlFor="ebt-pass">{t.passcode}</label>
            <input
              id="ebt-pass"
              className="ebt-input"
              type="password"
              autoComplete="off"
              value={passcode}
              onChange={function (e) { setPasscode(e.target.value); }}
              autoFocus
            />
            <button className="ebt-btn" type="submit" disabled={unlocking || !passcode}>
              {unlocking ? t.unlocking : t.unlock}
            </button>
          </form>
        )}

        {/* ---------- Success ---------- */}
        {result && (
          <div className="ebt-card ebt-success">
            <div className="ebt-check" aria-hidden="true">{'✓'}</div>
            <h2>{t.successTitle}</h2>
            <p className="ebt-big">{money(result.amount)}</p>
            <p className="ebt-muted">
              {t.successSub} {result.brand ? String(result.brand).toUpperCase() : ''} {result.last4 ? '•••• ' + result.last4 : ''}
              {name ? ' · ' + name : ''}
            </p>
            {ledgerMsg && <p className="ebt-ledger">{ledgerMsg}</p>}
            <div className="ebt-row">
              <button className="ebt-btn" type="button" onClick={startOver}>{t.newCharge}</button>
              <a className="ebt-btn ghost" href="/admin">{t.toDashboard}</a>
            </div>
          </div>
        )}

        {/* ---------- Charge form ---------- */}
        {config && config.unlocked && !result && (
          <form className="ebt-card" onSubmit={charge}>
            <label className="ebt-label" htmlFor="ebt-amt">{t.amount}</label>
            <div className="ebt-amt">
              <span>$</span>
              <input
                id="ebt-amt"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={function (e) { setAmount(e.target.value.replace(/[^0-9.]/g, '')); }}
              />
            </div>
            {config.maxDollars ? <p className="ebt-hint">{t.limit} {money(config.maxDollars)}</p> : null}

            <div className="ebt-grid2">
              <div>
                <label className="ebt-label" htmlFor="ebt-name">{t.name}</label>
                <input id="ebt-name" className="ebt-input" value={name} onChange={function (e) { setName(e.target.value); }} autoComplete="off" />
              </div>
              <div>
                <label className="ebt-label" htmlFor="ebt-email">{t.email}</label>
                <input id="ebt-email" className="ebt-input" type="email" value={email} onChange={function (e) { setEmail(e.target.value); }} autoComplete="off" />
              </div>
            </div>

            <label className="ebt-label" htmlFor="ebt-note">{t.note}</label>
            <input id="ebt-note" className="ebt-input" placeholder={t.notePh} value={note} onChange={function (e) { setNote(e.target.value); }} autoComplete="off" />

            <div className="ebt-section">{t.card}</div>
            {!fieldsReady && <p className="ebt-muted">{t.loading}</p>}
            <div className={'ebt-cardfields' + (fieldsReady ? '' : ' hidden')}>
              <div className="ebt-field wide">
                <span className="ebt-label">{t.cardNumber}</span>
                <div id="ebt-card-number" className="ebt-frame" />
              </div>
              <div className="ebt-field">
                <span className="ebt-label">{t.exp}</span>
                <div id="ebt-card-date" className="ebt-frame" />
              </div>
              <div className="ebt-field">
                <span className="ebt-label">{t.cvv}</span>
                <div id="ebt-card-cvv" className="ebt-frame" />
              </div>
              <div className="ebt-field">
                <span className="ebt-label">{t.zip}</span>
                <div id="ebt-card-zip" className="ebt-frame" />
              </div>
            </div>

            <button className="ebt-btn ebt-charge" type="submit" disabled={charging || !fieldsReady}>
              {charging ? t.charging : t.charge + (amtNum ? ' ' + money(amtNum) : '')}
            </button>

            <button className="ebt-linkbtn" type="button" onClick={lock}>{t.lock}</button>
          </form>
        )}

        {error && <p className="ebt-error" role="alert">{error}</p>}
      </div>
    </main>
  );
}

const css = `
.ebt { min-height: 100vh; background: #f6f1ea; color: #3d3128; font-family: inherit; padding: 32px 16px 64px; }
.ebt * { box-sizing: border-box; font-family: inherit; }
.ebt-wrap { max-width: 620px; margin: 0 auto; }
.ebt-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
.ebt-back { color: #3d3128; text-decoration: none; font-size: 14px; opacity: .8; }
.ebt-back:hover { opacity: 1; }
.ebt-langs { display: flex; border: 1px solid #3d3128; border-radius: 999px; overflow: hidden; }
.ebt-langs button { background: transparent; border: 0; padding: 5px 12px; font-size: 12px; letter-spacing: .08em; color: #3d3128; cursor: pointer; }
.ebt-langs button.on { background: #3d3128; color: #f6f1ea; }
.ebt-eyebrow { font-size: 11px; letter-spacing: .22em; margin: 0 0 6px; opacity: .7; }
.ebt-title { font-style: italic; font-weight: 400; font-size: 40px; line-height: 1.1; margin: 0; }
.ebt-sub { margin: 8px 0 0; opacity: .75; font-size: 15px; }
.ebt-rule { height: 2px; background: #3d3128; margin: 20px 0 24px; }
.ebt-sandbox { background: #f3d9a4; color: #5a3d0c; font-size: 12px; letter-spacing: .1em; padding: 8px 12px; border-radius: 8px; margin-bottom: 16px; text-align: center; }
.ebt-card { background: #fffdf9; border: 1px solid #e4d9cb; border-radius: 16px; padding: 24px; }
.ebt-card h2 { font-style: italic; font-weight: 400; font-size: 24px; margin: 0 0 6px; }
.ebt-lock { max-width: 380px; }
.ebt-muted { opacity: .7; font-size: 14px; margin: 0 0 12px; }
.ebt-hint { font-size: 12px; opacity: .6; margin: 6px 0 0; }
.ebt-label { display: block; font-size: 12px; letter-spacing: .06em; text-transform: uppercase; opacity: .75; margin: 16px 0 6px; }
.ebt-input { width: 100%; padding: 11px 12px; border: 1px solid #d8cbbb; border-radius: 10px; background: #fff; color: #3d3128; font-size: 16px; }
.ebt-input:focus { outline: 2px solid #a39382; outline-offset: 1px; }
.ebt-amt { display: flex; align-items: baseline; gap: 6px; border-bottom: 1px dotted #a39382; padding-bottom: 6px; }
.ebt-amt span { font-size: 32px; opacity: .6; }
.ebt-amt input { border: 0; background: transparent; font-size: 40px; width: 100%; color: #3d3128; outline: none; }
.ebt-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; }
.ebt-section { margin: 26px 0 4px; padding-top: 16px; border-top: 1px dotted #a39382; font-style: italic; font-size: 18px; }
.ebt-cardfields { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0 12px; }
.ebt-cardfields.hidden { visibility: hidden; height: 0; overflow: hidden; }
.ebt-field.wide { grid-column: 1 / -1; }
.ebt-frame { height: 46px; border: 1px solid #d8cbbb; border-radius: 10px; background: #fff; padding: 0 10px; overflow: hidden; }
.ebt-frame iframe { width: 100% !important; height: 44px !important; border: 0; }
.ebt-btn { display: inline-flex; justify-content: center; align-items: center; margin-top: 18px; padding: 13px 22px; border-radius: 999px; border: 1px solid #3d3128; background: #3d3128; color: #f6f1ea; font-size: 15px; cursor: pointer; text-decoration: none; }
.ebt-btn:disabled { opacity: .5; cursor: default; }
.ebt-btn.ghost { background: transparent; color: #3d3128; }
.ebt-charge { width: 100%; margin-top: 26px; font-size: 17px; padding: 15px; }
.ebt-linkbtn { display: block; margin: 16px auto 0; background: none; border: 0; color: #3d3128; opacity: .6; font-size: 13px; text-decoration: underline; cursor: pointer; }
.ebt-error { margin-top: 16px; background: #fbe9e6; color: #8a2b1d; border: 1px solid #efc4bb; border-radius: 10px; padding: 12px 14px; font-size: 14px; }
.ebt-success { text-align: center; }
.ebt-check { width: 52px; height: 52px; border-radius: 50%; background: #3d3128; color: #f6f1ea; display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 12px; }
.ebt-big { font-size: 40px; margin: 4px 0; }
.ebt-ledger { font-size: 13px; opacity: .75; margin: 10px 0 0; }
.ebt-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
@media (max-width: 560px) {
  .ebt-grid2 { grid-template-columns: 1fr; }
  .ebt-cardfields { grid-template-columns: 1fr 1fr; }
  .ebt-field:last-child { grid-column: 1 / -1; }
  .ebt-title { font-size: 32px; }
}
`;
