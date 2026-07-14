'use client';
 
import { useEffect, useMemo, useRef, useState } from 'react';
import { money, formatDate, formatAddress, paymentMethodLabel } from '@/lib/format';
 
/* ============================================================
   Erendira's Boutique — Billing Dashboard (Admin Studio)
   Redesign of components/AdminDashboard.js
   Same props as before: <AdminDashboard payments={...} admin={...} />
   Same endpoints: /api/admin/clover-sync, /api/admin/payment-notes,
   /api/auth/logout. Fonts inherit from the global stylesheet.
   Requires /public/logo2.png (light version, shown on taupe).
   ============================================================ */
 
function stripeUrl(kind, id) {
  if (!id) return '';
  if (kind === 'customer') return 'https://dashboard.stripe.com/customers/' + id;
  if (kind === 'payment') return 'https://dashboard.stripe.com/payments/' + id;
  if (kind === 'link') return 'https://dashboard.stripe.com/payment-links/' + id;
  return '';
}
 
function orderStatus(payment) {
  if (payment.refund_status === 'refunded') return 'refunded';
  if (payment.delivered_at) return 'delivered';
  if (payment.tracking_number) return 'shipped';
  if (payment.payment_status === 'paid') return 'paid';
  return payment.payment_status || 'unknown';
}
 
function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(function (w) { return w[0]; })
    .join('')
    .toUpperCase();
}
 
/* ---------------- Translations ---------------- */
const T = {
  en: {
    eyebrow: "ERENDIRA'S BOUTIQUE \u00b7 ADMIN STUDIO",
    totalRevenue: 'Total revenue',
    filteredRevenue: 'Filtered revenue',
    payments: 'payments',
    customers: 'customers',
    stripeClover: 'Stripe / Clover',
    dashboard: 'Dashboard',
    overview: 'Overview',
    reports: 'Reports',
    settings: 'Settings',
    paymentLinks: 'Payment Links',
    giftCards: 'Gift Cards',
    orders: 'Orders',
    shipping: 'Shipping',
    shippingPortal: 'Shipping portal',
    managePaymentLinks: 'Create and share links',
    manageGiftCards: 'Balances and codes',
    search: 'Search name, email, phone, amount...',
    allStatuses: 'All statuses',
    allSources: 'All sources',
    paid: 'Paid',
    shipped: 'Shipped',
    delivered: 'Delivered',
    refunded: 'Refunded',
    unpaid: 'Unpaid',
    unknown: 'Unknown',
    syncClover: 'Sync Clover',
    syncingClover: 'Syncing Clover payments...',
    syncedClover: 'Clover synced: ',
    syncFailed: 'Could not sync Clover.',
    paymentWord: 'payment(s).',
    exportCsv: 'Export CSV',
    print: 'Print',
    today: 'Today',
    order: 'order',
    ordersWord: 'orders',
    noPayments: 'No payments match these filters.',
    logOut: 'Log out',
    customer: 'Customer',
    shippingAddress: 'Shipping address',
    payment: 'Payment',
    customerTotals: 'Customer totals',
    lifetime: 'Lifetime',
    statusWord: 'Status',
    refundWord: 'Refund',
    openReceipt: 'Open Receipt',
    stripeCustomer: 'Stripe Customer',
    stripePayment: 'Stripe Payment',
    paymentLink: 'Payment Link',
    notesPlaceholder: 'Write private notes for this payment...',
    saveNotes: 'Save Notes',
    savingNote: 'Saving note...',
    saved: 'Saved.',
    saveFailed: 'Could not save note.',
    boutiquePurchase: 'Boutique purchase',
    noEmail: 'No email',
  },
  es: {
    eyebrow: "ERENDIRA'S BOUTIQUE \u00b7 ADMIN STUDIO",
    totalRevenue: 'Ingresos totales',
    filteredRevenue: 'Ingresos filtrados',
    payments: 'pagos',
    customers: 'clientas',
    stripeClover: 'Stripe / Clover',
    dashboard: 'Panel',
    overview: 'Resumen',
    reports: 'Reportes',
    settings: 'Configuración',
    paymentLinks: 'Enlaces de Pago',
    giftCards: 'Tarjetas de Regalo',
    orders: 'Pedidos',
    shipping: 'Env\u00edos',
    shippingPortal: 'Portal de env\u00edos',
    managePaymentLinks: 'Crear y compartir enlaces',
    manageGiftCards: 'Saldos y c\u00f3digos',
    search: 'Buscar nombre, correo, tel\u00e9fono, monto...',
    allStatuses: 'Todos los estados',
    allSources: 'Todas las fuentes',
    paid: 'Pagado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    refunded: 'Reembolsado',
    unpaid: 'Sin pagar',
    unknown: 'Desconocido',
    syncClover: 'Sincronizar Clover',
    syncingClover: 'Sincronizando pagos de Clover...',
    syncedClover: 'Clover sincronizado: ',
    syncFailed: 'No se pudo sincronizar Clover.',
    paymentWord: 'pago(s).',
    exportCsv: 'Exportar CSV',
    print: 'Imprimir',
    today: 'Hoy',
    order: 'pedido',
    ordersWord: 'pedidos',
    noPayments: 'Ning\u00fan pago coincide con estos filtros.',
    logOut: 'Cerrar sesi\u00f3n',
    customer: 'Clienta',
    shippingAddress: 'Direcci\u00f3n de env\u00edo',
    payment: 'Pago',
    customerTotals: 'Totales de la clienta',
    lifetime: 'Hist\u00f3rico',
    statusWord: 'Estado',
    refundWord: 'Reembolso',
    openReceipt: 'Abrir Recibo',
    stripeCustomer: 'Cliente en Stripe',
    stripePayment: 'Pago en Stripe',
    paymentLink: 'Enlace de Pago',
    notesPlaceholder: 'Escribe notas privadas para este pago...',
    saveNotes: 'Guardar Notas',
    savingNote: 'Guardando nota...',
    saved: 'Guardado.',
    saveFailed: 'No se pudo guardar la nota.',
    boutiquePurchase: 'Compra de boutique',
    noEmail: 'Sin correo',
  },
};
 
const dateLocale = { en: 'en-US', es: 'es-MX' };
 
/* ---------------- Icons (inline SVG) ---------------- */
function Icon(props) {
  return (
    <svg
      width={props.size || 20}
      height={props.size || 20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {props.children}
    </svg>
  );
}
 
const IconLink = function () {
  return (
    <Icon>
      <path d="M9 15l6-6" />
      <path d="M11 6l.5-.5a4.95 4.95 0 017 7L18 13" />
      <path d="M13 18l-.5.5a4.95 4.95 0 01-7-7L6 11" />
    </Icon>
  );
};
const IconGift = function () {
  return (
    <Icon>
      <path d="M3 9h18v3H3z" />
      <path d="M12 9v12" />
      <path d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" />
      <path d="M7.5 9a2.5 2.5 0 010-5C11 4 12 9 12 9s1-5 4.5-5a2.5 2.5 0 010 5" />
    </Icon>
  );
};
const IconBox = function () {
  return (
    <Icon>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M12 12l8-4.5" />
      <path d="M12 12v9" />
      <path d="M12 12L4 7.5" />
    </Icon>
  );
};
const IconTruck = function () {
  return (
    <Icon>
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path d="M5 17H3V6a1 1 0 011-1h9v12M9 17h6M15 8h4l2 3v6h-2" />
    </Icon>
  );
};
const IconExternal = function () {
  return (
    <Icon size={12}>
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </Icon>
  );
};
const IconSearch = function () {
  return (
    <Icon size={16}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </Icon>
  );
};
const IconChevronDown = function () {
  return (
    <Icon size={14}>
      <path d="M6 9l6 6 6-6" />
    </Icon>
  );
};
 
/* ---------------- Styles ---------------- */
var css = '' +
'.ebd { min-height: 100vh; background: #f5f3ef; color: #3d3128; }' +
'.ebd * { box-sizing: border-box; }' +
'.ebd a { color: inherit; text-decoration: none; }' +
'.ebd button, .ebd input, .ebd select, .ebd textarea { font-family: inherit; }' +
'.ebd button { cursor: pointer; }' +
'.ebd-shell { min-height: 100vh; display: grid; grid-template-columns: 238px minmax(0,1fr); }' +
'.ebd-sidebar { position: sticky; top: 0; height: 100vh; background: #fff; border-right: 1px solid #e7e1d8; padding: 22px 16px; display: flex; flex-direction: column; z-index: 30; }' +
'.ebd-brand { min-height: 88px; border-radius: 18px; background: #806a52; padding: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 22px; }' +
'.ebd-logo { width: 150px; height: auto; display: block; object-fit: contain; }' +
'.ebd-side-nav { display: grid; gap: 6px; }' +
'.ebd-side-link { display: flex; align-items: center; gap: 11px; padding: 11px 13px; border-radius: 12px; color: #6b5a4a; font-size: 14px; transition: background .15s ease, color .15s ease, transform .15s ease; }' +
'.ebd-side-link:hover { background: #f4f0ea; transform: translateX(2px); }' +
'.ebd-side-link.on { background: #806a52; color: #fff; }' +
'.ebd-side-icon { width: 20px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }' +
'.ebd-side-spacer { flex: 1; }' +
'.ebd-side-user { border-top: 1px solid #eee8df; padding-top: 16px; position: relative; }' +
'.ebd-userpill { width: 100%; display: flex; align-items: center; gap: 10px; border: 0; background: transparent; padding: 8px; border-radius: 12px; color: #54463b; text-align: left; }' +
'.ebd-userpill:hover { background: #f5f2ed; }' +
'.ebd-avatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; display: block; }' +
'.ebd-avatar-fb { width: 34px; height: 34px; border-radius: 50%; background: #d9cbbd; color: #6b5638; font-size: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }' +
'.ebd-usertext { min-width: 0; flex: 1; }' +
'.ebd-username, .ebd-useremail { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
'.ebd-username { font-size: 13px; color: #3d3128; }' +
'.ebd-useremail { font-size: 10px; color: #9b8a79; margin-top: 1px; }' +
'.ebd-menu { position: absolute; left: 0; bottom: calc(100% + 8px); z-index: 40; width: 100%; background: #fff; border: 1px solid #ddd5ca; border-radius: 14px; overflow: hidden; box-shadow: 0 14px 35px rgba(61,49,40,.14); }' +
'.ebd-menu-head { padding: 12px 14px; border-bottom: 1px solid #eee8df; }' +
'.ebd-menu-head p { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
'.ebd-menu-name { font-size: 13px; }' +
'.ebd-menu-email { font-size: 11px; color: #9b8a79; margin-top: 2px !important; }' +
'.ebd-menu button { width: 100%; border: 0; background: #fff; padding: 11px 14px; text-align: left; color: #6b5638; }' +
'.ebd-menu button:hover { background: #f5f2ed; }' +
'.ebd-main { min-width: 0; }' +
'.ebd-topbar { min-height: 78px; background: rgba(255,255,255,.92); border-bottom: 1px solid #e7e1d8; display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 16px 30px; position: sticky; top: 0; z-index: 20; backdrop-filter: blur(12px); }' +
'.ebd-welcome h1 { margin: 0; font-size: 22px; font-weight: 500; }' +
'.ebd-welcome p { margin: 3px 0 0; color: #9a8878; font-size: 12px; }' +
'.ebd-langs { display: flex; border: 1px solid #d8d0c6; border-radius: 999px; overflow: hidden; background: #f8f6f2; }' +
'.ebd-langs button { border: 0; background: transparent; padding: 7px 13px; font-size: 10px; letter-spacing: 1.5px; color: #806a52; }' +
'.ebd-langs button.on { background: #806a52; color: #fff; }' +
'.ebd-content { max-width: 1450px; margin: 0 auto; padding: 28px 30px 64px; }' +
'.ebd-stats { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 14px; margin-bottom: 22px; }' +
'.ebd-stat { min-height: 126px; background: #fff; border: 1px solid #e4ddd4; border-radius: 16px; padding: 18px; box-shadow: 0 8px 25px rgba(83,67,53,.035); }' +
'.ebd-stat.primary { background: #806a52; border-color: #806a52; color: #fff; }' +
'.ebd-stat-label { margin: 0; font-size: 11px; color: #988675; }' +
'.ebd-stat.primary .ebd-stat-label { color: #e7ddd2; }' +
'.ebd-stat-value { margin: 12px 0 0; font-size: clamp(28px,3vw,40px); line-height: 1; font-weight: 400; }' +
'.ebd-stat-note { margin: 10px 0 0; font-size: 11px; color: #9c8c7c; }' +
'.ebd-stat.primary .ebd-stat-note { color: #eadfd3; }' +
'.ebd-toolbar-card { background: #fff; border: 1px solid #e4ddd4; border-radius: 18px; padding: 14px; margin-bottom: 22px; box-shadow: 0 8px 25px rgba(83,67,53,.03); }' +
'.ebd-search { width: 100%; display: flex; align-items: center; gap: 9px; border: 1px solid #e2dbd1; border-radius: 12px; padding: 11px 13px; background: #fbfaf8; }' +
'.ebd-search svg { color: #a18e7b; flex-shrink: 0; }' +
'.ebd-search input { width: 100%; border: 0; outline: 0; background: transparent; color: #3d3128; font-size: 13px; }' +
'.ebd-search input::placeholder { color: #ad9c8d; }' +
'.ebd-toolbar-bottom { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; margin-top: 11px; }' +
'.ebd-select { appearance: none; min-width: 160px; border: 1px solid #e2dbd1; border-radius: 10px; padding: 9px 34px 9px 12px; background: #fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23806a52\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 12px center; color: #6b5638; font-size: 12px; outline: 0; }' +
'.ebd-actions { display: flex; gap: 8px; margin-left: auto; }' +
'.ebd-btn { border: 1px solid #ddd5cb; border-radius: 10px; padding: 9px 15px; font-size: 12px; background: #fff; color: #6b5638; }' +
'.ebd-btn:hover { background: #f6f2ed; }' +
'.ebd-btn-taupe { background: #806a52; border-color: #806a52; color: #fff; }' +
'.ebd-btn-taupe:hover { background: #6f5b46; }' +
'.ebd-notice { background: #fff; border: 1px solid #ddd5cb; border-radius: 12px; padding: 10px 14px; font-size: 12px; color: #806a52; margin-bottom: 16px; }' +
'.ebd-groupdate { margin: 20px 0 9px; font-size: 10px; text-transform: uppercase; letter-spacing: .22em; color: #a08a71; }' +
'.ebd-list { background: #fff; border: 1px solid #e4ddd4; border-radius: 16px; overflow: hidden; }' +
'.ebd-rowwrap { border-bottom: 1px solid #eee8df; }' +
'.ebd-rowwrap:last-child { border-bottom: 0; }' +
'.ebd-row { width: 100%; display: flex; align-items: center; gap: 12px; border: 0; background: #fff; padding: 13px 17px; text-align: left; }' +
'.ebd-row:hover { background: #fbf9f6; }' +
'.ebd-row-avatar { width: 38px; height: 38px; border-radius: 50%; background: #eee9e2; color: #806a52; font-size: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }' +
'.ebd-row-main { flex: 1; min-width: 0; }' +
'.ebd-row-name { display: block; font-size: 14px; color: #3d3128; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
'.ebd-row-meta { display: block; margin-top: 2px; font-size: 11px; color: #a08a71; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
'.ebd-badge { border-radius: 999px; padding: 4px 10px; font-size: 9px; letter-spacing: .06em; text-transform: uppercase; flex-shrink: 0; white-space: nowrap; }' +
'.ebd-badge-source { border: 1px solid #ddd5cb; color: #6b5638; background: #f8f5f0; }' +
'.ebd-badge-ok { background: #e7efe0; color: #3b5a2a; }' +
'.ebd-badge-bad { background: #f7e3e0; color: #a03535; }' +
'.ebd-badge-mid { background: #fff; border: 1px solid #d8d2c8; color: #806a52; }' +
'.ebd-row-amount { min-width: 92px; text-align: right; font-size: 16px; flex-shrink: 0; }' +
'.ebd-chev { color: #a08a71; flex-shrink: 0; }' +
'.ebd-detail { padding: 4px 17px 17px 67px; background: #fff; }' +
'.ebd-detail-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 10px; }' +
'.ebd-cell { background: #f5f2ed; border-radius: 12px; padding: 12px 13px; font-size: 12px; line-height: 1.55; }' +
'.ebd-cell .lb { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: .14em; color: #806a52; margin-bottom: 4px; }' +
'.ebd-detail-links { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }' +
'.ebd-detail-links a { border: 1px solid #ddd5cb; color: #806a52; border-radius: 999px; padding: 6px 12px; font-size: 10px; background: #fff; }' +
'.ebd-notes { margin-top: 10px; }' +
'.ebd-notes textarea { width: 100%; border: 1px solid #ddd5cb; border-radius: 12px; padding: 11px 12px; font-size: 12px; color: #3d3128; background: #fff; resize: vertical; outline: 0; }' +
'.ebd-empty { background: #fff; border: 1px solid #e4ddd4; border-radius: 16px; padding: 50px 20px; text-align: center; font-size: 13px; color: #a08a71; }' +
'@media (max-width: 1050px) { .ebd-shell { grid-template-columns: 190px minmax(0,1fr); } .ebd-stats { grid-template-columns: repeat(2,minmax(0,1fr)); } .ebd-content,.ebd-topbar { padding-left: 20px; padding-right: 20px; } }' +
'@media (max-width: 760px) { .ebd-shell { display: block; } .ebd-sidebar { position: static; height: auto; padding: 12px; border-right: 0; border-bottom: 1px solid #e7e1d8; } .ebd-brand { min-height: 64px; margin-bottom: 10px; } .ebd-logo { width: 132px; } .ebd-side-nav { display: flex; overflow-x: auto; padding-bottom: 2px; } .ebd-side-link { white-space: nowrap; padding: 9px 11px; } .ebd-side-spacer,.ebd-side-user { display: none; } .ebd-topbar { position: static; min-height: 68px; padding: 14px 16px; } .ebd-content { padding: 18px 14px 48px; } .ebd-welcome h1 { font-size: 19px; } .ebd-welcome p { display: none; } .ebd-stats { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 9px; } .ebd-stat { min-height: 105px; padding: 14px; } .ebd-stat-value { font-size: 26px; } .ebd-actions { width: 100%; margin-left: 0; } .ebd-actions .ebd-btn { flex: 1; } .ebd-select { flex: 1; min-width: 135px; } .ebd-row { flex-wrap: wrap; padding: 12px 13px; } .ebd-row-main { flex: 1 1 calc(100% - 52px); } .ebd-badge-source { margin-left: 50px; } .ebd-row-amount { margin-left: auto; min-width: 0; font-size: 15px; } .ebd-detail { padding: 4px 13px 15px; } }' +
'@media (max-width: 460px) { .ebd-stats { grid-template-columns: 1fr; } .ebd-stat { min-height: 96px; } .ebd-badge-source { display: none; } .ebd-row-main { flex-basis: calc(100% - 52px); } }' +
'@media print { .no-print { display: none !important; } .ebd-shell { display: block; } .ebd-content { padding: 0; } .ebd { background: #fff; } .ebd-list { border: 1px solid #999; } }';
 
/* ============================================================ */
export default function AdminDashboard({ payments, admin }) {
  const [lang, setLangState] = useState(admin?.language === 'es' ? 'es' : 'en');
  const t = T[lang];
 
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [notes, setNotes] = useState({});
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
 
  /* language: restore + persist */
  useEffect(function () {
    const saved = localStorage.getItem('eb-lang');
    if (saved === 'en' || saved === 'es') setLangState(saved);
  }, []);
  function setLang(l) {
    setLangState(l);
    localStorage.setItem('eb-lang', l);
    document.documentElement.lang = l;
  }
 
  /* close user menu on outside click */
  useEffect(function () {
    function close(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', close);
    return function () { document.removeEventListener('mousedown', close); };
  }, []);
 
  const avatarUrl = admin?.avatar_url || admin?.picture || admin?.avatar || null;
 
  /* -------- data derivations (same logic as the old file) -------- */
  const enriched = useMemo(function () {
    return (payments || []).map(function (p) {
      return { ...p, _status: orderStatus(p) };
    });
  }, [payments]);
 
  const filtered = useMemo(function () {
    const query = q.trim().toLowerCase();
    return enriched.filter(function (p) {
      const matchesQuery = !query || JSON.stringify(p).toLowerCase().includes(query);
      const matchesStatus = status === 'all' || p._status === status || p.payment_status === status || p.refund_status === status;
      const matchesSource = source === 'all' || (p.payment_source || 'stripe') === source;
      return matchesQuery && matchesStatus && matchesSource;
    });
  }, [enriched, q, status, source]);
 
  const total = filtered.reduce(function (sum, p) { return sum + Number(p.amount_total || 0); }, 0);
  const customers = new Set(filtered.map(function (p) { return p.customer_email; }).filter(Boolean)).size;
  const stripeCount = (payments || []).filter(function (p) { return (p.payment_source || 'stripe') === 'stripe'; }).length;
  const cloverCount = (payments || []).filter(function (p) { return p.payment_source === 'clover'; }).length;
  const isFiltered = q.trim() !== '' || status !== 'all' || source !== 'all';
 
  const customerTotals = useMemo(function () {
    const map = new Map();
    for (const p of payments || []) {
      const email = p.customer_email || 'unknown';
      map.set(email, (map.get(email) || 0) + Number(p.amount_total || 0));
    }
    return map;
  }, [payments]);
 
  const customerOrderCounts = useMemo(function () {
    const map = new Map();
    for (const p of payments || []) {
      const email = p.customer_email || 'unknown';
      map.set(email, (map.get(email) || 0) + 1);
    }
    return map;
  }, [payments]);
 
  function dayKeyLocalized(dt) {
    if (!dt) return 'Unknown date';
    return new Date(dt).toLocaleDateString(dateLocale[lang], { year: 'numeric', month: 'long', day: 'numeric' });
  }
 
  const groups = useMemo(function () {
    const g = [];
    const todayKey = dayKeyLocalized(new Date().toISOString());
    for (const p of filtered) {
      const k = dayKeyLocalized(p.created_at);
      const label = k === todayKey ? t.today + ' \u00b7 ' + k : k;
      const last = g[g.length - 1];
      if (last && last.label === label) last.items.push(p);
      else g.push({ label: label, items: [p] });
    }
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, lang]);
 
  function rowKey(p) {
    return p.id || p.stripe_session_id || p.clover_payment_id;
  }
 
  function statusText(s) {
    return t[s] || s;
  }
 
  function pillClass(s) {
    if (s === 'paid' || s === 'delivered') return 'ebd-badge ebd-badge-ok';
    if (s === 'refunded' || s === 'unpaid') return 'ebd-badge ebd-badge-bad';
    return 'ebd-badge ebd-badge-mid';
  }
 
  /* -------- actions (same endpoints as the old file) -------- */
  function exportCsv() {
    const headers = ['created_at', 'payment_source', 'customer_name', 'customer_email', 'customer_phone', 'amount_total', 'currency', 'payment_status', 'refund_status', 'payment_method', 'payment_method_brand', 'payment_method_last4', 'shipping_address', 'description', 'receipt_url', 'admin_notes'];
    const rows = [
      headers.join(','),
      ...filtered.map(function (p) {
        return headers.map(function (h) {
          const value = h === 'shipping_address' ? formatAddress(p[h]) : p[h];
          return '"' + String(value ?? '').replaceAll('"', '""') + '"';
        }).join(',');
      }),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'erendiras-billing-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
 
  async function syncCloverPayments() {
    setNotice(t.syncingClover);
    const res = await fetch('/api/admin/clover-sync', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      setNotice(data.error || t.syncFailed);
      console.error('Clover sync error', data);
      return;
    }
    setNotice(t.syncedClover + (data.imported || 0) + ' ' + t.paymentWord);
    setTimeout(function () { window.location.reload(); }, 1000);
  }
 
  async function saveNote(id) {
    setNotice(t.savingNote);
    const res = await fetch('/api/admin/payment-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, admin_notes: notes[id] || '' }),
    });
    setNotice(res.ok ? t.saved : t.saveFailed);
    setTimeout(function () { setNotice(''); }, 2500);
  }
 
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }
 
  const SHIP = 'https://ship.erendirasboutique.com';
 
  /* ============================================================ */
  return (
    <main className="ebd">
      <style>{css}</style>
 
      <div className="ebd-shell">
        <aside className="ebd-sidebar no-print">
          <a className="ebd-brand" href="/admin" aria-label="Erendira's Boutique admin home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo2.png" alt="Erendira&#8217;s Boutique" className="ebd-logo" />
          </a>
 
          <nav className="ebd-side-nav" aria-label="Admin navigation">
            <a className="ebd-side-link on" href="/admin">
              <span className="ebd-side-icon">⌂</span>
              <span>{t.overview}</span>
            </a>
            <a className="ebd-side-link" href="#payments">
              <span className="ebd-side-icon">$</span>
              <span>{t.payments}</span>
            </a>
            <a className="ebd-side-link" href="/admin/payment-links">
              <span className="ebd-side-icon"><IconLink /></span>
              <span>{t.paymentLinks}</span>
            </a>
            <a className="ebd-side-link" href="/admin/gift-cards">
              <span className="ebd-side-icon"><IconGift /></span>
              <span>{t.giftCards}</span>
            </a>
            <a className="ebd-side-link" href={SHIP + '/orders'} target="_blank" rel="noopener noreferrer">
              <span className="ebd-side-icon"><IconBox /></span>
              <span>{t.orders}</span>
            </a>
            <a className="ebd-side-link" href={SHIP} target="_blank" rel="noopener noreferrer">
              <span className="ebd-side-icon"><IconTruck /></span>
              <span>{t.shipping}</span>
            </a>
          </nav>
 
          <div className="ebd-side-spacer" />
 
          <div className="ebd-side-user" ref={menuRef}>
            <button
              className="ebd-userpill"
              onClick={function () { setMenuOpen(function (v) { return !v; }); }}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="ebd-avatar" />
              ) : (
                <span className="ebd-avatar-fb">{initials(admin?.name || admin?.email)}</span>
              )}
              <span className="ebd-usertext">
                <span className="ebd-username">{admin?.name || 'Admin Studio'}</span>
                <span className="ebd-useremail">{admin?.email || '...'}</span>
              </span>
              <IconChevronDown />
            </button>
 
            {menuOpen && (
              <div className="ebd-menu" role="menu">
                <div className="ebd-menu-head">
                  <p className="ebd-menu-name">{admin?.name || 'Admin Studio'}</p>
                  <p className="ebd-menu-email">{admin?.email}{admin?.role ? ' · ' + admin.role : ''}</p>
                </div>
                <button role="menuitem" onClick={logout}>{t.logOut}</button>
              </div>
            )}
          </div>
        </aside>
 
        <section className="ebd-main">
          <header className="ebd-topbar no-print">
            <div className="ebd-welcome">
              <h1>{lang === 'es' ? 'Hola, ' : 'Welcome back, '}{admin?.name?.split(' ')[0] || 'Erendira'}!</h1>
              <p>{lang === 'es' ? 'Aquí tienes un resumen de tu negocio.' : "Here’s what’s happening with your business today."}</p>
            </div>
 
            <div className="ebd-langs" role="group" aria-label="Language">
              {['en', 'es'].map(function (l) {
                return (
                  <button key={l} className={lang === l ? 'on' : ''} onClick={function () { setLang(l); }}>
                    {l.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </header>
 
          <div className="ebd-content" id="payments">
            <section className="ebd-stats no-print" aria-label="Dashboard summary">
              <article className="ebd-stat primary">
                <p className="ebd-stat-label">{isFiltered ? t.filteredRevenue : t.totalRevenue}</p>
                <p className="ebd-stat-value">{money(total)}</p>
                <p className="ebd-stat-note">{filtered.length} {t.payments}</p>
              </article>
              <article className="ebd-stat">
                <p className="ebd-stat-label">{t.payments}</p>
                <p className="ebd-stat-value">{filtered.length}</p>
                <p className="ebd-stat-note">{lang === 'es' ? 'En los filtros actuales' : 'In the current filters'}</p>
              </article>
              <article className="ebd-stat">
                <p className="ebd-stat-label">{t.customers}</p>
                <p className="ebd-stat-value">{customers}</p>
                <p className="ebd-stat-note">{lang === 'es' ? 'Clientas únicas' : 'Unique customers'}</p>
              </article>
              <article className="ebd-stat">
                <p className="ebd-stat-label">{t.stripeClover}</p>
                <p className="ebd-stat-value">{stripeCount} / {cloverCount}</p>
                <p className="ebd-stat-note">{lang === 'es' ? 'Pagos conectados' : 'Connected payments'}</p>
              </article>
            </section>
 
            <section className="ebd-toolbar-card no-print">
              <label className="ebd-search">
                <IconSearch />
                <input value={q} onChange={function (e) { setQ(e.target.value); }} placeholder={t.search} />
              </label>
 
              <div className="ebd-toolbar-bottom">
                <select className="ebd-select" value={status} onChange={function (e) { setStatus(e.target.value); }}>
                  <option value="all">{t.allStatuses}</option>
                  <option value="paid">{t.paid}</option>
                  <option value="shipped">{t.shipped}</option>
                  <option value="delivered">{t.delivered}</option>
                  <option value="refunded">{t.refunded}</option>
                  <option value="unpaid">{t.unpaid}</option>
                </select>
 
                <select className="ebd-select" value={source} onChange={function (e) { setSource(e.target.value); }}>
                  <option value="all">{t.allSources}</option>
                  <option value="stripe">Stripe</option>
                  <option value="clover">Clover</option>
                </select>
 
                <div className="ebd-actions">
                  <button className="ebd-btn ebd-btn-taupe" onClick={syncCloverPayments}>{t.syncClover}</button>
                  <button className="ebd-btn" onClick={exportCsv}>{t.exportCsv}</button>
                  <button className="ebd-btn" onClick={function () { window.print(); }}>{t.print}</button>
                </div>
              </div>
            </section>
 
            {notice && <div className="ebd-notice no-print">{notice}</div>}
 
            {groups.map(function (g) {
              return (
                <div key={g.label}>
                  <p className="ebd-groupdate">{g.label}</p>
                  <div className="ebd-list">
                    {g.items.map(function (p) {
                      const key = rowKey(p);
                      const open = expandedId === key;
                      const orders = customerOrderCounts.get(p.customer_email || 'unknown') || 1;
                      const sub = [
                        p.customer_email || t.noEmail,
                        paymentMethodLabel(p),
                        orders + ' ' + (orders === 1 ? t.order : t.ordersWord),
                      ].join(' · ');
                      return (
                        <div className="ebd-rowwrap" key={key}>
                          <button className="ebd-row" onClick={function () { setExpandedId(open ? null : key); }}>
                            <span className="ebd-row-avatar">{initials(p.customer_name)}</span>
                            <span className="ebd-row-main">
                              <span className="ebd-row-name">{p.customer_name || t.customer}</span>
                              <span className="ebd-row-meta">{sub}</span>
                            </span>
                            <span className="ebd-badge ebd-badge-source">{p.payment_source || 'stripe'}</span>
                            <span className={pillClass(p._status)}>{statusText(p._status)}</span>
                            <span className="ebd-row-amount">{money(p.amount_total, p.currency)}</span>
                            <span className="ebd-chev">{open ? '⌄' : '›'}</span>
                          </button>
 
                          {open && (
                            <div className="ebd-detail no-print">
                              <div className="ebd-detail-grid">
                                <div className="ebd-cell">
                                  <span className="lb">{t.customer}</span>
                                  <b>{p.customer_name || t.customer}</b><br />
                                  {p.customer_email || '—'}<br />
                                  {p.customer_phone || '—'}
                                </div>
                                <div className="ebd-cell">
                                  <span className="lb">{t.shippingAddress}</span>
                                  {formatAddress(p.shipping_address) || '—'}
                                </div>
                                <div className="ebd-cell">
                                  <span className="lb">{t.payment}</span>
                                  {formatDate(p.created_at)}<br />
                                  {paymentMethodLabel(p)}<br />
                                  {t.statusWord}: {p.payment_status || '—'} {p.refund_status ? ' · ' + t.refundWord + ': ' + p.refund_status : ''}
                                </div>
                                <div className="ebd-cell">
                                  <span className="lb">{t.customerTotals}</span>
                                  {t.ordersWord}: {orders}<br />
                                  {t.lifetime}: {money(customerTotals.get(p.customer_email || 'unknown') || 0, p.currency)}<br />
                                  {p.description || t.boutiquePurchase}
                                </div>
                              </div>
 
                              <div className="ebd-detail-links">
                                {p.receipt_url && <a target="_blank" rel="noopener noreferrer" href={p.receipt_url}>{t.openReceipt}</a>}
                                {p.stripe_customer_id && <a target="_blank" rel="noopener noreferrer" href={stripeUrl('customer', p.stripe_customer_id)}>{t.stripeCustomer}</a>}
                                {p.stripe_payment_intent && <a target="_blank" rel="noopener noreferrer" href={stripeUrl('payment', p.stripe_payment_intent)}>{t.stripePayment}</a>}
                                {p.payment_link && <a target="_blank" rel="noopener noreferrer" href={stripeUrl('link', p.payment_link)}>{t.paymentLink}</a>}
                              </div>
 
                              <div className="ebd-notes">
                                <textarea
                                  rows={4}
                                  value={notes[p.id] ?? p.admin_notes ?? ''}
                                  onChange={function (e) { setNotes({ ...notes, [p.id]: e.target.value }); }}
                                  placeholder={t.notesPlaceholder}
                                />
                                <button className="ebd-btn" onClick={function () { saveNote(p.id); }}>{t.saveNotes}</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
 
            {filtered.length === 0 && <div className="ebd-empty">{t.noPayments}</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
