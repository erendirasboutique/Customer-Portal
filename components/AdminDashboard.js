'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { money, formatDate, formatAddress, paymentMethodLabel } from '@/lib/format';

/* ============================================================
   Erendira's Boutique — Admin Studio · Dashboard
   "Studio" design: floating cream canvas, white rounded cards.
   Same props: <AdminDashboard payments={...} admin={...} />
   Same endpoints: /api/admin/clover-sync, /api/admin/payment-notes.
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

/* ---------------- Translations ---------------- */
const T = {
  en: {
    eyebrow: 'ADMIN STUDIO',
    title: 'Billing Portal',
    sub: 'Review payments, sync Clover, and keep notes on every order.',
    todayLabel: 'Today',
    todayCaption: 'payments taken',
    revenue: 'Revenue',
    revenueCap: 'All-time collected',
    filteredRevenue: 'Filtered revenue',
    filteredCap: 'Matching these filters',
    payments: 'Payments',
    paymentsCap: 'Records shown',
    customers: 'Customers',
    customersCap: 'Unique emails',
    sources: 'Stripe / Clover',
    sourcesCap: 'Payments by source',
    startHere: 'START HERE',
    quickActions: 'Quick Actions',
    ctaSync: 'Sync Clover',
    ctaSyncSub: 'Pull in the latest in-store payments',
    ctaSyncGo: 'Run',
    ctaLink: 'New payment link',
    ctaLinkSub: 'Create a Stripe link for a customer',
    ctaLinkGo: 'Open',
    ledger: 'PAYMENT LEDGER',
    ledgerTitle: 'Recent Payments',
    search: 'Search name, email, phone, amount...',
    allStatuses: 'All statuses',
    allSources: 'All sources',
    paid: 'Paid',
    shipped: 'Shipped',
    delivered: 'Delivered',
    refunded: 'Refunded',
    unpaid: 'Unpaid',
    unknown: 'Unknown',
    syncingClover: 'Syncing Clover payments...',
    syncedClover: 'Clover synced: ',
    syncFailed: 'Could not sync Clover.',
    paymentWord: 'payment(s).',
    exportCsv: 'Export CSV',
    print: 'Print',
    today: 'Today',
    order: 'order',
    ordersWord: 'orders',
    noPayments: 'No payments match these filters. Clear the search to see everything.',
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
    tipLabel: 'Quick tip',
    tipBody: 'Clover payments only appear after a sync. Run it once at the end of the day.',
  },
  es: {
    eyebrow: 'ADMIN STUDIO',
    title: 'Portal de Pagos',
    sub: 'Revisa pagos, sincroniza Clover y guarda notas de cada pedido.',
    todayLabel: 'Hoy',
    todayCaption: 'pagos recibidos',
    revenue: 'Ingresos',
    revenueCap: 'Cobrado hist\u00f3rico',
    filteredRevenue: 'Ingresos filtrados',
    filteredCap: 'Seg\u00fan los filtros',
    payments: 'Pagos',
    paymentsCap: 'Registros mostrados',
    customers: 'Clientas',
    customersCap: 'Correos \u00fanicos',
    sources: 'Stripe / Clover',
    sourcesCap: 'Pagos por fuente',
    startHere: 'EMPIEZA AQU\u00cd',
    quickActions: 'Acciones R\u00e1pidas',
    ctaSync: 'Sincronizar Clover',
    ctaSyncSub: 'Trae los \u00faltimos pagos de la tienda',
    ctaSyncGo: 'Correr',
    ctaLink: 'Nuevo enlace de pago',
    ctaLinkSub: 'Crea un enlace de Stripe para una clienta',
    ctaLinkGo: 'Abrir',
    ledger: 'LIBRO DE PAGOS',
    ledgerTitle: 'Pagos Recientes',
    search: 'Buscar nombre, correo, tel\u00e9fono, monto...',
    allStatuses: 'Todos los estados',
    allSources: 'Todas las fuentes',
    paid: 'Pagado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    refunded: 'Reembolsado',
    unpaid: 'Sin pagar',
    unknown: 'Desconocido',
    syncingClover: 'Sincronizando pagos de Clover...',
    syncedClover: 'Clover sincronizado: ',
    syncFailed: 'No se pudo sincronizar Clover.',
    paymentWord: 'pago(s).',
    exportCsv: 'Exportar CSV',
    print: 'Imprimir',
    today: 'Hoy',
    order: 'pedido',
    ordersWord: 'pedidos',
    noPayments: 'Ning\u00fan pago coincide. Borra la b\u00fasqueda para ver todo.',
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
    tipLabel: 'Tip r\u00e1pido',
    tipBody: 'Los pagos de Clover aparecen solo despu\u00e9s de sincronizar. Corre la sincronizaci\u00f3n al final del d\u00eda.',
  },
};

const dateLocale = { en: 'en-US', es: 'es-MX' };

function Icon(props) {
  return (
    <svg width={props.size || 15} height={props.size || 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {props.children}
    </svg>
  );
}
const IconSearch = function () { return (<Icon><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></Icon>); };

const pageCss = '' +
'.ebd-daylabel { margin:22px 2px 10px; font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:#bda891; }' +
'.ebd-daylabel:first-of-type { margin-top:6px; }' +
'.ebd-detail { padding:4px 4px 8px; display:grid; gap:12px; }' +
'.ebd-links { display:flex; flex-wrap:wrap; gap:7px; }' +
'.ebd-open { background:#FFFFFF !important; border-color:#e8e2d8 !important; }';

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

  useEffect(function () {
    const saved = localStorage.getItem('eb-lang');
    if (saved === 'en' || saved === 'es') setLangState(saved);
  }, []);

  /* -------- data derivations -------- */
  const enriched = useMemo(function () {
    return (payments || []).map(function (p) { return { ...p, _status: orderStatus(p) }; });
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

  function dayKeyLocalized(dt) {
    if (!dt) return 'Unknown date';
    return new Date(dt).toLocaleDateString(dateLocale[lang], { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const todayCount = useMemo(function () {
    const todayKey = dayKeyLocalized(new Date().toISOString());
    return (payments || []).filter(function (p) { return dayKeyLocalized(p.created_at) === todayKey; }).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, lang]);

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

  function rowKey(p) { return p.id || p.stripe_session_id || p.clover_payment_id; }
  function statusText(s) { return t[s] || s; }
  function pillClass(s) {
    if (s === 'paid' || s === 'delivered') return 'eba-pill ok';
    if (s === 'refunded' || s === 'unpaid') return 'eba-pill off';
    return 'eba-pill mid';
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

  function clearFilters() { setQ(''); setStatus('all'); setSource('all'); }

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

      <section className="eba-stats no-print" aria-label="Summary">
        <button className="eba-stat" type="button" onClick={clearFilters}>
          <span className="lb">{isFiltered ? t.filteredRevenue : t.revenue}</span>
          <b>{money(total)}</b>
          <span className="cap">{isFiltered ? t.filteredCap : t.revenueCap}</span>
        </button>
        <button className="eba-stat" type="button" onClick={clearFilters}>
          <span className="lb">{t.payments}</span>
          <b>{filtered.length}</b>
          <span className="cap">{t.paymentsCap}</span>
        </button>
        <button className="eba-stat" type="button" onClick={function () { setStatus('all'); }}>
          <span className="lb">{t.customers}</span>
          <b>{customers}</b>
          <span className="cap">{t.customersCap}</span>
        </button>
        <button className="eba-stat" type="button" onClick={function () { setSource(source === 'stripe' ? 'clover' : 'stripe'); }}>
          <span className="lb">{t.sources}</span>
          <b>{stripeCount} / {cloverCount}</b>
          <span className="cap">{t.sourcesCap}</span>
        </button>
      </section>

      <div className="eba-cols wide-left">
        <div className="eba-panel no-print">
          <p className="eba-eyebrow">{t.startHere}</p>
          <h2>{t.quickActions}</h2>

          <button className="eba-cta" type="button" onClick={syncCloverPayments}>
            <span>
              <h3>{t.ctaSync}</h3>
              <p>{t.ctaSyncSub}</p>
            </span>
            <span className="go">{t.ctaSyncGo} &rarr;</span>
          </button>

          <a className="eba-cta eba-cta-quiet" href="/admin/payment-links">
            <span>
              <h3>{t.ctaLink}</h3>
              <p>{t.ctaLinkSub}</p>
            </span>
            <span className="go">{t.ctaLinkGo} &rarr;</span>
          </a>

          <div className="eba-actions">
            <button className="eba-btn" onClick={exportCsv}>{t.exportCsv}</button>
            <button className="eba-btn" onClick={function () { window.print(); }}>{t.print}</button>
          </div>

          {notice && <div className="eba-notice">{notice}</div>}
        </div>

        <div className="eba-panel">
          <p className="eba-eyebrow">{t.ledger}</p>
          <h2>{t.ledgerTitle}</h2>

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
          </div>

          {groups.map(function (g) {
            return (
              <div key={g.label}>
                <p className="ebd-daylabel">{g.label}</p>
                <div className="eba-rows">
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
                      <div key={key}>
                        <button
                          className={open ? 'eba-row ebd-open' : 'eba-row'}
                          onClick={function () { setExpandedId(open ? null : key); }}
                          aria-expanded={open}
                        >
                          <span className="eba-who">
                            <span className="n">{p.customer_name || t.customer}</span>
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
                                {t.statusWord}: {p.payment_status || '\u2014'}{p.refund_status ? ' \u00b7 ' + t.refundWord + ': ' + p.refund_status : ''}
                              </div>
                              <div className="eba-cell">
                                <span className="lb">{t.customerTotals}</span>
                                {t.ordersWord}: {orders}<br />
                                {t.lifetime}: {money(customerTotals.get(p.customer_email || 'unknown') || 0, p.currency)}<br />
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
      </div>
    </AdminShell>
  );
}
