'use client';

// components/AdminShell.js
// Erendira's Boutique — Admin Studio shell ("Direction A: calm top bar")
//
// Cream canvas, white cards with hairline borders, one quiet top bar,
// a compact page header and a footer. Every admin page renders inside this.
//
// Props:
//   admin      { name, email, avatar_url, role }  — used for the profile menu
//   active     'overview' | 'payment-links' | 'sezzle' | 'card-terminal' | 'stripe-terminal' | 'receipts'
//              | 'gift-cards' | 'gift-card-sales'
//              | 'live-link' | 'live-schedule' | 'checks'
//              | 'reminders' | 'documents' | 'giveaway'
//              | 'team' | 'branding' | 'integrations' | 'settings' | 'help'  (profile menu pages)
//   lang       'en' | 'es'   (optional — omit and the shell manages it itself)
//   onLang     (l) => void   (optional — pass when the page owns lang state)
//   eyebrow    small line above the title ('ADMIN STUDIO' is no longer shown)
//   title      page title
//   subtitle   line under the title
//   heroStat   { label, value, caption }  — small number box at the header's right
//   tip        { label, body }            — one-line tip under the subtitle (optional)
//   actions    buttons for the header's right side (optional)
//   children   page content
//
// NAVIGATION (changes with screen size, nothing to set):
//   computer (1024px+)  top bar: menus, Search (Ctrl/⌘ K), + New, profile
//   phone/iPad (<1024)  small header + bottom tabs: Home, Sell, +, Gifts, More
// Pages are grouped in SECTIONS below. Add a page there and every layout gets it.
// Language (EN/ES) lives in the profile menu and the footer.

import { useEffect, useRef, useState } from 'react';

const LOGO_SRC = '/brand/logo.png';
const SHIP = 'https://ship.erendirasboutique.com';

const T = {
  en: {
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
    shippingPortal: 'Shipping portal',
    logOut: 'Log out',
    account: 'Account',
    home: 'Home',
    secSell: 'Sell',
    secGifts: 'Gift cards',
    giftsShort: 'Gifts',
    secLives: 'Lives',
    secBusiness: 'Business',
    more: 'More',
    team: 'Team & permissions',
    branding: 'Branding',
    integrations: 'Integrations',
    settings: 'Settings',
    help: 'Help',
    search: 'Search or jump to…',
    searchShort: 'Search',
    searchPlaceholder: 'Type a page name…',
    noResults: 'No page matches that.',
    create: 'New',
    createWhat: 'Create',
    newLink: 'Payment link',
    newSezzle: 'Sezzle link',
    newGift: 'Gift card',
    newCheck: 'Check',
    language: 'Language',
    close: 'Close',
    studio: "Erendira's Admin Studio",
  },
  es: {
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
    shippingPortal: 'Portal de envíos',
    logOut: 'Cerrar sesión',
    account: 'Cuenta',
    home: 'Inicio',
    secSell: 'Vender',
    secGifts: 'Tarjetas',
    giftsShort: 'Tarjetas',
    secLives: 'Lives',
    secBusiness: 'Negocio',
    more: 'Más',
    team: 'Equipo y permisos',
    branding: 'Marca',
    integrations: 'Integraciones',
    settings: 'Configuración',
    help: 'Ayuda',
    search: 'Buscar o ir a…',
    searchShort: 'Buscar',
    searchPlaceholder: 'Escribe el nombre de una página…',
    noResults: 'Ninguna página coincide.',
    create: 'Nuevo',
    createWhat: 'Crear',
    newLink: 'Enlace de pago',
    newSezzle: 'Enlace Sezzle',
    newGift: 'Tarjeta de regalo',
    newCheck: 'Cheque',
    language: 'Idioma',
    close: 'Cerrar',
    studio: 'Admin Studio de Erendira',
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
const IconSearch = function () { return (<Icon size={16}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></Icon>); };
const IconPlus = function () { return (<Icon size={16}><path d="M12 5v14M5 12h14" /></Icon>); };
const IconSell = function () { return (<Icon><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /></Icon>); };

/* ---------------- Design system ---------------- */
export const shellCss = '' +
/* tokens */
'.eba { --cream:#F5F3EF; --card:#FFFFFF; --wash:#FAF9F6; --sand:#8c775f; --soft:#efe8de; --taupe:#5f4e3d; --ink:#4a3d30; --mute:#7f6b55;' +
'  --line:#e6dccf; --hair:#efe8de; --accent:#5f4e3d; --accent-dark:#4a3d30; --warm:#8c775f; --ok:#4f6b45; --okbg:#eef1e6; --wait:#7f5a2a; --waitbg:#f6ecdc;' +
'  min-height:100vh; display:flex; flex-direction:column; background:var(--cream); color:var(--ink); overflow-x:clip;' +
'  font-family:var(--font-body); -webkit-font-smoothing:antialiased; }' +
'.eba * { box-sizing:border-box; }' +
'.eba a { color:inherit; text-decoration:none; }' +
'.eba button, .eba input, .eba select, .eba textarea { font-family:inherit; }' +
'.eba button { cursor:pointer; }' +
'.eba-display, .eba-head h1, .eba-panel h2, .eba-stat b, .eba-herostat b, .eba-cta h3 {' +
'  font-family:var(--font-heading); font-weight:400; letter-spacing:-0.01em; }' +
'.eba :focus-visible { outline:2px solid var(--warm); outline-offset:2px; border-radius:8px; }' +

/* ---------- top bar (computer) ---------- */
'.eba-top { display:none; }' +
'.eba-wrap { position:relative; }' +
'.eba-chip { width:28px; height:28px; border-radius:50%; background:var(--soft); color:var(--taupe); display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; }' +
'.eba-pop { background:var(--card); border:1px solid var(--line); border-radius:18px; padding:6px; box-shadow:0 18px 40px rgba(95,78,61,.14); }' +
'.eba-pop a, .eba-pop button { display:flex; align-items:center; gap:10px; width:100%; min-height:42px; padding:8px 10px; border:0; border-radius:12px; background:transparent;' +
'  text-align:left; font-size:14px; color:var(--ink); }' +
'.eba-pop a:hover, .eba-pop button:hover, .eba-pop a.on { background:var(--wash); }' +
'.eba-pop a.on .eba-chip { background:var(--accent); color:var(--cream); }' +
'.eba-pop .ext { margin-left:auto; opacity:.6; display:inline-flex; }' +
'.eba-pop-label { margin:10px 10px 4px; font-size:11px; letter-spacing:.14em; color:var(--mute); text-transform:uppercase; }' +
'.eba-pop-head { padding:8px 10px 10px; margin-bottom:4px; border-bottom:1px solid var(--line); display:flex; align-items:center; gap:10px; }' +
'.eba-pop-head .who { min-width:0; flex:1; }' +
'.eba-pop-head p { margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }' +
'.eba-pop-head .n { font-size:14px; color:var(--ink); }' +
'.eba-pop-head .e { font-size:12px; color:var(--mute); margin-top:2px; }' +
'.eba-pop-sep { border-top:1px solid var(--line); margin:6px 4px; }' +
'.eba-pop .eba-langrow { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:6px 10px; font-size:13px; color:var(--mute); }' +
'.eba-avatar, .eba-avatar-fb { width:36px; height:36px; border-radius:50%; flex-shrink:0; display:block; object-fit:cover; }' +
'.eba-avatar-fb { background:var(--accent); color:var(--cream); font-size:13px; display:flex; align-items:center; justify-content:center; }' +
'.eba-iconbtn { border:0; background:transparent; padding:0; border-radius:50%; }' +
'.eba-roundbtn { width:44px; height:44px; border-radius:50%; border:1px solid var(--line); background:var(--card); color:var(--taupe);' +
'  display:inline-flex; align-items:center; justify-content:center; }' +
'@media (min-width:1024px) {' +
' .eba-top { display:block; position:sticky; top:0; z-index:50; background:rgba(245,243,239,.92); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); border-bottom:1px solid var(--line); }' +
' .eba-topin { max-width:1240px; margin:0 auto; padding:10px 24px; display:flex; align-items:center; gap:18px; }' +
' .eba-top .eba-logo { width:104px; height:auto; display:block; }' +
' .eba-top nav { display:flex; gap:2px; flex:1; min-width:0; }' +
' .eba-tn { display:inline-flex; align-items:center; gap:6px; padding:9px 14px; border:0; border-radius:999px; background:transparent;' +
'   font-size:15px; color:var(--ink); white-space:nowrap; }' +
' .eba-tn:hover, .eba-tn.open { background:var(--soft); }' +
' .eba-tn.on { background:var(--accent); color:var(--cream); }' +
' .eba-tn svg { opacity:.7; }' +
' .eba-drop { position:absolute; top:calc(100% + 8px); left:0; min-width:250px; z-index:60; }' +
' .eba-drop.right { left:auto; right:0; }' +
' .eba-searchbtn { display:flex; align-items:center; gap:10px; height:40px; padding:0 12px 0 14px; min-width:210px; border:1px solid var(--line);' +
'   border-radius:999px; background:var(--card); color:var(--mute); font-size:14px; }' +
' .eba-searchbtn kbd { margin-left:auto; font-family:inherit; font-size:11px; border:1px solid var(--line); border-radius:6px; padding:1px 6px; }' +
' .eba-newbtn { display:inline-flex; align-items:center; gap:6px; height:40px; padding:0 16px; border:0; border-radius:999px; background:var(--warm); color:#fff; font-size:14px; }' +
' .eba-newbtn:hover { background:var(--accent); }' +
'}' +
'@media (min-width:1024px) and (max-width:1199px) { .eba-searchbtn { min-width:0; width:40px; padding:0; justify-content:center; } .eba-searchbtn .lbl, .eba-searchbtn kbd { display:none; } .eba-tn { padding:9px 10px; } .eba-topin { gap:12px; } }' +

/* ---------- phone + iPad ---------- */
'.eba-mhead { display:flex; align-items:center; gap:10px; padding:10px 16px; border-bottom:1px solid var(--line); background:var(--cream); }' +
'.eba-mhead .eba-logo { width:92px; height:auto; display:block; }' +
'.eba-mhead .sp { flex:1; }' +
'.eba-tabs { position:fixed; left:0; right:0; bottom:0; z-index:72; display:flex; align-items:flex-start; justify-content:space-around;' +
'  background:var(--card); border-top:1px solid var(--line); padding:8px 6px max(10px, env(safe-area-inset-bottom)); }' +
'.eba-tab { flex:1; min-width:0; max-width:90px; min-height:48px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;' +
'  border:0; background:transparent; border-radius:14px; font-size:11px; color:var(--mute); }' +
'.eba-tab svg { width:22px; height:22px; }' +
'.eba-tab.on { color:var(--taupe); }' +
'.eba-tab.on svg { color:var(--taupe); }' +
'.eba-tab.open { background:var(--soft); color:var(--taupe); }' +
'.eba-tabnew { width:54px; height:54px; margin-top:-20px; border:0; border-radius:50%; background:var(--warm); color:#fff; display:flex; align-items:center; justify-content:center;' +
'  box-shadow:0 8px 20px rgba(95,78,61,.3); flex-shrink:0; }' +
'.eba-tabnew svg { width:22px; height:22px; }' +
'.eba-sheet-bg { position:fixed; inset:0; z-index:70; background:rgba(60,48,36,.28); border:0; }' +
'.eba-sheet { position:fixed; left:0; right:0; bottom:0; z-index:71; max-height:84vh; overflow:auto; border-radius:26px 26px 0 0 !important;' +
'  padding:10px 14px calc(96px + env(safe-area-inset-bottom)) !important; background:var(--cream) !important; }' +
'.eba-grab { display:block; width:40px; height:5px; border-radius:5px; background:#cfbda9; margin:2px auto 10px; }' +
'.eba-sheet-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }' +
'.eba-sheet-grid a, .eba-sheet-grid button { background:var(--card); border:1px solid var(--hair) !important; min-height:52px; }' +
'.eba-sheet .eba-pop-head { background:var(--card); border:1px solid var(--hair); border-radius:16px; margin-bottom:8px; }' +
'@media (min-width:1024px) { .eba-mhead, .eba-tabs, .eba-sheet, .eba-sheet-bg { display:none !important; } }' +

/* ---------- search / jump ---------- */
'.eba-cmd-bg { position:fixed; inset:0; z-index:90; background:rgba(60,48,36,.3); border:0; }' +
'.eba-cmd { position:fixed; z-index:91; left:50%; top:12vh; transform:translateX(-50%); width:min(560px, calc(100vw - 24px)); max-height:70vh;' +
'  display:flex; flex-direction:column; background:var(--card); border:1px solid var(--line); border-radius:20px; box-shadow:0 24px 60px rgba(60,48,36,.25); overflow:hidden; }' +
'.eba-cmd label { display:flex; align-items:center; gap:10px; padding:14px 16px; border-bottom:1px solid var(--line); color:var(--mute); }' +
'.eba-cmd input { flex:1; border:0; outline:0; font-size:16px; color:var(--ink); background:transparent; }' +
'.eba-cmd ul { list-style:none; margin:0; padding:6px; overflow:auto; }' +
'.eba-cmd li a { display:flex; align-items:center; gap:10px; padding:10px; border-radius:12px; font-size:15px; }' +
'.eba-cmd li a.hi, .eba-cmd li a:hover { background:var(--wash); }' +
'.eba-cmd li .sec { margin-left:auto; font-size:12px; color:var(--mute); }' +
'.eba-cmd .none { padding:18px; text-align:center; color:var(--mute); font-size:14px; }' +

/* ---------- page ---------- */
'.eba-main { width:100%; max-width:1240px; margin:0 auto; padding:28px 24px 56px; min-width:0; display:grid; gap:20px; flex:1; align-content:start; }' +
'.eba-head { display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:14px 20px; }' +
'.eba-head-copy { min-width:0; flex:1 1 380px; }' +
'.eba-head .eyebrow { margin:0 0 6px; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--mute); }' +
'.eba-head h1 { margin:0; font-size:clamp(30px,3.6vw,46px); line-height:1.05; color:var(--taupe); }' +
'.eba-head .sub { margin:8px 0 0; font-size:15px; color:var(--mute); }' +
'.eba-head .tip { margin:6px 0 0; font-size:13px; line-height:1.5; color:var(--mute); max-width:640px; }' +
'.eba-head .tip b { font-weight:400; color:var(--taupe); }' +
'.eba-head-right { display:flex; flex-wrap:wrap; align-items:center; gap:10px; }' +
'.eba-herostat { display:flex; align-items:baseline; gap:8px; background:var(--card); border:1px solid var(--hair); border-radius:999px; padding:7px 16px; }' +
'.eba-herostat b { font-size:22px; line-height:1; color:var(--taupe); }' +
'.eba-herostat .lb { font-size:13px; color:var(--mute); }' +
'.eba-langs { display:inline-flex; border:1px solid var(--line); border-radius:999px; overflow:hidden; background:var(--card); }' +
'.eba-langs button { border:0; background:transparent; padding:6px 12px; font-size:12px; letter-spacing:.08em; color:var(--taupe); min-height:32px; }' +
'.eba-langs button.on { background:var(--accent); color:var(--cream); }' +

/* footer */
'.eba-foot { border-top:1px solid var(--line); }' +
'.eba-footin { max-width:1240px; margin:0 auto; padding:18px 24px; display:flex; flex-wrap:wrap; align-items:center; gap:10px 18px; font-size:13px; color:var(--mute); }' +
'.eba-foot .brand { font-family:var(--font-heading); font-size:16px; color:var(--taupe); }' +
'.eba-foot a:hover { color:var(--taupe); text-decoration:underline; }' +
'.eba-foot .sp { flex:1; }' +

/* stat cards */
'.eba-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; }' +
'.eba-stat { background:var(--card); border:1px solid var(--hair); border-radius:20px; padding:16px 18px; text-align:left; display:block; transition:border-color .16s ease; }' +
'button.eba-stat:hover { border-color:var(--line); }' +
'.eba-stat .lb { display:block; font-size:13px; color:var(--mute); }' +
'.eba-stat b { display:block; font-size:30px; line-height:1.1; color:var(--taupe); margin:6px 0 2px; overflow-wrap:anywhere; }' +
'.eba-stat .cap { display:block; font-size:12px; color:var(--mute); }' +

/* panels */
'.eba-cols { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:20px; align-items:start; }' +
'.eba-cols.wide-left { grid-template-columns:minmax(0,1.6fr) minmax(0,1fr); }' +
'.eba-panel { background:var(--card); border:1px solid var(--hair); border-radius:24px; padding:22px 24px; min-width:0; }' +
'.eba-eyebrow { display:none; }' +
'.eba-panel h2 { margin:0 0 14px; font-size:clamp(22px,2vw,26px); line-height:1.15; color:var(--taupe); }' +
'.eba-panelhead { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }' +

/* buttons */
'.eba-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; border:1px solid var(--line); min-height:40px;' +
'  border-radius:999px; padding:9px 16px; font-size:14px; background:var(--card); color:var(--taupe); }' +
'.eba-btn:hover { background:var(--wash); }' +
'.eba-btn-dark { background:var(--accent); border-color:var(--accent); color:var(--cream); }' +
'.eba-btn-dark:hover { background:var(--accent-dark); color:var(--cream); }' +
'.eba-btn.mini { min-height:34px; padding:6px 12px; font-size:13px; }' +
'.eba-btn:disabled { opacity:.5; cursor:not-allowed; }' +

/* cta */
'.eba-cta { display:flex; align-items:center; justify-content:space-between; gap:16px; width:100%; text-align:left;' +
'  background:var(--accent); color:var(--cream); border:0; border-radius:20px; padding:20px 22px; transition:background .16s ease; }' +
'.eba-cta:hover { background:var(--accent-dark); }' +
'.eba-cta > span { min-width:0; }' +
'.eba-cta h3 { margin:0; font-size:clamp(22px,2vw,28px); line-height:1.1; overflow-wrap:anywhere; }' +
'.eba-cta h3, .eba-cta p, .eba-cta .go { color:inherit; }' +
'.eba a.eba-btn-dark, .eba a.eba-cta:not(.eba-cta-quiet) { color:var(--cream); }' +
'.eba-cta p { margin:6px 0 0; font-size:13px; opacity:.85; }' +
'.eba-cta .go { font-size:13px; white-space:nowrap; opacity:.9; }' +
'.eba-cta-quiet { background:var(--wash); color:var(--ink); border:1px solid var(--line); margin-top:14px; }' +
'.eba-cta-quiet:hover { background:var(--soft); }' +
'.eba-cta-quiet h3 { color:var(--taupe); }' +
'.eba-cta-quiet p { color:var(--mute); opacity:1; }' +
'.eba-cta-quiet .go { color:var(--taupe); }' +

/* form fields */
'.eba-lb { display:block; font-size:13px; color:var(--mute); margin:0 0 6px; }' +
'.eba-in { width:100%; border:1px solid var(--line); border-radius:12px; background:var(--wash); padding:11px 14px; min-height:44px;' +
'  font-size:15px; color:var(--ink); outline:0; }' +
'.eba-in:focus { border-color:var(--warm); background:var(--card); }' +
'.eba-in:disabled { color:var(--mute); opacity:.7; }' +
'.eba-in::placeholder { color:#a8947c; }' +
'textarea.eba-in { resize:vertical; }' +
'.eba-formrow { display:grid; grid-template-columns:minmax(0,1.6fr) minmax(0,1fr); gap:12px; }' +
'.eba-formrow.even { grid-template-columns:minmax(0,1fr) minmax(0,1fr); }' +
'.eba-field + .eba-field, .eba-formrow + .eba-field, .eba-field + .eba-formrow, .eba-formrow + .eba-formrow { margin-top:12px; }' +
'.eba-checks { display:flex; flex-wrap:wrap; gap:10px 18px; margin-top:16px; padding-top:16px; border-top:1px solid var(--hair); }' +
'.eba-check { display:flex; align-items:center; gap:8px; font-size:14px; color:var(--ink); cursor:pointer; min-height:32px; }' +
'.eba-check input { accent-color:var(--accent); width:17px; height:17px; }' +
'.eba-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:18px; }' +
'.eba-select { appearance:none; border:1px solid var(--line); border-radius:999px; padding:9px 32px 9px 15px; min-height:40px;' +
'  background:var(--card) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'11\' height=\'11\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%235f4e3d\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 13px center;' +
'  color:var(--taupe); font-size:14px; outline:0; }' +
'.eba-search { display:flex; align-items:center; gap:9px; border:1px solid var(--line); border-radius:999px;' +
'  padding:0 16px; min-height:42px; background:var(--card); flex:1; min-width:200px; }' +
'.eba-search svg { color:var(--mute); flex-shrink:0; }' +
'.eba-search input { width:100%; border:0; outline:0; background:transparent; color:var(--ink); font-size:15px; }' +
'.eba-search input::placeholder { color:#a8947c; }' +
'.eba-toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:8px; }' +
'.eba-notice { margin-top:14px; background:var(--wash); border:1px solid var(--line); border-radius:14px; padding:11px 14px; font-size:14px; color:var(--taupe); }' +
'.eba-err { margin-top:14px; background:rgba(160,53,53,.07); border:1px solid rgba(160,53,53,.2); border-radius:14px; padding:11px 14px; font-size:14px; color:#8f3a3a; }' +
'.eba-muted { font-size:13px; color:var(--mute); }' +

/* rows */
'.eba-rows { display:grid; grid-template-columns:minmax(0,1fr); gap:0; }' +
'.eba-row { display:flex; flex-wrap:wrap; align-items:center; gap:8px 14px; width:100%; text-align:left;' +
'  background:transparent; border:0; border-top:1px solid var(--hair); border-radius:0; padding:13px 4px; color:inherit; font-size:inherit; }' +
'.eba-rows > :first-child.eba-row, .eba-rows > :first-child > .eba-row:first-child { border-top:0; }' +
'button.eba-row:hover, .eba-row.click:hover { background:var(--wash); }' +
'.eba-row.off { opacity:.55; }' +
'.eba-who { min-width:160px; flex:1; }' +
'.eba-who .n { display:block; font-size:15px; color:var(--ink); overflow:hidden; text-overflow:ellipsis; overflow-wrap:anywhere; }' +
'.eba-who .s { display:block; margin-top:2px; font-size:12.5px; color:var(--mute); overflow-wrap:anywhere; }' +
'.eba-amt { font-size:16px; color:var(--ink); white-space:nowrap; }' +
'.eba-rowbtns { display:flex; flex-wrap:wrap; gap:6px; }' +
'.eba-pill { border-radius:999px; padding:4px 10px; font-size:11px; letter-spacing:.06em; text-transform:uppercase;' +
'  white-space:nowrap; border:1px solid transparent; }' +
'.eba-pill.ok { background:var(--okbg); color:var(--ok); }' +
'.eba-pill.mid { background:var(--waitbg); color:var(--wait); }' +
'.eba-pill.off { background:var(--card); border-color:var(--line); color:var(--mute); }' +
'.eba-empty { padding:40px 18px; text-align:center; font-size:14px; color:var(--mute); background:var(--wash); border-radius:16px; }' +

/* detail cells */
'.eba-cells { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:10px; }' +
'.eba-cell { background:var(--wash); border:1px solid var(--hair); border-radius:16px; padding:12px 14px; font-size:13px; line-height:1.6; color:var(--mute); }' +
'.eba-cell .lb { display:block; font-size:12px; color:var(--mute); margin-bottom:4px; }' +
'.eba-cell b { color:var(--ink); font-weight:400; }' +

/* table */
'.eba-tablewrap { overflow-x:auto; }' +
'.eba-table { width:100%; border-collapse:collapse; font-size:14px; }' +
'.eba-table th { text-align:left; font-weight:400; font-size:12px; color:var(--mute); padding:0 12px 10px; }' +
'.eba-table td { padding:12px; color:var(--mute); border-top:1px solid var(--hair); }' +
'.eba-table tbody tr:hover td { background:var(--wash); }' +
'.eba-table td:first-child { color:var(--ink); }' +
'.eba-table td:last-child { text-align:right; }' +
'.eba-clip { max-width:230px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }' +

/* responsive */
'@media (max-width:1100px) { .eba-cols, .eba-cols.wide-left { grid-template-columns:minmax(0,1fr); } }' +
'@media (max-width:1023px) {' +
' .eba-main { padding:18px 16px calc(110px + env(safe-area-inset-bottom)); gap:16px; }' +
' .eba-foot { display:none; }' +
' .eba-head { align-items:flex-start; }' +
' .eba-head-copy { flex-basis:100%; }' +
' .eba-head h1 { font-size:clamp(28px,7.4vw,36px); }' +
' .eba-head .sub { font-size:14px; }' +
' .eba-head .tip { display:none; }' +
' .eba-head-right { width:100%; }' +
' .eba-stats { grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }' +
' .eba-stat { padding:12px 14px; border-radius:16px; }' +
' .eba-stat b { font-size:24px; }' +
' .eba-stat .cap { display:none; }' +
' .eba-panel { padding:16px; border-radius:20px; }' +
' .eba-panelhead { flex-wrap:wrap; }' +
' .eba-cta { flex-wrap:wrap; padding:16px; border-radius:16px; }' +
'}' +
'@media (max-width:720px) {' +
' .eba-tablewrap { overflow-x:visible; }' +
' .eba-table, .eba-table tbody, .eba-table tr, .eba-table td { display:block; width:100%; }' +
' .eba-table thead { display:none; }' +
' .eba-table tr { background:var(--wash); border-radius:16px; padding:10px 14px; margin-bottom:8px; }' +
' .eba-table tbody tr:hover td { background:transparent; }' +
' .eba-table td { display:flex; align-items:center; justify-content:space-between; gap:14px;' +
'   border-top:0; padding:5px 0; color:var(--ink); text-align:right !important; }' +
' .eba-table td::before { content:attr(data-label); flex-shrink:0; font-size:12px; color:var(--mute); }' +
' .eba-table td:not([data-label]) { justify-content:flex-end; padding-top:10px; }' +
' .eba-table td:not([data-label])::before { content:none; }' +
' .eba-clip { max-width:none; }' +
'}' +
'@media (max-width:560px) {' +
' .eba-formrow, .eba-formrow.even { grid-template-columns:minmax(0,1fr); }' +
' .eba-cells { grid-template-columns:minmax(0,1fr); }' +
' .eba-who { flex:1 1 60%; min-width:0; }' +
' .eba-amt { margin-left:auto; }' +
' .eba-rowbtns { flex:1 1 100%; }' +
' .eba-rowbtns .eba-btn { flex:1; }' +
' .eba-search { flex:1 1 100%; }' +
' .eba-select { flex:1; }' +
' .eba-actions .eba-btn { flex:1; }' +
'}' +
'@media (display-mode:standalone) { .eba-mhead { padding-top:max(10px, env(safe-area-inset-top)); } }' +
'@media (prefers-reduced-motion:reduce) { .eba * { transition:none !important; } }' +
'@media print { .no-print, .eba-top, .eba-mhead, .eba-tabs, .eba-sheet, .eba-foot { display:none !important; } .eba { background:#fff; }' +
' .eba-main { padding:0; } .eba-panel { border:0; padding:0; } }';

/* ============================================================ */
export default function AdminShell(props) {
  const admin = props.admin;
  const [ownLang, setOwnLang] = useState(props.lang || 'en');
  const lang = props.lang || ownLang;
  const t = T[lang] || T.en;

  // Which menu is open: 'top:sell', 'top:new', 'top:account', 'sheet:more'... or null.
  const [open, setOpen] = useState(null);
  function toggle(id) { setOpen(function (cur) { return cur === id ? null : id; }); }

  // Search / jump to a page.
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQ, setCmdQ] = useState('');
  const [cmdHi, setCmdHi] = useState(0);
  const cmdInput = useRef(null);

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
    function keys(e) {
      if (e.key === 'Escape') { setOpen(null); setCmdOpen(false); }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen(null);
        setCmdOpen(function (v) { return !v; });
      }
    }
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', keys);
    return function () {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', keys);
    };
  }, []);

  useEffect(function () {
    if (cmdOpen) {
      setCmdQ('');
      setCmdHi(0);
      setTimeout(function () { if (cmdInput.current) cmdInput.current.focus(); }, 0);
    }
  }, [cmdOpen]);

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
    { key: 'payments', label: t.secSell, icon: <IconSell />, items: [
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
      { key: 'ship-orders', href: SHIP + '/orders', label: t.orders, icon: <IconBox />, external: true },
      { key: 'ship-home', href: SHIP, label: t.shippingPortal, icon: <IconTruck />, external: true },
    ] },
  ];
  const accountNav = [
    { key: 'team', href: '/admin/team', label: t.team, icon: <IconUsers /> },
    { key: 'branding', href: '/admin/branding', label: t.branding, icon: <IconPalette /> },
    { key: 'integrations', href: '/admin/integrations', label: t.integrations, icon: <IconPlug /> },
    { key: 'settings', href: '/admin/settings', label: t.settings, icon: <IconGear /> },
    { key: 'help', href: '/admin/help', label: t.help, icon: <IconHelp /> },
  ];
  const createNav = [
    { key: 'new-link', href: '/admin/payment-links?new=1', label: t.newLink, icon: <IconLink /> },
    { key: 'new-sezzle', href: '/admin/sezzle', label: t.newSezzle, icon: <IconSezzle /> },
    { key: 'new-gift', href: '/admin/gift-cards', label: t.newGift, icon: <IconGift /> },
    { key: 'new-check', href: '/admin/checks/new', label: t.newCheck, icon: <IconCheck /> },
  ];
  const isHome = props.active === 'overview';
  function sectionActive(sec) {
    return sec.items.some(function (it) { return it.key === props.active; });
  }
  const accountActive = accountNav.some(function (it) { return it.key === props.active; });

  // Every page, for Search / jump to.
  const allPages = [{ key: 'overview', href: '/admin', label: t.overview, icon: <IconHome />, sec: '' }]
    .concat(SECTIONS.reduce(function (list, sec) {
      return list.concat(sec.items.map(function (it) { return { ...it, sec: sec.label }; }));
    }, []))
    .concat(accountNav.map(function (it) { return { ...it, sec: t.account }; }))
    .concat(createNav.map(function (it) { return { ...it, sec: t.createWhat }; }));
  const cmdList = allPages.filter(function (p) {
    const q = cmdQ.trim().toLowerCase();
    return !q || (p.label + ' ' + p.sec).toLowerCase().includes(q);
  });
  function cmdKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCmdHi(function (i) { return Math.min(i + 1, cmdList.length - 1); }); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCmdHi(function (i) { return Math.max(i - 1, 0); }); }
    if (e.key === 'Enter' && cmdList[cmdHi]) {
      const p = cmdList[cmdHi];
      if (p.external) window.open(p.href, '_blank', 'noopener');
      else window.location.href = p.href;
    }
  }

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

  function langSwitch() {
    return (
      <div className="eba-langs" role="group" aria-label={t.language}>
        {['en', 'es'].map(function (l) {
          return (
            <button key={l} type="button" className={lang === l ? 'on' : ''} aria-pressed={lang === l} onClick={function () { setLang(l); }}>
              {l.toUpperCase()}
            </button>
          );
        })}
      </div>
    );
  }

  function profileHead() {
    return (
      <div className="eba-pop-head">
        {avatar()}
        <div className="who">
          <p className="n">{admin?.name || t.account}</p>
          <p className="e">{admin?.email}{admin?.role ? ' · ' + admin.role : ''}</p>
        </div>
      </div>
    );
  }

  function accountMenu() {
    return (
      <>
        {profileHead()}
        {pageLinks(accountNav)}
        <div className="eba-langrow"><span>{t.language}</span>{langSwitch()}</div>
        <div className="eba-pop-sep" />
        <button type="button" role="menuitem" onClick={logout}><span className="eba-chip"><IconLogout /></span>{t.logOut}</button>
      </>
    );
  }

  const sheetSection = open && open.indexOf('sheet:') === 0 ? open.slice(6) : null;
  const sheetSec = SECTIONS.find(function (s) { return s.key === sheetSection; });
  const moreOn = SECTIONS.some(function (s) { return (s.key === 'lives' || s.key === 'business') && sectionActive(s); }) || accountActive;
  const sellSec = SECTIONS[0];
  const giftSec = SECTIONS[1];
  const eyebrow = props.eyebrow && String(props.eyebrow).toUpperCase() !== 'ADMIN STUDIO' ? props.eyebrow : null;

  return (
    <main className="eba">
      <style>{shellCss}</style>

      {/* ===== computer: top bar ===== */}
      <header className="eba-top no-print" data-eba-pop>
        <div className="eba-topin">
          <a href="/admin" aria-label="Erendira&#8217;s Boutique admin home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SRC} alt="Erendira&#8217;s Boutique" className="eba-logo" />
          </a>
          <nav aria-label="Admin">
            <a href="/admin" className={'eba-tn' + (isHome ? ' on' : '')} aria-current={isHome ? 'page' : undefined}>{t.home}</a>
            {SECTIONS.map(function (sec) {
              const id = 'top:' + sec.key;
              const isOpen = open === id;
              return (
                <div key={sec.key} className="eba-wrap">
                  <button type="button" className={'eba-tn' + (sectionActive(sec) ? ' on' : '') + (isOpen ? ' open' : '')}
                    aria-haspopup="menu" aria-expanded={isOpen} onClick={function () { toggle(id); }}>
                    {sec.label}<IconChevron />
                  </button>
                  {isOpen && <div className="eba-pop eba-drop" role="menu">{pageLinks(sec.items)}</div>}
                </div>
              );
            })}
          </nav>
          <button type="button" className="eba-searchbtn" aria-label={t.search} onClick={function () { setOpen(null); setCmdOpen(true); }}>
            <IconSearch /><span className="lbl">{t.search}</span><kbd>{'⌘'}K</kbd>
          </button>
          <div className="eba-wrap">
            <button type="button" className="eba-newbtn" aria-haspopup="menu" aria-expanded={open === 'top:new'} onClick={function () { toggle('top:new'); }}>
              <IconPlus />{t.create}
            </button>
            {open === 'top:new' && <div className="eba-pop eba-drop right" role="menu">{pageLinks(createNav)}</div>}
          </div>
          <div className="eba-wrap">
            <button type="button" className="eba-iconbtn" aria-label={t.account + (admin?.name ? ': ' + admin.name : '')} aria-haspopup="menu"
              aria-expanded={open === 'top:account'} onClick={function () { toggle('top:account'); }}>
              {avatar()}
            </button>
            {open === 'top:account' && <div className="eba-pop eba-drop right" role="menu" style={{ minWidth: 280 }}>{accountMenu()}</div>}
          </div>
        </div>
      </header>

      {/* ===== phone + iPad: small header ===== */}
      <div className="eba-mhead no-print">
        <a href="/admin" aria-label="Erendira&#8217;s Boutique admin home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} alt="Erendira&#8217;s Boutique" className="eba-logo" />
        </a>
        <span className="sp" />
        <button type="button" className="eba-roundbtn" aria-label={t.searchShort} onClick={function () { setOpen(null); setCmdOpen(true); }}><IconSearch /></button>
        <button type="button" className="eba-iconbtn" aria-label={t.account} data-eba-pop onClick={function () { toggle('sheet:more'); }}>{avatar()}</button>
      </div>

      {sheetSection && (
        <button type="button" className="eba-sheet-bg no-print" aria-label={t.close} onClick={function () { setOpen(null); }} />
      )}
      {sheetSection && (
        <div className="eba-pop eba-sheet no-print" data-eba-pop role="menu">
          <span className="eba-grab" />
          {sheetSection === 'more' ? (
            <>
              {profileHead()}
              <div className="eba-langrow"><span>{t.language}</span>{langSwitch()}</div>
              {SECTIONS.filter(function (s) { return s.key === 'lives' || s.key === 'business'; }).map(function (sec) {
                return (
                  <div key={sec.key}>
                    <p className="eba-pop-label">{sec.label}</p>
                    <div className="eba-sheet-grid">{pageLinks(sec.items)}</div>
                  </div>
                );
              })}
              <p className="eba-pop-label">{t.account}</p>
              <div className="eba-sheet-grid">{pageLinks(accountNav)}</div>
              <div className="eba-pop-sep" />
              <button type="button" role="menuitem" onClick={logout}><span className="eba-chip"><IconLogout /></span>{t.logOut}</button>
            </>
          ) : sheetSection === 'new' ? (
            <>
              <p className="eba-pop-label">{t.createWhat}</p>
              <div className="eba-sheet-grid">{pageLinks(createNav)}</div>
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
        <button type="button" className={'eba-tab' + (sectionActive(sellSec) ? ' on' : '') + (open === 'sheet:payments' ? ' open' : '')}
          aria-haspopup="menu" aria-expanded={open === 'sheet:payments'} onClick={function () { toggle('sheet:payments'); }}>
          <IconSell />{t.secSell}
        </button>
        <button type="button" className="eba-tabnew" aria-label={t.createWhat} aria-haspopup="menu" aria-expanded={open === 'sheet:new'}
          onClick={function () { toggle('sheet:new'); }}>
          <IconPlus />
        </button>
        <button type="button" className={'eba-tab' + (sectionActive(giftSec) ? ' on' : '') + (open === 'sheet:gifts' ? ' open' : '')}
          aria-haspopup="menu" aria-expanded={open === 'sheet:gifts'} onClick={function () { toggle('sheet:gifts'); }}>
          <IconGift />{t.giftsShort}
        </button>
        <button type="button" className={'eba-tab' + (moreOn ? ' on' : '') + (open === 'sheet:more' ? ' open' : '')}
          aria-haspopup="menu" aria-expanded={open === 'sheet:more'} onClick={function () { toggle('sheet:more'); }}>
          <IconDots />{t.more}
        </button>
      </nav>

      {/* ===== Search / jump to ===== */}
      {cmdOpen && <button type="button" className="eba-cmd-bg no-print" aria-label={t.close} onClick={function () { setCmdOpen(false); }} />}
      {cmdOpen && (
        <div className="eba-cmd no-print" role="dialog" aria-label={t.searchShort}>
          <label>
            <IconSearch />
            <input ref={cmdInput} value={cmdQ} placeholder={t.searchPlaceholder} aria-label={t.searchShort}
              onChange={function (e) { setCmdQ(e.target.value); setCmdHi(0); }} onKeyDown={cmdKey} />
          </label>
          {cmdList.length ? (
            <ul>
              {cmdList.map(function (p, i) {
                return (
                  <li key={p.key}>
                    <a href={p.href} className={i === cmdHi ? 'hi' : ''} onMouseEnter={function () { setCmdHi(i); }}
                      target={p.external ? '_blank' : undefined} rel={p.external ? 'noopener noreferrer' : undefined}>
                      <span className="eba-chip">{p.icon}</span>{p.label}<span className="sec">{p.sec}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="none">{t.noResults}</p>
          )}
        </div>
      )}

      <section className="eba-main">
        <header className="eba-head">
          <div className="eba-head-copy">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1>{props.title}</h1>
            {props.subtitle && <p className="sub">{props.subtitle}</p>}
            {props.tip && <p className="tip no-print"><b>{props.tip.label}:</b> {props.tip.body}</p>}
          </div>
          {(props.heroStat || props.actions) && (
            <div className="eba-head-right no-print">
              {props.heroStat && (
                <div className="eba-herostat" title={props.heroStat.caption || undefined}>
                  <b>{props.heroStat.value}</b>
                  <span className="lb">{props.heroStat.caption || props.heroStat.label}</span>
                </div>
              )}
              {props.actions}
            </div>
          )}
        </header>

        {props.children}
      </section>

      <footer className="eba-foot no-print">
        <div className="eba-footin">
          <span className="brand">{t.studio}</span>
          <a href="/admin/help">{t.help}</a>
          <a href={SHIP} target="_blank" rel="noopener noreferrer">{t.shippingPortal} {'↗'}</a>
          <span className="sp" />
          {langSwitch()}
          <span>{'©'} {new Date().getFullYear()} Erendira&#8217;s Boutique</span>
        </div>
      </footer>
    </main>
  );
}
