'use client';

import { Fragment, useMemo, useState } from 'react';
import { money, formatDate, formatAddress, paymentMethodLabel } from '@/lib/format';
import LanguageToggle from './LanguageToggle';

function stripeUrl(kind, id) {
  if (!id) return '';
  if (kind === 'customer') return `https://dashboard.stripe.com/customers/${id}`;
  if (kind === 'payment') return `https://dashboard.stripe.com/payments/${id}`;
  if (kind === 'session') return `https://dashboard.stripe.com/payments/checkout/${id}`;
  if (kind === 'link') return `https://dashboard.stripe.com/payment-links/${id}`;
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
  const labels = { paid:'Paid', shipped:'Shipped', delivered:'Delivered', refunded:'Refunded', unpaid:'Unpaid', unknown:'Unknown' };
  return labels[status] || status;
}

export default function AdminDashboard({ payments, admin }) {
  const [lang, setLang] = useState(admin?.language || 'en');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [notes, setNotes] = useState({});
  const [notice, setNotice] = useState('');

  const enriched = useMemo(() => payments.map(p => ({ ...p, _status: orderStatus(p) })), [payments]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return enriched.filter((p) => {
      const matchesQuery = !query || JSON.stringify(p).toLowerCase().includes(query);
      const matchesStatus = status === 'all' || p._status === status || p.payment_status === status || p.refund_status === status;
      const matchesSource = source === 'all' || (p.payment_source || 'stripe') === source;
      return matchesQuery && matchesStatus && matchesSource;
    });
  }, [enriched, q, status, source]);

  const total = filtered.reduce((sum, p) => sum + Number(p.amount_total || 0), 0);
  const allTimeTotal = payments.reduce((sum, p) => sum + Number(p.amount_total || 0), 0);
  const customers = new Set(filtered.map(p => p.customer_email).filter(Boolean)).size;
  const stripeCount = payments.filter(p => (p.payment_source || 'stripe') === 'stripe').length;
  const cloverCount = payments.filter(p => p.payment_source === 'clover').length;

  const customerTotals = useMemo(() => {
    const map = new Map();
    for (const p of payments) {
      const email = p.customer_email || 'unknown';
      map.set(email, (map.get(email) || 0) + Number(p.amount_total || 0));
    }
    return map;
  }, [payments]);

  const customerOrderCounts = useMemo(() => {
    const map = new Map();
    for (const p of payments) {
      const email = p.customer_email || 'unknown';
      map.set(email, (map.get(email) || 0) + 1);
    }
    return map;
  }, [payments]);

  function exportCsv() {
    const headers = ['created_at','payment_source','customer_name','customer_email','customer_phone','amount_total','currency','payment_status','refund_status','payment_method','payment_method_brand','payment_method_last4','shipping_address','description','receipt_url','admin_notes'];
    const rows = [
      headers.join(','),
      ...filtered.map(p => headers.map(h => {
        const value = h === 'shipping_address' ? formatAddress(p[h]) : p[h];
        return `"${String(value ?? '').replaceAll('"','""')}"`;
      }).join(',')),
    ];
    const blob = new Blob([rows.join('\n')], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'erendiras-billing-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function syncCloverPayments() {
    setNotice('Syncing Clover payments...');
    const res = await fetch('/api/admin/clover-sync', { method:'POST' });
    const data = await res.json();
    if (!res.ok) {
      setNotice(data.error || 'Could not sync Clover.');
      console.error('Clover sync error', data);
      return;
    }
    setNotice(`Clover synced: ${data.imported || 0} payment(s).`);
    setTimeout(() => window.location.reload(), 1000);
  }
async function createPaymentLink() {
  setNotice('Creating payment link...');

  const res = await fetch('/api/admin/create-payment-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Custom Boutique Payment',
      description: 'Order payment',
      amount: 25,
      quantity: 1,
      customerEmail: '',
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    setNotice(data.error || 'Could not create payment link.');
    return;
  }

  setNotice(`Payment link created: ${data.url}`);
  window.open(data.url, '_blank');
}
  
  async function saveNote(id) {
    setNotice('Saving note...');
    const res = await fetch('/api/admin/payment-notes', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ id, admin_notes: notes[id] || '' }),
    });
    setNotice(res.ok ? 'Saved.' : 'Could not save note.');
    setTimeout(() => setNotice(''), 2500);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method:'POST' });
    window.location.href = '/admin/login';
  }
  

  return (
    <main className="page adminPage">
      <span className="flower one no-print">✿</span><span className="flower two no-print">❀</span>
      <div className="shell split adminShell">
        <aside className="card sidebar no-print">
          <img src="/logo.png" className="logo" alt="Erendira's Boutique" />
          <h2>Admin Studio</h2>
          <p>{admin?.email}</p>
          <p><span className="pill">{admin?.role}</span></p>
          <div className="side-links">
            <a className="button secondary" href="/admin">Dashboard</a>
            <button className="button ghost" onClick={logout}>Logout</button>
          </div>
        </aside>

        <section className="adminContent">
          <div className="adminHero no-print">
            <div>
              <p className="eyebrow">Erendira&apos;s Boutique Billing</p>
              <h1>Billing Dashboard</h1>
              <p>Review Stripe and Clover payments, customer history, receipts, notes, and print/export all-time payment records.</p>
            </div>
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>

          <div className="statsGrid print-keep">
            <button className="stat highlight" type="button" onClick={() => setStatus('all')}><span>Filtered Revenue</span><b>{money(total)}</b></button>
            <button className="stat" type="button" onClick={() => setStatus('all')}><span>All-Time Revenue</span><b>{money(allTimeTotal)}</b></button>
            <button className="stat" type="button" onClick={() => setSource('stripe')}><span>Stripe Payments</span><b>{stripeCount}</b></button>
            <button className="stat" type="button" onClick={() => setSource('clover')}><span>Clover Payments</span><b>{cloverCount}</b></button>
            <button className="stat" type="button" onClick={() => setStatus('paid')}><span>Paid Orders</span><b>{filtered.filter(p => p.payment_status === 'paid').length}</b></button>
            <button className="stat" type="button" onClick={() => setStatus('shipped')}><span>Shipped</span><b>{enriched.filter(p => p._status === 'shipped').length}</b></button>
            <button className="stat" type="button" onClick={() => setStatus('all')}><span>Customers</span><b>{customers}</b></button>
            <button className="stat" type="button" onClick={() => setStatus('all')}><span>Total Payments</span><b>{payments.length}</b></button>
          </div>

          <div className="card dashboardCard">
            <div className="filters no-print">
              <input className="input" placeholder="Search name, email, phone, amount..." value={q} onChange={e => setQ(e.target.value)} />
              <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="paid">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="refunded">Refunded</option>
                <option value="unpaid">Unpaid</option>
              </select>
              <select className="input" value={source} onChange={e => setSource(e.target.value)}>
                <option value="all">All sources</option>
                <option value="stripe">Stripe</option>
                <option value="clover">Clover</option>
              </select>
              <button className="button secondary" onClick={syncCloverPayments}>Sync Clover</button>
  <button className="button secondary" onClick={createPaymentLink}>
  Create Payment Link
</button>
              <button className="button secondary" onClick={exportCsv}>Export CSV</button>
              <button className="button ghost" onClick={() => window.print()}>Print</button>
            </div>

            {notice && <div className="notice no-print">{notice}</div>}

            <div className="paymentList adminPaymentList">
              {filtered.map((p) => (
                <Fragment key={p.id || p.stripe_session_id || p.clover_payment_id}>
                  <article className="orderCard">
                    <div className="orderTop">
                      <div className="customerBlock">
                        <p className="eyebrow">{formatDate(p.created_at)}</p>
                        <h3>{p.customer_name || 'Customer'}</h3>
                        <p>{p.customer_email || 'No email'} {p.customer_phone ? `• ${p.customer_phone}` : ''}</p>
                      </div>
                      <div className="amountBlock">
                        <b>{money(p.amount_total, p.currency)}</b>
                        <div className="sourceBadgeWrap">
                          <span className={`pill source-${p.payment_source || 'stripe'}`}>{p.payment_source || 'stripe'}</span>
                          <span className="pill">{statusLabel(p._status)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="quickDetails">
                      <div><b>Payment Method</b><p>{paymentMethodLabel(p)}</p></div>
                      <div><b>Customer Orders</b><p>{customerOrderCounts.get(p.customer_email || 'unknown') || 1}</p></div>
                      <div><b>Lifetime Spend</b><p>{money(customerTotals.get(p.customer_email || 'unknown') || 0, p.currency)}</p></div>
                      <div><b>Receipt</b><p>{p.receipt_url ? <a href={p.receipt_url} target="_blank" rel="noopener noreferrer">Open Receipt</a> : '—'}</p></div>
                    </div>

                    <div className="actionGrid no-print">
                      <div className="actionTile">
                        <b>👤 Customer Details</b>
                        <p>Name, email, phone, shipping address, and customer totals.</p>
                        <button className="button ghost mini" onClick={() => setExpandedId(expandedId === `${p.id}-customer` ? null : `${p.id}-customer`)}>Open Customer</button>
                      </div>
                      <div className="actionTile">
                        <b>💳 Payment Information</b>
                        <p>Receipt, source, method, status, Stripe/Clover links, and notes.</p>
                        <button className="button ghost mini" onClick={() => setExpandedId(expandedId === `${p.id}-payment` ? null : `${p.id}-payment`)}>Open Payment</button>
                      </div>
                    </div>
                  </article>

                  {expandedId === `${p.id}-customer` && (
                    <article className="detailsPanel no-print">
                      <div className="detailsGrid">
                        <div className="detailCard"><span className="detailLabel">Customer</span><p><b>{p.customer_name || 'Customer'}</b><br />{p.customer_email || '—'}<br />{p.customer_phone || '—'}</p></div>
                        <div className="detailCard"><span className="detailLabel">Shipping Address</span><p>{formatAddress(p.shipping_address)}</p></div>
                        <div className="detailCard"><span className="detailLabel">Customer Summary</span><p>Orders: {customerOrderCounts.get(p.customer_email || 'unknown') || 1}<br />Lifetime: {money(customerTotals.get(p.customer_email || 'unknown') || 0, p.currency)}</p></div>
                      </div>
                    </article>
                  )}

                  {expandedId === `${p.id}-payment` && (
                    <article className="detailsPanel no-print">
                      <div className="detailsGrid">
                        <div className="detailCard"><span className="detailLabel">Payment Details</span><p>{paymentMethodLabel(p)}<br />Status: {p.payment_status || '—'}<br />Refund: {p.refund_status || 'none'}<br />Source: {p.payment_source || 'stripe'}</p></div>
                        <div className="detailCard"><span className="detailLabel">Description</span><p>{p.description || 'Boutique purchase'}</p></div>
                        <div className="detailCard">
                          <span className="detailLabel">Open Links</span>
                          <div className="stripeButtons">
                            {p.receipt_url && <a className="miniButton" target="_blank" rel="noopener noreferrer" href={p.receipt_url}>Receipt</a>}
                            {p.stripe_customer_id && <a className="miniButton" target="_blank" rel="noopener noreferrer" href={stripeUrl('customer', p.stripe_customer_id)}>Stripe Customer</a>}
                            {p.stripe_payment_intent && <a className="miniButton" target="_blank" rel="noopener noreferrer" href={stripeUrl('payment', p.stripe_payment_intent)}>Stripe Payment</a>}
                            {p.payment_link && <a className="miniButton" target="_blank" rel="noopener noreferrer" href={stripeUrl('link', p.payment_link)}>Payment Link</a>}
                          </div>
                        </div>
                        <div className="notesCard">
                          <span className="detailLabel">Private Admin Notes</span>
                          <textarea className="input notesArea" rows="5" value={notes[p.id] ?? p.admin_notes ?? ''} onChange={e => setNotes({ ...notes, [p.id]: e.target.value })} placeholder="Write private notes for this payment..." />
                          <button className="button secondary" onClick={() => saveNote(p.id)}>Save Notes</button>
                        </div>
                      </div>
                    </article>
                  )}
                </Fragment>
              ))}
              {filtered.length === 0 && <div className="emptyState">No payments match these filters.</div>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
