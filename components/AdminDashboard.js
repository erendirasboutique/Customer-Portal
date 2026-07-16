'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { money, formatDate, formatAddress, paymentMethodLabel } from '@/lib/format';

/* ============================================================
   Erendira's Boutique — Admin Studio · Billing dashboard
   "Atelier" design: espresso sidebar, ruled ledger content.
   Same props: <AdminDashboard payments={...} admin={...} />
   Same endpoints: /api/admin/clover-sync, /api/admin/payment-notes,
   /api/auth/logout. Fonts inherit from the global stylesheet.
   Requires /public/logo2.png (light logo, shown on espresso).
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
    adminStudio: 'ADMIN STUDIO',
    overview: 'Overview',
    paymentLinks: 'Payment links',
    giftCards: 'Gift cards',
    orders: 'Orders',
    shipping: 'Shipping',
    welcome: 'Welcome back',
    revenue: 'Revenue',
    filteredRevenue: 'Filtered revenue',
    payments: 'Payments',
    paymentsLower: 'payments',
    customers: 'Customers',
    sources: 'Stripe / Clover',
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
    openReceipt: 'Open receipt',
    stripeCustomer: 'Stripe customer',
    stripePayment: 'Stripe payment',
    paymentLink: 'Payment link',
    notesPlaceholder: 'Write private notes for this payment...',
    saveNotes: 'Save notes',
    savingNote: 'Saving note...',
    saved: 'Saved.',
    saveFailed: 'Could not save note.',
    boutiquePurchase: 'Boutique purchase',
    noEmail: 'No email',
  },
  es: {
    adminStudio: 'ADMIN STUDIO',
    overview: 'Resumen',
    paymentLinks: 'Enlaces de pago',
    giftCards: 'Tarjetas de regalo',
    orders: 'Pedidos',
    shipping: 'Env\u00edos',
    welcome: 'Bienvenida de nuevo',
    revenue: 'Ingresos',
    filteredRevenue: 'Ingresos filtrados',
    payments: 'Pagos',
    paymentsLower: 'pagos',
    customers: 'Clientas',
    sources: 'Stripe / Clover',
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
    openReceipt: 'Abrir recibo',
    stripeCustomer: 'Cliente en Stripe',
    stripePayment: 'Pago en Stripe',
    paymentLink: 'Enlace de pago',
    notesPlaceholder: 'Escribe notas privadas para este pago...',
    saveNotes: 'Guardar notas',
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
    <svg width={props.size || 17} height={props.size || 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {props.children}
    </svg>
  );
}
const IconHome = function () { return (<Icon><path d="M5 12l7-8 7 8" /><path d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9" /></Icon>); };
const IconLink = function () { return (<Icon><path d="M9 15l6-6" /><path d="M11 6l.5-.5a4.95 4.95 0 017 7L18 13" /><path d="M13 18l-.5.5a4.95 4.95 0 01-7-7L6 11" /></Icon>); };
const IconGift = function () { return (<Icon><path d="M3 9h18v3H3z" /><path d="M12 9v12" /><path d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" /><path d="M7.5 9a2.5 2.5 0 010-5C11 4 12 9 12 9s1-5 4.5-5a2.5 2.5 0 010 5" /></Icon>); };
const IconBox = function () { return (<Icon><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M12 12l8-4.5" /><path d="M12 12v9" /><path d="M12 12L4 7.5" /></Icon>); };
const IconTruck = function () { return (<Icon><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M5 17H3V6a1 1 0 011-1h9v12M9 17h6M15 8h4l2 3v6h-2" /></Icon>); };
const IconExternal = function () { return (<Icon size={11}><path d="M7 17L17 7" /><path d="M8 7h9v9" /></Icon>); };
const IconSearch = function () { return (<Icon size={15}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></Icon>); };
const IconChevronDown = function () { return (<Icon size={13}><path d="M6 9l6 6 6-6" /></Icon>); };

/* ---------------- Styles ---------------- */
var css = '' +
'.eba { min-height: 100vh; background: #F5F3EF; color: #3d3128; }' +
'.eba * { box-sizing: border-box; }' +
'.eba a { color: inherit; text-decoration: none; }' +
'.eba button, .eba input, .eba select, .eba textarea { font-family: inherit; }' +
'.eba button { cursor: pointer; }' +
'.eba-shell { min-height: 100vh; display: grid; grid-template-columns: 236px minmax(0,1fr); }' +

/* sidebar */
'.eba-side { position: sticky; top: 0; height: 100vh; background: #3d3128; padding: 26px 16px 18px; display: flex; flex-direction: column; z-index: 30; }' +
'.eba-logo { width: 138px; height: auto; display: block; object-fit: contain; }' +
'.eba-side-eyebrow { margin: 14px 0 20px; font-size: 9px; letter-spacing: 0.3em; color: #bda891; }' +
'.eba-nav { display: grid; gap: 4px; }' +
'.eba-nav a { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 10px; color: #bda891; font-size: 13.5px; transition: background .15s ease, color .15s ease; }' +
'.eba-nav a:hover { background: rgba(245,243,239,0.07); color: #e3d9cc; }' +
'.eba-nav a.on { background: #806a52; color: #F5F3EF; }' +
'.eba-nav .ic { width: 18px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }' +
'.eba-nav .ext { margin-left: auto; opacity: .7; display: inline-flex; }' +
'.eba-side-div { border-top: 1px solid #5a4c3c; margin: 12px 4px; }' +
'.eba-side-spacer { flex: 1; }' +
'.eba-side-user { border-top: 1px solid #5a4c3c; padding-top: 12px; position: relative; }' +
'.eba-userpill { width: 100%; display: flex; align-items: center; gap: 10px; border: 0; background: transparent; padding: 8px; border-radius: 10px; text-align: left; color: #e3d9cc; }' +
'.eba-userpill:hover { background: rgba(245,243,239,0.07); }' +
'.eba-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; display: block; flex-shrink: 0; }' +
'.eba-avatar-fb { width: 32px; height: 32px; border-radius: 50%; background: #bda891; color: #3d3128; font-size: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }' +
'.eba-usertext { min-width: 0; flex: 1; }' +
'.eba-username, .eba-useremail { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
'.eba-username { font-size: 12.5px; color: #F5F3EF; }' +
'.eba-useremail { font-size: 10px; color: #bda891; margin-top: 1px; }' +
'.eba-menu { position: absolute; left: 0; bottom: calc(100% + 8px); z-index: 40; width: 100%; background: #F5F3EF; border: 1px solid #d8d2c8; border-radius: 12px; overflow: hidden; box-shadow: 0 14px 35px rgba(20,15,10,.35); }' +
'.eba-menu-head { padding: 11px 13px; border-bottom: 1px solid #e2dcd2; }' +
'.eba-menu-head p { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
'.eba-menu-name { font-size: 13px; color: #3d3128; }' +
'.eba-menu-email { font-size: 11px; color: #a08a71; margin-top: 2px !important; }' +
'.eba-menu button { width: 100%; border: 0; background: transparent; padding: 11px 13px; text-align: left; color: #6b5638; font-size: 13px; }' +
'.eba-menu button:hover { background: #EDEAE3; }' +

/* content */
'.eba-main { min-width: 0; }' +
'.eba-content { max-width: 1240px; margin: 0 auto; padding: 30px 36px 72px; }' +
'.eba-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }' +
'.eba-head h1 { margin: 0; font-size: 34px; font-weight: 400; font-style: italic; color: #3d3128; line-height: 1.1; }' +
'.eba-head .sub { margin: 5px 0 0; font-size: 12px; color: #a08a71; }' +
'.eba-langs { display: flex; border: 1px solid #cbb9a4; border-radius: 999px; overflow: hidden; flex-shrink: 0; }' +
'.eba-langs button { border: 0; background: transparent; padding: 7px 14px; font-size: 10px; letter-spacing: 1.5px; color: #806a52; }' +
'.eba-langs button.on { background: #3d3128; color: #F5F3EF; }' +

/* ruled stat strip */
'.eba-rule { border-top: 2px solid #3d3128; margin-top: 16px; }' +
'.eba-stats { display: flex; flex-wrap: wrap; gap: 14px 40px; padding: 16px 2px; border-bottom: 1px solid #cbb9a4; }' +
'.eba-stat { border: 0; background: none; text-align: left; padding: 0; }' +
'.eba-stat b { display: block; font-size: 27px; font-weight: 400; color: #3d3128; line-height: 1.1; }' +
'.eba-stat span { display: block; margin-top: 3px; font-size: 9.5px; text-transform: uppercase; letter-spacing: .2em; color: #a08a71; }' +
'.eba-stat:hover span { color: #806a52; }' +

/* toolbar */
'.eba-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; margin-top: 18px; }' +
'.eba-search { flex: 1; min-width: 230px; display: flex; align-items: center; gap: 9px; border: 1px solid #d8d2c8; border-radius: 999px; padding: 10px 15px; background: #fff; }' +
'.eba-search svg { color: #a08a71; flex-shrink: 0; }' +
'.eba-search input { width: 100%; border: 0; outline: 0; background: transparent; color: #3d3128; font-size: 13px; }' +
'.eba-search input::placeholder { color: #a08a71; }' +
'.eba-select { appearance: none; border: 1px solid #d8d2c8; border-radius: 999px; padding: 10px 32px 10px 15px; background: #fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'11\' height=\'11\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23806a52\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 13px center; color: #6b5638; font-size: 12px; outline: 0; }' +
'.eba-btn { border: 1px solid #d8d2c8; border-radius: 999px; padding: 10px 17px; font-size: 12.5px; background: #fff; color: #6b5638; text-decoration: none; display: inline-block; }' +
'.eba-btn:hover { background: #EDEAE3; }' +
'.eba-btn-dark { background: #3d3128; border-color: #3d3128; color: #F5F3EF; }' +
'.eba-btn-dark:hover { background: #2c241c; }' +
'.eba-notice { margin-top: 14px; background: #EDEAE3; border-radius: 12px; padding: 11px 15px; font-size: 12.5px; color: #806a52; }' +

/* ledger */
'.eba-daylabel { margin: 26px 0 4px; font-size: 15px; font-style: italic; color: #806a52; }' +
'.eba-rowwrap { border-bottom: 1px dotted #bda891; }' +
'.eba-row { width: 100%; display: flex; align-items: center; gap: 14px; border: 0; background: transparent; padding: 13px 4px; text-align: left; }' +
'.eba-row:hover { background: rgba(237,234,227,0.6); }' +
'.eba-row-main { flex: 1; min-width: 0; }' +
'.eba-row-name { display: block; font-size: 14.5px; color: #3d3128; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
'.eba-row-meta { display: block; margin-top: 2px; font-size: 11px; color: #a08a71; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
'.eba-pill { border-radius: 999px; padding: 3px 10px; font-size: 9px; letter-spacing: .12em; text-transform: uppercase; flex-shrink: 0; white-space: nowrap; }' +
'.eba-pill-src { border: 1px solid #d8d2c8; color: #6b5638; background: #fff; }' +
'.eba-pill-ok { background: #e7efe0; color: #3b5a2a; }' +
'.eba-pill-bad { background: #f7e3e0; color: #a03535; }' +
'.eba-pill-mid { background: #fff; border: 1px solid #d8d2c8; color: #806a52; }' +
'.eba-amt { min-width: 90px; text-align: right; font-size: 16.5px; color: #3d3128; flex-shrink: 0; }' +
'.eba-chev { color: #a08a71; flex-shrink: 0; }' +

/* expanded detail */
'.eba-detail { padding: 4px 4px 18px; }' +
'.eba-detail-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 10px; }' +
'.eba-cell { background: #EDEAE3; border-radius: 12px; padding: 12px 13px; font-size: 12px; line-height: 1.55; }' +
'.eba-cell .lb { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: .16em; color: #806a52; margin-bottom: 4px; }' +
'.eba-detail-links { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }' +
'.eba-detail-links a { border: 1px solid #d8d2c8; color: #806a52; border-radius: 999px; padding: 6px 12px; font-size: 10.5px; background: #fff; }' +
'.eba-detail-links a:hover { background: #EDEAE3; }' +
'.eba-notes { margin-top: 10px; }' +
'.eba-notes textarea { width: 100%; border: 1px solid #d8d2c8; border-radius: 12px; padding: 11px 12px; font-size: 12px; color: #3d3128; background: #fff; resize: vertical; outline: 0; }' +
'.eba-notes textarea:focus { border-color: #806a52; }' +
'.eba-notes .eba-btn { margin-top: 8px; }' +
'.eba-empty { padding: 52px 20px; text-align: center; font-size: 13.5px; color: #a08a71; border-bottom: 1px dotted #bda891; }' +

/* responsive */
'@media (max-width: 1050px) { .eba-shell { grid-template-columns: 200px minmax(0,1fr); } .eba-content { padding: 24px 20px 60px; } .eba-head h1 { font-size: 28px; } }' +
'@media (max-width: 760px) {' +
' .eba-shell { display: block; }' +
' .eba-side { position: static; height: auto; padding: 14px 12px; }' +
' .eba-logo { width: 108px; }' +
' .eba-side-eyebrow { margin: 8px 0 10px; }' +
' .eba-nav { display: flex; overflow-x: auto; padding-bottom: 3px; }' +
' .eba-nav a { white-space: nowrap; padding: 8px 11px; }' +
' .eba-side-div, .eba-side-spacer { display: none; }' +
' .eba-side-user { border-top: 0; padding-top: 8px; }' +
' .eba-menu { bottom: auto; top: calc(100% + 6px); }' +
' .eba-content { padding: 18px 14px 52px; }' +
' .eba-head h1 { font-size: 25px; }' +
' .eba-stats { gap: 12px 26px; }' +
' .eba-stat b { font-size: 22px; }' +
' .eba-toolbar .eba-btn { flex: 1; text-align: center; }' +
' .eba-select { flex: 1; min-width: 130px; }' +
' .eba-row { flex-wrap: wrap; row-gap: 7px; padding: 12px 2px; }' +
' .eba-row-main { flex: 1 1 100%; }' +
' .eba-amt { margin-left: auto; min-width: 0; font-size: 15px; }' +
' .eba-detail { padding: 4px 2px 15px; }' +
'}' +
'@media (max-width: 460px) { .eba-pill-src { display: none; } }' +
'@media print { .no-print { display: none !important; } .eba-shell { display: block; } .eba { background: #fff; } .eba-content { padding: 0; max-width: none; } }';

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

  useEffect(function () {
    const saved = localStorage.getItem('eb-lang');
    if (saved === 'en' || saved === 'es') setLangState(saved);
  }, []);
  function setLang(l) {
    setLangState(l);
    localStorage.setItem('eb-lang', l);
    document.documentElement.lang = l;
  }

  useEffect(function () {
    function close(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', close);
    return function () { document.removeEventListener('mousedown', close); };
  }, []);

  const avatarUrl = admin?.avatar_url || admin?.picture || admin?.avatar || null;

  /* -------- data derivations -------- */
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
      const label = k === todayKey ? t.today + ' \u2014 ' + k : k;
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
    if (s === 'paid' || s === 'delivered') return 'eba-pill eba-pill-ok';
    if (s === 'refunded' || s === 'unpaid') return 'eba-pill eba-pill-bad';
    return 'eba-pill eba-pill-mid';
  }

  /* -------- actions (same endpoints) -------- */
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
  const todayLine = new Date().toLocaleDateString(dateLocale[lang], { weekday: 'long', month: 'long', day: 'numeric' });

  /* ============================================================ */
  return (
    <main className="eba">
      <style>{css}</style>

      <div className="eba-shell">
        <aside className="eba-side no-print">
          <a href="/admin" aria-label="Erendira's Boutique admin home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo2.png" alt="Erendira&#8217;s Boutique" className="eba-logo" />
          </a>
          <p className="eba-side-eyebrow">{t.adminStudio}</p>

          <nav className="eba-nav" aria-label="Admin navigation">
            <a className="on" href="/admin"><span className="ic"><IconHome /></span><span>{t.overview}</span></a>
            <a href="/admin/payment-links"><span className="ic"><IconLink /></span><span>{t.paymentLinks}</span></a>
            <a href="/admin/gift-cards"><span className="ic"><IconGift /></span><span>{t.giftCards}</span></a>
          </nav>
          <div className="eba-side-div" />
          <nav className="eba-nav" aria-label="Shipping portal">
            <a href={SHIP + '/orders'} target="_blank" rel="noopener noreferrer"><span className="ic"><IconBox /></span><span>{t.orders}</span><span className="ext"><IconExternal /></span></a>
            <a href={SHIP} target="_blank" rel="noopener noreferrer"><span className="ic"><IconTruck /></span><span>{t.shipping}</span><span className="ext"><IconExternal /></span></a>
          </nav>

          <div className="eba-side-spacer" />

          <div className="eba-side-user" ref={menuRef}>
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
              <span className="eba-usertext">
                <span className="eba-username">{admin?.name || 'Admin Studio'}</span>
                <span className="eba-useremail">{admin?.email || '...'}</span>
              </span>
              <IconChevronDown />
            </button>

            {menuOpen && (
              <div className="eba-menu" role="menu">
                <div className="eba-menu-head">
                  <p className="eba-menu-name">{admin?.name || 'Admin Studio'}</p>
                  <p className="eba-menu-email">{admin?.email}{admin?.role ? ' \u00b7 ' + admin.role : ''}</p>
                </div>
                <button role="menuitem" onClick={logout}>{t.logOut}</button>
              </div>
            )}
          </div>
        </aside>

        <section className="eba-main">
          <div className="eba-content">
            <div className="eba-head no-print">
              <div>
                <h1>{t.welcome}, {admin?.name?.split(' ')[0] || 'Erendira'}</h1>
                <p className="sub">{todayLine}</p>
              </div>
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

            <div className="eba-rule" />

            <section className="eba-stats" aria-label="Dashboard summary">
              <button className="eba-stat" type="button" onClick={function () { setQ(''); setStatus('all'); setSource('all'); }}>
                <b>{money(total)}</b>
                <span>{isFiltered ? t.filteredRevenue : t.revenue}</span>
              </button>
              <button className="eba-stat" type="button" onClick={function () { setQ(''); setStatus('all'); setSource('all'); }}>
                <b>{filtered.length}</b>
                <span>{t.payments}</span>
              </button>
              <button className="eba-stat" type="button" onClick={function () { setStatus('all'); }}>
                <b>{customers}</b>
                <span>{t.customers}</span>
              </button>
              <button className="eba-stat" type="button" onClick={function () { setSource(source === 'stripe' ? 'clover' : 'stripe'); }}>
                <b>{stripeCount} / {cloverCount}</b>
                <span>{t.sources}</span>
              </button>
            </section>

            <div className="eba-toolbar no-print">
              <label className="eba-search">
                <IconSearch />
                <input value={q} onChange={function (e) { setQ(e.target.value); }} placeholder={t.search} />
              </label>

              <select className="eba-select" value={status} onChange={function (e) { setStatus(e.target.value); }}>
                <option value="all">{t.allStatuses}</option>
                <option value="paid">{t.paid}</option>
                <option value="shipped">{t.shipped}</option>
                <option value="delivered">{t.delivered}</option>
                <option value="refunded">{t.refunded}</option>
                <option value="unpaid">{t.unpaid}</option>
              </select>

              <select className="eba-select" value={source} onChange={function (e) { setSource(e.target.value); }}>
                <option value="all">{t.allSources}</option>
                <option value="stripe">Stripe</option>
                <option value="clover">Clover</option>
              </select>

              <button className="eba-btn eba-btn-dark" onClick={syncCloverPayments}>{t.syncClover}</button>
              <button className="eba-btn" onClick={exportCsv}>{t.exportCsv}</button>
              <button className="eba-btn" onClick={function () { window.print(); }}>{t.print}</button>
            </div>

            {notice && <div className="eba-notice no-print">{notice}</div>}

            {groups.map(function (g) {
              return (
                <div key={g.label}>
                  <p className="eba-daylabel">{g.label}</p>
                  <div>
                    {g.items.map(function (p) {
                      const key = rowKey(p);
                      const open = expandedId === key;
                      const orders = customerOrderCounts.get(p.customer_email || 'unknown') || 1;
                      const sub = [
                        p.customer_email || t.noEmail,
                        paymentMethodLabel(p),
                        orders + ' ' + (orders === 1 ? t.order : t.ordersWord),
                      ].join(' \u00b7 ');
                      return (
                        <div className="eba-rowwrap" key={key}>
                          <button className="eba-row" onClick={function () { setExpandedId(open ? null : key); }}>
                            <span className="eba-row-main">
                              <span className="eba-row-name">{p.customer_name || t.customer}</span>
                              <span className="eba-row-meta">{sub}</span>
                            </span>
                            <span className="eba-pill eba-pill-src">{p.payment_source || 'stripe'}</span>
                            <span className={pillClass(p._status)}>{statusText(p._status)}</span>
                            <span className="eba-amt">{money(p.amount_total, p.currency)}</span>
                            <span className="eba-chev">{open ? '\u2304' : '\u203a'}</span>
                          </button>

                          {open && (
                            <div className="eba-detail no-print">
                              <div className="eba-detail-grid">
                                <div className="eba-cell">
                                  <span className="lb">{t.customer}</span>
                                  <b>{p.customer_name || t.customer}</b><br />
                                  {p.customer_email || '\u2014'}<br />
                                  {p.customer_phone || '\u2014'}
                                </div>
                                <div className="eba-cell">
                                  <span className="lb">{t.shippingAddress}</span>
                                  {formatAddress(p.shipping_address) || '\u2014'}
                                </div>
                                <div className="eba-cell">
                                  <span className="lb">{t.payment}</span>
                                  {formatDate(p.created_at)}<br />
                                  {paymentMethodLabel(p)}<br />
                                  {t.statusWord}: {p.payment_status || '\u2014'} {p.refund_status ? ' \u00b7 ' + t.refundWord + ': ' + p.refund_status : ''}
                                </div>
                                <div className="eba-cell">
                                  <span className="lb">{t.customerTotals}</span>
                                  {t.ordersWord}: {orders}<br />
                                  {t.lifetime}: {money(customerTotals.get(p.customer_email || 'unknown') || 0, p.currency)}<br />
                                  {p.description || t.boutiquePurchase}
                                </div>
                              </div>

                              <div className="eba-detail-links">
                                {p.receipt_url && <a target="_blank" rel="noopener noreferrer" href={p.receipt_url}>{t.openReceipt}</a>}
                                {p.stripe_customer_id && <a target="_blank" rel="noopener noreferrer" href={stripeUrl('customer', p.stripe_customer_id)}>{t.stripeCustomer}</a>}
                                {p.stripe_payment_intent && <a target="_blank" rel="noopener noreferrer" href={stripeUrl('payment', p.stripe_payment_intent)}>{t.stripePayment}</a>}
                                {p.payment_link && <a target="_blank" rel="noopener noreferrer" href={stripeUrl('link', p.payment_link)}>{t.paymentLink}</a>}
                              </div>

                              <div className="eba-notes">
                                <textarea
                                  rows={4}
                                  value={notes[p.id] ?? p.admin_notes ?? ''}
                                  onChange={function (e) { setNotes({ ...notes, [p.id]: e.target.value }); }}
                                  placeholder={t.notesPlaceholder}
                                />
                                <button className="eba-btn" onClick={function () { saveNote(p.id); }}>{t.saveNotes}</button>
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

            {filtered.length === 0 && <div className="eba-empty">{t.noPayments}</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
