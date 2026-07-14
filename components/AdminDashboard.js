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
'.ebd { min-height: 100vh; background: #EDEAE3; color: #3d3128; }' +
'.ebd * { box-sizing: border-box; }' +
'.ebd a { text-decoration: none; }' +
'.ebd button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }' +
'.ebd-wrap { max-width: 1500px; margin: 0 auto; padding: 0 24px; }' +
'@media (min-width: 1024px) { .ebd-wrap { padding: 0 40px; } }' +

/* header */
'.ebd-header { background: #806a52; }' +
'.ebd-header-in { padding-top: 24px; padding-bottom: 22px; }' +
'.ebd-toprow { display: flex; align-items: center; justify-content: space-between; gap: 16px; }' +
'.ebd-logo { height: 52px; width: auto; object-fit: contain; display: block; }' +
'@media (min-width: 1024px) { .ebd-logo { height: 60px; } }' +
'.ebd-topright { display: flex; align-items: center; gap: 12px; }' +
'.ebd-langs { display: flex; border: 1px solid #a08a71; border-radius: 999px; overflow: hidden; }' +
'.ebd-langs button { padding: 7px 15px; font-size: 12px; letter-spacing: 2px; color: #e3d9cc; }' +
'.ebd-langs button.on { background: #F5F3EF; color: #6b5638; }' +
'.ebd-userpill { display: flex; align-items: center; gap: 10px; border: 1px solid #a08a71; border-radius: 999px; padding: 5px 12px 5px 5px; color: #F5F3EF; }' +
'.ebd-avatar { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; display: block; }' +
'.ebd-avatar-fb { width: 30px; height: 30px; border-radius: 50%; background: #bda891; color: #fff; font-size: 11px; display: flex; align-items: center; justify-content: center; }' +
'.ebd-useremail { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }' +
'@media (max-width: 640px) { .ebd-useremail { display: none; } }' +
'.ebd-menu-wrap { position: relative; }' +
'.ebd-menu { position: absolute; right: 0; top: calc(100% + 8px); z-index: 20; width: 260px; background: #fff; border: 0.5px solid #d8d2c8; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(61,49,40,0.12); }' +
'.ebd-menu-head { padding: 12px 16px; border-bottom: 0.5px solid #eee8dd; }' +
'.ebd-menu-head p { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
'.ebd-menu-name { font-size: 14px; color: #3d3128; }' +
'.ebd-menu-email { font-size: 12px; color: #a08a71; }' +
'.ebd-menu button { display: block; width: 100%; text-align: left; padding: 12px 16px; font-size: 14px; color: #6b5638; }' +
'.ebd-menu button:hover { background: #F5F3EF; }' +

'.ebd-eyebrow { margin: 26px 0 0; font-size: 11px; letter-spacing: 0.25em; color: #e3d9cc; }' +
'.ebd-herorow { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; column-gap: 32px; row-gap: 12px; }' +
'.ebd-revenue { margin: 0; line-height: 1; color: #F5F3EF; font-size: clamp(42px, 6vw, 72px); font-weight: 400; }' +
'.ebd-substats { margin: 10px 0 0; font-size: 14px; color: #e3d9cc; }' +
'.ebd-substats button { font-size: inherit; color: inherit; padding: 0; }' +
'.ebd-substats button:hover { color: #F5F3EF; }' +
'.ebd-nav { display: flex; flex-wrap: wrap; gap: 8px; padding-bottom: 4px; }' +
'.ebd-nav a, .ebd-nav span { border-radius: 999px; padding: 8px 20px; font-size: 14px; }' +
'.ebd-nav .on { background: #F5F3EF; color: #6b5638; }' +
'.ebd-nav a { border: 1px solid #a08a71; color: #e3d9cc; }' +
'.ebd-nav a:hover { border-color: #e3d9cc; }' +

/* modules */
'.ebd-body { padding: 32px 0 64px; }' +
'.ebd-mods { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; margin-bottom: 32px; }' +
'@media (min-width: 1024px) { .ebd-mods { grid-template-columns: repeat(4, minmax(0,1fr)); } }' +
'.ebd-mod { border-radius: 16px; padding: 18px 20px; display: block; transition: transform .15s ease; }' +
'.ebd-mod:hover { transform: translateY(-2px); }' +
'.ebd-mod-taupe { background: #806a52; color: #F5F3EF; }' +
'.ebd-mod-sand { background: #bda891; color: #fff; }' +
'.ebd-mod-white { background: #fff; border: 0.5px solid #d8d2c8; color: #3d3128; }' +
'.ebd-mod-white svg { color: #806a52; }' +
'.ebd-mod-label { margin: 12px 0 0; font-size: 15px; display: flex; align-items: center; gap: 6px; }' +
'.ebd-mod-sub { margin: 2px 0 0; font-size: 12px; }' +
'.ebd-mod-taupe .ebd-mod-sub, .ebd-mod-sand .ebd-mod-sub { color: #e3d9cc; }' +
'.ebd-mod-white .ebd-mod-sub, .ebd-mod-white .ebd-ext { color: #a08a71; }' +

/* toolbar */
'.ebd-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 22px; }' +
'.ebd-search { flex: 1; min-width: 240px; display: flex; align-items: center; gap: 8px; background: #fff; border: 0.5px solid #d8d2c8; border-radius: 999px; padding: 10px 16px; }' +
'.ebd-search svg { color: #a08a71; flex-shrink: 0; }' +
'.ebd-search input { border: none; outline: none; background: transparent; width: 100%; font-size: 14px; color: #3d3128; font-family: inherit; }' +
'.ebd-search input::placeholder { color: #a08a71; }' +
'.ebd-select { appearance: none; background: #fff; border: 0.5px solid #d8d2c8; border-radius: 999px; padding: 10px 34px 10px 16px; font-size: 14px; color: #6b5638; font-family: inherit; outline: none; cursor: pointer;' +
' background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23a08a71\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E");' +
' background-repeat: no-repeat; background-position: right 14px center; }' +
'.ebd-btn { border-radius: 999px; padding: 10px 20px; font-size: 14px; }' +
'.ebd-btn-taupe { background: #806a52; color: #F5F3EF; }' +
'.ebd-btn-taupe:hover { opacity: 0.92; }' +
'.ebd-btn-white { background: #fff; border: 0.5px solid #d8d2c8; color: #6b5638; }' +
'.ebd-btn-white:hover { background: #F5F3EF; }' +
'.ebd-notice { background: #fff; border: 0.5px solid #d8d2c8; border-radius: 12px; padding: 10px 16px; font-size: 13px; color: #806a52; margin-bottom: 18px; }' +

/* list */
'.ebd-groupdate { margin: 22px 0 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.25em; color: #a08a71; }' +
'.ebd-list { background: #fff; border: 0.5px solid #d8d2c8; border-radius: 16px; overflow: hidden; }' +
'.ebd-rowwrap { border-bottom: 0.5px solid #eee8dd; }' +
'.ebd-rowwrap:last-child { border-bottom: 0; }' +
'.ebd-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 16px; text-align: left; }' +
'@media (min-width: 1024px) { .ebd-row { padding: 14px 24px; } }' +
'.ebd-row:hover { background: rgba(237,234,227,0.5); }' +
'.ebd-row-avatar { width: 40px; height: 40px; border-radius: 50%; background: #EDEAE3; color: #806a52; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }' +
'.ebd-row-main { flex: 1; min-width: 0; }' +
'.ebd-row-name { display: block; font-size: 15px; color: #3d3128; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
'.ebd-row-meta { display: block; font-size: 12px; color: #a08a71; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
'.ebd-badge { border-radius: 999px; padding: 4px 12px; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; flex-shrink: 0; white-space: nowrap; }' +
'.ebd-badge-source { border: 0.5px solid #d8d2c8; color: #6b5638; background: #F5F3EF; }' +
'.ebd-badge-ok { background: #e7efe0; color: #3b5a2a; }' +
'.ebd-badge-bad { background: #f7e3e0; color: #a03535; }' +
'.ebd-badge-mid { background: #fff; border: 0.5px solid #d8d2c8; color: #806a52; }' +
'@media (max-width: 640px) { .ebd-badge-source { display: none; } }' +
'.ebd-row-amount { min-width: 92px; text-align: right; font-size: 17px; color: #3d3128; flex-shrink: 0; }' +
'.ebd-chev { color: #a08a71; flex-shrink: 0; }' +

/* expanded detail */
'.ebd-detail { padding: 4px 18px 18px 68px; }' +
'@media (max-width: 640px) { .ebd-detail { padding: 4px 14px 16px 14px; } }' +
'.ebd-detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }' +
'.ebd-cell { background: #EDEAE3; border-radius: 14px; padding: 12px 14px; font-size: 13px; }' +
'.ebd-cell .lb { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #806a52; margin-bottom: 4px; }' +
'.ebd-detail-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }' +
'.ebd-detail-links a { border: 0.5px solid #d8d2c8; color: #806a52; border-radius: 999px; padding: 6px 14px; font-size: 11px; background: #fff; }' +
'.ebd-detail-links a:hover { background: #F5F3EF; }' +
'.ebd-notes { margin-top: 12px; }' +
'.ebd-notes textarea { width: 100%; border: 0.5px solid #d8d2c8; border-radius: 14px; padding: 12px 14px; font-size: 13px; font-family: inherit; color: #3d3128; background: #fff; resize: vertical; outline: none; }' +
'.ebd-notes textarea:focus { border-color: #806a52; }' +
'.ebd-notes .ebd-btn { margin-top: 8px; }' +

'.ebd-empty { background: #fff; border: 0.5px solid #d8d2c8; border-radius: 16px; padding: 56px 24px; text-align: center; font-size: 14px; color: #a08a71; margin-top: 22px; }' +

/* mobile row wrap like the old design */
'@media (max-width: 640px) {' +
' .ebd-row { flex-wrap: wrap; row-gap: 8px; padding: 12px 14px; }' +
' .ebd-row-main { flex: 1 1 100%; }' +
' .ebd-row-amount { font-size: 15px; margin-left: auto; min-width: 0; }' +
'}' +

'@media print { .no-print { display: none !important; } .ebd { background: #fff; } .ebd-list { border: 1px solid #999; } }';

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
  const modules = [
    { icon: <IconLink />, label: t.paymentLinks, sub: t.managePaymentLinks, href: '/admin/payment-links', cls: 'ebd-mod-taupe' },
    { icon: <IconGift />, label: t.giftCards, sub: t.manageGiftCards, href: '/admin/gift-cards', cls: 'ebd-mod-sand' },
    { icon: <IconBox />, label: t.orders, sub: t.shippingPortal, href: SHIP + '/orders', cls: 'ebd-mod-white', external: true },
    { icon: <IconTruck />, label: t.shipping, sub: t.shippingPortal, href: SHIP, cls: 'ebd-mod-white', external: true },
  ];

  /* ============================================================ */
  return (
    <main className="ebd">
      <style>{css}</style>

      {/* ---------- Taupe hero header ---------- */}
      <header className="ebd-header no-print">
        <div className="ebd-wrap ebd-header-in">
          <div className="ebd-toprow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo2.png" alt="Erendira&#8217;s Boutique" className="ebd-logo" />

            <div className="ebd-topright">
              <div className="ebd-langs" role="group" aria-label="Language">
                {['en', 'es'].map(function (l) {
                  return (
                    <button key={l} className={lang === l ? 'on' : ''} onClick={function () { setLang(l); }}>
                      {l.toUpperCase()}
                    </button>
                  );
                })}
              </div>

              <div className="ebd-menu-wrap" ref={menuRef}>
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
                  <span className="ebd-useremail">{admin?.email || '\u2026'}</span>
                  <IconChevronDown />
                </button>

                {menuOpen && (
                  <div className="ebd-menu" role="menu">
                    <div className="ebd-menu-head">
                      <p className="ebd-menu-name">{admin?.name || 'Admin Studio'}</p>
                      <p className="ebd-menu-email">
                        {admin?.email}
                        {admin?.role ? ' \u00b7 ' + admin.role : ''}
                      </p>
                    </div>
                    <button role="menuitem" onClick={logout}>{t.logOut}</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="ebd-eyebrow">{t.eyebrow}</p>
          <div className="ebd-herorow">
            <div>
              <h1 className="ebd-revenue">{money(total)}</h1>
              <p className="ebd-substats">
                {isFiltered ? t.filteredRevenue : t.totalRevenue}{' \u00b7 '}{filtered.length} {t.payments}{' \u00b7 '}{customers} {t.customers}{' \u00b7 '}
                <button type="button" onClick={function () { setSource(source === 'stripe' ? 'clover' : 'stripe'); }}>
                  {t.stripeClover} {stripeCount} / {cloverCount}
                </button>
              </p>
            </div>

            <nav className="ebd-nav">
              <span className="on">{t.dashboard}</span>
              <a href="/admin/payment-links">{t.paymentLinks}</a>
              <a href="/admin/gift-cards">{t.giftCards}</a>
            </nav>
          </div>
        </div>
      </header>

      {/* ---------- Body ---------- */}
      <div className="ebd-wrap ebd-body">
        {/* module buttons */}
        <div className="ebd-mods no-print">
          {modules.map(function (m) {
            return (
              <a
                key={m.label}
                href={m.href}
                className={'ebd-mod ' + m.cls}
                target={m.external ? '_blank' : undefined}
                rel={m.external ? 'noopener noreferrer' : undefined}
              >
                {m.icon}
                <p className="ebd-mod-label">
                  {m.label}
                  {m.external && <span className="ebd-ext"><IconExternal /></span>}
                </p>
                <p className="ebd-mod-sub">{m.sub}</p>
              </a>
            );
          })}
        </div>

        {/* toolbar */}
        <div className="ebd-toolbar no-print">
          <label className="ebd-search">
            <IconSearch />
            <input
              value={q}
              onChange={function (e) { setQ(e.target.value); }}
              placeholder={t.search}
            />
          </label>

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

          <button className="ebd-btn ebd-btn-taupe" onClick={syncCloverPayments}>{t.syncClover}</button>
          <button className="ebd-btn ebd-btn-white" onClick={exportCsv}>{t.exportCsv}</button>
          <button className="ebd-btn ebd-btn-white" onClick={function () { window.print(); }}>{t.print}</button>
        </div>

        {notice && <div className="ebd-notice no-print">{notice}</div>}

        {/* payment ledger */}
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
                  ].join(' \u00b7 ');
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
                        <span className="ebd-chev">{open ? '\u2304' : '\u203a'}</span>
                      </button>

                      {open && (
                        <div className="ebd-detail no-print">
                          <div className="ebd-detail-grid">
                            <div className="ebd-cell">
                              <span className="lb">{t.customer}</span>
                              <b>{p.customer_name || t.customer}</b><br />
                              {p.customer_email || '\u2014'}<br />
                              {p.customer_phone || '\u2014'}
                            </div>
                            <div className="ebd-cell">
                              <span className="lb">{t.shippingAddress}</span>
                              {formatAddress(p.shipping_address) || '\u2014'}
                            </div>
                            <div className="ebd-cell">
                              <span className="lb">{t.payment}</span>
                              {formatDate(p.created_at)}<br />
                              {paymentMethodLabel(p)}<br />
                              {t.statusWord}: {p.payment_status || '\u2014'} {p.refund_status ? '\u00b7 ' + t.refundWord + ': ' + p.refund_status : ''}
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
                            <button className="ebd-btn ebd-btn-white" onClick={function () { saveNote(p.id); }}>{t.saveNotes}</button>
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
    </main>
  );
}
