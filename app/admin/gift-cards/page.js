
'use client';

import { useEffect, useState } from 'react';

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function GiftCardsAdminPage() {
  const [form, setForm] = useState({
    amount: '',
    customerName: '',
    customerEmail: '',
    message: '',
    customCode: '',
  });
  const [message, setMessage] = useState('');
  const [giftCards, setGiftCards] = useState([]);
  const [createdGiftCard, setCreatedGiftCard] = useState(null);
  const [copiedId, setCopiedId] = useState('');

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function loadGiftCards() {
    const res = await fetch('/api/admin/gift-cards/list', { cache: 'no-store' });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || 'Could not load gift cards.');
      return;
    }

    setGiftCards(data.giftCards || []);
  }

  useEffect(() => {
    loadGiftCards();
  }, []);

  async function createGiftCard(e) {
    e.preventDefault();
    setMessage('Creating gift card...');
    setCreatedGiftCard(null);

    const res = await fetch('/api/admin/gift-cards/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || 'Could not create gift card.');
      return;
    }

    setCreatedGiftCard(data.giftCard);
    setMessage('Gift card created.');
    setForm({ amount: '', customerName: '', customerEmail: '', message: '', customCode: '' });
    await loadGiftCards();
  }

  async function toggleGiftCard(card) {
    const nextActive = card.status !== 'active';

    const res = await fetch('/api/admin/gift-cards/deactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: card.id,
        stripePromotionCodeId: card.stripe_promotion_code_id,
        active: nextActive,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || 'Could not update gift card.');
      return;
    }

    setMessage(nextActive ? 'Gift card activated.' : 'Gift card deactivated.');
    await loadGiftCards();
  }

  async function copyText(text, id) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 1800);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  return (
    <main className="page adminPage">
      <div className="shell split adminShell">
        <aside className="card sidebar no-print">
          <img src="/logo-icon.png" className="logo" alt="Erendira's Boutique" />
          <h2>Admin Studio</h2>
          <p>Gift Cards</p>
          <div className="side-links">
            <a className="button ghost" href="/admin">Dashboard</a>
            <a className="button ghost" href="/admin/payment-links">Payment Links</a>
            <a className="button secondary" href="/admin/gift-cards">Gift Cards</a>
            <button className="button ghost" onClick={logout}>Logout</button>
          </div>
        </aside>

        <section className="adminContent">
          <div className="adminHero no-print">
            <div>
              <p className="eyebrow">Erendira&apos;s Boutique</p>
              <h1>Gift Cards</h1>
              <p>Create Stripe promo-code gift cards, generate a branded PDF, and give customers a private gift-card portal link.</p>
            </div>
          </div>

          <div className="paymentLinkPageGrid">
            <form className="card paymentLinkBuilder" onSubmit={createGiftCard}>
              <p className="eyebrow">Create</p>
              <h2>New gift card</h2>

              <div className="formGrid">
                <label className="field">
                  Amount
                  <input className="input" type="number" min="1" step="0.01" value={form.amount} onChange={(e) => updateForm('amount', e.target.value)} required />
                </label>

                <label className="field">
                  Custom code optional
                  <input className="input" value={form.customCode} onChange={(e) => updateForm('customCode', e.target.value)} />
                </label>

                <label className="field">
                  Customer name
                  <input className="input" value={form.customerName} onChange={(e) => updateForm('customerName', e.target.value)} />
                </label>

                <label className="field">
                  Customer email
                  <input className="input" type="email" value={form.customerEmail} onChange={(e) => updateForm('customerEmail', e.target.value)} />
                </label>

                <label className="field formWide">
                  Message
                  <textarea className="input" rows="3" value={form.message} onChange={(e) => updateForm('message', e.target.value)} />
                </label>
              </div>

              <div className="notice">
                Gift cards work as Stripe promotion codes. Your payment links must have “Allow promotion codes” enabled.
              </div>

              <button className="button secondary" type="submit">Create Gift Card</button>
              {message && <div className="notice">{message}</div>}
            </form>

            <aside className="card paymentLinkPreview">
              <p className="eyebrow">Latest</p>
              <h2>Created gift card</h2>

              {createdGiftCard ? (
                <div className="createdLinkBox">
                  <b>{money(createdGiftCard.amount)}</b>
                  <p>{createdGiftCard.code}</p>
                  <div className="paymentLinkActions">
                    <button className="button secondary" type="button" onClick={() => copyText(createdGiftCard.code, 'created-code')}>
                      {copiedId === 'created-code' ? 'Copied!' : 'Copy Code'}
                    </button>
                    <a className="button ghost" href={createdGiftCard.gift_card_url} target="_blank" rel="noopener noreferrer">Open Portal</a>
                    <a className="button ghost" href={createdGiftCard.pdf_url} target="_blank" rel="noopener noreferrer">View PDF</a>
                  </div>
                </div>
              ) : (
                <div className="emptyState">Create a gift card to see links here.</div>
              )}
            </aside>
          </div>

          <section className="card savedPaymentLinksCard">
            <div className="savedLinksHeader">
              <div>
                <p className="eyebrow">Saved</p>
                <h2>Gift cards</h2>
              </div>
              <button className="button ghost" type="button" onClick={loadGiftCards}>Refresh</button>
            </div>

            <div className="savedPaymentLinksList">
              {giftCards.map((card) => (
                <article className="savedPaymentLinkCard" key={card.id}>
                  <div>
                    <p className="eyebrow">Created {formatDate(card.created_at)}</p>
                    <h3>{money(card.amount)} Gift Card</h3>
                    <p className="mutedText">{card.customer_name || 'No customer'} {card.customer_email ? `• ${card.customer_email}` : ''}</p>
                    <p>{card.code}</p>
                  </div>

                  <div className="savedLinkMeta">
                    <span className="pill">{card.status || 'active'}</span>
                    <p>Redeemed: {card.redeemed_count || 0}</p>
                    <p>Total: {money(card.total_redeemed || 0)}</p>
                  </div>

                  <div className="savedLinkButtons">
                    <button className="button secondary mini" onClick={() => copyText(card.code, `${card.id}-code`)}>
                      {copiedId === `${card.id}-code` ? 'Copied!' : 'Code'}
                    </button>
                    <button className="button ghost mini" onClick={() => copyText(card.gift_card_url, `${card.id}-url`)}>
                      {copiedId === `${card.id}-url` ? 'Copied!' : 'Portal'}
                    </button>
                    <a className="button ghost mini" href={card.gift_card_url} target="_blank" rel="noopener noreferrer">Open</a>
                    <a className="button ghost mini" href={card.pdf_url} target="_blank" rel="noopener noreferrer">PDF</a>
                    <button className="button ghost mini" onClick={() => toggleGiftCard(card)}>
                      {card.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </article>
              ))}

              {giftCards.length === 0 && <div className="emptyState">No gift cards yet.</div>}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
