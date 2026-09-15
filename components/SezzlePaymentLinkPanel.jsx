// components/SezzlePaymentLinkPanel.jsx
'use client';

import { useState } from 'react';

// Brand palette (Erendira's): cream #F5F3EF, taupe #806a52, sand #bda891, ink #3d3128
// Restyle to match your existing generator — the logic is the important part.

export default function SezzlePaymentLinkPanel() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deliver, setDeliver] = useState(false); // let Sezzle text/email the link
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { checkoutUrl, orderUuid }
  const [copied, setCopied] = useState(false);

  async function generate() {
    setError(null);
    setResult(null);

    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/sezzle/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `pl_${Date.now()}`, // swap for a real order id to reconcile in Supabase
          amountInCents: cents,
          description, // Sezzle requires an order description

          items: [
            {
              name: description || 'Erendira\u2019s Boutique',
              sku: 'CUSTOM',
              quantity: 1,
              priceInCents: cents,
            },
          ],
          customer:
            email || phone ? { email: email || undefined, phone: phone || undefined } : undefined,
          mode: deliver ? 'link' : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create link');
      setResult({ checkoutUrl: data.checkoutUrl, orderUuid: data.orderUuid });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.checkoutUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{ maxWidth: 460, color: '#3d3128' }}>
      <h2 style={{ fontWeight: 600, marginBottom: 12 }}>Sezzle payment link</h2>

      <label style={{ display: 'block', marginBottom: 8 }}>
        Amount (USD)
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          style={inputStyle}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 8 }}>
        Description (shown at checkout)
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Order #1234 / custom sale"
          style={inputStyle}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 8 }}>
        Customer email (optional)
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
      </label>

      <label style={{ display: 'block', marginBottom: 8 }}>
        Customer phone (optional)
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
      </label>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '10px 0' }}>
        <input type="checkbox" checked={deliver} onChange={(e) => setDeliver(e.target.checked)} />
        Have Sezzle text/email the link to the customer
      </label>

      <button
        onClick={generate}
        disabled={loading}
        style={{
          background: '#806a52',
          color: '#F5F3EF',
          border: 'none',
          padding: '10px 16px',
          borderRadius: 8,
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Generating\u2026' : 'Generate Sezzle link'}
      </button>

      {error && <p style={{ color: '#a33', marginTop: 12 }}>{error}</p>}

      {result && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: '#F5F3EF',
            borderRadius: 8,
            border: '1px solid #bda891',
          }}
        >
          <div style={{ fontSize: 13, wordBreak: 'break-all', marginBottom: 8 }}>{result.checkoutUrl}</div>
          <button onClick={copyLink} style={smallBtn}>
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <p style={{ fontSize: 12, color: '#806a52', marginTop: 8 }}>
            This is a single-use Sezzle checkout and will expire. Generate a fresh one if it goes stale.
          </p>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  display: 'block',
  width: '100%',
  marginTop: 4,
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #bda891',
  background: '#fff',
};

const smallBtn = {
  background: '#3d3128',
  color: '#F5F3EF',
  border: 'none',
  padding: '6px 12px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
};
