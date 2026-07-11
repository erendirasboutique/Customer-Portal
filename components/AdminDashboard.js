'use client';

import { Fragment, useMemo, useState } from 'react';
import { money, formatDate, formatAddress, paymentMethodLabel } from '@/lib/format';
import LanguageToggle from './LanguageToggle';

function stripeUrl(kind, id) {
  if (!id) return '';
  if (kind === 'customer') return 'https://dashboard.stripe.com/customers/' + id;
  if (kind === 'payment') return 'https://dashboard.stripe.com/payments/' + id;
  if (kind === 'session') return 'https://dashboard.stripe.com/payments/checkout/' + id;
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

function statusLabel(status) {
  const labels = { paid: 'Paid', shipped: 'Shipped', delivered: 'Delivered', refunded: 'Refunded', unpaid: 'Unpaid', unknown: 'Unknown' };
  return labels[status] || status;
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

function dayKey(dt) {
  if (!dt) return 'Unknown date';
  return new Date(dt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

var css = '' +
'.eb-admin { min-height: 100vh; background: #e9e3d9; color: #332b23; font-family: inherit; padding: 24px 16px 64px; }' +
'.eb-wrap { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 24px; }' +
'@media (min-width: 1024px) { .eb-wrap { grid-template-columns: 232px 1fr; } }' +
'.eb-side { background: #fff; border: 0.5px solid rgba(128,106,82,0.3); border-radius: 24px; padding: 24px; align-self: start; position: sticky; top: 24px; }' +
'.eb-side img { width: 120px; height: auto; }' +
'.eb-side h2 { font-size: 26px; color: #806a52; margin: 14px 0 2px; font-weight: 400; }' +
'.eb-side .eb-email { font-size: 12px; color: rgba(51,43,35,0.65); margin: 0; word-break: break-all; }' +
'.eb-rolepill { display: inline-block; margin-top: 8px; border: 0.5px solid rgba(128,106,82,0.45); background: #e9e3d9; color: #5c4d3b; border-radius: 999px; padding: 2px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }' +
'.eb-nav { display: flex; flex-direction: column; gap: 8px; margin-top: 18px; }' +
'.eb-nav a, .eb-nav button { display: block; width: 100%; box-sizing: border-box; text-align: center; border-radius: 999px; padding: 10px 14px; font-size: 13px; text-decoration: none; cursor: pointer; font-family: inherit; }' +
'.eb-nav .on { background: #806a52; color: #e9e3d9; border: 0.5px solid #806a52; }' +
'.eb-nav .off { background: transparent; color: #806a52; border: 0.5px solid rgba(128,106,82,0.4); }' +
'.eb-nav .off:hover { background: rgba(128,106,82,0.08); }' +
'.eb-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; }' +
'.eb-eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: 0.3em; color: #806a52; margin: 0; }' +
'.eb-head h1 { font-size: 40px; color: #806a52; margin: 2px 0 0; font-weight: 400; }' +
'.eb-stats { display: flex; flex-wrap: wrap; background: #fff; border: 0.5px solid rgba(128,106,82,0.25); border-radius: 20px; margin-top: 16px; padding: 16px 0; }' +
'.eb-stat { flex: 1; min-width: 120px; padding: 0 20px; border: 0; background: none; text-align: left; cursor: pointer; font-family: inherit; }' +
'.eb-stat + .eb-stat { border-left: 0.5px solid rgba(128,106,82,0.2); }' +
'.eb-stat span { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #806a52; }' +
'.eb-stat b { display: block; font-size: 24px; color: #806a52; font-weight: 400; margin-top: 4px; }' +
'.eb-bar { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; align-items: center; }' +
'.eb-search { flex: 1; min-width: 200px; }' +
'.eb-in { box-sizing: border-box; border: 0.5px solid rgba(128,106,82,0.35); border-radius: 999px; background: #fff; padding: 10px 16px; font-size: 13px; color: #332b23; font-family: inherit; outline: none; width: 100%; }' +
'.eb-in:focus { border-color: #806a52; }' +
'select.eb-in { width: auto; }' +
'.eb-btn { border: 0; border-radius: 999px; padding: 10px 18px; font-size: 13px; cursor: pointer; font-family: inherit; }' +
'.eb-btn.solid { background: #806a52; color: #e9e3d9; }' +
'.eb-btn.solid:hover { opacity: 0.92; }' +
'.eb-btn.line { background: #fff; color: #806a52; border: 0.5px solid rgba(128,106,82,0.4); }' +
'.eb-btn.line:hover { background: rgba(128,106,82,0.08); }' +
'.eb-notice { margin-top: 12px; background: #fff; border: 0.5px solid rgba(128,106,82,0.3); border-radius: 16px; padding: 10px 16px; font-size: 13px; color: #806a52; }' +
'.eb-daylabel { font-size: 10px; text-transform: uppercase; letter-spacing: 0.25em; color: #806a52; margin: 22px 0 8px; }' +
'.eb-ledger { background: #fff; border: 0.5px solid rgba(128,106,82,0.25); border-radius: 20px; overflow: hidden; }' +
'.eb-row { display: flex; align-items: center; gap: 14px; width: 100%; box-sizing: border-box; padding: 14px 18px; border: 0; background: none; text-align: left; cursor: pointer; font-family: inherit; }' +
'.eb-row:hover { background: rgba(233,227,217,0.5); }' +
'.eb-rowwrap { border-bottom: 0.5px solid rgba(128,106,82,0.18); }' +
'.eb-rowwrap:last-child { border-bottom: 0; }' +
'.eb-av { width: 36px; height: 36px; border-radius: 50%; background: #e9e3d9; color: #806a52; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }' +
'.eb-who { min-width: 0; flex: 1; }' +
'.eb-who .n { display: block; font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }' +
'.eb-who .s { display: block; font-size: 12px; color: #7a6c5c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }' +
'.eb-pill { border-radius: 999px; padding: 3px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; }' +
'.eb-pill.src { border: 0.5px solid rgba(128,106,82,0.45); background: #e9e3d9; color: #5c4d3b; }' +
'.eb-pill.ok { border: 0.5px solid rgba(88,128,82,0.5); background: rgba(120,150,110,0.12); color: #4c6a44; }' +
'.eb-pill.bad { border: 0.5px solid rgba(178,60,60,0.5); background: rgba(178,60,60,0.08); color: #a03535; }' +
'.eb-pill.mid { border: 0.5px solid rgba(128,106,82,0.45); background: #fff; color: #806a52; }' +
'.eb-amt { font-size: 17px; color: #806a52; white-space: nowrap; }' +
'.eb-chev { color: #806a52; }' +
'.eb-detail { padding: 4px 18px 18px 68px; }' +
'.eb-detail .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }' +
'.eb-cell { background: #e9e3d9; border-radius: 14px; padding: 12px 14px; font-size: 13px; }' +
'.eb-cell .lb { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #806a52; margin-bottom: 4px; }' +
'.eb-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }' +
'.eb-links a { border: 0.5px solid rgba(128,106,82,0.4); color: #806a52; border-radius: 999px; padding: 6px 14px; font-size: 11px; text-decoration: none; background: #fff; }' +
'.eb-links a:hover { background: rgba(128,106,82,0.08); }' +
'.eb-notes { margin-top: 12px; }' +
'.eb-notes textarea { width: 100%; box-sizing: border-box; border: 0.5px solid rgba(128,106,82,0.35); border-radius: 14px; padding: 12px 14px; font-size: 13px; font-family: inherit; color: #332b23; background: #fff; resize: vertical; outline: none; }' +
'.eb-notes textarea:focus { border-color: #806a52; }' +
'.eb-notes .eb-btn { margin-top: 8px; }' +
'.eb-empty { padding: 48px 18px; text-align: center; font-size: 14px; color: rgba(51,43,35,0.55); }' +
'@media print { .no-print { display: none !important; } .eb-admin { background: #fff; padding: 0; } .eb-wrap { grid-template-columns: 1fr; } .eb-ledger { border: 1px solid #999; } }' +
'@media (max-width: 720px) {' +
' .eb-admin { padding: 16px 12px 48px; }' +
' .eb-side { position: static; display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; padding: 16px; }' +
' .eb-side img { width: 70px; }' +
' .eb-side h2 { font-size: 20px; margin: 0; }' +
' .eb-side .eb-email, .eb-rolepill { display: none; }' +
' .eb-nav { flex-direction: row; flex-wrap: wrap; margin-top: 4px; width: 100%; gap: 6px; }' +
' .eb-nav a, .eb-nav button { width: auto; flex: 1 1 40%; padding: 9px 8px; font-size: 12px; }' +
' .eb-head h1 { font-size: 30px; }' +
' .eb-stats { display: grid; grid-template-columns: 1fr 1fr; row-gap: 14px; padding: 14px 0; }' +
' .eb-stat { min-width: 0; padding: 0 16px; }' +
' .eb-stat + .eb-stat { border-left: 0; }' +
' .eb-stat:nth-child(even) { border-left: 0.5px solid rgba(128,106,82,0.2); }' +
' .eb-stat b { font-size: 20px; }' +
' .eb-bar .eb-search { min-width: 100%; }' +
' .eb-row { flex-wrap: wrap; padding: 12px 14px; row-gap: 8px; }' +
' .eb-who { flex: 1 1 100%; }' +
' .eb-amt { font-size: 15px; margin-left: auto; }' +
' .eb-detail { padding: 4px 14px 16px 14px; }' +
' .eb-detail .grid { grid-template-columns: 1fr; }' +
'}';

export default function AdminDashboard({ payments, admin }) {
  const [lang, setLang] = useState(admin?.language || 'en');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [notes, setNotes] = useState({});
  const [notice, setNotice] = useState('');

  const enriched = useMemo(function () {
    return payments.map(function (p) {
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
  const stripeCount = payments.filter(function (p) { return (p.payment_source || 'stripe') === 'stripe'; }).length;
  const cloverCount = payments.filter(function (p) { return p.payment_source === 'clover'; }).length;
  const isFiltered = q.trim() !== '' || status !== 'all' || source !== 'all';

  const customerTotals = useMemo(function () {
    const map = new Map();
    for (const p of payments) {
      const email = p.customer_email || 'unknown';
      map.set(email, (map.get(email) || 0) + Number(p.amount_total || 0));
    }
    return map;
  }, [payments]);

  const customerOrderCounts = useMemo(function () {
    const map = new Map();
    for (const p of payments) {
      const email = p.customer_email || 'unknown';
      map.set(email, (map.get(email) || 0) + 1);
    }
    return map;
  }, [payments]);

  const groups = useMemo(function () {
    const g = [];
    const todayKey = dayKey(new Date().toISOString());
    for (const p of filtered) {
      const k = dayKey(p.created_at);
      const label = k === todayKey ? 'Today \u00b7 ' + k : k;
      const last = g[g.length - 1];
      if (last && last.label === label) last.items.push(p);
      else g.push({ label: label, items: [p] });
    }
    return g;
  }, [filtered]);

  function rowKey(p) {
    return p.id || p.stripe_session_id || p.clover_payment_id;
  }

  function pillClass(s) {
    if (s === 'paid' || s === 'delivered') return 'eb-pill ok';
    if (s === 'refunded' || s === 'unpaid') return 'eb-pill bad';
    return 'eb-pill mid';
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
    setNotice('Syncing Clover payments...');
    const res = await fetch('/api/admin/clover-sync', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      setNotice(data.error || 'Could not sync Clover.');
      console.error('Clover sync error', data);
      return;
    }
    setNotice('Clover synced: ' + (data.imported || 0) + ' payment(s).');
    setTimeout(function () { window.location.reload(); }, 1000);
  }

  async function saveNote(id) {
    setNotice('Saving note...');
    const res = await fetch('/api/admin/payment-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, admin_notes: notes[id] || '' }),
    });
    setNotice(res.ok ? 'Saved.' : 'Could not save note.');
    setTimeout(function () { setNotice(''); }, 2500);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  return (
    <main className="eb-admin">
      <style>{css}</style>
      <div className="eb-wrap">
        <aside className="eb-side no-print">
          <img src="/logo2.png" alt="Erendira&#8217;s Boutique" />
          <h2>Admin Studio</h2>
          <p className="eb-email">{admin?.email}</p>
          {admin?.role && <span className="eb-rolepill">{admin.role}</span>}
          <nav className="eb-nav">
            <a className="on" href="/admin">Dashboard</a>
            <a className="off" href="/admin/payment-links">Payment Links</a>
            <a className="off" href="/admin/gift-cards">Gift Cards</a>
            <button className="off" onClick={logout}>Logout</button>
          </nav>
        </aside>

        <section>
          <div className="eb-head no-print">
            <div>
              <p className="eb-eyebrow">Erendira&#8217;s Boutique Billing</p>
              <h1>Billing Dashboard</h1>
            </div>
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>

          <div className="eb-stats print-keep">
            <button className="eb-stat" type="button" onClick={function () { setQ(''); setStatus('all'); setSource('all'); }}>
              <span>{isFiltered ? 'Filtered revenue' : 'Revenue'}</span>
              <b>{money(total)}</b>
            </button>
            <button className="eb-stat" type="button" onClick={function () { setQ(''); setStatus('all'); setSource('all'); }}>
              <span>Payments</span>
              <b>{filtered.length}</b>
            </button>
            <button className="eb-stat" type="button" onClick={function () { setStatus('all'); }}>
              <span>Customers</span>
              <b>{customers}</b>
            </button>
            <button className="eb-stat" type="button" onClick={function () { setSource(source === 'stripe' ? 'clover' : 'stripe'); }}>
              <span>Stripe / Clover</span>
              <b>{stripeCount} / {cloverCount}</b>
            </button>
          </div>

          <div className="eb-bar no-print">
            <div className="eb-search">
              <input className="eb-in" placeholder="Search name, email, phone, amount..." value={q} onChange={function (e) { setQ(e.target.value); }} />
            </div>
            <select className="eb-in" value={status} onChange={function (e) { setStatus(e.target.value); }}>
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="refunded">Refunded</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <select className="eb-in" value={source} onChange={function (e) { setSource(e.target.value); }}>
              <option value="all">All sources</option>
              <option value="stripe">Stripe</option>
              <option value="clover">Clover</option>
            </select>
            <button className="eb-btn solid" onClick={syncCloverPayments}>Sync Clover</button>
            <button className="eb-btn line" onClick={exportCsv}>Export CSV</button>
            <button className="eb-btn line" onClick={function () { window.print(); }}>Print</button>
          </div>

          {notice && <div className="eb-notice no-print">{notice}</div>}

          {groups.map(function (g) {
            return (
              <div key={g.label}>
                <p className="eb-daylabel">{g.label}</p>
                <div className="eb-ledger">
                  {g.items.map(function (p) {
                    const key = rowKey(p);
                    const open = expandedId === key;
                    const orders = customerOrderCounts.get(p.customer_email || 'unknown') || 1;
                    const sub = [
                      p.customer_email || 'No email',
                      paymentMethodLabel(p),
                      orders + (orders === 1 ? ' order' : ' orders'),
                    ].join(' \u00b7 ');
                    return (
                      <div className="eb-rowwrap" key={key}>
                        <button className="eb-row" onClick={function () { setExpandedId(open ? null : key); }}>
                          <span className="eb-av">{initials(p.customer_name)}</span>
                          <span className="eb-who">
                            <span className="n">{p.customer_name || 'Customer'}</span>
                            <span className="s">{sub}</span>
                          </span>
                          <span className="eb-pill src">{p.payment_source || 'stripe'}</span>
                          <span className={pillClass(p._status)}>{statusLabel(p._status)}</span>
                          <span className="eb-amt">{money(p.amount_total, p.currency)}</span>
                          <span className="eb-chev">{open ? '\u2304' : '\u203a'}</span>
                        </button>

                        {open && (
                          <div className="eb-detail no-print">
                            <div className="grid">
                              <div className="eb-cell">
                                <span className="lb">Customer</span>
                                <b>{p.customer_name || 'Customer'}</b><br />
                                {p.customer_email || '\u2014'}<br />
                                {p.customer_phone || '\u2014'}
                              </div>
                              <div className="eb-cell">
                                <span className="lb">Shipping address</span>
                                {formatAddress(p.shipping_address) || '\u2014'}
                              </div>
                              <div className="eb-cell">
                                <span className="lb">Payment</span>
                                {formatDate(p.created_at)}<br />
                                {paymentMethodLabel(p)}<br />
                                Status: {p.payment_status || '\u2014'} {p.refund_status ? '\u00b7 Refund: ' + p.refund_status : ''}
                              </div>
                              <div className="eb-cell">
                                <span className="lb">Customer totals</span>
                                Orders: {orders}<br />
                                Lifetime: {money(customerTotals.get(p.customer_email || 'unknown') || 0, p.currency)}<br />
                                {p.description || 'Boutique purchase'}
                              </div>
                            </div>

                            <div className="eb-links">
                              {p.receipt_url && <a target="_blank" rel="noopener noreferrer" href={p.receipt_url}>Open Receipt</a>}
                              {p.stripe_customer_id && <a target="_blank" rel="noopener noreferrer" href={stripeUrl('customer', p.stripe_customer_id)}>Stripe Customer</a>}
                              {p.stripe_payment_intent && <a target="_blank" rel="noopener noreferrer" href={stripeUrl('payment', p.stripe_payment_intent)}>Stripe Payment</a>}
                              {p.payment_link && <a target="_blank" rel="noopener noreferrer" href={stripeUrl('link', p.payment_link)}>Payment Link</a>}
                            </div>

                            <div className="eb-notes">
                              <textarea
                                rows={4}
                                value={notes[p.id] ?? p.admin_notes ?? ''}
                                onChange={function (e) { setNotes({ ...notes, [p.id]: e.target.value }); }}
                                placeholder="Write private notes for this payment..."
                              />
                              <button className="eb-btn line" onClick={function () { saveNote(p.id); }}>Save Notes</button>
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
          {filtered.length === 0 && (
            <div className="eb-ledger" style={{ marginTop: 22 }}>
              <div className="eb-empty">No payments match these filters.</div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
