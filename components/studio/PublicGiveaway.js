'use client';

// components/studio/PublicGiveaway.js
// /giveaway-wheel: PIN screen, then the same wheel as the admin,
// without the sidebar.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { shellCss } from '@/components/AdminShell';
import GiveawayWheel from '@/components/studio/GiveawayWheel';

const LOGO_SRC = '/EB_Logo_Fall BGBLANK.png';

const T = {
  en: {
    title: 'Giveaway Wheel',
    enterPin: 'Enter the staff PIN. This device stays unlocked for 30 days.',
    pinLabel: 'Staff PIN',
    open: 'Open the wheel',
    checking: 'Checking...',
    notSet: 'The wheel PIN hasn\u2019t been set up yet. Add GIVEAWAY_PIN in Vercel and redeploy.',
    wrong: 'That PIN isn\u2019t right.',
    tooMany: 'Too many wrong tries. Wait 15 minutes.',
    error: 'Something went wrong. Try again.',
    lock: 'Lock this device',
    lockConfirm: 'Lock the wheel on this device? You\u2019ll need the PIN to open it again.',
  },
  es: {
    title: 'Ruleta de Regalos',
    enterPin: 'Escribe el PIN del personal. Este dispositivo queda desbloqueado por 30 d\u00edas.',
    pinLabel: 'PIN del personal',
    open: 'Abrir la ruleta',
    checking: 'Revisando...',
    notSet: 'El PIN de la ruleta a\u00fan no est\u00e1 configurado. Agrega GIVEAWAY_PIN en Vercel y vuelve a publicar.',
    wrong: 'Ese PIN no es correcto.',
    tooMany: 'Demasiados intentos. Espera 15 minutos.',
    error: 'Algo sali\u00f3 mal. Intenta otra vez.',
    lock: 'Bloquear este dispositivo',
    lockConfirm: '\u00bfBloquear la ruleta en este dispositivo? Vas a necesitar el PIN para abrirla otra vez.',
  },
};

const css = '' +
'.ebpw-wrap { max-width:1400px; margin:0 auto; padding:18px; display:grid; gap:16px; }' +
'.ebpw-top { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; background:var(--card);' +
'  border-radius:26px; padding:16px 22px; box-shadow:0 1px 2px rgba(218,94,22,.04), 0 14px 40px rgba(218,94,22,.06); }' +
'.ebpw-brand { display:flex; align-items:center; gap:14px; min-width:0; }' +
'.ebpw-brand img { width:110px; height:auto; display:block; }' +
'.ebpw-brand h1 { margin:0; font-family:"La Luxes Serif","Recoleta",Georgia,serif; font-weight:400; font-size:clamp(24px,3vw,34px); color:var(--taupe); }' +
'.ebpw-lock { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; }' +
'.ebpw-card { width:100%; max-width:380px; background:var(--card); border-radius:30px; padding:30px 26px; text-align:center;' +
'  box-shadow:0 1px 2px rgba(218,94,22,.04), 0 14px 40px rgba(218,94,22,.08); }' +
'.ebpw-card img { width:120px; height:auto; display:block; margin:0 auto 14px; }' +
'.ebpw-card h1 { margin:0; font-family:"La Luxes Serif","Recoleta",Georgia,serif; font-weight:400; font-size:34px; color:var(--taupe); }' +
'.ebpw-card p { margin:8px 0 20px; font-size:13.5px; color:var(--mute); }' +
'.ebpw-pin { text-align:center; font-size:26px !important; letter-spacing:.4em; padding:14px !important; }' +
'.ebpw-card .eba-btn { width:100%; margin-top:12px; padding:13px; font-size:14px; }' +
'.ebpw-right { display:flex; align-items:center; gap:8px; }' +
'.ebpw-card .eba-langs { display:inline-flex; margin:0 auto 16px; }' +
'@media (max-width:980px) { .ebpw-wrap { padding:10px; gap:10px; } }';

export default function PublicGiveaway(props) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLangState] = useState('en');
  const t = T[lang];

  useEffect(function () {
    try {
      const saved = localStorage.getItem('eb-lang');
      if (saved === 'en' || saved === 'es') setLangState(saved);
    } catch (e) {}
  }, []);

  function setLang(l) {
    setLangState(l);
    try { localStorage.setItem('eb-lang', l); } catch (e) {}
    document.documentElement.lang = l;
  }

  const langToggle = (
    <div className="eba-langs" role="group" aria-label="Language">
      {['en', 'es'].map(function (l) {
        return <button key={l} type="button" className={lang === l ? 'on' : ''} onClick={function () { setLang(l); }}>{l.toUpperCase()}</button>;
      })}
    </div>
  );

  async function call(body) {
    const res = await fetch('/api/giveaway-wheel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      const map = { 401: 'wrong', 429: 'tooMany', 503: 'notSet' };
      throw new Error(map[res.status] || 'error');
    }
    return data;
  }

  async function unlock(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await call({ action: 'unlock', pin: pin });
      setPin('');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function lock() {
    if (!confirm(t.lockConfirm)) return;
    await call({ action: 'lock' }).catch(function () {});
    router.refresh();
  }

  if (!props.unlocked) {
    return (
      <main className="eba">
        <style>{shellCss + css}</style>
        <div className="ebpw-lock">
          <form className="ebpw-card" onSubmit={unlock}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SRC} alt="Erendira&#8217;s Boutique" />
            {langToggle}
            <h1>{t.title}</h1>
            {props.configured ? (
              <>
                <p>{t.enterPin}</p>
                <input className="eba-in ebpw-pin" type="password" inputMode="numeric" autoComplete="off" autoFocus
                  value={pin} maxLength={20} aria-label={t.pinLabel} onChange={function (e) { setPin(e.target.value); setError(''); }} />
                <button className="eba-btn eba-btn-dark" type="submit" disabled={busy || pin.trim().length < 4}>
                  {busy ? t.checking : t.open}
                </button>
                {error && <div className="eba-err">{t[error] || t.error}</div>}
              </>
            ) : (
              <p>{t.notSet}</p>
            )}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="eba">
      <style>{shellCss + css}</style>
      <div className="ebpw-wrap">
        <div className="ebpw-top">
          <div className="ebpw-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SRC} alt="Erendira&#8217;s Boutique" />
            <h1>{t.title}</h1>
          </div>
          <div className="ebpw-right">
            {langToggle}
            <button className="eba-btn mini" type="button" onClick={lock}>{t.lock}</button>
          </div>
        </div>
        <GiveawayWheel
          history={props.history}
          lang={lang}
          apiPath="/api/giveaway-wheel"
          canEditHistory={false}
          onLocked={function () { router.refresh(); }}
        />
      </div>
    </main>
  );
}
