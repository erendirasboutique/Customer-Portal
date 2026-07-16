'use client';

// components/AdminShell.js
// Erendira's Boutique — Admin Studio shell
//
// "Studio" design: floating cream canvas, white rounded cards, pill nav,
// La Luxes display headings. Every admin page renders inside this.
//
// Props:
//   admin      { name, email, avatar_url, role }  — used for the profile card
//   active     'overview' | 'payment-links' | 'gift-cards' | 'live-link' | 'checks'
//   lang       'en' | 'es'   (optional — omit and the shell manages it itself)
//   onLang     (l) => void   (optional — pass when the page owns lang state)
//   eyebrow    small caps line above the hero title
//   title      hero title
//   subtitle   hero sub-line
//   heroStat   { label, value, caption }  — the boxed number at the hero's right
//   tip        { label, body }            — sidebar quick tip (optional)
//   children   page content
//
// NOTE: the sidebar is white now, so it needs the DARK logo.
// Change LOGO_SRC below if your dark logo file is named something else.

import { useEffect, useRef, useState } from 'react';

const LOGO_SRC = '/logo.png';
const SHIP = 'https://ship.erendirasboutique.com';

const T = {
  en: {
    brand: "ERENDIRA'S BOUTIQUE",
    studio: 'Admin Studio',
    welcome: 'Welcome',
    overview: 'Dashboard',
    paymentLinks: 'Payment links',
    giftCards: 'Gift cards',
    liveLink: 'Live link',
    checks: 'Checks',
    orders: 'Orders',
    shipping: 'Shipping',
    logOut: 'Log out',
    account: 'Account',
  },
  es: {
    brand: "ERENDIRA'S BOUTIQUE",
    studio: 'Admin Studio',
    welcome: 'Bienvenida',
    overview: 'Panel',
    paymentLinks: 'Enlaces de pago',
    giftCards: 'Tarjetas de regalo',
    liveLink: 'Enlace en vivo',
    checks: 'Cheques',
    orders: 'Pedidos',
    shipping: 'Env\u00edos',
    logOut: 'Cerrar sesi\u00f3n',
    account: 'Cuenta',
  },
};

/* ---------------- Icons ---------------- */
function Icon(props) {
  return (
    <svg
      width={props.size || 15}
      height={props.size || 15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {props.children}
    </svg>
  );
}
const IconHome = function () { return (<Icon><path d="M5 12l7-8 7 8" /><path d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9" /></Icon>); };
const IconLink = function () { return (<Icon><path d="M9 15l6-6" /><path d="M11 6l.5-.5a4.95 4.95 0 017 7L18 13" /><path d="M13 18l-.5.5a4.95 4.95 0 01-7-7L6 11" /></Icon>); };
const IconGift = function () { return (<Icon><path d="M3 9h18v3H3z" /><path d="M12 9v12" /><path d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" /><path d="M7.5 9a2.5 2.5 0 010-5C11 4 12 9 12 9s1-5 4.5-5a2.5 2.5 0 010 5" /></Icon>); };
const IconBroadcast = function () { return (<Icon><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 010 8.49" /><path d="M7.76 16.24a6 6 0 010-8.49" /><path d="M19.07 4.93a10 10 0 010 14.14" /><path d="M4.93 19.07a10 10 0 010-14.14" /></Icon>); };
const IconCheck = function () { return (<Icon><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /><path d="M7 14h4" /></Icon>); };
const IconBox = function () { return (<Icon><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M12 12l8-4.5" /><path d="M12 12v9" /><path d="M12 12L4 7.5" /></Icon>); };
const IconTruck = function () { return (<Icon><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M5 17H3V6a1 1 0 011-1h9v12M9 17h6M15 8h4l2 3v6h-2" /></Icon>); };
const IconExternal = function () { return (<Icon size={11}><path d="M7 17L17 7" /><path d="M8 7h9v9" /></Icon>); };
const IconChevron = function () { return (<Icon size={13}><path d="M6 9l6 6 6-6" /></Icon>); };
const IconLogout = function () { return (<Icon size={14}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></Icon>); };

function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(function (w) { return w[0]; })
    .join('')
    .toUpperCase();
}

/* ---------------- Design system ---------------- */
export const shellCss = '' +
/* tokens */
'.eba { --cream:#F2F0EB; --card:#FFFFFF; --wash:#FAF8F4; --sand:#bda891; --taupe:#806a52; --ink:#3d3428; --mute:#8b7a64; --line:#e8e2d8;' +
'  min-height:100vh; background:var(--cream); color:var(--ink);' +
'  font-family:"Recoleta", Georgia, serif; -webkit-font-smoothing:antialiased; }' +
'.eba * { box-sizing:border-box; }' +
'.eba a { color:inherit; text-decoration:none; }' +
'.eba button, .eba input, .eba select, .eba textarea { font-family:inherit; }' +
'.eba button { cursor:pointer; }' +
'.eba-display, .eba-hero h1, .eba-panel h2, .eba-stat b, .eba-herostat b, .eba-cta h3 {' +
'  font-family:"La Luxes Serif", "Recoleta", Georgia, serif; font-weight:400; letter-spacing:-0.01em; }' +
'.eba :focus-visible { outline:2px solid var(--taupe); outline-offset:2px; border-radius:8px; }' +

/* layout */
'.eba-shell { display:grid; grid-template-columns:272px minmax(0,1fr); gap:18px; align-items:start;' +
'  max-width:1640px; margin:0 auto; padding:18px; }' +

/* sidebar */
'.eba-side { position:sticky; top:18px; background:var(--card); border-radius:30px; padding:26px 20px 20px;' +
'  display:flex; flex-direction:column; gap:4px; min-height:calc(100vh - 36px);' +
'  box-shadow:0 1px 2px rgba(61,52,40,.04), 0 14px 40px rgba(61,52,40,.06); }' +
'.eba-logo { width:150px; height:auto; display:block; object-fit:contain; margin:4px 0 22px 6px; }' +
'.eba-brand { margin:0 0 2px 6px; font-size:9.5px; letter-spacing:.26em; color:var(--sand); }' +
'.eba-studio { margin:0 0 4px 6px; font-size:34px; line-height:1.02; color:var(--taupe); }' +
'.eba-hello { margin:8px 0 18px 6px; font-size:13px; color:var(--mute); }' +
'.eba-hr { border-top:1px solid var(--line); margin:0 6px 16px; }' +
'.eba-nav { display:grid; gap:8px; }' +
'.eba-nav a, .eba-nav button { display:flex; align-items:center; gap:12px; width:100%; text-align:left;' +
'  padding:9px 14px 9px 9px; border-radius:999px; border:1px solid transparent; background:var(--wash);' +
'  color:var(--mute); font-size:14px; transition:background .16s ease, color .16s ease, box-shadow .16s ease; }' +
'.eba-nav a:hover, .eba-nav button:hover { background:#F0ECE4; color:var(--ink); }' +
'.eba-nav a.on { background:var(--card); border-color:var(--line); color:var(--ink);' +
'  box-shadow:0 4px 16px rgba(61,52,40,.07); }' +
'.eba-nav .ic { width:30px; height:30px; border-radius:50%; background:#EFEAE1; color:var(--taupe);' +
'  display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; }' +
'.eba-nav a.on .ic { background:var(--taupe); color:var(--cream); }' +
'.eba-nav .ext { margin-left:auto; opacity:.6; display:inline-flex; }' +
'.eba-navlabel { margin:20px 6px 8px; font-size:9px; letter-spacing:.22em; color:var(--sand); }' +
'.eba-tip { margin-top:18px; background:rgba(189,168,145,.16); border-radius:18px; padding:14px 16px; }' +
'.eba-tip .lb { display:block; font-size:12.5px; color:var(--taupe); margin-bottom:4px; }' +
'.eba-tip p { margin:0; font-size:12.5px; line-height:1.5; color:var(--mute); }' +
'.eba-spacer { flex:1; min-height:18px; }' +

/* profile */
'.eba-profile { position:relative; }' +
'.eba-userpill { display:flex; align-items:center; gap:11px; padding:9px 12px 9px 9px !important; border-radius:999px;' +
'  border:1px solid var(--line) !important; background:var(--wash); width:100%; }' +
'.eba-avatar, .eba-avatar-fb { width:34px; height:34px; border-radius:50%; flex-shrink:0; display:block; object-fit:cover; }' +
'.eba-avatar-fb { background:var(--taupe); color:var(--cream); font-size:12px; display:flex; align-items:center; justify-content:center; }' +
'.eba-utext { min-width:0; flex:1; }' +
'.eba-uname, .eba-umail { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }' +
'.eba-uname { font-size:13.5px; color:var(--ink); }' +
'.eba-umail { font-size:10.5px; color:var(--sand); margin-top:1px; }' +
'.eba-menu { position:absolute; left:0; right:0; bottom:calc(100% + 8px); z-index:60; background:var(--card);' +
'  border:1px solid var(--line); border-radius:18px; overflow:hidden; box-shadow:0 18px 40px rgba(61,52,40,.16); }' +
'.eba-menu-head { padding:12px 14px; border-bottom:1px solid var(--line); }' +
'.eba-menu-head p { margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }' +
'.eba-menu-head .n { font-size:13px; color:var(--ink); }' +
'.eba-menu-head .e { font-size:11px; color:var(--sand); margin-top:2px !important; }' +
'.eba-menu button { display:flex; align-items:center; gap:9px; width:100%; border:0; background:transparent;' +
'  padding:12px 14px; text-align:left; color:var(--taupe); font-size:13px; }' +
'.eba-menu button:hover { background:var(--wash); }' +

/* main */
'.eba-main { min-width:0; display:grid; gap:16px; }' +
'.eba-hero { position:relative; overflow:hidden; background:var(--card); border-radius:30px; padding:30px 34px;' +
'  display:flex; align-items:center; justify-content:space-between; gap:24px;' +
'  box-shadow:0 1px 2px rgba(61,52,40,.04), 0 14px 40px rgba(61,52,40,.06); }' +
'.eba-hero::after { content:""; position:absolute; right:-70px; top:-90px; width:280px; height:280px; border-radius:50%;' +
'  background:radial-gradient(circle at 30% 30%, rgba(189,168,145,.28), rgba(189,168,145,0) 65%); pointer-events:none; }' +
'.eba-hero-copy { position:relative; z-index:1; min-width:0; }' +
'.eba-hero .eyebrow { margin:0 0 6px; font-size:10px; letter-spacing:.28em; color:var(--sand); }' +
'.eba-hero h1 { margin:0; font-size:clamp(32px,4.2vw,58px); line-height:1; color:var(--taupe); }' +
'.eba-hero .sub { margin:12px 0 0; font-size:14.5px; color:var(--mute); }' +
'.eba-hero-right { position:relative; z-index:1; display:flex; align-items:center; gap:12px; flex-shrink:0; }' +
'.eba-herostat { background:var(--wash); border:1px solid var(--line); border-radius:24px; padding:16px 30px;' +
'  text-align:center; min-width:170px; }' +
'.eba-herostat .lb { display:block; font-size:12px; color:var(--mute); }' +
'.eba-herostat b { display:block; font-size:44px; line-height:1.1; color:var(--taupe); }' +
'.eba-herostat .cap { display:block; font-size:11.5px; color:var(--sand); }' +
'.eba-langs { display:flex; border:1px solid var(--line); border-radius:999px; overflow:hidden; }' +
'.eba-langs button { border:0; background:transparent; padding:8px 13px; font-size:10px; letter-spacing:.14em; color:var(--taupe); }' +
'.eba-langs button.on { background:var(--taupe); color:var(--cream); }' +

/* stat cards */
'.eba-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(168px,1fr)); gap:14px; }' +
'.eba-stat { background:var(--card); border:0; border-radius:24px; padding:18px 20px; text-align:left; display:block;' +
'  box-shadow:0 1px 2px rgba(61,52,40,.04), 0 10px 30px rgba(61,52,40,.05); transition:transform .16s ease; }' +
'button.eba-stat:hover { transform:translateY(-2px); }' +
'.eba-stat .lb { display:block; font-size:12.5px; color:var(--mute); }' +
'.eba-stat b { display:block; font-size:38px; line-height:1.1; color:var(--taupe); margin:8px 0 4px; }' +
'.eba-stat .cap { display:block; font-size:11.5px; color:var(--sand); }' +

/* panels */
'.eba-cols { display:grid; grid-template-columns:1fr 1fr; gap:16px; align-items:start; }' +
'.eba-cols.wide-left { grid-template-columns:1.35fr 1fr; }' +
'.eba-panel { background:var(--card); border-radius:30px; padding:26px 28px;' +
'  box-shadow:0 1px 2px rgba(61,52,40,.04), 0 14px 40px rgba(61,52,40,.06); }' +
'.eba-eyebrow { margin:0 0 4px; font-size:10px; letter-spacing:.28em; color:var(--sand); text-transform:uppercase; }' +
'.eba-panel h2 { margin:0 0 18px; font-size:clamp(26px,2.6vw,40px); line-height:1.02; color:var(--taupe); }' +
'.eba-panelhead { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }' +

/* buttons */
'.eba-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; border:1px solid var(--line);' +
'  border-radius:999px; padding:10px 18px; font-size:12.5px; background:var(--card); color:var(--taupe); }' +
'.eba-btn:hover { background:var(--wash); }' +
'.eba-btn-dark { background:var(--taupe); border-color:var(--taupe); color:var(--cream); }' +
'.eba-btn-dark:hover { background:#6f5b45; color:var(--cream); }' +
'.eba-btn.mini { padding:6px 13px; font-size:11px; }' +
'.eba-btn:disabled { opacity:.5; cursor:not-allowed; }' +

/* cta */
'.eba-cta { display:flex; align-items:center; justify-content:space-between; gap:16px; width:100%; text-align:left;' +
'  background:var(--taupe); color:var(--cream); border:0; border-radius:24px; padding:24px 26px;' +
'  transition:background .16s ease; }' +
'.eba-cta:hover { background:#6f5b45; }' +
'.eba-cta h3 { margin:0; font-size:clamp(24px,2.4vw,36px); line-height:1; }' +
'.eba-cta p { margin:8px 0 0; font-size:13px; opacity:.82; }' +
'.eba-cta .go { font-size:13px; white-space:nowrap; opacity:.9; }' +
'.eba-cta-quiet { background:var(--wash); color:var(--ink); border:1px solid var(--line); margin-top:14px; }' +
'.eba-cta-quiet:hover { background:#F0ECE4; }' +
'.eba-cta-quiet h3 { color:var(--taupe); }' +
'.eba-cta-quiet p { color:var(--mute); opacity:1; }' +
'.eba-cta-quiet .go { color:var(--taupe); }' +

/* form fields */
'.eba-lb { display:block; font-size:10px; text-transform:uppercase; letter-spacing:.18em; color:var(--sand); margin:0 0 6px; }' +
'.eba-in { width:100%; border:1px solid var(--line); border-radius:14px; background:var(--wash); padding:11px 15px;' +
'  font-size:13.5px; color:var(--ink); outline:0; }' +
'.eba-in:focus { border-color:var(--taupe); background:var(--card); }' +
'.eba-in:disabled { color:var(--sand); }' +
'.eba-in::placeholder { color:var(--sand); }' +
'textarea.eba-in { resize:vertical; }' +
'.eba-formrow { display:grid; grid-template-columns:1.6fr 1fr; gap:12px; }' +
'.eba-formrow.even { grid-template-columns:1fr 1fr; }' +
'.eba-field + .eba-field, .eba-formrow + .eba-field, .eba-field + .eba-formrow, .eba-formrow + .eba-formrow { margin-top:12px; }' +
'.eba-checks { display:flex; flex-wrap:wrap; gap:10px 18px; margin-top:16px; padding-top:16px; border-top:1px solid var(--line); }' +
'.eba-check { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--mute); cursor:pointer; }' +
'.eba-check input { accent-color:var(--taupe); width:16px; height:16px; }' +
'.eba-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:18px; }' +
'.eba-select { appearance:none; border:1px solid var(--line); border-radius:999px; padding:10px 32px 10px 15px;' +
'  background:var(--card) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'11\' height=\'11\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23806a52\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 13px center;' +
'  color:var(--taupe); font-size:12.5px; outline:0; }' +
'.eba-search { display:flex; align-items:center; gap:9px; border:1px solid var(--line); border-radius:999px;' +
'  padding:10px 16px; background:var(--card); flex:1; min-width:200px; }' +
'.eba-search svg { color:var(--sand); flex-shrink:0; }' +
'.eba-search input { width:100%; border:0; outline:0; background:transparent; color:var(--ink); font-size:13px; }' +
'.eba-search input::placeholder { color:var(--sand); }' +
'.eba-toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:9px; }' +
'.eba-notice { margin-top:14px; background:var(--wash); border:1px solid var(--line); border-radius:16px;' +
'  padding:11px 16px; font-size:12.5px; color:var(--taupe); }' +
'.eba-err { margin-top:14px; background:rgba(160,53,53,.07); border:1px solid rgba(160,53,53,.2); border-radius:16px;' +
'  padding:11px 16px; font-size:12.5px; color:#8f3a3a; }' +
'.eba-muted { font-size:12.5px; color:var(--mute); }' +

/* rows */
'.eba-rows { display:grid; gap:10px; }' +
'.eba-row { display:flex; flex-wrap:wrap; align-items:center; gap:10px 14px; width:100%; text-align:left;' +
'  background:var(--wash); border:1px solid transparent; border-radius:20px; padding:14px 18px; color:inherit; }' +
'button.eba-row:hover, .eba-row.click:hover { border-color:var(--line); background:var(--card); }' +
'.eba-row.off { opacity:.55; }' +
'.eba-who { min-width:180px; flex:1; }' +
'.eba-who .n { display:block; font-size:15px; color:var(--ink); overflow:hidden; text-overflow:ellipsis; }' +
'.eba-who .s { display:block; margin-top:3px; font-size:11.5px; color:var(--mute); }' +
'.eba-amt { font-size:17px; color:var(--taupe); white-space:nowrap; }' +
'.eba-rowbtns { display:flex; flex-wrap:wrap; gap:6px; }' +
'.eba-pill { border-radius:999px; padding:4px 11px; font-size:9px; letter-spacing:.12em; text-transform:uppercase;' +
'  white-space:nowrap; border:1px solid transparent; }' +
'.eba-pill.ok { background:var(--taupe); color:var(--cream); }' +
'.eba-pill.mid { background:rgba(189,168,145,.32); color:var(--taupe); }' +
'.eba-pill.off { background:var(--card); border-color:var(--line); color:var(--mute); }' +
'.eba-empty { padding:44px 18px; text-align:center; font-size:13.5px; color:var(--sand); background:var(--wash); border-radius:20px; }' +

/* detail cells */
'.eba-cells { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:12px; }' +
'.eba-cell { background:var(--wash); border:1px solid var(--line); border-radius:20px; padding:14px 16px;' +
'  font-size:12.5px; line-height:1.6; color:var(--mute); }' +
'.eba-cell .lb { display:block; font-size:9px; text-transform:uppercase; letter-spacing:.18em; color:var(--sand); margin-bottom:6px; }' +
'.eba-cell b { color:var(--ink); font-weight:400; }' +

/* table */
'.eba-tablewrap { overflow-x:auto; }' +
'.eba-table { width:100%; border-collapse:collapse; font-size:13px; }' +
'.eba-table th { text-align:left; font-weight:400; font-size:9.5px; letter-spacing:.18em; text-transform:uppercase;' +
'  color:var(--sand); padding:0 14px 10px; }' +
'.eba-table td { padding:14px; color:var(--mute); border-top:1px solid var(--line); }' +
'.eba-table tbody tr:hover td { background:var(--wash); }' +
'.eba-table td:first-child { color:var(--ink); border-radius:14px 0 0 14px; }' +
'.eba-table td:last-child { border-radius:0 14px 14px 0; text-align:right; }' +
'.eba-clip { max-width:230px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }' +

/* responsive */
'@media (max-width:1180px) { .eba-cols, .eba-cols.wide-left { grid-template-columns:1fr; } }' +
'@media (max-width:980px) {' +
' .eba-shell { grid-template-columns:1fr; padding:12px; gap:12px; }' +
' .eba-side { position:static; min-height:0; border-radius:24px; padding:18px 16px; }' +
' .eba-logo { width:120px; margin-bottom:14px; }' +
' .eba-studio { font-size:26px; }' +
' .eba-hello, .eba-tip, .eba-spacer { display:none; }' +
' .eba-nav { display:flex; overflow-x:auto; padding-bottom:4px; }' +
' .eba-nav a, .eba-nav button { width:auto; white-space:nowrap; }' +
' .eba-navlabel { margin:14px 6px 6px; }' +
' .eba-profile { margin-top:14px; }' +
' .eba-menu { bottom:auto; top:calc(100% + 8px); }' +
' .eba-hero { flex-direction:column; align-items:flex-start; padding:24px; border-radius:24px; }' +
' .eba-hero-right { width:100%; justify-content:space-between; }' +
' .eba-herostat { flex:1; }' +
' .eba-panel { padding:20px; border-radius:24px; }' +
'}' +
'@media (max-width:560px) { .eba-formrow, .eba-formrow.even { grid-template-columns:1fr; }' +
' .eba-rowbtns { flex:1 1 100%; } .eba-rowbtns .eba-btn { flex:1; } }' +
'@media (prefers-reduced-motion:reduce) { .eba * { transition:none !important; } }' +
'@media print { .no-print { display:none !important; } .eba { background:#fff; } .eba-shell { display:block; padding:0; }' +
' .eba-panel, .eba-hero { box-shadow:none; padding:0; } }';

/* ============================================================ */
export default function AdminShell(props) {
  const admin = props.admin;
  const [ownLang, setOwnLang] = useState(props.lang || 'en');
  const lang = props.lang || ownLang;
  const t = T[lang] || T.en;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(function () {
    if (props.lang) return;
    const stored = localStorage.getItem('eb-lang');
    if (stored === 'en' || stored === 'es') setOwnLang(stored);
  }, [props.lang]);

  function setLang(l) {
    localStorage.setItem('eb-lang', l);
    document.documentElement.lang = l;
    if (props.onLang) props.onLang(l);
    else setOwnLang(l);
  }

  useEffect(function () {
    function close(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    function esc(e) { if (e.key === 'Escape') setMenuOpen(false); }
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return function () {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  const avatarUrl = admin?.avatar_url || admin?.picture || admin?.avatar || null;
  const nav = [
    { key: 'overview', href: '/admin', label: t.overview, icon: <IconHome /> },
    { key: 'payment-links', href: '/admin/payment-links', label: t.paymentLinks, icon: <IconLink /> },
    { key: 'gift-cards', href: '/admin/gift-cards', label: t.giftCards, icon: <IconGift /> },
    { key: 'live-link', href: '/admin/live-link', label: t.liveLink, icon: <IconBroadcast /> },
    { key: 'checks', href: '/admin/checks', label: t.checks, icon: <IconCheck /> },
  ];

  return (
    <main className="eba">
      <style>{shellCss}</style>

      <div className="eba-shell">
        <aside className="eba-side no-print">
          <a href="/admin" aria-label="Erendira&#8217;s Boutique admin home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SRC} alt="Erendira&#8217;s Boutique" className="eba-logo" />
          </a>
          <p className="eba-brand">{t.brand}</p>
          <p className="eba-studio eba-display">{t.studio}</p>
          <p className="eba-hello">{t.welcome}, {admin?.name?.split(' ')[0] || 'Erendira'}</p>
          <div className="eba-hr" />

          <nav className="eba-nav" aria-label="Admin">
            {nav.map(function (item) {
              return (
                <a key={item.key} href={item.href} className={props.active === item.key ? 'on' : ''} aria-current={props.active === item.key ? 'page' : undefined}>
                  <span className="ic">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          <p className="eba-navlabel">{t.shipping.toUpperCase()}</p>
          <nav className="eba-nav" aria-label="Shipping portal">
            <a href={SHIP + '/orders'} target="_blank" rel="noopener noreferrer">
              <span className="ic"><IconBox /></span><span>{t.orders}</span><span className="ext"><IconExternal /></span>
            </a>
            <a href={SHIP} target="_blank" rel="noopener noreferrer">
              <span className="ic"><IconTruck /></span><span>{t.shipping}</span><span className="ext"><IconExternal /></span>
            </a>
          </nav>

          {props.tip && (
            <div className="eba-tip">
              <span className="lb">{props.tip.label}</span>
              <p>{props.tip.body}</p>
            </div>
          )}

          <div className="eba-spacer" />

          <div className="eba-profile" ref={menuRef}>
            <button
              className="eba-userpill"
              onClick={function () { setMenuOpen(function (v) { return !v; }); }}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="eba-avatar" />
              ) : (
                <span className="eba-avatar-fb">{initials(admin?.name || admin?.email)}</span>
              )}
              <span className="eba-utext">
                <span className="eba-uname">{admin?.name || t.account}</span>
                <span className="eba-umail">{admin?.email || '\u2014'}</span>
              </span>
              <IconChevron />
            </button>

            {menuOpen && (
              <div className="eba-menu" role="menu">
                <div className="eba-menu-head">
                  <p className="n">{admin?.name || t.account}</p>
                  <p className="e">{admin?.email}{admin?.role ? ' \u00b7 ' + admin.role : ''}</p>
                </div>
                <button role="menuitem" onClick={logout}><IconLogout />{t.logOut}</button>
              </div>
            )}
          </div>
        </aside>

        <section className="eba-main">
          <div className="eba-hero">
            <div className="eba-hero-copy">
              {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
              <h1>{props.title}</h1>
              {props.subtitle && <p className="sub">{props.subtitle}</p>}
            </div>
            <div className="eba-hero-right no-print">
              {props.heroStat && (
                <div className="eba-herostat">
                  <span className="lb">{props.heroStat.label}</span>
                  <b>{props.heroStat.value}</b>
                  <span className="cap">{props.heroStat.caption}</span>
                </div>
              )}
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
          </div>

          {props.children}
        </section>
      </div>
    </main>
  );
}
