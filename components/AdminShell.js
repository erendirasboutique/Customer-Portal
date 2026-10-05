'use client';

// components/AdminShell.js
// Erendira's Boutique — Admin Studio shell
//
// "Studio" design: floating cream canvas, white rounded cards, pill nav,
// La Luxes display headings. Every admin page renders inside this.
//
// Props:
//   admin      { name, email, avatar_url, role }  — used for the profile card
//   active     'overview' | 'payment-links' | 'sezzle' | 'card-terminal' | 'stripe-terminal' | 'receipts'
//              | 'gift-cards' | 'gift-card-sales'
//              | 'live-link' | 'live-schedule' | 'checks'
//              | 'reminders' | 'documents' | 'giveaway'
//              | 'team' | 'branding' | 'integrations' | 'settings' | 'help'  (profile menu pages)
//   lang       'en' | 'es'   (optional — omit and the shell manages it itself)
//   onLang     (l) => void   (optional — pass when the page owns lang state)
//   eyebrow    small caps line above the hero title
//   title      hero title
//   subtitle   hero sub-line
//   heroStat   { label, value, caption }  — the boxed number at the hero's right
//   tip        { label, body }            — sidebar quick tip (optional)
//   children   page content
//
// NAVIGATION (changes with screen size, nothing to set):
//   computer (1180px+)  top bar with dropdown menus
//   iPad (700-1179px)   slim icon rail on the left; tap a section for its pages
//   phone (under 700px) bottom tabs; tap a section for a sheet of its pages
// Pages are grouped in SECTIONS below. Add a page there and every layout gets it.

import { useEffect, useRef, useState } from 'react';

const LOGO_SRC = '/EB_Logo_Fall BGBLANK.png';
const SHIP = 'https://ship.erendirasboutique.com';

const T = {
  en: {
    brand: "ERENDIRA'S BOUTIQUE",
    studio: 'Admin Studio',
    welcome: 'Welcome',
    overview: 'Dashboard',
    paymentLinks: 'Payment links',
    sezzle: 'Sezzle',
    cardTerminal: 'Clover terminal',
    stripeTerminal: 'Stripe terminal',
    receipts: 'Receipts',
    giftCards: 'Gift cards',
    giftCardSales: 'Gift card sales',
    liveLink: 'Live link',
    liveSchedule: 'Live schedule',
    checks: 'Checks',
    reminders: 'Bills & supplies',
    documents: 'Documents',
    giveaway: 'Giveaway wheel',
    orders: 'Orders',
    shipping: 'Shipping',
    logOut: 'Log out',
    account: 'Account',
    home: 'Home',
    secPayments: 'Payments',
    secGifts: 'Gift cards',
    secLives: 'Lives',
    secBusiness: 'Business',
    more: 'More',
    menu: 'Menu',
    team: 'Team & permissions',
    branding: 'Branding',
    integrations: 'Integrations',
    settings: 'Settings',
    help: 'Help',
  },
  es: {
    brand: "ERENDIRA'S BOUTIQUE",
    studio: 'Admin Studio',
    welcome: 'Bienvenida',
    overview: 'Panel',
    paymentLinks: 'Enlaces de pago',
    sezzle: 'Sezzle',
    cardTerminal: 'Terminal Clover',
    stripeTerminal: 'Terminal Stripe',
    receipts: 'Recibos',
    giftCards: 'Tarjetas de regalo',
    giftCardSales: 'Ventas de tarjetas',
    liveLink: 'Enlace en vivo',
    liveSchedule: 'Calendario de lives',
    checks: 'Cheques',
    reminders: 'Pagos y suministros',
    documents: 'Documentos',
    giveaway: 'Ruleta de regalos',
    orders: 'Pedidos',
    shipping: 'Envíos',
    logOut: 'Cerrar sesión',
    account: 'Cuenta',
    home: 'Inicio',
    secPayments: 'Pagos',
    secGifts: 'Tarjetas',
    secLives: 'Lives',
    secBusiness: 'Negocio',
    more: 'Más',
    menu: 'Menú',
    team: 'Equipo y permisos',
    branding: 'Marca',
    integrations: 'Integraciones',
    settings: 'Configuración',
    help: 'Ayuda',
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
const IconSezzle = function () { return (<Icon><path d="M4 8h13a3 3 0 013 3v0a3 3 0 01-3 3H7a3 3 0 01-3-3" /><path d="M8 5v3" /><path d="M16 14v3" /></Icon>); };
const IconTerminal = function () { return (<Icon><rect x="6" y="2.5" width="12" height="19" rx="2" /><path d="M9 6.5h6v3.5H9z" /><path d="M9 14h.01M12 14h.01M15 14h.01M9 17.5h.01M12 17.5h.01M15 17.5h.01" /></Icon>); };
const IconCard = function () { return (<Icon><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><rect x="5.5" y="8.5" width="4" height="3" rx=".6" /><path d="M5.5 15h6M14 15h4.5" /></Icon>); };
const IconReceipt = function () { return (<Icon><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" /><path d="M9 8h6M9 12h6M9 16h3" /></Icon>); };
const IconGift = function () { return (<Icon><path d="M3 9h18v3H3z" /><path d="M12 9v12" /><path d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" /><path d="M7.5 9a2.5 2.5 0 010-5C11 4 12 9 12 9s1-5 4.5-5a2.5 2.5 0 010 5" /></Icon>); };
const IconBroadcast = function () { return (<Icon><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 010 8.49" /><path d="M7.76 16.24a6 6 0 010-8.49" /><path d="M19.07 4.93a10 10 0 010 14.14" /><path d="M4.93 19.07a10 10 0 010-14.14" /></Icon>); };
const IconBag = function () { return (<Icon><path d="M5 8h14l-1 12a1 1 0 01-1 1H7a1 1 0 01-1-1L5 8z" /><path d="M9 8V6a3 3 0 016 0v2" /></Icon>); };
const IconCalendar = function () { return (<Icon><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17" /><path d="M8 3v4M16 3v4" /><circle cx="12" cy="15" r="1.4" /></Icon>); };
const IconCheck = function () { return (<Icon><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /><path d="M7 14h4" /></Icon>); };
const IconBell = function () { return (<Icon><path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15L6 16z" /><path d="M10 20a2 2 0 004 0" /></Icon>); };
const IconFolder = function () { return (<Icon><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><path d="M3 10h18" /></Icon>); };
const IconWheel = function () { return (<Icon><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" /><path d="M12 3v7M12 14v7M3 12h7M14 12h7M5.6 5.6l5 5M13.4 13.4l5 5M18.4 5.6l-5 5M10.6 13.4l-5 5" /></Icon>); };
const IconBox = function () { return (<Icon><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M12 12l8-4.5" /><path d="M12 12v9" /><path d="M12 12L4 7.5" /></Icon>); };
const IconTruck = function () { return (<Icon><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M5 17H3V6a1 1 0 011-1h9v12M9 17h6M15 8h4l2 3v6h-2" /></Icon>); };
const IconWallet = function () { return (<Icon><path d="M4 7a2 2 0 012-2h11v4" /><rect x="3" y="8" width="18" height="11" rx="2" /><path d="M16 13.5h2" /></Icon>); };
const IconDots = function () { return (<Icon><circle cx="5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="19" cy="12" r="1.3" /></Icon>); };
const IconExternal = function () { return (<Icon size={11}><path d="M7 17L17 7" /><path d="M8 7h9v9" /></Icon>); };
const IconChevron = function () { return (<Icon size={13}><path d="M6 9l6 6 6-6" /></Icon>); };
const IconLogout = function () { return (<Icon size={14}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></Icon>); };
const IconUsers = function () { return (<Icon size={14}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0" /><path d="M16 4.5a3.5 3.5 0 010 7" /><path d="M18 14.5a6.5 6.5 0 013.5 5.5" /></Icon>); };
const IconPalette = function () { return (<Icon size={14}><path d="M12 3a9 9 0 100 18c1.1 0 1.7-.9 1.4-1.8l-.3-.9a1.6 1.6 0 011.5-2.1H17a4 4 0 004-4c0-5-4-9.2-9-9.2z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" /></Icon>); };
const IconPlug = function () { return (<Icon size={14}><path d="M9 3v5M15 3v5" /><path d="M6 8h12v3a6 6 0 01-12 0V8z" /><path d="M12 17v4" /></Icon>); };
const IconGear = function () { return (<Icon size={14}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></Icon>); };
const IconHelp = function () { return (<Icon size={14}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.7-2.5 2-2.5 3.5" /><path d="M12 17h.01" /></Icon>); };

function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(function (w) { return w[0]; })
    .join('')
    .toUpperCase();
}

/* ---------------- Home screen app ----------------
   Adds the tags phones look for when you "Add to Home Screen",
   and registers a tiny service worker that only shows an
   "offline" screen when there's no internet. */
function installAppTags() {
  if (typeof document === 'undefined') return;
  const head = document.head;
  function ensure(tag, attrs) {
    const key = attrs.rel ? 'link[rel="' + attrs.rel + '"]' : 'meta[name="' + attrs.name + '"]';
    let el = head.querySelector(key);
    if (!el) { el = document.createElement(tag); head.appendChild(el); }
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
  }
  ensure('link', { rel: 'manifest', href: '/studio.webmanifest' });
  ensure('link', { rel: 'apple-touch-icon', href: '/studio-icons/apple-touch-icon.png' });
  ensure('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  ensure('meta', { name: 'mobile-web-app-capable', content: 'yes' });
  ensure('meta', { name: 'apple-mobile-web-app-title', content: 'EB Studio' });
  ensure('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'default' });
  ensure('meta', { name: 'theme-color', content: '#F5F3EF' });

  if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    navigator.serviceWorker.register('/studio-sw.js', { scope: '/admin' }).catch(function () {});
  }
}

/* ---------------- Design system ---------------- */
export const shellCss = '' +
/* tokens */
'.eba { --cream:#F5F3EF; --card:#FFFFFF; --wash:#FAF9F6; --sand:#cfbda9; --taupe:#957f67; --ink:#957f67; --mute:#957f67; --line:#e6dccf; --accent:#957f67; --accent-dark:#7f6b55;' +
'  min-height:100vh; background:var(--cream); color:var(--ink); overflow-x:clip;' +
'  font-family:"Recoleta", Georgia, serif; -webkit-font-smoothing:antialiased; }' +
'.eba * { box-sizing:border-box; }' +
'.eba a { color:inherit; text-decoration:none; }' +
'.eba button, .eba input, .eba select, .eba textarea { font-family:inherit; }' +
'.eba button { cursor:pointer; }' +
'.eba-display, .eba-hero h1, .eba-panel h2, .eba-stat b, .eba-herostat b, .eba-cta h3 {' +
'  font-family:"La Luxes Serif", "Recoleta", Georgia, serif; font-weight:400; letter-spacing:-0.01em; }' +
'.eba :focus-visible { outline:2px solid var(--taupe); outline-offset:2px; border-radius:8px; }' +

/* layout */
'.eba-shell { max-width:1640px; margin:0 auto; padding:10px 10px 104px; }' +
'@media (min-width:700px) { .eba-shell { display:grid; grid-template-columns:86px minmax(0,1fr); gap:16px; align-items:start; padding:14px; } }' +
'@media (min-width:1180px) { .eba-shell { display:block; padding:12px 18px 24px; } }' +

/* ---------- navigation (phone first) ---------- */
'.eba-top, .eba-rail { display:none; }' +
'.eba-wrap { position:relative; }' +
'.eba-chip { width:28px; height:28px; border-radius:50%; background:#efe8de; color:var(--taupe); display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; }' +
'.eba-pop { background:var(--card); border:1px solid var(--line); border-radius:20px; padding:8px; box-shadow:0 18px 40px rgba(149,127,103,.18); }' +
'.eba-pop a, .eba-pop button { display:flex; align-items:center; gap:10px; width:100%; padding:10px 12px; border:0; border-radius:14px; background:transparent;' +
'  text-align:left; font-size:13.5px; color:var(--ink); }' +
'.eba-pop a:hover, .eba-pop button:hover, .eba-pop a.on { background:var(--wash); }' +
'.eba-pop a.on .eba-chip { background:var(--accent); color:var(--cream); }' +
'.eba-pop .ext { margin-left:auto; opacity:.6; display:inline-flex; }' +
'.eba-pop-label { margin:6px 12px 6px; font-size:9.5px; letter-spacing:.22em; color:#8c775f; text-transform:uppercase; }' +
'.eba-pop-head { padding:8px 12px 10px; margin-bottom:4px; border-bottom:1px solid var(--line); }' +
'.eba-pop-head p { margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }' +
'.eba-pop-head .n { font-size:13.5px; color:var(--ink); }' +
'.eba-pop-head .e { font-size:11px; color:#8c775f; margin-top:2px; }' +
'.eba-pop-sep { border-top:1px solid var(--line); margin:6px 4px; }' +
'.eba-avatar, .eba-avatar-fb { width:34px; height:34px; border-radius:50%; flex-shrink:0; display:block; object-fit:cover; }' +
'.eba-avatar-fb { background:var(--accent); color:var(--cream); font-size:12px; display:flex; align-items:center; justify-content:center; }' +
'.eba-brandmark { font-family:"La Luxes Serif","Recoleta",Georgia,serif; color:var(--taupe); line-height:1; }' +
/* phone */
'.eba-mhead { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:4px 4px 12px; }' +
'.eba-mhead .eba-logo { width:110px; height:auto; display:block; }' +
'.eba-iconbtn { border:0; background:transparent; padding:0; border-radius:50%; }' +
'.eba-tabs { position:fixed; left:10px; right:10px; bottom:max(12px, env(safe-area-inset-bottom)); z-index:72; display:flex; gap:2px;' +
'  background:var(--card); border-radius:26px; padding:6px; box-shadow:0 10px 30px rgba(149,127,103,.22); }' +
'.eba-tab { flex:1; min-width:0; min-height:50px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;' +
'  border:0; background:transparent; border-radius:20px; font-size:10.5px; color:var(--mute); }' +
'.eba-tab svg { width:20px; height:20px; }' +
'.eba-tab.on { background:#efe8de; color:var(--ink); }' +
'.eba-tab.open { background:var(--accent); color:var(--cream); }' +
'.eba-sheet-bg { position:fixed; inset:0; z-index:70; background:rgba(60,48,36,.22); border:0; }' +
'.eba-sheet { position:fixed; left:0; right:0; bottom:0; z-index:71; max-height:78vh; overflow:auto; border-radius:26px 26px 0 0 !important;' +
'  padding:10px 14px calc(92px + env(safe-area-inset-bottom)) !important; }' +
'.eba-grab { display:block; width:40px; height:4px; border-radius:4px; background:var(--line); margin:2px auto 10px; }' +
'.eba-sheet-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px; }' +
'.eba-sheet-grid a, .eba-sheet-grid button { background:var(--wash); }' +
/* iPad: icon rail */
'@media (min-width:700px) {' +
' .eba-mhead, .eba-tabs, .eba-sheet, .eba-sheet-bg { display:none !important; }' +
' .eba-rail { display:flex; flex-direction:column; align-items:center; gap:6px; position:sticky; top:14px; z-index:50;' +
'   min-height:calc(100vh - 28px); background:var(--card); border-radius:28px; padding:16px 8px 14px;' +
'   box-shadow:0 1px 2px rgba(149,127,103,.04), 0 14px 40px rgba(149,127,103,.06); }' +
' .eba-rail .eba-brandmark { font-size:28px; margin:2px 0 12px; }' +
' .eba-rb { display:flex; flex-direction:column; align-items:center; gap:4px; width:70px; padding:8px 2px; border:0; border-radius:16px;' +
'   background:transparent; font-size:10.5px; line-height:1.15; color:var(--mute); text-align:center; }' +
' .eba-rb .ic { width:40px; height:40px; border-radius:14px; background:#efe8de; color:var(--taupe); display:inline-flex; align-items:center; justify-content:center; }' +
' .eba-rb:hover, .eba-rb.open { background:var(--wash); color:var(--ink); }' +
' .eba-rb.on .ic { background:var(--accent); color:var(--cream); }' +
' .eba-rb.on { color:var(--ink); }' +
' .eba-rail-fill { flex:1; min-height:12px; }' +
' .eba-fly { position:absolute; left:calc(100% + 12px); top:0; width:250px; z-index:60; }' +
' .eba-fly.up { top:auto; bottom:0; }' +
'}' +
/* computer: top bar */
'@media (min-width:1180px) {' +
' .eba-rail { display:none; }' +
' .eba-top { display:flex; flex-wrap:wrap; align-items:center; gap:8px 14px; position:sticky; top:12px; z-index:50;' +
'   background:var(--card); border-radius:999px; padding:8px 10px 8px 22px; margin-bottom:16px;' +
'   box-shadow:0 1px 2px rgba(149,127,103,.04), 0 14px 40px rgba(149,127,103,.08); }' +
' .eba-top .eba-logo { width:118px; height:auto; display:block; }' +
' .eba-top nav { display:flex; flex-wrap:wrap; gap:2px; flex:1; min-width:0; }' +
' .eba-tn { display:inline-flex; align-items:center; gap:7px; padding:10px 14px; border:0; border-radius:999px; background:transparent;' +
'   font-size:14px; color:var(--mute); white-space:nowrap; }' +
' .eba-tn:hover, .eba-tn.open { background:#efe8de; color:var(--ink); }' +
' .eba-tn.on { background:var(--accent); color:var(--cream); }' +
' .eba-tn .car { font-size:9px; opacity:.8; }' +
' .eba-drop { position:absolute; top:calc(100% + 10px); left:0; min-width:270px; z-index:60; }' +
' .eba-drop.right { left:auto; right:0; }' +
' .eba-userpill { display:flex; align-items:center; gap:9px; padding:4px 12px 4px 4px; border:1px solid var(--line); border-radius:999px; background:var(--wash); }' +
' .eba-userpill .nm { font-size:13px; color:var(--ink); max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }' +
'}' +

/* main */
'.eba-main { min-width:0; display:grid; gap:16px; }' +
'.eba-hero { position:relative; overflow:hidden; background:var(--card); border-radius:30px; padding:30px 34px;' +
'  display:flex; align-items:center; justify-content:space-between; gap:24px;' +
'  box-shadow:0 1px 2px rgba(149,127,103,.04), 0 14px 40px rgba(149,127,103,.06); }' +
'.eba-hero::after { content:""; position:absolute; right:-70px; top:-90px; width:280px; height:280px; border-radius:50%;' +
'  background:radial-gradient(circle at 30% 30%, rgba(207,189,169,.28), rgba(207,189,169,0) 65%); pointer-events:none; }' +
'.eba-hero-copy { position:relative; z-index:1; min-width:0; }' +
'.eba-hero .eyebrow { margin:0 0 6px; font-size:10px; letter-spacing:.28em; color:var(--sand); }' +
'.eba-hero h1 { margin:0; font-size:clamp(32px,4.2vw,58px); line-height:1; color:var(--taupe); }' +
'.eba-hero .sub { margin:12px 0 0; font-size:14.5px; color:var(--mute); }' +
'.eba-hero .tip { margin:10px 0 0; font-size:12.5px; line-height:1.5; color:#8c775f; max-width:640px; }' +
'.eba-hero .tip b { font-weight:400; color:var(--taupe); }' +
'.eba-hero-right { position:relative; z-index:1; display:flex; align-items:center; gap:12px; flex-shrink:0; }' +
'.eba-herostat { background:var(--wash); border:1px solid var(--line); border-radius:24px; padding:16px 30px;' +
'  text-align:center; min-width:170px; }' +
'.eba-herostat .lb { display:block; font-size:12px; color:var(--mute); }' +
'.eba-herostat b { display:block; font-size:44px; line-height:1.1; color:var(--taupe); }' +
'.eba-herostat .cap { display:block; font-size:11.5px; color:var(--sand); }' +
'.eba-langs { display:flex; border:1px solid var(--line); border-radius:999px; overflow:hidden; }' +
'.eba-langs button { border:0; background:transparent; padding:8px 13px; font-size:10px; letter-spacing:.14em; color:var(--taupe); }' +
'.eba-langs button.on { background:var(--accent); color:var(--cream); }' +

/* stat cards */
'.eba-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(168px,1fr)); gap:14px; }' +
'.eba-stat { background:var(--card); border:0; border-radius:24px; padding:18px 20px; text-align:left; display:block;' +
'  box-shadow:0 1px 2px rgba(149,127,103,.04), 0 10px 30px rgba(149,127,103,.05); transition:transform .16s ease; }' +
'button.eba-stat:hover { transform:translateY(-2px); }' +
'.eba-stat .lb { display:block; font-size:12.5px; color:var(--mute); }' +
'.eba-stat b { display:block; font-size:38px; line-height:1.1; color:var(--taupe); margin:8px 0 4px; overflow-wrap:anywhere; }' +
'.eba-stat .cap { display:block; font-size:11.5px; color:var(--sand); }' +

/* panels */
'.eba-cols { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:16px; align-items:start; }' +
'.eba-cols.wide-left { grid-template-columns:minmax(0,1.35fr) minmax(0,1fr); }' +
'.eba-panel { background:var(--card); border-radius:30px; padding:26px 28px;' +
'  box-shadow:0 1px 2px rgba(149,127,103,.04), 0 14px 40px rgba(149,127,103,.06); }' +
'.eba-eyebrow { margin:0 0 4px; font-size:10px; letter-spacing:.28em; color:var(--sand); text-transform:uppercase; }' +
'.eba-panel h2 { margin:0 0 18px; font-size:clamp(26px,2.6vw,40px); line-height:1.02; color:var(--taupe); }' +
'.eba-panelhead { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }' +

/* buttons */
'.eba-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; border:1px solid var(--line);' +
'  border-radius:999px; padding:10px 18px; font-size:12.5px; background:var(--card); color:var(--taupe); }' +
'.eba-btn:hover { background:var(--wash); }' +
'.eba-btn-dark { background:var(--accent); border-color:var(--accent); color:var(--cream); }' +
'.eba-btn-dark:hover { background:var(--accent-dark); color:var(--cream); }' +
'.eba-btn.mini { padding:6px 13px; font-size:11px; }' +
'.eba-btn:disabled { opacity:.5; cursor:not-allowed; }' +

/* cta */
'.eba-cta { display:flex; align-items:center; justify-content:space-between; gap:16px; width:100%; text-align:left;' +
'  background:var(--accent); color:var(--cream); border:0; border-radius:24px; padding:24px 26px;' +
'  transition:background .16s ease; }' +
'.eba-cta:hover { background:var(--accent-dark); }' +
'.eba-cta > span { min-width:0; }' +
'.eba-cta h3 { margin:0; font-size:clamp(24px,2.4vw,36px); line-height:1; overflow-wrap:anywhere; }' +
'.eba-cta h3, .eba-cta p, .eba-cta .go { color:inherit; }' +
'.eba a.eba-btn-dark, .eba a.eba-cta:not(.eba-cta-quiet) { color:var(--cream); }' +
'.eba-cta p { margin:8px 0 0; font-size:13px; opacity:.82; }' +
'.eba-cta .go { font-size:13px; white-space:nowrap; opacity:.9; }' +
'.eba-cta-quiet { background:var(--wash); color:var(--ink); border:1px solid var(--line); margin-top:14px; }' +
'.eba-cta-quiet:hover { background:#efe8de; }' +
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
'.eba-formrow { display:grid; grid-template-columns:minmax(0,1.6fr) minmax(0,1fr); gap:12px; }' +
'.eba-formrow.even { grid-template-columns:minmax(0,1fr) minmax(0,1fr); }' +
'.eba-field + .eba-field, .eba-formrow + .eba-field, .eba-field + .eba-formrow, .eba-formrow + .eba-formrow { margin-top:12px; }' +
'.eba-checks { display:flex; flex-wrap:wrap; gap:10px 18px; margin-top:16px; padding-top:16px; border-top:1px solid var(--line); }' +
'.eba-check { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--mute); cursor:pointer; }' +
'.eba-check input { accent-color:var(--accent); width:16px; height:16px; }' +
'.eba-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:18px; }' +
'.eba-select { appearance:none; border:1px solid var(--line); border-radius:999px; padding:10px 32px 10px 15px;' +
'  background:var(--card) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'11\' height=\'11\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23957f67\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 13px center;' +
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
'.eba-rows { display:grid; grid-template-columns:minmax(0,1fr); gap:10px; }' +
'.eba-row { display:flex; flex-wrap:wrap; align-items:center; gap:10px 14px; width:100%; text-align:left;' +
'  background:var(--wash); border:1px solid transparent; border-radius:20px; padding:14px 18px; color:inherit; }' +
'button.eba-row:hover, .eba-row.click:hover { border-color:var(--line); background:var(--card); }' +
'.eba-row.off { opacity:.55; }' +
'.eba-who { min-width:180px; flex:1; }' +
'.eba-who .n { display:block; font-size:15px; color:var(--ink); overflow:hidden; text-overflow:ellipsis; overflow-wrap:anywhere; }' +
'.eba-who .s { display:block; margin-top:3px; font-size:11.5px; color:var(--mute); overflow-wrap:anywhere; }' +
'.eba-amt { font-size:17px; color:var(--taupe); white-space:nowrap; }' +
'.eba-rowbtns { display:flex; flex-wrap:wrap; gap:6px; }' +
'.eba-pill { border-radius:999px; padding:4px 11px; font-size:9px; letter-spacing:.12em; text-transform:uppercase;' +
'  white-space:nowrap; border:1px solid transparent; }' +
'.eba-pill.ok { background:var(--accent); color:var(--cream); }' +
'.eba-pill.mid { background:rgba(207,189,169,.32); color:var(--taupe); }' +
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
'@media (max-width:1180px) { .eba-cols, .eba-cols.wide-left { grid-template-columns:minmax(0,1fr); } }' +

/* tablet + phone: sidebar becomes a compact header bar */
'@media (max-width:980px) {' +
' .eba-hero { flex-direction:column; align-items:stretch; gap:18px; padding:22px 20px; border-radius:22px; }' +
' .eba-hero::after { width:200px; height:200px; right:-60px; top:-70px; }' +
' .eba-hero h1 { font-size:clamp(30px,8vw,42px); }' +
' .eba-hero .sub { margin-top:10px; font-size:13.5px; }' +
' .eba-hero-right { width:100%; align-items:stretch; justify-content:space-between; }' +
' .eba-herostat { flex:1; min-width:0; padding:12px 16px; border-radius:18px; text-align:left; }' +
' .eba-herostat b { font-size:32px; }' +
' .eba-langs { align-self:flex-start; }' +
' .eba-stats { grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }' +
' .eba-stat { padding:14px 16px; border-radius:18px; }' +
' .eba-stat .lb { font-size:11.5px; }' +
' .eba-stat b { font-size:28px; margin:6px 0 3px; }' +
' .eba-stat .cap { font-size:10.5px; }' +
' .eba-panel { padding:18px 16px; border-radius:22px; }' +
' .eba-panel h2 { margin-bottom:14px; font-size:clamp(24px,6.4vw,30px); }' +
' .eba-panelhead { flex-wrap:wrap; }' +
' .eba-cta { flex-wrap:wrap; padding:18px; border-radius:18px; }' +
' .eba-cta h3 { font-size:26px; }' +
' .eba-row { padding:13px 14px; border-radius:16px; }' +
' .eba-cell { border-radius:16px; }' +
'}' +

/* phone: the checks table stops being a table */
'@media (max-width:720px) {' +
' .eba-tablewrap { overflow-x:visible; }' +
' .eba-table, .eba-table tbody, .eba-table tr, .eba-table td { display:block; width:100%; }' +
' .eba-table thead { display:none; }' +
' .eba-table tr { background:var(--wash); border-radius:18px; padding:12px 14px; margin-bottom:10px; }' +
' .eba-table tbody tr:hover td { background:transparent; }' +
' .eba-table td { display:flex; align-items:center; justify-content:space-between; gap:14px;' +
'   border-top:0; padding:5px 0; color:var(--ink); text-align:right !important; border-radius:0 !important; }' +
' .eba-table td::before { content:attr(data-label); flex-shrink:0; font-size:9.5px; letter-spacing:.16em;' +
'   text-transform:uppercase; color:var(--sand); }' +
' .eba-table td:not([data-label]) { justify-content:flex-end; padding-top:10px; }' +
' .eba-table td:not([data-label])::before { content:none; }' +
' .eba-clip { max-width:none; }' +
'}' +

/* small phone */
'@media (max-width:560px) {' +
' .eba-formrow, .eba-formrow.even { grid-template-columns:minmax(0,1fr); }' +
' .eba-cells { grid-template-columns:minmax(0,1fr); }' +
' .eba-who { flex:1 1 100%; min-width:0; }' +
' .eba-amt { margin-left:auto; font-size:16px; }' +
' .eba-rowbtns { flex:1 1 100%; }' +
' .eba-rowbtns .eba-btn { flex:1; min-height:36px; }' +
' .eba-search { flex:1 1 100%; }' +
' .eba-select { flex:1; }' +
' .eba-btn { padding:10px 16px; }' +
' .eba-actions .eba-btn { flex:1; }' +
'}' +
'@media (max-width:380px) {' +
' .eba-hero-right { flex-direction:column; gap:12px; }' +
' .eba-langs { align-self:stretch; }' +
' .eba-langs button { flex:1; }' +
'}' +
'@media (display-mode:standalone) { .eba-shell { padding-top:max(12px, env(safe-area-inset-top)); } }' +
'@media (prefers-reduced-motion:reduce) { .eba * { transition:none !important; } }' +
'@media print { .no-print, .eba-top, .eba-rail, .eba-mhead, .eba-tabs, .eba-sheet { display:none !important; } .eba { background:#fff; } .eba-shell { display:block; padding:0; }' +
' .eba-panel, .eba-hero { box-shadow:none; padding:0; } }';

/* ============================================================ */
export default function AdminShell(props) {
  const admin = props.admin;
  const [ownLang, setOwnLang] = useState(props.lang || 'en');
  const lang = props.lang || ownLang;
  const t = T[lang] || T.en;

  // Which menu is open: 'top:payments', 'rail:lives', 'sheet:more', 'top:account'... or null.
  const [open, setOpen] = useState(null);
  function toggle(id) { setOpen(function (cur) { return cur === id ? null : id; }); }

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
      if (!e.target.closest || !e.target.closest('[data-eba-pop]')) setOpen(null);
    }
    function esc(e) { if (e.key === 'Escape') setOpen(null); }
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return function () {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  // Home screen app: manifest + iPhone tags + offline screen.
  useEffect(function () {
    installAppTags();
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  const avatarUrl = admin?.avatar_url || admin?.picture || admin?.avatar || null;
  // ---- the menu, grouped. Add a page to a section and every layout shows it. ----
  const SECTIONS = [
    { key: 'payments', label: t.secPayments, icon: <IconWallet />, items: [
      { key: 'payment-links', href: '/admin/payment-links', label: t.paymentLinks, icon: <IconLink /> },
      { key: 'sezzle', href: '/admin/sezzle', label: t.sezzle, icon: <IconSezzle /> },
      { key: 'card-terminal', href: '/admin/clover-terminal', label: t.cardTerminal, icon: <IconTerminal /> },
      { key: 'stripe-terminal', href: '/admin/stripe-terminal', label: t.stripeTerminal, icon: <IconCard /> },
      { key: 'receipts', href: '/admin/receipts', label: t.receipts, icon: <IconReceipt /> },
    ] },
    { key: 'gifts', label: t.secGifts, icon: <IconGift />, items: [
      { key: 'gift-cards', href: '/admin/gift-cards', label: t.giftCards, icon: <IconGift /> },
      { key: 'gift-card-sales', href: '/admin/gift-card-sales', label: t.giftCardSales, icon: <IconBag /> },
    ] },
    { key: 'lives', label: t.secLives, icon: <IconBroadcast />, items: [
      { key: 'live-link', href: '/admin/live-link', label: t.liveLink, icon: <IconBroadcast /> },
      { key: 'live-schedule', href: '/admin/live-schedule', label: t.liveSchedule, icon: <IconCalendar /> },
      { key: 'giveaway', href: '/admin/giveaway', label: t.giveaway, icon: <IconWheel /> },
    ] },
    { key: 'business', label: t.secBusiness, icon: <IconFolder />, items: [
      { key: 'checks', href: '/admin/checks', label: t.checks, icon: <IconCheck /> },
      { key: 'reminders', href: '/admin/reminders', label: t.reminders, icon: <IconBell /> },
      { key: 'documents', href: '/admin/documents', label: t.documents, icon: <IconFolder /> },
    ] },
    { key: 'shipping', label: t.shipping, icon: <IconTruck />, external: true, items: [
      { key: 'ship-orders', href: SHIP + '/orders', label: t.orders, icon: <IconBox />, external: true },
      { key: 'ship-home', href: SHIP, label: t.shipping, icon: <IconTruck />, external: true },
    ] },
  ];
  const accountNav = [
    { key: 'team', href: '/admin/team', label: t.team, icon: <IconUsers /> },
    { key: 'branding', href: '/admin/branding', label: t.branding, icon: <IconPalette /> },
    { key: 'integrations', href: '/admin/integrations', label: t.integrations, icon: <IconPlug /> },
    { key: 'settings', href: '/admin/settings', label: t.settings, icon: <IconGear /> },
    { key: 'help', href: '/admin/help', label: t.help, icon: <IconHelp /> },
  ];
  const isHome = props.active === 'overview';
  function sectionActive(sec) {
    return sec.items.some(function (it) { return it.key === props.active; });
  }
  const accountActive = accountNav.some(function (it) { return it.key === props.active; });
  const firstName = admin?.name?.split(' ')[0] || (admin?.email ? admin.email.split('@')[0] : '');

  function avatar() {
    return avatarUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="eba-avatar" />
    ) : (
      <span className="eba-avatar-fb">{initials(admin?.name || admin?.email)}</span>
    );
  }

  function pageLinks(items) {
    return items.map(function (it) {
      const on = props.active === it.key;
      return (
        <a key={it.key} href={it.href} role="menuitem" className={on ? 'on' : ''} aria-current={on ? 'page' : undefined}
          target={it.external ? '_blank' : undefined} rel={it.external ? 'noopener noreferrer' : undefined}>
          <span className="eba-chip">{it.icon}</span>
          <span>{it.label}</span>
          {it.external && <span className="ext"><IconExternal /></span>}
        </a>
      );
    });
  }

  function accountMenu() {
    return (
      <>
        <div className="eba-pop-head">
          <p className="n">{admin?.name || t.account}</p>
          <p className="e">{admin?.email}{admin?.role ? ' \u00b7 ' + admin.role : ''}</p>
        </div>
        {pageLinks(accountNav)}
        <div className="eba-pop-sep" />
        <button role="menuitem" onClick={logout}><span className="eba-chip"><IconLogout /></span>{t.logOut}</button>
      </>
    );
  }

  const sheetSection = open && open.indexOf('sheet:') === 0 ? open.slice(6) : null;
  const sheetSec = SECTIONS.find(function (s) { return s.key === sheetSection; });

  return (
    <main className="eba">
      <style>{shellCss}</style>

      <div className="eba-shell">
        {/* ===== computer: top bar ===== */}
        <header className="eba-top no-print" data-eba-pop>
          <a href="/admin" aria-label="Erendira&#8217;s Boutique admin home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SRC} alt="Erendira&#8217;s Boutique" className="eba-logo" />
          </a>
          <nav aria-label="Admin">
            <a href="/admin" className={'eba-tn' + (isHome ? ' on' : '')} aria-current={isHome ? 'page' : undefined}>{t.overview}</a>
            {SECTIONS.map(function (sec) {
              const id = 'top:' + sec.key;
              const isOpen = open === id;
              return (
                <div key={sec.key} className="eba-wrap">
                  <button type="button" className={'eba-tn' + (sectionActive(sec) ? ' on' : '') + (isOpen ? ' open' : '')}
                    aria-haspopup="menu" aria-expanded={isOpen} onClick={function () { toggle(id); }}>
                    {sec.label}<span className="car">{sec.external ? '\u2197' : '\u25BE'}</span>
                  </button>
                  {isOpen && <div className="eba-pop eba-drop" role="menu">{pageLinks(sec.items)}</div>}
                </div>
              );
            })}
          </nav>
          <div className="eba-wrap">
            <button type="button" className="eba-userpill" aria-haspopup="menu" aria-expanded={open === 'top:account'}
              onClick={function () { toggle('top:account'); }}>
              {avatar()}<span className="nm">{admin?.name || t.account}</span><IconChevron />
            </button>
            {open === 'top:account' && <div className="eba-pop eba-drop right" role="menu">{accountMenu()}</div>}
          </div>
        </header>

        {/* ===== iPad: slim icon rail ===== */}
        <aside className="eba-rail no-print" data-eba-pop aria-label="Admin">
          <a href="/admin" className="eba-brandmark" aria-label="Erendira&#8217;s Boutique admin home">EB</a>
          <a href="/admin" className={'eba-rb' + (isHome ? ' on' : '')} aria-current={isHome ? 'page' : undefined}>
            <span className="ic"><IconHome /></span>{t.home}
          </a>
          {SECTIONS.map(function (sec) {
            const id = 'rail:' + sec.key;
            const isOpen = open === id;
            return (
              <div key={sec.key} className="eba-wrap">
                <button type="button" className={'eba-rb' + (sectionActive(sec) ? ' on' : '') + (isOpen ? ' open' : '')}
                  aria-haspopup="menu" aria-expanded={isOpen} onClick={function () { toggle(id); }}>
                  <span className="ic">{sec.icon}</span>{sec.label}
                </button>
                {isOpen && (
                  <div className="eba-pop eba-fly" role="menu">
                    <p className="eba-pop-label">{sec.label}</p>
                    {pageLinks(sec.items)}
                  </div>
                )}
              </div>
            );
          })}
          <div className="eba-rail-fill" />
          <div className="eba-wrap">
            <button type="button" className={'eba-iconbtn' + (accountActive ? ' on' : '')} aria-label={t.account}
              aria-haspopup="menu" aria-expanded={open === 'rail:account'} onClick={function () { toggle('rail:account'); }}>
              {avatar()}
            </button>
            {open === 'rail:account' && <div className="eba-pop eba-fly up" role="menu">{accountMenu()}</div>}
          </div>
        </aside>

        {/* ===== phone: small header + bottom tabs ===== */}
        <div className="eba-mhead no-print" data-eba-pop>
          <a href="/admin" aria-label="Erendira&#8217;s Boutique admin home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SRC} alt="Erendira&#8217;s Boutique" className="eba-logo" />
          </a>
          <button type="button" className="eba-iconbtn" aria-label={t.account} onClick={function () { toggle('sheet:account'); }}>{avatar()}</button>
        </div>

        {open && open.indexOf('sheet:') === 0 && (
          <button type="button" className="eba-sheet-bg no-print" aria-label="Close" onClick={function () { setOpen(null); }} />
        )}
        {open && open.indexOf('sheet:') === 0 && (
          <div className="eba-pop eba-sheet no-print" data-eba-pop role="menu">
            <span className="eba-grab" />
            {sheetSection === 'account' ? (
              accountMenu()
            ) : sheetSection === 'more' ? (
              <>
                {SECTIONS.filter(function (s) { return s.key === 'business' || s.key === 'shipping'; }).map(function (sec) {
                  return (
                    <div key={sec.key}>
                      <p className="eba-pop-label">{sec.label}</p>
                      <div className="eba-sheet-grid">{pageLinks(sec.items)}</div>
                    </div>
                  );
                })}
                <p className="eba-pop-label">{t.account}</p>
                <div className="eba-sheet-grid">{pageLinks(accountNav)}</div>
              </>
            ) : sheetSec ? (
              <>
                <p className="eba-pop-label">{sheetSec.label}</p>
                <div className="eba-sheet-grid">{pageLinks(sheetSec.items)}</div>
              </>
            ) : null}
          </div>
        )}

        <nav className="eba-tabs no-print" data-eba-pop aria-label="Admin">
          <a href="/admin" className={'eba-tab' + (isHome ? ' on' : '')} aria-current={isHome ? 'page' : undefined}><IconHome />{t.home}</a>
          {SECTIONS.filter(function (s) { return s.key === 'payments' || s.key === 'gifts' || s.key === 'lives'; }).map(function (sec) {
            const id = 'sheet:' + sec.key;
            return (
              <button key={sec.key} type="button" className={'eba-tab' + (sectionActive(sec) ? ' on' : '') + (open === id ? ' open' : '')}
                aria-haspopup="menu" aria-expanded={open === id} onClick={function () { toggle(id); }}>
                {sec.icon}{sec.label}
              </button>
            );
          })}
          {(function () {
            const moreOn = SECTIONS.some(function (s) { return (s.key === 'business' || s.key === 'shipping') && sectionActive(s); }) || accountActive;
            return (
              <button type="button" className={'eba-tab' + (moreOn ? ' on' : '') + (open === 'sheet:more' ? ' open' : '')}
                aria-haspopup="menu" aria-expanded={open === 'sheet:more'} onClick={function () { toggle('sheet:more'); }}>
                <IconDots />{t.more}
              </button>
            );
          })()}
        </nav>

        <section className="eba-main">
          <div className="eba-hero">
            <div className="eba-hero-copy">
              {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
              <h1>{props.title}</h1>
              {props.subtitle && <p className="sub">{props.subtitle}</p>}
              {props.tip && <p className="tip no-print"><b>{props.tip.label}:</b> {props.tip.body}</p>}
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
