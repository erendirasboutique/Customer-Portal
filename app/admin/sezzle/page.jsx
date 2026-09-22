'use client';

// app/admin/sezzle/page.jsx
// Sezzle Buy-Now-Pay-Later link creator, styled with the Admin Studio shell.

import { useState } from 'react';
import AdminShell from '@/components/AdminShell';

function money(v) {
  return `$${Number(v || 0).toFixed(2)}`;
}

export default function SezzlePage() {
  const [form, setForm] = useState({
    title: '',
    amount: '',
    description: '',
    customerName: '',
    email: '',
    phone: '',
    reference: '',
    sendToCustomer: true,
    collectShipping: false,
    customRedirect: false,
    redirectUrl: 'https://erendirasboutique.com/thank-you',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((c) => ({ ...c, [field]: value }));
  }

  async function generate(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    setCreatedLink('');
    setCopied(false);

    if (!form.title.trim()) { setError('Enter a payment title.'); return; }
    if (!form.amount || Number(form.amount) < 1) { setError('Enter a valid amount (minimum $1.00).'); return; }

    setBusy(true);
    setMessage('Creating Sezzle link...');
    try {
      const res = await fetch('/api/admin/create-sezzle-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          amount: form.amount,
          customerName: form.customerName,
          email: form.email,
          phone: form.phone,
          reference: form.reference,
          send: form.sendToCustomer,
          collectShipping: form.collectShipping,
          customRedirect: form.customRedirect,
          redirectUrl: form.redirectUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(''); setError(data.error || 'Could not create Sezzle link.'); return; }
      setCreatedLink(data.url || '');
      setMessage(form.sendToCustomer ? 'Sezzle link created and sent.' : 'Sezzle link created.');
    } catch (err) {
      setMessage('');
      setError(err.message || 'Could not create Sezzle link.');
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <AdminShell
      active="sezzle"
      eyebrow="Buy Now, Pay Later"
      title="Sezzle Links"
      subtitle="Create a Sezzle checkout link for a customer — split into 4 interest-free payments."
      tip={{ label: 'Heads up', body: 'Sezzle also collects the customer\u2019s details on its own checkout page.' }}
    >
      <div className="eba-cols wide-left">
        {/* form */}
        <form className="eba-panel" onSubmit={generate}>
          <p className="eba-eyebrow">New link</p>
          <h2>Payment information</h2>

          <div className="eba-formrow">
            <div className="eba-field">
              <label className="eba-lb">Product / payment title</label>
              <input className="eba-in" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Custom order" required />
            </div>
            <div className="eba-field">
              <label className="eba-lb">Amount</label>
              <input className="eba-in" type="number" min="1" step="0.01" value={form.amount} onChange={(e) => update('amount', e.target.value)} placeholder="0.00" required />
            </div>
          </div>

          <div className="eba-field">
            <label className="eba-lb">Description (optional)</label>
            <textarea className="eba-in" rows="3" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Shown to the customer on the receipt" />
          </div>

          <div className="eba-field">
            <label className="eba-lb">Customer name (optional)</label>
            <input className="eba-in" value={form.customerName} onChange={(e) => update('customerName', e.target.value)} placeholder="Full name" />
          </div>

          <div className="eba-formrow even">
            <div className="eba-field">
              <label className="eba-lb">Email (optional)</label>
              <input className="eba-in" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="name@email.com" />
            </div>
            <div className="eba-field">
              <label className="eba-lb">Mobile (optional)</label>
              <input className="eba-in" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="(555) 000-0000" />
            </div>
          </div>

          <div className="eba-field">
            <label className="eba-lb">Order reference (optional)</label>
            <input className="eba-in" value={form.reference} onChange={(e) => update('reference', e.target.value)} placeholder="Auto-generated if left blank" />
          </div>

          <div className="eba-checks">
            <label className="eba-check">
              <input type="checkbox" checked={form.sendToCustomer} onChange={(e) => update('sendToCustomer', e.target.checked)} />
              <span>Send link to customer</span>
            </label>
            <label className="eba-check">
              <input type="checkbox" checked={form.collectShipping} onChange={(e) => update('collectShipping', e.target.checked)} />
              <span>Collect shipping address</span>
            </label>
          </div>

          <div className="eba-checks">
            <label className="eba-check" style={{ flex: '0 0 auto' }}>
              <input type="checkbox" checked={form.customRedirect} onChange={(e) => update('customRedirect', e.target.checked)} />
              <span>Custom redirect after payment</span>
            </label>
            <input
              className="eba-in"
              style={{ flex: 1, minWidth: 220 }}
              value={form.redirectUrl}
              onChange={(e) => update('redirectUrl', e.target.value)}
              placeholder="https://erendirasboutique.com/thank-you"
              disabled={!form.customRedirect}
            />
          </div>

          <div className="eba-actions">
            <button className="eba-btn eba-btn-dark" type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Generate Sezzle Link'}
            </button>
            <a className="eba-btn" href="/admin">Back to Dashboard</a>
          </div>

          {message && <div className="eba-notice">{message}</div>}
          {error && <div className="eba-err">{error}</div>}
        </form>

        {/* preview */}
        <aside className="eba-panel">
          <p className="eba-eyebrow">Preview</p>
          <h2>Link summary</h2>

          <div className="eba-cell" style={{ marginBottom: 14 }}>
            <span className="lb">{form.title || 'Untitled link'}</span>
            <b style={{ fontSize: 30, display: 'block', color: 'var(--taupe)', margin: '4px 0' }}>
              {form.amount ? money(form.amount) : '$0.00'}
            </b>
            <span>{form.description || '\u2014'}</span>
            <div style={{ marginTop: 8 }}>4 payments of {money((Number(form.amount) || 0) / 4)} with Sezzle</div>
            {form.customerName && <div style={{ marginTop: 6 }}>For: {form.customerName}</div>}
          </div>

          {createdLink ? (
            <div className="eba-cell">
              <span className="lb">Sezzle link ready</span>
              <b style={{ wordBreak: 'break-all', fontSize: 12.5 }}>{createdLink}</b>
              <div className="eba-actions" style={{ marginTop: 12 }}>
                <button className="eba-btn eba-btn-dark mini" type="button" onClick={copyLink}>{copied ? 'Copied!' : 'Copy Link'}</button>
                <a className="eba-btn mini" href={createdLink} target="_blank" rel="noopener noreferrer">Open Link</a>
              </div>
            </div>
          ) : (
            <div className="eba-empty">Your generated Sezzle link will appear here.</div>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}
