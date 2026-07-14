'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

/* ============================================================
   Erendira's Boutique — Billing Dashboard (Admin Studio)
   Drop-in replacement for the dashboard page.
   Requirements:
   - /public/logo2.png  (light version of the logo, shown on taupe)
   - NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY env vars
   - Payments come from GET /api/payments (same data the old page used).
     Expected: an array of objects; field names are mapped leniently below.
   ============================================================ */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ---------------- Brand ---------------- */
const C = {
  cream: '#F5F3EF',
  creamDark: '#EDEAE3',
  taupe: '#806a52',
  taupeDark: '#6b5638',
  ink: '#3d3128',
  sand: '#bda891',
  sandLight: '#e3d9cc',
  hairline: '#d8d2c8',
  rowLine: '#eee8dd',
  muted: '#a08a71',
  paidBg: '#e7efe0',
  paidText: '#3b5a2a',
  pendingBg: '#f3e4dc',
  pendingText: '#8a4a2e',
};

const SERIF = "'La Luxes Serif', Georgia, serif";
const BODY = "'Recoleta', Georgia, serif";

/* ---------------- Translations ---------------- */
type Lang = 'en' | 'es';

const T: Record<Lang, Record<string, string>> = {
  en: {
    eyebrow: "ERENDIRA'S BOUTIQUE · ADMIN STUDIO",
    totalRevenue: 'Total revenue',
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
    recentPayments: 'Recent payments',
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
    owner: 'Propietario',
    recentPayments: 'Pagos recientes',
  },
};

const dateLocale: Record<Lang, string> = { en: 'en-US', es: 'es-MX' };

/* ---------------- Types + lenient mapping ---------------- */
type Payment = {
  id: string;
  name: string;
  email: string;
  amount: number; // dollars
  status: 'paid' | 'pending' | 'refunded' | 'failed';
  source: 'stripe' | 'clover';
  method: string;
  orderCount: number;
  date: string; // ISO
};

function mapPayment(raw: any, i: number): Payment {
  const amountRaw =
    raw.amount ?? raw.amount_total ?? raw.total ?? raw.amount_cents ?? 0;
  const amount =
    raw.amount_cents != null || (raw.amount_total != null && amountRaw > 5000)
      ? Number(amountRaw) / 100
      : Number(amountRaw);
  return {
    id: String(raw.id ?? raw.payment_id ?? i),
    name: raw.name ?? raw.customer_name ?? raw.customer?.name ?? 'Customer',
    email: raw.email ?? raw.customer_email ?? raw.customer?.email ?? '',
    amount: isFinite(amount) ? amount : 0,
    status: (raw.status ?? 'paid').toLowerCase(),
    source: (raw.source ?? raw.provider ?? 'stripe').toLowerCase(),
    method: raw.method ?? raw.payment_method ?? raw.payment_method_type ?? 'card',
    orderCount: Number(raw.order_count ?? raw.orders ?? 1),
    date: raw.date ?? raw.created_at ?? raw.created ?? new Date().toISOString(),
  } as Payment;
}

/* ---------------- Icons (inline, no deps) ---------------- */
const ic = {
  link: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 15l6-6"/><path d="M11 6l.5-.5a4.95 4.95 0 017 7L18 13"/><path d="M13 18l-.5.5a4.95 4.95 0 01-7-7L6 11"/></svg>
  ),
  gift: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 010-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 010 5"/></svg>
  ),
  box: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 12l8-4.5"/><path d="M12 12v9"/><path d="M12 12L4 7.5"/></svg>
  ),
  truck: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17H3V6a1 1 0 011-1h9v12M9 17h6M15 8h4l2 3v6h-2"/></svg>
  ),
  external: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
  ),
  chevron: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
  ),
};

/* ---------------- Small helpers ---------------- */
const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '·';
}

function dayKey(iso: string) {
  return new Date(iso).toDateString();
}

/* ============================================================ */
export default function BillingDashboard() {
  const [lang, setLang] = useState<Lang>('en');
  const t = T[lang];

  const [user, setUser] = useState<{ email: string; avatar: string | null; name: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
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
      const m: any = u.user_metadata || {};
      setUser({
        email: u.email ?? '',
        avatar: m.avatar_url ?? m.picture ?? null,
        name: m.full_name ?? m.name ?? u.email ?? '',
      });
    });
  }, []);

  /* close user menu on outside click */
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  /* payments */
  async function loadPayments() {
    try {
      const res = await fetch('/api/payments', { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const arr = Array.isArray(json) ? json : json.payments ?? json.data ?? [];
      setPayments(arr.map(mapPayment));
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadPayments();
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

  const groups = useMemo(() => {
    const map = new Map<string, Payment[]>();
    for (const p of filtered) {
      const k = dayKey(p.date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function groupLabel(key: string) {
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
    const header = ['Name', 'Email', 'Amount', 'Status', 'Source', 'Method', 'Date'];
    const rows = filtered.map((p) => [
      p.name,
      p.email,
      p.amount.toFixed(2),
      p.status,
      p.source,
      p.method,
      new Date(p.date).toISOString(),
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

  const statusBadge = (s: Payment['status']) => {
    const paidLike = s === 'paid';
    return {
      background: paidLike ? C.paidBg : C.pendingBg,
      color: paidLike ? C.paidText : C.pendingText,
    };
  };

  const statusLabel: Record<string, string> = {
    paid: t.paid,
    pending: t.pending,
    refunded: t.refunded,
    failed: t.failed,
  };

  /* module buttons */
  const SHIP = 'https://ship.erendirasboutique.com';
  const modules = [
    { icon: ic.link, label: t.paymentLinks, sub: t.managePaymentLinks, href: '/payment-links', external: false, filled: true },
    { icon: ic.gift, label: t.giftCards, sub: t.manageGiftCards, href: '/gift-cards', external: false, filled: false, sandFill: true },
    { icon: ic.box, label: t.orders, sub: t.shippingPortal, href: `${SHIP}/orders`, external: true },
    { icon: ic.truck, label: t.shipping, sub: t.shippingPortal, href: SHIP, external: true },
  ];

  return (
    <main
      style={{ background: C.creamDark, minHeight: '100vh', fontFamily: BODY, color: C.ink }}
    >
      {/* ============ Taupe hero header ============ */}
      <header style={{ background: C.taupe }} className="print:hidden">
        <div className="mx-auto w-full max-w-[1500px] px-6 pt-6 pb-5 lg:px-10">
          {/* top row: logo · lang + user */}
          <div className="flex items-center justify-between gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo2.png"
              alt="Erendira's Boutique"
              className="h-12 w-auto lg:h-14"
              style={{ objectFit: 'contain' }}
            />

            <div className="flex items-center gap-3">
              {/* EN / ES toggle */}
              <div
                className="flex overflow-hidden rounded-full"
                style={{ border: `1px solid ${C.muted}` }}
                role="group"
                aria-label="Language"
              >
                {(['en', 'es'] as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className="px-3.5 py-1.5 text-xs tracking-widest transition-colors"
                    style={{
                      background: lang === l ? C.cream : 'transparent',
                      color: lang === l ? C.taupeDark : C.sandLight,
                    }}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* user pill */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 transition-colors"
                  style={{ border: `1px solid ${C.muted}`, color: C.cream }}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  {user?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[11px]"
                      style={{ background: C.sand, color: '#fff' }}
                    >
                      {initials(user?.name || user?.email || '·')}
                    </span>
                  )}
                  <span className="hidden max-w-[220px] truncate text-sm sm:block">
                    {user?.email ?? '…'}
                  </span>
                  <span style={{ color: C.sandLight }}>{ic.chevron}</span>
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl bg-white"
                    style={{ border: `1px solid ${C.hairline}`, boxShadow: '0 8px 24px rgba(61,49,40,0.12)' }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.rowLine}` }}>
                      <p className="m-0 truncate text-sm font-medium" style={{ color: C.ink }}>
                        {user?.name}
                      </p>
                      <p className="m-0 truncate text-xs" style={{ color: C.muted }}>
                        {user?.email} · {t.owner}
                      </p>
                    </div>
                    <button
                      role="menuitem"
                      onClick={logOut}
                      className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[#F5F3EF]"
                      style={{ color: C.taupeDark }}
                    >
                      {t.logOut}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* hero numbers */}
          <p className="mt-6 mb-0 text-[11px] tracking-[0.25em]" style={{ color: C.sandLight }}>
            {t.eyebrow}
          </p>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div>
              <p
                className="m-0 leading-none"
                style={{ fontFamily: SERIF, fontSize: 'clamp(44px, 6vw, 72px)', color: C.cream }}
              >
                {money(stats.revenue)}
              </p>
              <p className="mb-0 mt-2 text-sm" style={{ color: C.sandLight }}>
                {t.totalRevenue} · {stats.count} {t.payments} · {stats.customers} {t.customers} ·{' '}
                {t.stripeClover} {stats.stripe} / {stats.clover}
              </p>
            </div>

            {/* pill nav */}
            <nav className="flex flex-wrap gap-2 pb-1">
              <span
                className="rounded-full px-5 py-2 text-sm"
                style={{ background: C.cream, color: C.taupeDark }}
              >
                {t.dashboard}
              </span>
              <a
                href="/payment-links"
                className="rounded-full px-5 py-2 text-sm no-underline transition-colors"
                style={{ border: `1px solid ${C.muted}`, color: C.sandLight }}
              >
                {t.paymentLinks}
              </a>
              <a
                href="/gift-cards"
                className="rounded-full px-5 py-2 text-sm no-underline"
                style={{ border: `1px solid ${C.muted}`, color: C.sandLight }}
              >
                {t.giftCards}
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* ============ Body ============ */}
      <div className="mx-auto w-full max-w-[1500px] px-6 py-8 lg:px-10">
        {/* module buttons */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 print:hidden">
          {modules.map((m) => {
            const filled = 'filled' in m && m.filled;
            const sandFill = 'sandFill' in m && (m as any).sandFill;
            const bg = filled ? C.taupe : sandFill ? C.sand : '#fff';
            const fg = filled || sandFill ? C.cream : C.ink;
            const sub = filled || sandFill ? C.sandLight : C.muted;
            return (
              <a
                key={m.label}
                href={m.href}
                target={m.external ? '_blank' : undefined}
                rel={m.external ? 'noopener noreferrer' : undefined}
                className="group rounded-2xl p-4 no-underline transition-transform hover:-translate-y-0.5 lg:p-5"
                style={{
                  background: bg,
                  border: filled || sandFill ? 'none' : `1px solid ${C.hairline}`,
                }}
              >
                <span style={{ color: filled || sandFill ? C.cream : C.taupe }}>{m.icon}</span>
                <p className="mb-0 mt-3 flex items-center gap-1.5 text-[15px] font-medium" style={{ color: fg }}>
                  {m.label}
                  {m.external && <span style={{ color: sub }}>{ic.external}</span>}
                </p>
                <p className="m-0 mt-0.5 text-xs" style={{ color: sub }}>
                  {m.sub}
                </p>
              </a>
            );
          })}
        </div>

        {/* toolbar */}
        <div className="mb-6 flex flex-wrap items-center gap-2.5 print:hidden">
          <label
            className="flex min-w-[240px] flex-1 items-center gap-2 rounded-full bg-white px-4 py-2.5"
            style={{ border: `1px solid ${C.hairline}` }}
          >
            <span style={{ color: C.muted }}>{ic.search}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: C.ink, fontFamily: BODY }}
            />
          </label>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full bg-white px-4 py-2.5 text-sm outline-none"
            style={{ border: `1px solid ${C.hairline}`, color: C.taupeDark, fontFamily: BODY }}
          >
            <option value="all">{t.allStatuses}</option>
            <option value="paid">{t.paid}</option>
            <option value="pending">{t.pending}</option>
            <option value="refunded">{t.refunded}</option>
            <option value="failed">{t.failed}</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-full bg-white px-4 py-2.5 text-sm outline-none"
            style={{ border: `1px solid ${C.hairline}`, color: C.taupeDark, fontFamily: BODY }}
          >
            <option value="all">{t.allSources}</option>
            <option value="stripe">Stripe</option>
            <option value="clover">Clover</option>
          </select>

          <button
            onClick={syncClover}
            disabled={syncing}
            className="rounded-full px-5 py-2.5 text-sm transition-opacity disabled:opacity-60"
            style={{ background: C.taupe, color: C.cream }}
          >
            {syncing ? t.syncing : t.syncClover}
          </button>
          <button
            onClick={exportCsv}
            className="rounded-full bg-white px-5 py-2.5 text-sm"
            style={{ border: `1px solid ${C.hairline}`, color: C.taupeDark }}
          >
            {t.exportCsv}
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-full bg-white px-5 py-2.5 text-sm"
            style={{ border: `1px solid ${C.hairline}`, color: C.taupeDark }}
          >
            {t.print}
          </button>
        </div>

        {/* payments — one list, date-grouped rows */}
        {loading ? (
          <p className="py-16 text-center text-sm" style={{ color: C.muted }}>
            {t.loading}
          </p>
        ) : groups.length === 0 ? (
          <div
            className="rounded-2xl bg-white px-6 py-16 text-center"
            style={{ border: `1px solid ${C.hairline}` }}
          >
            <p className="m-0 text-base" style={{ fontFamily: SERIF, color: C.ink }}>
              {t.noPayments}
            </p>
            <p className="mb-0 mt-1 text-sm" style={{ color: C.muted }}>
              {t.noPaymentsHint}
            </p>
          </div>
        ) : (
          groups.map(([key, rows]) => (
            <section key={key} className="mb-7">
              <p
                className="mb-2.5 text-[11px] uppercase tracking-[0.25em]"
                style={{ color: C.muted }}
              >
                {groupLabel(key)}
              </p>
              <div
                className="overflow-hidden rounded-2xl bg-white"
                style={{ border: `1px solid ${C.hairline}` }}
              >
                {rows.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3.5 lg:px-6"
                    style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.rowLine}` }}
                  >
                    <span
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs"
                      style={{ background: C.creamDark, color: C.taupe }}
                    >
                      {initials(p.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-[15px] font-medium" style={{ color: C.ink }}>
                        {p.name}
                      </p>
                      <p className="m-0 truncate text-xs" style={{ color: C.muted }}>
                        {p.email && `${p.email} · `}
                        {p.method} · {p.orderCount}{' '}
                        {p.orderCount === 1 ? t.order : t.ordersWord}
                      </p>
                    </div>
                    <span
                      className="hidden rounded-full px-3 py-1 text-[10px] uppercase tracking-widest sm:inline"
                      style={{ border: `1px solid ${C.hairline}`, color: C.taupeDark }}
                    >
                      {p.source}
                    </span>
                    <span
                      className="rounded-full px-3 py-1 text-[10px] uppercase tracking-widest"
                      style={statusBadge(p.status)}
                    >
                      {statusLabel[p.status] ?? p.status}
                    </span>
                    <span
                      className="min-w-[92px] text-right text-lg"
                      style={{ fontFamily: SERIF, color: C.ink }}
                    >
                      {money(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
