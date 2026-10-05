'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { money, formatDate, formatAddress, paymentMethodLabel } from '@/lib/format';

/* ============================================================
   Erendira's Boutique — Admin Studio · Dashboard ("Insights")
   Props: <AdminDashboard payments admin lives giftCardSales />
     lives          optional array of live start times (live_events)
     giftCardSales  optional fulfilled online gift card orders
   Same endpoints as before: /api/admin/clover-sync, /api/admin/payment-notes.

   Top half: how the shop is doing for the range you pick.
   Bottom half (#ledger): the full searchable payments list with
   notes, receipts, Export CSV and Print — unchanged features.

   Revenue counts only PAID payments, minus refunds. Failed and
   unpaid payments are shown, but never added to totals.
   ============================================================ */

function stripeUrl(kind, id) {
  if (!id) return '';
  if (kind === 'customer') return 'https://dashboard.stripe.com/customers/' + id;
  if (kind === 'payment') return 'https://dashboard.stripe.com/payments/' + id;
  if (kind === 'link') return 'https://dashboard.stripe.com/payment-links/' + id;
  return '';
}

const PAID = ['paid', 'succeeded', 'success', 'complete', 'completed', 'captured'];
const FAILED = ['fail', 'failed', 'failure', 'declined', 'canceled', 'cancelled', 'voided', 'void'];

function lower(v) { return String(v || '').toLowerCase(); }
function isRefunded(p) { return lower(p.refund_status) === 'refunded'; }
function isPaid(p) { return PAID.includes(lower(p.payment_status)) && !isRefunded(p); }
function isFailed(p) { return FAILED.includes(lower(p.payment_status)); }

/* What a payment really brought in (refunds taken out when we know them). */
function netAmount(p) {
  if (!isPaid(p)) return 0;
  const total = Number(p.amount_total || 0);
  const refunded = Number(p.amount_refunded || 0);
  return Math.max(0, total - (refunded > 0 && refunded <= total ? refunded : 0));
}

function orderStatus(p) {
  if (isRefunded(p)) return 'refunded';
  if (isFailed(p)) return 'failed';
  if (p.delivered_at) return 'delivered';
  if (p.tracking_number) return 'shipped';
  if (isPaid(p)) return 'paid';
  return lower(p.payment_status) || 'unknown';
}

function channelOf(p) {
  const s = lower(p.payment_source || 'stripe');
  if (s === 'clover') return 'instore';
  if (s === 'sezzle') return 'sezzle';
  return 'online';
}

/* Clover sales with no real customer name read as "In-store sale". */
function displayName(p, t) {
  const n = String(p.customer_name || '').trim();
  const generic = !n || /^manually entered$/i.test(n) || /^customer$/i.test(n);
  if (generic) return channelOf(p) === 'instore' ? t.inStoreSale : t.customer;
  return n;
}

/* ---------------- dates (this device's time zone) ---------------- */
function pad(n) { return String(n).padStart(2, '0'); }
function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function monthKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

/* Each range: [start, end) plus the matching period before it. */
function rangeBounds(range, now) {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  if (range === 'today') return { start: today, end: tomorrow, prevStart: addDays(today, -1), prevEnd: today, unit: 'day', chartDays: 14 };
  if (range === 'week') return { start: addDays(today, -6), end: tomorrow, prevStart: addDays(today, -13), prevEnd: addDays(today, -6), unit: 'day', chartDays: 7 };
  if (range === 'month') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    const ps = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const pe = new Date(ps.getFullYear(), ps.getMonth(), Math.min(now.getDate(), new Date(ps.getFullYear(), ps.getMonth() + 1, 0).getDate()) + 1);
    return { start: s, end: tomorrow, prevStart: ps, prevEnd: pe, unit: 'day', chartDays: 30 };
  }
  if (range === 'year') {
    const s = new Date(now.getFullYear(), 0, 1);
    const ps = new Date(now.getFullYear() - 1, 0, 1);
    const pe = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 1);
    return { start: s, end: tomorrow, prevStart: ps, prevEnd: pe, unit: 'month', chartMonths: now.getMonth() + 1 };
  }
  return { start: new Date(0), end: tomorrow, prevStart: null, prevEnd: null, unit: 'month', chartMonths: 24 };
}

/* ---------------- Translations ---------------- */
const T = {
  en: {
    eyebrow: 'ADMIN STUDIO',
    title: 'How the Shop Is Doing',
    sub: 'Sales, customers and every payment in one place.',
    todayLabel: 'Today',
    todayCaption: 'payments taken',
    ranges: { today: 'Today', week: 'Week', month: 'Month', year: 'Year', all: 'All time' },
    vsToday: 'compared with yesterday',
    vsWeek: 'last 7 days, compared with the 7 before',
    vsMonth: 'this month so far, compared with the same days last month',
    vsYear: 'this year so far, compared with the same point last year',
    vsAll: 'everything since the first payment',
    revenue: 'Revenue',
    revenueCap: 'Paid only, after refunds',
    orders: 'Orders',
    ordersCap: function (n) { return n + ' failed or unpaid not counted'; },
    ordersCapNone: 'Paid payments',
    avg: 'Average order',
    avgCap: 'Revenue ÷ orders',
    newCustomers: 'New customers',
    newCustomersCap: 'First paid order in this range',
    up: 'up', down: 'down', flat: 'same as before', noCompare: '—',
    actSync: 'Sync Clover',
    actLink: '+ Payment link',
    actSezzle: '+ Sezzle',
    actGift: '+ Gift card',
    syncingClover: 'Syncing Clover payments...',
    syncedClover: 'Clover synced: ',
    syncFailed: 'Could not sync Clover.',
    paymentWord: 'payment(s).',
    salesBy: 'SALES BY DAY',
    salesByMonth: 'SALES BY MONTH',
    lastNDays: function (n) { return 'Last ' + n + ' days'; },
    lastNMonths: function (n) { return 'Last ' + n + ' months'; },
    thisYear: 'This year',
    liveNights: 'Live nights',
    otherDays: 'Other days',
    showTable: 'Show as table',
    showChart: 'Show as chart',
    dateCol: 'Date',
    salesCol: 'Sales',
    ordersCol: 'Orders',
    noSales: 'No paid sales in this range yet.',
    channels: 'WHERE SALES COME FROM',
    byChannel: 'By channel',
    online: 'Online (Stripe)',
    instore: 'In store (Clover)',
    sezzle: 'Sezzle',
    giftOnline: 'Gift cards sold online',
    channelsCap: 'Share of revenue in this range',
    loyal: 'LOYAL CUSTOMERS',
    topTitle: 'Top customers',
    noTop: 'No customers with an email in this range.',
    latest: 'LATEST',
    recent: 'Recent payments',
    openLedger: 'Open ledger ↓',
    ledger: 'PAYMENT LEDGER',
    ledgerTitle: 'Every Payment',
    ledgerSummary: function (n, total) { return n + ' shown · ' + total + ' paid'; },
    search: 'Search name, email, phone, amount...',
    allStatuses: 'All statuses',
    allSources: 'All sources',
    paid: 'Paid',
    shipped: 'Shipped',
    delivered: 'Delivered',
    refunded: 'Refunded',
    failed: 'Failed',
    unpaid: 'Unpaid',
    unknown: 'Unknown',
    exportCsv: 'Export CSV',
    print: 'Print',
    today: 'Today',
    order: 'order',
    ordersWord: 'orders',
    noPayments: 'No payments match these filters. Clear the search to see everything.',
    customer: 'Customer',
    inStoreSale: 'In-store sale',
    shippingAddress: 'Shipping address',
    payment: 'Payment',
    customerTotals: 'Customer totals',
    lifetime: 'Lifetime (paid)',
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
    tipLabel: 'Quick tip',
    tipBody: 'Clover payments only appear after a sync. Run it once at the end of the day.',
  },
  es: {
    eyebrow: 'ADMIN STUDIO',
    title: 'Cómo Va la Tienda',
    sub: 'Ventas, clientas y cada pago en un solo lugar.',
    todayLabel: 'Hoy',
    todayCaption: 'pagos recibidos',
    ranges: { today: 'Hoy', week: 'Semana', month: 'Mes', year: 'Año', all: 'Todo' },
    vsToday: 'comparado con ayer',
    vsWeek: 'últimos 7 días, comparado con los 7 anteriores',
    vsMonth: 'este mes hasta hoy, comparado con los mismos días del mes pasado',
    vsYear: 'este año hasta hoy, comparado con el mismo punto del año pasado',
    vsAll: 'todo desde el primer pago',
    revenue: 'Ingresos',
    revenueCap: 'Solo pagados, sin reembolsos',
    orders: 'Pedidos',
    ordersCap: function (n) { return n + ' fallidos o sin pagar no cuentan'; },
    ordersCapNone: 'Pagos pagados',
    avg: 'Pedido promedio',
    avgCap: 'Ingresos ÷ pedidos',
    newCustomers: 'Clientas nuevas',
    newCustomersCap: 'Primer pedido pagado en este periodo',
    up: 'más', down: 'menos', flat: 'igual que antes', noCompare: '—',
    actSync: 'Sincronizar Clover',
    actLink: '+ Enlace de pago',
    actSezzle: '+ Sezzle',
    actGift: '+ Tarjeta de regalo',
    syncingClover: 'Sincronizando pagos de Clover...',
    syncedClover: 'Clover sincronizado: ',
    syncFailed: 'No se pudo sincronizar Clover.',
    paymentWord: 'pago(s).',
    salesBy: 'VENTAS POR DÍA',
    salesByMonth: 'VENTAS POR MES',
    lastNDays: function (n) { return 'Últimos ' + n + ' días'; },
    lastNMonths: function (n) { return 'Últimos ' + n + ' meses'; },
    thisYear: 'Este año',
    liveNights: 'Noches de live',
    otherDays: 'Otros días',
    showTable: 'Ver como tabla',
    showChart: 'Ver como gráfica',
    dateCol: 'Fecha',
    salesCol: 'Ventas',
    ordersCol: 'Pedidos',
    noSales: 'Aún no hay ventas pagadas en este periodo.',
    channels: 'DE DÓNDE VIENEN LAS VENTAS',
    byChannel: 'Por canal',
    online: 'En línea (Stripe)',
    instore: 'En la tienda (Clover)',
    sezzle: 'Sezzle',
    giftOnline: 'Tarjetas vendidas en línea',
    channelsCap: 'Parte de los ingresos en este periodo',
    loyal: 'CLIENTAS FIELES',
    topTitle: 'Mejores clientas',
    noTop: 'No hay clientas con correo en este periodo.',
    latest: 'LO MÁS RECIENTE',
    recent: 'Pagos recientes',
    openLedger: 'Ver todos ↓',
    ledger: 'LIBRO DE PAGOS',
    ledgerTitle: 'Todos los Pagos',
    ledgerSummary: function (n, total) { return n + ' mostrados · ' + total + ' pagado'; },
    search: 'Buscar nombre, correo, teléfono, monto...',
    allStatuses: 'Todos los estados',
    allSources: 'Todas las fuentes',
    paid: 'Pagado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    refunded: 'Reembolsado',
    failed: 'Fallido',
    unpaid: 'Sin pagar',
    unknown: 'Desconocido',
    exportCsv: 'Exportar CSV',
    print: 'Imprimir',
    today: 'Hoy',
    order: 'pedido',
    ordersWord: 'pedidos',
    noPayments: 'Ningún pago coincide. Borra la búsqueda para ver todo.',
    customer: 'Clienta',
    inStoreSale: 'Venta en tienda',
    shippingAddress: 'Dirección de envío',
    payment: 'Pago',
    customerTotals: 'Totales de la clienta',
    lifetime: 'Histórico (pagado)',
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
    tipLabel: 'Tip rápido',
    tipBody: 'Los pagos de Clover aparecen solo después de sincronizar. Corre la sincronización al final del día.',
  },
};

const dateLocale = { en: 'en-US', es: 'es-MX' };
const LIVE_COLOR = '#6f5a44';
const DAY_COLOR = '#bfa98f';
const CHANNEL_COLORS = { online: '#6f5a44', instore: '#bfa98f', sezzle: '#957f67' };

function Icon(props) {
  return (
    <svg width={props.size || 15} height={props.size || 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {props.children}
    </svg>
  );
}
const IconSearch = function () { return (<Icon><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></Icon>); };

const pageCss = '' +
'.eba a.eba-btn-dark { color:var(--cream); }' +
'.eba-cta h3, .eba-cta p { color:inherit; }' +
'.ebd-daylabel { margin:22px 2px 10px; font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:#8c775f; }' +
'.ebd-daylabel:first-of-type { margin-top:6px; }' +
'.ebd-detail { padding:4px 4px 8px; display:grid; gap:12px; }' +
'.ebd-links { display:flex; flex-wrap:wrap; gap:7px; }' +
'.ebd-open { background:#FFFFFF !important; border-color:#e6dccf !important; }' +
'.eba-pill.fail { background:rgba(176,72,63,.12); color:#9a3d35; border-color:rgba(176,72,63,.22); }' +
'.ebd-small { font-size:11.5px; color:#8c775f; }' +
/* header actions + range */
'.ebd-bar { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; }' +
'.ebd-seg { display:inline-flex; flex-wrap:wrap; gap:2px; padding:4px; border:1px solid var(--line); border-radius:999px; background:var(--card); }' +
'.ebd-seg button { border:0; background:transparent; border-radius:999px; padding:8px 14px; font-size:12.5px; color:var(--taupe); }' +
'.ebd-seg button.on { background:var(--accent); color:var(--cream); }' +
'.ebd-range { font-size:12.5px; color:#8c775f; }' +
/* KPIs */
'.ebd-kpis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }' +
'.ebd-delta { display:inline-block; margin-top:4px; font-size:11.5px; color:#8c775f; }' +
'.ebd-delta.up { color:#4f6b45; } .ebd-delta.down { color:#9a3d35; }' +
/* chart */
'.ebd-grid2 { display:grid; grid-template-columns:minmax(0,1.6fr) minmax(0,1fr); gap:16px; align-items:stretch; }' +
'.ebd-grid2b { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.3fr); gap:16px; align-items:start; }' +
'.ebd-chart { position:relative; display:flex; align-items:flex-end; gap:2px; height:220px; margin-top:18px; border-bottom:1px solid var(--line); }' +
'.ebd-col { flex:1; height:100%; display:flex; align-items:flex-end; padding:0; border:0; background:transparent; cursor:default; min-width:0; }' +
'.ebd-col:hover .ebd-barfill, .ebd-col:focus-visible .ebd-barfill { opacity:.75; }' +
'.ebd-barfill { width:100%; border-radius:4px 4px 0 0; min-height:0; }' +
'.ebd-tip { position:absolute; top:6px; transform:translateX(-50%); background:#fff; border:1px solid var(--line); border-radius:12px;' +
'  padding:8px 11px; font-size:12px; color:#5f4e3d; white-space:nowrap; box-shadow:0 10px 24px rgba(149,127,103,.16); pointer-events:none; z-index:3; }' +
'.ebd-tip b { font-weight:400; display:block; color:#8c775f; font-size:11px; }' +
'.ebd-axis { display:flex; justify-content:space-between; margin-top:8px; font-size:11px; color:#8c775f; }' +
'.ebd-legend { display:flex; flex-wrap:wrap; gap:16px; margin-top:12px; font-size:12px; }' +
'.ebd-legend span { display:inline-flex; align-items:center; gap:6px; }' +
'.ebd-sw { width:10px; height:10px; border-radius:3px; display:inline-block; }' +
'.ebd-table { width:100%; border-collapse:collapse; font-size:13px; margin-top:14px; }' +
'.ebd-table th { text-align:left; font-weight:400; font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:#8c775f; padding:0 8px 8px; }' +
'.ebd-table td { padding:8px; border-top:1px solid var(--line); }' +
'.ebd-table td:last-child, .ebd-table th:last-child { text-align:right; }' +
'.ebd-tablebox { max-height:260px; overflow:auto; }' +
/* channels */
'.ebd-ch + .ebd-ch { margin-top:16px; }' +
'.ebd-chtop { display:flex; justify-content:space-between; gap:10px; font-size:13.5px; }' +
'.ebd-track { height:10px; border-radius:999px; background:#efe8de; margin-top:6px; overflow:hidden; }' +
'.ebd-fill { height:100%; border-radius:999px; }' +
/* lists */
'.ebd-li { display:flex; flex-wrap:wrap; align-items:center; gap:8px 12px; padding:11px 0; border-top:1px solid var(--line); }' +
'.ebd-li:first-child { border-top:0; }' +
'.ebd-rank { width:20px; font-size:12px; color:#8c775f; }' +
'.ebd-li .nm { flex:1; min-width:130px; font-size:14px; color:#5f4e3d; overflow-wrap:anywhere; }' +
'.ebd-li .amt { font-size:14.5px; color:#5f4e3d; min-width:76px; text-align:right; }' +
'@media (max-width:1180px) { .ebd-grid2, .ebd-grid2b { grid-template-columns:minmax(0,1fr); } }' +
'@media (max-width:980px) { .ebd-kpis { grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; } }' +
'@media (max-width:560px) { .ebd-bar .eba-actions { width:100%; } .ebd-bar .eba-actions .eba-btn { flex:1 1 calc(50% - 8px); white-space:nowrap; } .ebd-seg { width:100%; justify-content:space-between; } .ebd-seg button { padding:8px 10px; } .ebd-chart { height:170px; } }';

/* ============================================================ */
export default function AdminDashboard({ payments, admin, lives, giftCardSales }) {
  const [lang, setLangState] = useState(admin?.language === 'es' ? 'es' : 'en');
  const t = T[lang];

  const [range, setRange] = useState('month');
  const [now, setNow] = useState(null);
  const [hover, setHover] = useState(null);
  const [asTable, setAsTable] = useState(false);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [notes, setNotes] = useState({});
  const [notice, setNotice] = useState('');

  useEffect(function () {
    const saved = localStorage.getItem('eb-lang');
    if (saved === 'en' || saved === 'es') setLangState(saved);
    try {
      const r = localStorage.getItem('eb-dash-range');
      if (r && ['today', 'week', 'month', 'year', 'all'].includes(r)) setRange(r);
    } catch (e) {}
    setNow(new Date());
  }, []);

  function pickRange(r) {
    setRange(r);
    setHover(null);
    try { localStorage.setItem('eb-dash-range', r); } catch (e) {}
  }

  const all = payments || [];

  /* -------- whole-history helpers -------- */
  const firstPaidAt = useMemo(function () {
    const map = new Map();
    for (const p of all) {
      if (!isPaid(p) || !p.customer_email) continue;
      const k = lower(p.customer_email);
      const ts = new Date(p.created_at).getTime();
      if (!map.has(k) || ts < map.get(k)) map.set(k, ts);
    }
    return map;
  }, [all]);

  const customerTotals = useMemo(function () {
    const map = new Map();
    for (const p of all) {
      if (!p.customer_email) continue;
      const k = lower(p.customer_email);
      const cur = map.get(k) || { total: 0, orders: 0 };
      cur.total += netAmount(p);
      if (isPaid(p)) cur.orders += 1;
      map.set(k, cur);
    }
    return map;
  }, [all]);

  const liveDays = useMemo(function () {
    const s = new Set();
    (lives || []).forEach(function (iso) { s.add(dayKey(new Date(iso))); });
    return s;
  }, [lives]);

  /* -------- range stats -------- */
  const stats = useMemo(function () {
    if (!now) return null;
    const b = rangeBounds(range, now);
    const inRange = function (p, s, e) {
      const d = new Date(p.created_at);
      return d >= s && d < e;
    };
    const cur = all.filter(function (p) { return inRange(p, b.start, b.end); });
    const prev = b.prevStart ? all.filter(function (p) { return inRange(p, b.prevStart, b.prevEnd); }) : null;

    function summarize(list) {
      const paid = list.filter(isPaid);
      const revenue = paid.reduce(function (s, p) { return s + netAmount(p); }, 0);
      const orders = paid.length;
      return { revenue: revenue, orders: orders, avg: orders ? revenue / orders : 0, notCounted: list.length - orders };
    }
    function newCustomers(s, e) {
      let n = 0;
      firstPaidAt.forEach(function (ts) { if (ts >= s.getTime() && ts < e.getTime()) n++; });
      return n;
    }

    const c = summarize(cur);
    const p = prev ? summarize(prev) : null;

    /* chart buckets */
    const buckets = [];
    if (b.unit === 'day') {
      const days = b.chartDays;
      for (let i = days - 1; i >= 0; i--) {
        const d = addDays(startOfDay(now), -i);
        buckets.push({ key: dayKey(d), date: d, revenue: 0, orders: 0, live: liveDays.has(dayKey(d)) });
      }
    } else {
      const months = range === 'all'
        ? Math.max(1, Math.min(b.chartMonths, (function () {
            const first = all.reduce(function (m, p) { const ts = new Date(p.created_at).getTime(); return ts < m ? ts : m; }, now.getTime());
            const f = new Date(first);
            return (now.getFullYear() - f.getFullYear()) * 12 + now.getMonth() - f.getMonth() + 1;
          })()))
        : b.chartMonths;
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({ key: monthKey(d), date: d, revenue: 0, orders: 0, live: false });
      }
    }
    const index = new Map(buckets.map(function (x, i) { return [x.key, i]; }));
    for (const pay of all) {
      if (!isPaid(pay)) continue;
      const d = new Date(pay.created_at);
      const k = b.unit === 'day' ? dayKey(d) : monthKey(d);
      const i = index.get(k);
      if (i === undefined) continue;
      buckets[i].revenue += netAmount(pay);
      buckets[i].orders += 1;
    }
    const max = buckets.reduce(function (m, x) { return Math.max(m, x.revenue); }, 0);

    /* channels */
    const ch = { online: 0, instore: 0, sezzle: 0 };
    cur.forEach(function (pay) { ch[channelOf(pay)] += netAmount(pay); });
    const chTotal = ch.online + ch.instore + ch.sezzle;
    const giftSold = (giftCardSales || []).filter(function (g) {
      const d = new Date(g.fulfilled_at || g.created_at);
      return d >= b.start && d < b.end;
    });

    /* top customers */
    const byEmail = new Map();
    cur.forEach(function (pay) {
      if (!isPaid(pay) || !pay.customer_email) return;
      const k = lower(pay.customer_email);
      const x = byEmail.get(k) || { name: displayName(pay, t), total: 0, orders: 0 };
      x.total += netAmount(pay);
      x.orders += 1;
      byEmail.set(k, x);
    });
    const top = Array.from(byEmail.values()).sort(function (a, z) { return z.total - a.total; }).slice(0, 5);

    return {
      b: b,
      c: c,
      p: p,
      newC: newCustomers(b.start, b.end),
      newP: b.prevStart ? newCustomers(b.prevStart, b.prevEnd) : null,
      buckets: buckets,
      max: max,
      ch: ch,
      chTotal: chTotal,
      giftSold: giftSold,
      top: top,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, range, now, liveDays, firstPaidAt, giftCardSales, lang]);

  function delta(curV, prevV) {
    if (prevV === null || prevV === undefined) return { cls: 'ebd-delta', text: t.noCompare };
    if (!prevV && !curV) return { cls: 'ebd-delta', text: t.flat };
    if (!prevV) return { cls: 'ebd-delta up', text: '▲ ' + t.up };
    const pct = Math.round(((curV - prevV) / prevV) * 100);
    if (pct === 0) return { cls: 'ebd-delta', text: t.flat };
    return pct > 0
      ? { cls: 'ebd-delta up', text: '▲ ' + pct + '% ' + t.up }
      : { cls: 'ebd-delta down', text: '▼ ' + Math.abs(pct) + '% ' + t.down };
  }

  const loc = dateLocale[lang];
  function bucketLabel(x, long) {
    if (!stats) return '';
    if (stats.b.unit === 'day') return x.date.toLocaleDateString(loc, long ? { weekday: 'short', month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric' });
    return x.date.toLocaleDateString(loc, long ? { month: 'long', year: 'numeric' } : { month: 'short', year: '2-digit' });
  }
  const vsText = { today: t.vsToday, week: t.vsWeek, month: t.vsMonth, year: t.vsYear, all: t.vsAll }[range];
  const chartTitle = !stats ? '' : stats.b.unit === 'day'
    ? t.lastNDays(stats.buckets.length)
    : range === 'year' ? t.thisYear : t.lastNMonths(stats.buckets.length);

  /* -------- ledger (unchanged features, cleaner labels) -------- */
  const enriched = useMemo(function () {
    return all.map(function (p) { return { ...p, _status: orderStatus(p) }; });
  }, [all]);

  const filtered = useMemo(function () {
    const query = q.trim().toLowerCase();
    return enriched.filter(function (p) {
      const matchesQuery = !query || JSON.stringify(p).toLowerCase().includes(query);
      const matchesStatus = status === 'all' || p._status === status || lower(p.payment_status) === status || p.refund_status === status;
      const matchesSource = source === 'all' || lower(p.payment_source || 'stripe') === source;
      return matchesQuery && matchesStatus && matchesSource;
    });
  }, [enriched, q, status, source]);

  const filteredPaid = filtered.reduce(function (s, p) { return s + netAmount(p); }, 0);
  const sourcesSeen = useMemo(function () {
    return Array.from(new Set(all.map(function (p) { return lower(p.payment_source || 'stripe'); })));
  }, [all]);

  function dayKeyLocalized(dt) {
    if (!dt) return 'Unknown date';
    return new Date(dt).toLocaleDateString(loc, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const todayCount = useMemo(function () {
    if (!now) return '—';
    const k = dayKey(now);
    return all.filter(function (p) { return isPaid(p) && dayKey(new Date(p.created_at)) === k; }).length;
  }, [all, now]);

  const groups = useMemo(function () {
    const g = [];
    const todayKey = dayKeyLocalized(new Date().toISOString());
    for (const p of filtered) {
      const k = dayKeyLocalized(p.created_at);
      const label = k === todayKey ? t.today + ' — ' + k : k;
      const last = g[g.length - 1];
      if (last && last.label === label) last.items.push(p);
      else g.push({ label: label, items: [p] });
    }
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, lang]);

  function rowKey(p) { return p.id || p.stripe_session_id || p.clover_payment_id; }
  function statusText(s) { return t[s] || s; }
  function pillClass(s) {
    if (s === 'paid' || s === 'delivered') return 'eba-pill ok';
    if (s === 'failed') return 'eba-pill fail';
    if (s === 'refunded' || s === 'unpaid') return 'eba-pill off';
    return 'eba-pill mid';
  }

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

  function goLedger() {
    const el = document.getElementById('ledger');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const recent = all.slice(0, 6);
  const s = stats;

  /* ============================================================ */
  return (
    <AdminShell
      admin={admin}
      active="overview"
      lang={lang}
      onLang={setLangState}
      eyebrow={t.eyebrow}
      title={t.title}
      subtitle={t.sub}
      heroStat={{ label: t.todayLabel, value: todayCount, caption: t.todayCaption }}
      tip={{ label: t.tipLabel, body: t.tipBody }}
    >
      <style>{pageCss}</style>

      {/* Actions + range */}
      <section className="eba-panel no-print" style={{ padding: '18px 22px' }}>
        <div className="ebd-bar">
          <div className="eba-actions" style={{ marginTop: 0 }}>
            <button className="eba-btn eba-btn-dark" type="button" onClick={syncCloverPayments}>{t.actSync}</button>
            <a className="eba-btn" href="/admin/payment-links">{t.actLink}</a>
            <a className="eba-btn" href="/admin/sezzle">{t.actSezzle}</a>
            <a className="eba-btn" href="/admin/gift-cards">{t.actGift}</a>
          </div>
          <div className="ebd-seg" role="group" aria-label="Date range">
            {['today', 'week', 'month', 'year', 'all'].map(function (r) {
              return (
                <button key={r} type="button" className={range === r ? 'on' : ''} aria-pressed={range === r} onClick={function () { pickRange(r); }}>
                  {t.ranges[r]}
                </button>
              );
            })}
          </div>
        </div>
        <p className="ebd-range" style={{ margin: '12px 2px 0' }}>{vsText}</p>
        {notice && <div className="eba-notice">{notice}</div>}
      </section>

      {/* KPIs */}
      <section className="ebd-kpis no-print" aria-label="Summary">
        <div className="eba-stat">
          <span className="lb">{t.revenue}</span>
          <b>{s ? money(s.c.revenue) : '—'}</b>
          {s && <span className={delta(s.c.revenue, s.p && s.p.revenue).cls}>{delta(s.c.revenue, s.p && s.p.revenue).text}</span>}
          <span className="cap">{t.revenueCap}</span>
        </div>
        <div className="eba-stat">
          <span className="lb">{t.orders}</span>
          <b>{s ? s.c.orders : '—'}</b>
          {s && <span className={delta(s.c.orders, s.p && s.p.orders).cls}>{delta(s.c.orders, s.p && s.p.orders).text}</span>}
          <span className="cap">{s && s.c.notCounted ? t.ordersCap(s.c.notCounted) : t.ordersCapNone}</span>
        </div>
        <div className="eba-stat">
          <span className="lb">{t.avg}</span>
          <b>{s ? money(s.c.avg) : '—'}</b>
          {s && <span className={delta(s.c.avg, s.p && s.p.avg).cls}>{delta(s.c.avg, s.p && s.p.avg).text}</span>}
          <span className="cap">{t.avgCap}</span>
        </div>
        <div className="eba-stat">
          <span className="lb">{t.newCustomers}</span>
          <b>{s ? s.newC : '—'}</b>
          {s && <span className={delta(s.newC, s.newP).cls}>{delta(s.newC, s.newP).text}</span>}
          <span className="cap">{t.newCustomersCap}</span>
        </div>
      </section>

      {/* Chart + channels */}
      <div className="ebd-grid2 no-print">
        <div className="eba-panel">
          <div className="eba-panelhead" style={{ alignItems: 'flex-end' }}>
            <div>
              <p className="eba-eyebrow">{s && s.b.unit === 'month' ? t.salesByMonth : t.salesBy}</p>
              <h2 style={{ marginBottom: 0 }}>{chartTitle}</h2>
            </div>
            <button className="eba-btn mini" type="button" onClick={function () { setAsTable(!asTable); }}>
              {asTable ? t.showChart : t.showTable}
            </button>
          </div>

          {!s ? (
            <div className="eba-empty" style={{ marginTop: 18 }}>&nbsp;</div>
          ) : s.max === 0 ? (
            <div className="eba-empty" style={{ marginTop: 18 }}>{t.noSales}</div>
          ) : asTable ? (
            <div className="ebd-tablebox">
              <table className="ebd-table">
                <thead><tr><th>{t.dateCol}</th><th>{t.ordersCol}</th><th>{t.salesCol}</th></tr></thead>
                <tbody>
                  {s.buckets.slice().reverse().map(function (x) {
                    return (
                      <tr key={x.key}>
                        <td>{bucketLabel(x, true)}{x.live ? ' · ' + t.liveNights.toLowerCase() : ''}</td>
                        <td>{x.orders}</td>
                        <td>{money(x.revenue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              <div className="ebd-chart" onMouseLeave={function () { setHover(null); }}>
                {s.buckets.map(function (x, i) {
                  const h = x.revenue > 0 ? Math.max(2, (x.revenue / s.max) * 100) : 0;
                  return (
                    <button
                      key={x.key}
                      type="button"
                      className="ebd-col"
                      aria-label={bucketLabel(x, true) + ': ' + money(x.revenue) + ', ' + x.orders + ' ' + t.ordersWord}
                      onMouseEnter={function () { setHover(i); }}
                      onFocus={function () { setHover(i); }}
                      onBlur={function () { setHover(null); }}
                    >
                      <span className="ebd-barfill" style={{ height: h + '%', background: x.live ? LIVE_COLOR : DAY_COLOR }} />
                    </button>
                  );
                })}
                {hover !== null && s.buckets[hover] && (
                  <div className="ebd-tip" style={{ left: ((hover + 0.5) / s.buckets.length) * 100 + '%' }}>
                    <b>{bucketLabel(s.buckets[hover], true)}{s.buckets[hover].live ? ' · ' + t.liveNights : ''}</b>
                    {money(s.buckets[hover].revenue)} &middot; {s.buckets[hover].orders} {t.ordersWord}
                  </div>
                )}
              </div>
              <div className="ebd-axis">
                <span>{bucketLabel(s.buckets[0])}</span>
                {s.buckets.length > 4 && <span>{bucketLabel(s.buckets[Math.floor(s.buckets.length / 2)])}</span>}
                <span>{bucketLabel(s.buckets[s.buckets.length - 1])}</span>
              </div>
              {s.b.unit === 'day' && liveDays.size > 0 && (
                <div className="ebd-legend">
                  <span><i className="ebd-sw" style={{ background: LIVE_COLOR }} />{t.liveNights}</span>
                  <span><i className="ebd-sw" style={{ background: DAY_COLOR }} />{t.otherDays}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="eba-panel">
          <p className="eba-eyebrow">{t.channels}</p>
          <h2>{t.byChannel}</h2>
          {s && ['online', 'instore', 'sezzle'].filter(function (k) { return k !== 'sezzle' || s.ch.sezzle > 0 || sourcesSeen.includes('sezzle'); }).map(function (k) {
            const pct = s.chTotal ? Math.round((s.ch[k] / s.chTotal) * 100) : 0;
            return (
              <div className="ebd-ch" key={k}>
                <div className="ebd-chtop"><span>{t[k]}</span><span>{money(s.ch[k])} &middot; {pct}%</span></div>
                <div className="ebd-track"><div className="ebd-fill" style={{ width: pct + '%', background: CHANNEL_COLORS[k] }} /></div>
              </div>
            );
          })}
          {s && (giftCardSales || []).length > 0 && (
            <div className="ebd-chtop" style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
              <span>{t.giftOnline}</span><span>{s.giftSold.length}</span>
            </div>
          )}
          <p className="ebd-small" style={{ margin: '16px 0 0' }}>{t.channelsCap}</p>
        </div>
      </div>

      {/* Top customers + recent */}
      <div className="ebd-grid2b no-print">
        <div className="eba-panel">
          <p className="eba-eyebrow">{t.loyal}</p>
          <h2>{t.topTitle}</h2>
          {s && s.top.length ? (
            <div>
              {s.top.map(function (c, i) {
                return (
                  <div className="ebd-li" key={i}>
                    <span className="ebd-rank">{i + 1}</span>
                    <span className="nm">{c.name}</span>
                    <span className="ebd-small">{c.orders} {c.orders === 1 ? t.order : t.ordersWord}</span>
                    <span className="amt">{money(c.total)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="eba-empty">{t.noTop}</div>
          )}
        </div>

        <div className="eba-panel">
          <div className="eba-panelhead" style={{ alignItems: 'flex-end' }}>
            <div>
              <p className="eba-eyebrow">{t.latest}</p>
              <h2 style={{ marginBottom: 8 }}>{t.recent}</h2>
            </div>
            <button className="eba-btn mini" type="button" onClick={goLedger}>{t.openLedger}</button>
          </div>
          {recent.map(function (p) {
            const st = orderStatus(p);
            const when = new Date(p.created_at).toLocaleString(loc, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
            return (
              <div className="ebd-li" key={rowKey(p)}>
                <span className="nm">{displayName(p, t)}<span className="ebd-small" style={{ display: 'block' }}>{when} &middot; {t[channelOf(p)]}</span></span>
                <span className={pillClass(st)}>{statusText(st)}</span>
                <span className="amt">{money(p.amount_total, p.currency)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full ledger */}
      <div className="eba-panel" id="ledger" style={{ scrollMarginTop: 18 }}>
        <div className="eba-panelhead" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <p className="eba-eyebrow">{t.ledger}</p>
            <h2 style={{ marginBottom: 6 }}>{t.ledgerTitle}</h2>
            <p className="ebd-small" style={{ margin: '0 0 14px' }}>{t.ledgerSummary(filtered.length, money(filteredPaid))}</p>
          </div>
          <div className="eba-actions no-print" style={{ marginTop: 0, marginBottom: 14 }}>
            <button className="eba-btn" onClick={exportCsv}>{t.exportCsv}</button>
            <button className="eba-btn" onClick={function () { window.print(); }}>{t.print}</button>
          </div>
        </div>

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
            <option value="failed">{t.failed}</option>
            <option value="refunded">{t.refunded}</option>
            <option value="unpaid">{t.unpaid}</option>
          </select>
          <select className="eba-select" value={source} onChange={function (e) { setSource(e.target.value); }}>
            <option value="all">{t.allSources}</option>
            {sourcesSeen.map(function (src) {
              return <option key={src} value={src}>{src.charAt(0).toUpperCase() + src.slice(1)}</option>;
            })}
          </select>
        </div>

        {groups.map(function (g) {
          return (
            <div key={g.label}>
              <p className="ebd-daylabel">{g.label}</p>
              <div className="eba-rows">
                {g.items.map(function (p) {
                  const key = rowKey(p);
                  const open = expandedId === key;
                  const ct = p.customer_email ? customerTotals.get(lower(p.customer_email)) : null;
                  const sub = [
                    p.customer_email || (channelOf(p) === 'instore' ? null : t.noEmail),
                    paymentMethodLabel(p),
                    ct && ct.orders ? ct.orders + ' ' + (ct.orders === 1 ? t.order : t.ordersWord) : null,
                  ].filter(Boolean).join(' · ');
                  return (
                    <div key={key}>
                      <button
                        className={open ? 'eba-row ebd-open' : 'eba-row'}
                        onClick={function () { setExpandedId(open ? null : key); }}
                        aria-expanded={open}
                      >
                        <span className="eba-who">
                          <span className="n">{displayName(p, t)}</span>
                          <span className="s">{sub}</span>
                        </span>
                        <span className="eba-pill off">{p.payment_source || 'stripe'}</span>
                        <span className={pillClass(p._status)}>{statusText(p._status)}</span>
                        <span className="eba-amt">{money(p.amount_total, p.currency)}</span>
                      </button>

                      {open && (
                        <div className="ebd-detail no-print">
                          <div className="eba-cells">
                            <div className="eba-cell">
                              <span className="lb">{t.customer}</span>
                              <b>{displayName(p, t)}</b><br />
                              {p.customer_email || '—'}<br />
                              {p.customer_phone || '—'}
                            </div>
                            <div className="eba-cell">
                              <span className="lb">{t.shippingAddress}</span>
                              {formatAddress(p.shipping_address) || '—'}
                            </div>
                            <div className="eba-cell">
                              <span className="lb">{t.payment}</span>
                              {formatDate(p.created_at)}<br />
                              {paymentMethodLabel(p)}<br />
                              {t.statusWord}: {p.payment_status || '—'}{p.refund_status ? ' · ' + t.refundWord + ': ' + p.refund_status : ''}
                            </div>
                            <div className="eba-cell">
                              <span className="lb">{t.customerTotals}</span>
                              {ct ? (
                                <>
                                  {t.ordersWord}: {ct.orders}<br />
                                  {t.lifetime}: {money(ct.total, p.currency)}<br />
                                </>
                              ) : (
                                <>{t.noEmail}<br /></>
                              )}
                              {p.description || t.boutiquePurchase}
                            </div>
                          </div>

                          <div className="ebd-links">
                            {p.receipt_url && <a className="eba-btn mini" target="_blank" rel="noopener noreferrer" href={p.receipt_url}>{t.openReceipt}</a>}
                            {p.stripe_customer_id && <a className="eba-btn mini" target="_blank" rel="noopener noreferrer" href={stripeUrl('customer', p.stripe_customer_id)}>{t.stripeCustomer}</a>}
                            {p.stripe_payment_intent && <a className="eba-btn mini" target="_blank" rel="noopener noreferrer" href={stripeUrl('payment', p.stripe_payment_intent)}>{t.stripePayment}</a>}
                            {p.payment_link && <a className="eba-btn mini" target="_blank" rel="noopener noreferrer" href={stripeUrl('link', p.payment_link)}>{t.paymentLink}</a>}
                          </div>

                          <div>
                            <textarea
                              className="eba-in"
                              rows={4}
                              value={notes[p.id] ?? p.admin_notes ?? ''}
                              onChange={function (e) { setNotes({ ...notes, [p.id]: e.target.value }); }}
                              placeholder={t.notesPlaceholder}
                            />
                            <div className="eba-actions">
                              <button className="eba-btn" onClick={function () { saveNote(p.id); }}>{t.saveNotes}</button>
                            </div>
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
    </AdminShell>
  );
}
