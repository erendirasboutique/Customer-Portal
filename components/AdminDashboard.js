'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

/* ============================================================
   Erendira's Boutique — Billing Dashboard (Admin Studio)
   Self-contained: all styles are in the <style> block below.
   Requires:
   - /public/logo2.png (light logo, shown on taupe)
   - NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
   Reads the `payments` table written by api/stripe-webhook/route.js,
   falling back to GET /api/admin/payments if the direct read fails.
   ============================================================ */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* ---------------- Translations ---------------- */
const T = {
  en: {
    eyebrow: "ERENDIRA'S BOUTIQUE · ADMIN STUDIO",
    totalRevenue: 'Total revenue',
    payments: 'payments',
    customers: 'customers',
    stripeClover: 'Stripe / Clover',
    dashboard: 'Dashboard',
    paymentLinks: 'Payment links',
    giftCards: 'Gift cards',
    orders: 'Orders',
    shipping: 'Shipping',
    shippingPortal: 'Shipping portal',
    managePaymentLinks: 'Create and share links',
    manageGiftCards: 'Balances and codes',
    search: 'Search name, email, phone, amount…',
    allStatuses: 'All statuses',
    allSources: 'All sources',
    paid: 'Paid',
    pending: 'Pending',
    refunded: 'Refunded',
    failed: 'Failed',
    syncClover: 'Sync Clover',
    syncing: 'Syncing…',
    exportCsv: 'Export CSV',
    print: 'Print',
    today: 'Today',
    order: 'order',
    ordersWord: 'orders',
    noPayments: 'No payments match your search.',
    noPaymentsHint: 'Try clearing the filters or syncing Clover.',
    loading: 'Loading payments…',
    logOut: 'Log out',
    owner: 'Owner',
    loadError: "Couldn't load payments",
  },
  es: {
    eyebrow: "ERENDIRA'S BOUTIQUE · ADMIN STUDIO",
    totalRevenue: 'Ingresos totales',
    payments: 'pagos',
    customers: 'clientas',
    stripeClover: 'Stripe / Clover',
    dashboard: 'Panel',
    paymentLinks: 'Enlaces de pago',
    giftCards: 'Tarjetas de regalo',
    orders: 'Pedidos',
    shipping: 'Envíos',
    shippingPortal: 'Portal de envíos',
    managePaymentLinks: 'Crear y compartir enlaces',
    manageGiftCards: 'Saldos y códigos',
    search: 'Buscar nombre, correo, teléfono, monto…',
    allStatuses: 'Todos los estados',
    allSources: 'Todas las fuentes',
    paid: 'Pagado',
    pending: 'Pendiente',
    refunded: 'Reembolsado',
    failed: 'Fallido',
    syncClover: 'Sincronizar Clover',
    syncing: 'Sincronizando…',
    exportCsv: 'Exportar CSV',
    print: 'Imprimir',
    today: 'Hoy',
    order: 'pedido',
    ordersWord: 'pedidos',
    noPayments: 'Ningún pago coincide con tu búsqueda.',
    noPaymentsHint: 'Intenta quitar los filtros o sincronizar Clover.',
    loading: 'Cargando pagos…',
    logOut: 'Cerrar sesión',
    owner: 'Propietaria',
    loadError: 'No se pudieron cargar los pagos',
  },
};

const dateLocale = { en: 'en-US', es: 'es-MX' };

/* Maps a row from the `payments` table (written by the Stripe webhook) */
function mapPayment(raw, i) {
  const refunded = raw.refund_status && raw.refund_status !== 'none';
  let method = raw.payment_method || 'card';
  if (raw.payment_method_brand || raw.payment_method_last4) {
    method = `${method} (${[
      raw.payment_method_brand,
      raw.payment_method_last4 ? `•••• ${raw.payment_method_last4}` : '',
    ]
      .filter(Boolean)
      .join(' ')})`;
  }
  return {
    id: String(raw.stripe_session_id ?? raw.id ?? i),
    name: raw.customer_name || raw.customer_email || 'Customer',
    email: (raw.customer_email || '').toLowerCase(),
    amount: Number(raw.amount_total) || 0,
    status: refunded ? 'refunded' : (raw.payment_status || 'paid').toLowerCase(),
    source: (raw.payment_source || 'stripe').toLowerCase(),
    method,
    receiptUrl: raw.receipt_url || null,
    date: raw.created_at || new Date().toISOString(),
  };
}

/* ---------------- Icons (inline SVG, no deps) ---------------- */
function Icon({ d, size = 20, extra = null }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d.map((path, i) => (
        <path key={i} d={path} />
      ))}
      {extra}
    </svg>
  );
}

const paths = {
  link: ['M9 15l6-6', 'M11 6l.5-.5a4.95 4.95 0 017 7L18 13', 'M13 18l-.5.5a4.95 4.95 0 01-7-7L6 11'],
  gift: [
    'M3 9h18v3H3z',
    'M12 9v12',
    'M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7',
    'M7.5 9a2.5 2.5 0 010-5C11 4 12 9 12 9s1-5 4.5-5a2.5 2.5 0 010 5',
  ],
  box: ['M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z', 'M12 12l8-4.5', 'M12 12v9', 'M12 12L4 7.5'],
  truck: ['M5 17H3V6a1 1 0 011-1h9v12M9 17h6M15 8h4l2 3v6h-2'],
  external: ['M7 17L17 7', 'M8 7h9v9'],
  search: ['M21 21l-4.35-4.35'],
  chevronDown: ['M6 9l6 6 6-6'],
  chevronRight: ['M9 6l6 6-6 6'],
};

/* ---------------- Helpers ---------------- */
const money = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

function initials(name) {
  return (
    String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '·'
  );
}

function dayKey(iso) {
  return new Date(iso).toDateString();
}

/* ============================================================ */
export default function AdminDashboard() {
  const [lang, setLang] = useState('en');
  const t = T[lang];

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  /* language: restore + persist */
  useEffect(() => {
    const saved = localStorage.getItem('eb-lang');
    if (saved === 'en' || saved === 'es') setLang(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem('eb-lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  /* auth: profile pic + email from Google OAuth metadata */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      const m = u.user_metadata || {};
      setUser({
        email: u.email || '',
        avatar: m.avatar_url || m.picture || null,
        name: m.full_name || m.name || u.email || '',
      });
    });
  }, []);

  /* close user menu on outside click */
  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  /* payments — read the table the Stripe webhook writes to */
  async function loadPayments() {
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(
          'id, stripe_session_id, customer_name, customer_email, amount_total, payment_status, refund_status, payment_source, payment_method, payment_method_brand, payment_method_last4, receipt_url, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(500);

      if (!error && data) {
        setPayments(data.map(mapPayment));
        return;
      }

      // Fallback: RLS may block reads — try an admin API route
      const res = await fetch('/api/admin/payments', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const arr = Array.isArray(json) ? json : json.payments || json.data || [];
        setPayments(arr.map(mapPayment));
      } else {
        setPayments([]);
        setLoadError(error ? error.message : `API ${res.status}`);
      }
    } catch (err) {
      setPayments([]);
      setLoadError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function syncClover() {
    setSyncing(true);
    try {
      await fetch('/api/clover/sync', { method: 'POST' });
      await loadPayments();
    } finally {
      setSyncing(false);
    }
  }

  async function logOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  /* derived */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments
      .filter((p) => (statusFilter === 'all' ? true : p.status === statusFilter))
      .filter((p) => (sourceFilter === 'all' ? true : p.source === sourceFilter))
      .filter((p) =>
        !q
          ? true
          : p.name.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q) ||
            p.amount.toFixed(2).includes(q)
      )
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [payments, query, statusFilter, sourceFilter]);

  const stats = useMemo(() => {
    const revenue = payments
      .filter((p) => p.status === 'paid')
      .reduce((s, p) => s + p.amount, 0);
    const customers = new Set(payments.map((p) => p.email || p.name)).size;
    const stripe = payments.filter((p) => p.source === 'stripe').length;
    const clover = payments.filter((p) => p.source === 'clover').length;
    return { revenue, count: payments.length, customers, stripe, clover };
  }, [payments]);

  const orderCounts = useMemo(() => {
    const m = new Map();
    for (const p of payments) {
      const k = p.email || p.name;
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }, [payments]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const p of filtered) {
      const k = dayKey(p.date);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(p);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function groupLabel(key) {
    const d = new Date(key);
    const label = d.toLocaleDateString(dateLocale[lang], {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const isToday = key === new Date().toDateString();
    return (isToday ? `${t.today} · ` : '') + label;
  }

  function exportCsv() {
    const header = ['Name', 'Email', 'Amount', 'Status', 'Source', 'Method', 'Date', 'Receipt'];
    const rows = filtered.map((p) => [
      p.name,
      p.email,
      p.amount.toFixed(2),
      p.status,
      p.source,
      p.method,
      new Date(p.date).toISOString(),
      p.receiptUrl || '',
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payments.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const statusLabel = {
    paid: t.paid,
    pending: t.pending,
    refunded: t.refunded,
    failed: t.failed,
  };

  const SHIP = 'https://ship.erendirasboutique.com';
  const modules = [
    { icon: paths.link, label: t.paymentLinks, sub: t.managePaymentLinks, href: '/payment-links', cls: 'ebd-mod-taupe' },
    { icon: paths.gift, label: t.giftCards, sub: t.manageGiftCards, href: '/gift-cards', cls: 'ebd-mod-sand' },
    { icon: paths.box, label: t.orders, sub: t.shippingPortal, href: `${SHIP}/orders`, cls: 'ebd-mod-white', external: true },
    { icon: paths.truck, label: t.shipping, sub: t.shippingPortal, href: SHIP, cls: 'ebd-mod-white', external: true },
  ];

  return (
    <main className="ebd">
      <style>{`
        .ebd { --cream:#F5F3EF; --cream-dark:#EDEAE3; --taupe:#806a52; --taupe-dark:#6b5638;
          --ink:#3d3128; --sand:#bda891; --sand-light:#e3d9cc; --hairline:#d8d2c8;
          --row-line:#eee8dd; --muted:#a08a71;
          background: var(--cream-dark); min-height: 100vh; color: var(--ink);
          font-family: 'Recoleta', Georgia, serif; }
        .ebd * { box-sizing: border-box; }
        .ebd .serif { font-family: 'La Luxes Serif', Georgia, serif; }
        .ebd a { text-decoration: none; }
        .ebd button { font-family: inherit; cursor: pointer; border: none; background: none; }
        .ebd-wrap { max-width: 1500px; margin: 0 auto; padding: 0 24px; }
        @media (min-width: 1024px) { .ebd-wrap { padding: 0 40px; } }

        /* ---------- header ---------- */
        .ebd-header { background: var(--taupe); }
        .ebd-header-in { padding-top: 24px; padding-bottom: 22px; }
        .ebd-toprow { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .ebd-logo { height: 52px; width: auto; object-fit: contain; display: block; }
        @media (min-width: 1024px) { .ebd-logo { height: 60px; } }
        .ebd-topright { display: flex; align-items: center; gap: 12px; }
        .ebd-langs { display: flex; border: 1px solid var(--muted); border-radius: 999px; overflow: hidden; }
        .ebd-langs button { padding: 7px 15px; font-size: 12px; letter-spacing: 2px; color: var(--sand-light); }
        .ebd-langs button.on { background: var(--cream); color: var(--taupe-dark); }
        .ebd-userpill { display: flex; align-items: center; gap: 10px; border: 1px solid var(--muted);
          border-radius: 999px; padding: 5px 12px 5px 5px; color: var(--cream); }
        .ebd-avatar { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; display: block; }
        .ebd-avatar-fallback { width: 30px; height: 30px; border-radius: 50%; background: var(--sand);
          color: #fff; font-size: 11px; display: flex; align-items: center; justify-content: center; }
        .ebd-useremail { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
        @media (max-width: 640px) { .ebd-useremail { display: none; } }
        .ebd-menu-wrap { position: relative; }
        .ebd-menu { position: absolute; right: 0; top: calc(100% + 8px); z-index: 20; width: 260px;
          background: #fff; border: 1px solid var(--hairline); border-radius: 16px; overflow: hidden;
          box-shadow: 0 8px 24px rgba(61,49,40,0.12); }
        .ebd-menu-head { padding: 12px 16px; border-bottom: 1px solid var(--row-line); }
        .ebd-menu-head p { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ebd-menu-name { font-size: 14px; font-weight: 500; color: var(--ink); }
        .ebd-menu-email { font-size: 12px; color: var(--muted); }
        .ebd-menu button { display: block; width: 100%; text-align: left; padding: 12px 16px;
          font-size: 14px; color: var(--taupe-dark); }
        .ebd-menu button:hover { background: var(--cream); }

        .ebd-eyebrow { margin: 26px 0 0; font-size: 11px; letter-spacing: 0.25em; color: var(--sand-light); }
        .ebd-herorow { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between;
          column-gap: 32px; row-gap: 12px; }
        .ebd-revenue { margin: 0; line-height: 1; color: var(--cream); font-size: clamp(44px, 6vw, 72px); }
        .ebd-substats { margin: 10px 0 0; font-size: 14px; color: var(--sand-light); }
        .ebd-nav { display: flex; flex-wrap: wrap; gap: 8px; padding-bottom: 4px; }
        .ebd-nav a, .ebd-nav span { border-radius: 999px; padding: 8px 20px; font-size: 14px; }
        .ebd-nav .on { background: var(--cream); color: var(--taupe-dark); }
        .ebd-nav a { border: 1px solid var(--muted); color: var(--sand-light); }
        .ebd-nav a:hover { border-color: var(--sand-light); }

        /* ---------- modules ---------- */
        .ebd-body { padding: 32px 0; }
        .ebd-mods { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; margin-bottom: 32px; }
        @media (min-width: 1024px) { .ebd-mods { grid-template-columns: repeat(4, minmax(0,1fr)); } }
        .ebd-mod { border-radius: 16px; padding: 18px 20px; display: block; transition: transform .15s ease; }
        .ebd-mod:hover { transform: translateY(-2px); }
        .ebd-mod-taupe { background: var(--taupe); color: var(--cream); }
        .ebd-mod-sand { background: var(--sand); color: #fff; }
        .ebd-mod-white { background: #fff; border: 1px solid var(--hairline); color: var(--ink); }
        .ebd-mod-white svg { color: var(--taupe); }
        .ebd-mod-label { margin: 12px 0 0; font-size: 15px; font-weight: 500; display: flex; align-items: center; gap: 6px; }
        .ebd-mod-sub { margin: 2px 0 0; font-size: 12px; }
        .ebd-mod-taupe .ebd-mod-sub, .ebd-mod-sand .ebd-mod-sub { color: var(--sand-light); }
        .ebd-mod-white .ebd-mod-sub { color: var(--muted); }
        .ebd-mod-white .ebd-ext { color: var(--muted); }

        /* ---------- toolbar ---------- */
        .ebd-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 26px; }
        .ebd-search { flex: 1; min-width: 240px; display: flex; align-items: center; gap: 8px;
          background: #fff; border: 1px solid var(--hairline); border-radius: 999px; padding: 10px 16px; }
        .ebd-search svg { color: var(--muted); flex-shrink: 0; }
        .ebd-search input { border: none; outline: none; background: transparent; width: 100%;
          font-size: 14px; color: var(--ink); font-family: inherit; }
        .ebd-search input::placeholder { color: var(--muted); }
        .ebd-select { appearance: none; background: #fff; border: 1px solid var(--hairline);
          border-radius: 999px; padding: 10px 34px 10px 16px; font-size: 14px; color: var(--taupe-dark);
          font-family: inherit; outline: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a08a71' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center; }
        .ebd-btn { border-radius: 999px; padding: 10px 20px; font-size: 14px; }
        .ebd-btn-taupe { background: var(--taupe); color: var(--cream); }
        .ebd-btn-taupe:disabled { opacity: .6; cursor: default; }
        .ebd-btn-white { background: #fff; border: 1px solid var(--hairline); color: var(--taupe-dark); }
        .ebd-btn-white:hover { background: var(--cream); }

        /* ---------- list ---------- */
        .ebd-error { background: #f3e4dc; border: 1px solid #e0c4b4; color: #8a4a2e; border-radius: 12px;
          padding: 12px 16px; font-size: 13px; margin-bottom: 20px; }
        .ebd-groupdate { margin: 0 0 10px; font-size: 11px; text-transform: uppercase;
          letter-spacing: 0.25em; color: var(--muted); }
        .ebd-group { margin-bottom: 28px; }
        .ebd-list { background: #fff; border: 1px solid var(--hairline); border-radius: 16px; overflow: hidden; }
        .ebd-row { display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
        @media (min-width: 1024px) { .ebd-row { padding: 14px 24px; } }
        .ebd-row + .ebd-row { border-top: 1px solid var(--row-line); }
        .ebd-row-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--cream-dark);
          color: var(--taupe); font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ebd-row-main { flex: 1; min-width: 0; }
        .ebd-row-name { margin: 0; font-size: 15px; font-weight: 500; color: var(--ink);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ebd-row-meta { margin: 0; font-size: 12px; color: var(--muted);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ebd-badge { border-radius: 999px; padding: 4px 12px; font-size: 10px; letter-spacing: 2px;
          text-transform: uppercase; flex-shrink: 0; }
        .ebd-badge-source { border: 1px solid var(--hairline); color: var(--taupe-dark); }
        @media (max-width: 640px) { .ebd-badge-source { display: none; } }
        .ebd-badge-paid { background: #e7efe0; color: #3b5a2a; }
        .ebd-badge-warn { background: #f3e4dc; color: #8a4a2e; }
        .ebd-row-amount { min-width: 92px; text-align: right; font-size: 18px; color: var(--ink); flex-shrink: 0; }
        .ebd-row-receipt { color: var(--muted); display: flex; align-items: center; }
        .ebd-row-receipt:hover { color: var(--taupe); }
        @media (max-width: 640px) { .ebd-row-receipt { display: none; } }
        .ebd-empty { background: #fff; border: 1px solid var(--hairline); border-radius: 16px;
          padding: 64px 24px; text-align: center; }
        .ebd-empty-title { margin: 0; font-size: 16px; color: var(--ink); }
        .ebd-empty-hint { margin: 4px 0 0; font-size: 14px; color: var(--muted); }
        .ebd-loading { padding: 64px 0; text-align: center; font-size: 14px; color: var(--muted); }

        @media print {
          .ebd-header, .ebd-mods, .ebd-toolbar { display: none !important; }
          .ebd { background: #fff; }
        }
      `}</style>

      {/* ============ Taupe hero header ============ */}
      <header className="ebd-header">
        <div className="ebd-wrap ebd-header-in">
          <div className="ebd-toprow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo2.png" alt="Erendira's Boutique" className="ebd-logo" />

            <div className="ebd-topright">
              <div className="ebd-langs" role="group" aria-label="Language">
                {['en', 'es'].map((l) => (
                  <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="ebd-menu-wrap" ref={menuRef}>
                <button
                  className="ebd-userpill"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  {user && user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt="" referrerPolicy="no-referrer" className="ebd-avatar" />
                  ) : (
                    <span className="ebd-avatar-fallback">{initials(user?.name || user?.email)}</span>
                  )}
                  <span className="ebd-useremail">{user ? user.email : '…'}</span>
                  <Icon d={paths.chevronDown} size={14} />
                </button>

                {menuOpen && (
                  <div className="ebd-menu" role="menu">
                    <div className="ebd-menu-head">
                      <p className="ebd-menu-name">{user?.name}</p>
                      <p className="ebd-menu-email">
                        {user?.email} · {t.owner}
                      </p>
                    </div>
                    <button role="menuitem" onClick={logOut}>
                      {t.logOut}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="ebd-eyebrow">{t.eyebrow}</p>
          <div className="ebd-herorow">
            <div>
              <p className="ebd-revenue serif">{money(stats.revenue)}</p>
              <p className="ebd-substats">
                {t.totalRevenue} · {stats.count} {t.payments} · {stats.customers} {t.customers} ·{' '}
                {t.stripeClover} {stats.stripe} / {stats.clover}
              </p>
            </div>

            <nav className="ebd-nav">
              <span className="on">{t.dashboard}</span>
              <a href="/payment-links">{t.paymentLinks}</a>
              <a href="/gift-cards">{t.giftCards}</a>
            </nav>
          </div>
        </div>
      </header>

      {/* ============ Body ============ */}
      <div className="ebd-wrap ebd-body">
        {/* module buttons */}
        <div className="ebd-mods">
          {modules.map((m) => (
            <a
              key={m.label}
              href={m.href}
              className={`ebd-mod ${m.cls}`}
              target={m.external ? '_blank' : undefined}
              rel={m.external ? 'noopener noreferrer' : undefined}
            >
              <Icon d={m.icon} extra={m.icon === paths.truck ? (
                <>
                  <circle cx="7" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                </>
              ) : m.icon === paths.search ? <circle cx="11" cy="11" r="7" /> : null} />
              <p className="ebd-mod-label">
                {m.label}
                {m.external && (
                  <span className="ebd-ext">
                    <Icon d={paths.external} size={12} />
                  </span>
                )}
              </p>
              <p className="ebd-mod-sub">{m.sub}</p>
            </a>
          ))}
        </div>

        {/* toolbar */}
        <div className="ebd-toolbar">
          <label className="ebd-search">
            <Icon d={paths.search} size={16} extra={<circle cx="11" cy="11" r="7" />} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
            />
          </label>

          <select className="ebd-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{t.allStatuses}</option>
            <option value="paid">{t.paid}</option>
            <option value="pending">{t.pending}</option>
            <option value="refunded">{t.refunded}</option>
            <option value="failed">{t.failed}</option>
          </select>

          <select className="ebd-select" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="all">{t.allSources}</option>
            <option value="stripe">Stripe</option>
            <option value="clover">Clover</option>
          </select>

          <button className="ebd-btn ebd-btn-taupe" onClick={syncClover} disabled={syncing}>
            {syncing ? t.syncing : t.syncClover}
          </button>
          <button className="ebd-btn ebd-btn-white" onClick={exportCsv}>
            {t.exportCsv}
          </button>
          <button className="ebd-btn ebd-btn-white" onClick={() => window.print()}>
            {t.print}
          </button>
        </div>

        {loadError && (
          <div className="ebd-error">
            {t.loadError}: {loadError}
          </div>
        )}

        {/* payments — one list per date group */}
        {loading ? (
          <p className="ebd-loading">{t.loading}</p>
        ) : groups.length === 0 ? (
          <div className="ebd-empty">
            <p className="ebd-empty-title serif">{t.noPayments}</p>
            <p className="ebd-empty-hint">{t.noPaymentsHint}</p>
          </div>
        ) : (
          groups.map(([key, rows]) => (
            <section className="ebd-group" key={key}>
              <p className="ebd-groupdate">{groupLabel(key)}</p>
              <div className="ebd-list">
                {rows.map((p) => {
                  const n = orderCounts.get(p.email || p.name) || 1;
                  return (
                    <div className="ebd-row" key={p.id}>
                      <span className="ebd-row-avatar">{initials(p.name)}</span>
                      <div className="ebd-row-main">
                        <p className="ebd-row-name">{p.name}</p>
                        <p className="ebd-row-meta">
                          {p.email && `${p.email} · `}
                          {p.method} · {n} {n === 1 ? t.order : t.ordersWord}
                        </p>
                      </div>
                      <span className="ebd-badge ebd-badge-source">{p.source}</span>
                      <span
                        className={`ebd-badge ${p.status === 'paid' ? 'ebd-badge-paid' : 'ebd-badge-warn'}`}
                      >
                        {statusLabel[p.status] || p.status}
                      </span>
                      <span className="ebd-row-amount serif">{money(p.amount)}</span>
                      {p.receiptUrl ? (
                        <a
                          className="ebd-row-receipt"
                          href={p.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Receipt"
                        >
                          <Icon d={paths.chevronRight} size={16} />
                        </a>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
