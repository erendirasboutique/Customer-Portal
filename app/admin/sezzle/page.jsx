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
    description: '',
    amount: '',
    collectShipping: false,
    redirectAfterPayment: true,
    redirectUrl: 'https://ebtq.io/cc',
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
          collectShipping: form.collectShipping,
          redirectAfterPayment: form.redirectAfterPayment,
          redirectUrl: form.redirectUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(''); setError(data.error || 'Could not create Sezzle link.'); return; }
      setCreatedLink(data.url || '');
      setMessage('Sezzle link created.');
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
      tip={{ label: 'Heads up', body: 'Sezzle collects the customer’s name, contact, and billing on its own checkout page.' }}
    >
      <div className="eba-cols wide-left">
        {/* form */}
        <form className="eba-panel" onSubmit={generate}>
          <p className="eba-eyebrow">New link</p>
          <h2>Payment information</h2>

          <div className="eba-formrow">
            <div className="eba-field">
              <label className="eba-lb">Product / payment title</label>
              <input className="eba-in" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Custom order" required />
            </div>
            <div className="eba-field">
              <label className="eba-lb">Amount</label>
              <input className="eba-in" type="number" min="1" step="0.01" value={form.amount} onChange={(e) => update('amount', e.target.value)} placeholder="0.00" required />
            </div>
          </div>

          <div className="eba-field">
            <label className="eba-lb">Description</label>
            <textarea className="eba-in" rows="3" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Shown to the customer on the receipt" />
          </div>

          <div className="eba-checks">
            <label className="eba-check">
              <input type="checkbox" checked={form.collectShipping} onChange={(e) => update('collectShipping', e.target.checked)} />
              <span>Collect shipping address</span>
            </label>
            <label className="eba-check">
              <input type="checkbox" checked={form.redirectAfterPayment} onChange={(e) => update('redirectAfterPayment', e.target.checked)} />
              <span>Redirect customer after payment</span>
            </label>
          </div>

          {form.redirectAfterPayment && (
            <div className="eba-field" style={{ marginTop: 12 }}>
              <label className="eba-lb">Redirect URL</label>
              <input className="eba-in" value={form.redirectUrl} onChange={(e) => update('redirectUrl', e.target.value)} placeholder="https://erendirasboutique.com/thank-you" />
            </div>
          )}

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
            <span>{form.description || '—'}</span>
            <div style={{ marginTop: 8 }}>4 payments of {money((Number(form.amount) || 0) / 4)} with Sezzle</div>
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
