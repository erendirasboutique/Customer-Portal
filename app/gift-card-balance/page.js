'use client';

/* ============================================================
   Erendira's Boutique — Gift card balance check (customer page)
   Public page at /gift-card-balance. Customers type their code and
   see what's left. Link straight to a card with
   /gift-card-balance?code=EB-XXXX-XXXX and it checks automatically.
   EN / ES follows the same "eb-lang" setting as the rest of the site.
   ============================================================ */

import { useEffect, useState } from 'react';

const LOGO_SRC = '/EB_Logo_Fall BGBLANK.png';

const T = {
  en: {
    eyebrow: "ERENDIRA'S BOUTIQUE",
    title: 'Gift Card Balance',
    sub: 'Enter the code on your gift card to see what’s left to spend.',
    label: 'Gift card code',
    placeholder: 'EB-XXXX-XXXX',
    check: 'Check balance',
    checking: 'Checking...',
    remaining: 'Available balance',
    of: 'of',
    original: 'original value',
    active: 'Ready to use',
    used: 'Fully used',
    inactive: 'Not active',
    expired: 'Expired',
    expires: 'Expires',
    activeNote: 'Enter this code in the promo code box at checkout to use it.',
    usedNote: 'This gift card has been spent. Thank you for shopping with us!',
    inactiveNote: 'This gift card isn’t active right now. Please contact us and we’ll help.',
    expiredNote: 'This gift card has expired. Please contact us if you have questions.',
    notFound: 'We couldn’t find that code. Check for typos — it usually starts with EB.',
    tooMany: 'Too many tries. Please wait a few minutes and try again.',
    error: 'Something went wrong. Please try again in a moment.',
    another: 'Check another card',
    shop: 'Back to the boutique',
  },
  es: {
    eyebrow: "ERENDIRA'S BOUTIQUE",
    title: 'Saldo de Tarjeta de Regalo',
    sub: 'Escribe el código de tu tarjeta para ver cuánto te queda.',
    label: 'Código de la tarjeta',
    placeholder: 'EB-XXXX-XXXX',
    check: 'Ver saldo',
    checking: 'Buscando...',
    remaining: 'Saldo disponible',
    of: 'de',
    original: 'valor original',
    active: 'Lista para usar',
    used: 'Ya usada',
    inactive: 'No activa',
    expired: 'Vencida',
    expires: 'Vence',
    activeNote: 'Escribe este código en la casilla de código promocional al pagar.',
    usedNote: 'Esta tarjeta ya se usó por completo. ¡Gracias por tu compra!',
    inactiveNote: 'Esta tarjeta no está activa en este momento. Escríbenos y te ayudamos.',
    expiredNote: 'Esta tarjeta ya venció. Escríbenos si tienes preguntas.',
    notFound: 'No encontramos ese código. Revisa que esté bien escrito — normalmente empieza con EB.',
    tooMany: 'Demasiados intentos. Espera unos minutos y vuelve a intentar.',
    error: 'Algo salió mal. Intenta de nuevo en un momento.',
    another: 'Ver otra tarjeta',
    shop: 'Volver a la boutique',
  },
};

const locale = { en: 'en-US', es: 'es-MX' };

function money(value, currency, lang) {
  try {
    return new Intl.NumberFormat(locale[lang], { style: 'currency', currency: currency || 'USD' }).format(Number(value || 0));
  } catch (e) {
    return '$' + Number(value || 0).toFixed(2);
  }
}

const css = '' +
'.gcb { --bg:#fdfcf7; --card:#ffffff; --wash:#fffdf8; --ink:#da5e16; --accent:#eda033; --accent-dark:#d98a1f; --line:#f6d3a8; --soft:#fcefdc;' +
'  min-height:100vh; background:var(--bg); color:var(--ink); display:flex; align-items:flex-start; justify-content:center;' +
'  padding:clamp(20px,6vh,72px) 16px 40px; font-family:"Recoleta", Georgia, serif; -webkit-font-smoothing:antialiased; }' +
'.gcb * { box-sizing:border-box; }' +
'.gcb-wrap { width:100%; max-width:460px; }' +
'.gcb-top { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:18px; }' +
'.gcb-logo { width:120px; height:auto; display:block; }' +
'.gcb-langs { display:flex; border:1px solid var(--line); border-radius:999px; overflow:hidden; background:var(--card); }' +
'.gcb-langs button { border:0; background:transparent; padding:7px 12px; font:inherit; font-size:10px; letter-spacing:.14em; color:var(--ink); cursor:pointer; }' +
'.gcb-langs button.on { background:var(--accent); color:#fff; }' +
'.gcb-card { position:relative; overflow:hidden; background:var(--card); border-radius:30px; padding:30px 26px 26px;' +
'  box-shadow:0 1px 2px rgba(218,94,22,.04), 0 14px 40px rgba(218,94,22,.08); }' +
'.gcb-card::after { content:""; position:absolute; right:-80px; top:-90px; width:240px; height:240px; border-radius:50%;' +
'  background:radial-gradient(circle at 30% 30%, rgba(237,160,51,.26), rgba(237,160,51,0) 65%); pointer-events:none; }' +
'.gcb-card > * { position:relative; z-index:1; }' +
'.gcb-eyebrow { margin:0 0 6px; font-size:10px; letter-spacing:.28em; color:var(--accent); }' +
'.gcb h1 { margin:0; font-family:"La Luxes Serif","Recoleta",Georgia,serif; font-weight:400; font-size:clamp(32px,8vw,42px); line-height:1.02; }' +
'.gcb-sub { margin:10px 0 22px; font-size:14px; line-height:1.5; }' +
'.gcb-lb { display:block; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--accent); margin:0 0 7px; }' +
'.gcb-in { width:100%; border:1px solid var(--line); border-radius:16px; background:var(--wash); padding:14px 16px;' +
'  font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:16px; letter-spacing:.1em; color:var(--ink);' +
'  text-transform:uppercase; outline:0; }' +
'.gcb-in:focus { border-color:var(--accent); background:var(--card); }' +
'.gcb-in::placeholder { color:var(--line); }' +
'.gcb-btn { width:100%; margin-top:12px; border:0; border-radius:999px; padding:14px 20px; background:var(--accent); color:#fff;' +
'  font:inherit; font-size:14px; cursor:pointer; transition:background .16s ease; }' +
'.gcb-btn:hover { background:var(--accent-dark); }' +
'.gcb-btn:disabled { opacity:.6; cursor:wait; }' +
'.gcb-btn.quiet { background:transparent; color:var(--ink); border:1px solid var(--line); }' +
'.gcb-btn.quiet:hover { background:var(--wash); }' +
'.gcb-msg { margin-top:14px; border-radius:16px; padding:12px 15px; font-size:13px; line-height:1.5; background:var(--wash); border:1px solid var(--line); }' +
'.gcb-msg.err { background:rgba(160,53,53,.06); border-color:rgba(160,53,53,.2); color:#8f3a3a; }' +
'.gcb-result { margin-top:6px; text-align:center; }' +
'.gcb-code { display:inline-block; font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12.5px; letter-spacing:.1em;' +
'  background:var(--soft); border-radius:10px; padding:5px 11px; }' +
'.gcb-rl { margin:18px 0 0; font-size:12px; letter-spacing:.06em; }' +
'.gcb-amt { margin:4px 0 0; font-family:"La Luxes Serif","Recoleta",Georgia,serif; font-weight:400; font-size:clamp(52px,15vw,68px); line-height:1.05; }' +
'.gcb-orig { margin:4px 0 0; font-size:12.5px; opacity:.8; }' +
'.gcb-bar { height:8px; border-radius:999px; background:var(--soft); overflow:hidden; margin:16px 0 0; }' +
'.gcb-bar span { display:block; height:100%; border-radius:999px; background:var(--accent); transition:width .5s ease; }' +
'.gcb-pill { display:inline-block; margin-top:16px; border-radius:999px; padding:5px 13px; font-size:9.5px; letter-spacing:.14em; text-transform:uppercase; }' +
'.gcb-pill.active { background:var(--accent); color:#fff; }' +
'.gcb-pill.off { background:var(--card); border:1px solid var(--line); }' +
'.gcb-exp { margin:10px 0 0; font-size:12px; }' +
'.gcb-note { margin:16px 0 0; font-size:13px; line-height:1.55; }' +
'.gcb-foot { margin:18px 0 0; text-align:center; font-size:12.5px; }' +
'.gcb-foot a { color:var(--ink); text-decoration:underline; text-underline-offset:3px; }' +
'@media (prefers-reduced-motion:reduce) { .gcb * { transition:none !important; } }';

export default function GiftCardBalancePage() {
  const [lang, setLangState] = useState('en');
  const t = T[lang];

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function setLang(l) {
    setLangState(l);
    try { localStorage.setItem('eb-lang', l); } catch (e) {}
    document.documentElement.lang = l;
  }

  async function check(value) {
    const c = String(value ?? code).trim();
    if (!c) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/gift-card-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: c }),
      });
      const data = await res.json().catch(function () { return {}; });
      if (res.status === 429) setError('tooMany');
      else if (!res.ok) setError('error');
      else if (!data.found) setError('notFound');
      else setResult(data);
    } catch (e) {
      setError('error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    try {
      const saved = localStorage.getItem('eb-lang');
      if (saved === 'en' || saved === 'es') setLangState(saved);
    } catch (e) {}
    const fromUrl = new URLSearchParams(window.location.search).get('code');
    if (fromUrl) {
      setCode(fromUrl.toUpperCase());
      check(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e) {
    e.preventDefault();
    if (!loading) check();
  }

  function reset() {
    setResult(null);
    setError('');
    setCode('');
  }

  const pct = result && result.original > 0 ? Math.min(100, Math.max(0, (result.balance / result.original) * 100)) : 0;
  const expiresLine = result && result.expires_at
    ? new Date(result.expires_at).toLocaleDateString(locale[lang], { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <main className="gcb">
      <style>{css}</style>
      <div className="gcb-wrap">
        <div className="gcb-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} alt="Erendira&#8217;s Boutique" className="gcb-logo" />
          <div className="gcb-langs" role="group" aria-label="Language">
            {['en', 'es'].map(function (l) {
              return (
                <button key={l} type="button" className={lang === l ? 'on' : ''} onClick={function () { setLang(l); }}>
                  {l.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="gcb-card">
          <p className="gcb-eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>

          {!result ? (
            <>
              <p className="gcb-sub">{t.sub}</p>
              <form onSubmit={onSubmit}>
                <label className="gcb-lb" htmlFor="gcb-code">{t.label}</label>
                <input
                  id="gcb-code"
                  className="gcb-in"
                  value={code}
                  onChange={function (e) { setCode(e.target.value.toUpperCase()); setError(''); }}
                  placeholder={t.placeholder}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck="false"
                  maxLength={40}
                  required
                />
                <button className="gcb-btn" type="submit" disabled={loading || !code.trim()}>
                  {loading ? t.checking : t.check}
                </button>
              </form>
              {error && <div className="gcb-msg err" role="alert">{t[error]}</div>}
            </>
          ) : (
            <div className="gcb-result" aria-live="polite">
              <p className="gcb-rl" style={{ marginTop: 22 }}><span className="gcb-code">{result.code}</span></p>
              <p className="gcb-rl">{t.remaining}</p>
              <p className="gcb-amt">{money(result.balance, result.currency, lang)}</p>
              {result.original > 0 && (
                <p className="gcb-orig">{t.of} {money(result.original, result.currency, lang)} {t.original}</p>
              )}
              <div className="gcb-bar" aria-hidden="true"><span style={{ width: pct + '%' }} /></div>
              <span className={result.status === 'active' ? 'gcb-pill active' : 'gcb-pill off'}>{t[result.status]}</span>
              {expiresLine && result.status === 'active' && <p className="gcb-exp">{t.expires} {expiresLine}</p>}
              <p className="gcb-note">{t[result.status + 'Note']}</p>
              <button className="gcb-btn quiet" type="button" onClick={reset}>{t.another}</button>
            </div>
          )}
        </div>

        <p className="gcb-foot"><a href="/">{t.shop}</a></p>
      </div>
    </main>
  );
}
