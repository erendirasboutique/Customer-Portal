// components/shop/publicStyles.js
// Shared look for the customer-facing pages (gift card shop, thank-you,
// live schedule). Same palette as your customer portal.

export const LOGO_SRC = '/EB_Logo_Fall BGBLANK.png';

export const publicCss = '' +
'.ebp { --bg:#fdfcf7; --card:#ffffff; --wash:#fffdf8; --ink:#da5e16; --accent:#eda033; --accent-dark:#d98a1f; --line:#f6d3a8; --soft:#fcefdc;' +
'  min-height:100vh; background:var(--bg); color:var(--ink); padding:clamp(18px,5vh,56px) 16px 44px;' +
'  font-family:"Recoleta", Georgia, serif; -webkit-font-smoothing:antialiased; }' +
'.ebp * { box-sizing:border-box; }' +
'.ebp a { color:inherit; }' +
'.ebp-wrap { width:100%; max-width:560px; margin:0 auto; }' +
'.ebp-wrap.wide { max-width:760px; }' +
'.ebp-top { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:18px; }' +
'.ebp-logo { width:120px; height:auto; display:block; }' +
'.ebp-langs { display:flex; border:1px solid var(--line); border-radius:999px; overflow:hidden; background:var(--card); }' +
'.ebp-langs button { border:0; background:transparent; padding:7px 12px; font:inherit; font-size:10px; letter-spacing:.14em; color:var(--ink); cursor:pointer; }' +
'.ebp-langs button.on { background:var(--accent); color:#fff; }' +
'.ebp-card { position:relative; overflow:hidden; background:var(--card); border-radius:30px; padding:30px 26px 26px;' +
'  box-shadow:0 1px 2px rgba(218,94,22,.04), 0 14px 40px rgba(218,94,22,.08); }' +
'.ebp-card + .ebp-card { margin-top:14px; }' +
'.ebp-card.glow::after { content:""; position:absolute; right:-80px; top:-90px; width:240px; height:240px; border-radius:50%;' +
'  background:radial-gradient(circle at 30% 30%, rgba(237,160,51,.26), rgba(237,160,51,0) 65%); pointer-events:none; }' +
'.ebp-card > * { position:relative; z-index:1; }' +
'.ebp-eyebrow { margin:0 0 6px; font-size:10px; letter-spacing:.28em; color:var(--accent); text-transform:uppercase; }' +
'.ebp h1, .ebp h2, .ebp-display { font-family:"La Luxes Serif","Recoleta",Georgia,serif; font-weight:400; }' +
'.ebp h1 { margin:0; font-size:clamp(32px,8vw,44px); line-height:1.02; }' +
'.ebp h2 { margin:0 0 14px; font-size:clamp(24px,6vw,30px); line-height:1.05; }' +
'.ebp-sub { margin:10px 0 22px; font-size:14px; line-height:1.55; }' +
'.ebp-lb { display:block; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--accent); margin:0 0 7px; }' +
'.ebp-in { width:100%; border:1px solid var(--line); border-radius:16px; background:var(--wash); padding:13px 15px;' +
'  font:inherit; font-size:15px; color:var(--ink); outline:0; }' +
'.ebp-in:focus { border-color:var(--accent); background:var(--card); }' +
'.ebp-in::placeholder { color:#efc28c; }' +
'textarea.ebp-in { resize:vertical; min-height:84px; }' +
'.ebp-field + .ebp-field, .ebp-row + .ebp-field, .ebp-field + .ebp-row, .ebp-row + .ebp-row { margin-top:12px; }' +
'.ebp-row { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:12px; }' +
'.ebp-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; margin-top:16px; border:0;' +
'  border-radius:999px; padding:14px 20px; background:var(--accent); color:#fff; font:inherit; font-size:15px; cursor:pointer;' +
'  text-decoration:none; transition:background .16s ease; }' +
'.ebp-btn:hover { background:var(--accent-dark); }' +
'.ebp-btn:disabled { opacity:.6; cursor:wait; }' +
'.ebp a.ebp-btn { color:#fff; }' +
'.ebp-btn.quiet, .ebp a.ebp-btn.quiet { background:transparent; color:var(--ink); border:1px solid var(--line); }' +
'.ebp-btn.quiet:hover { background:var(--wash); }' +
'.ebp-btn.small { width:auto; margin-top:0; padding:9px 16px; font-size:12.5px; }' +
'.ebp-msg { margin-top:14px; border-radius:16px; padding:12px 15px; font-size:13px; line-height:1.5; background:var(--wash); border:1px solid var(--line); }' +
'.ebp-msg.err { background:rgba(160,53,53,.06); border-color:rgba(160,53,53,.2); color:#8f3a3a; }' +
'.ebp-chips { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }' +
'.ebp-chip { border:1px solid var(--line); background:var(--wash); color:var(--ink); border-radius:16px; padding:13px 8px;' +
'  font:inherit; font-size:17px; cursor:pointer; transition:background .16s ease, border-color .16s ease; }' +
'.ebp-chip:hover { border-color:var(--accent); }' +
'.ebp-chip.on { background:var(--accent); border-color:var(--accent); color:#fff; }' +
'.ebp-seg { display:grid; grid-template-columns:1fr 1fr; gap:6px; padding:5px; background:var(--wash); border:1px solid var(--line); border-radius:999px; }' +
'.ebp-seg button { border:0; background:transparent; border-radius:999px; padding:10px; font:inherit; font-size:13.5px; color:var(--ink); cursor:pointer; }' +
'.ebp-seg button.on { background:var(--card); box-shadow:0 2px 10px rgba(218,94,22,.12); }' +
'.ebp-hint { margin:6px 2px 0; font-size:11.5px; opacity:.85; }' +
'.ebp-code { display:inline-block; font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:18px; letter-spacing:.12em;' +
'  background:var(--soft); border-radius:12px; padding:8px 14px; }' +
'.ebp-foot { margin:18px 0 0; text-align:center; font-size:12.5px; }' +
'.ebp-foot a { text-decoration:underline; text-underline-offset:3px; }' +
/* gift card visual */
'.ebp-gift { position:relative; aspect-ratio:1.6; border-radius:22px; padding:20px 22px; color:#fff; overflow:hidden;' +
'  background:linear-gradient(135deg,#eda033 0%,#da5e16 100%); display:flex; flex-direction:column; justify-content:space-between;' +
'  box-shadow:0 14px 34px rgba(218,94,22,.25); }' +
'.ebp-gift::before { content:""; position:absolute; right:-40px; top:-60px; width:200px; height:200px; border-radius:50%; background:rgba(255,255,255,.14); }' +
'.ebp-gift::after { content:""; position:absolute; left:-50px; bottom:-80px; width:180px; height:180px; border-radius:50%; background:rgba(255,255,255,.08); }' +
'.ebp-gift > * { position:relative; z-index:1; }' +
'.ebp-gift .brand { font-size:10px; letter-spacing:.28em; }' +
'.ebp-gift .amt { font-family:"La Luxes Serif","Recoleta",Georgia,serif; font-size:clamp(40px,11vw,54px); line-height:1; }' +
'.ebp-gift .to { font-size:13px; opacity:.95; min-height:1.3em; }' +
'.ebp-gift .note { font-size:12px; font-style:italic; opacity:.9; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }' +
'@media (max-width:480px) { .ebp-row { grid-template-columns:minmax(0,1fr); } .ebp-card { padding:24px 18px 20px; border-radius:24px; } }' +
'@media (prefers-reduced-motion:reduce) { .ebp * { transition:none !important; } }';

export const locales = { en: 'en-US', es: 'es-MX' };

export function readLang() {
  try {
    const saved = localStorage.getItem('eb-lang');
    if (saved === 'en' || saved === 'es') return saved;
  } catch (e) {}
  return null;
}

export function saveLang(l) {
  try { localStorage.setItem('eb-lang', l); } catch (e) {}
  if (typeof document !== 'undefined') document.documentElement.lang = l;
}
