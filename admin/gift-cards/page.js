'use client';

import { useEffect, useMemo, useState } from 'react';
import LanguageToggle from '@/components/LanguageToggle';

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function GiftCardsPage() {
  const [lang, setLang] = useState('en');
  const [message, setMessage] = useState('');
  const [giftCards, setGiftCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [form, setForm] = useState({
    amount: '',
    recipientName: '',
    note: '',
    neverExpires: true,
  });

  const analytics = useMemo(() => {
    const active = giftCards.filter((g) => g.status !== 'redeemed' && g.active !== false);
    const redeemed = giftCards.filter((g) => g.status === 'redeemed');
    const issued = giftCards.reduce((sum, g) => sum + Number(g.amount || 0), 0);
    const redeemedAmount = giftCards.reduce((sum, g) => sum + Number(g.redeemed_amount || 0), 0);
    return { total: giftCards.length, active: active.length, redeemed: redeemed.length, issued, redeemedAmount };
  }, [giftCards]);

  const filteredGiftCards = giftCards.filter((card) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [card.code, card.recipient_name, card.status, card.note]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function loadGiftCards() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/gift-cards', { method: 'GET', cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Could not load gift cards.');
        setGiftCards([]);
        return;
      }
      setGiftCards(data.giftCards || []);
    } catch (error) {
      setMessage(error.message || 'Could not load gift cards.');
      setGiftCards([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGiftCards();
  }, []);

  async function createGiftCard(e) {
    e.preventDefault();
    setMessage('');

    if (!form.amount || Number(form.amount) < 1) {
      setMessage('Enter a gift card amount of at least $1.');
      return;
    }

    setMessage('Creating gift card...');

    const res = await fetch('/api/admin/gift-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || 'Could not create gift card.');
      return;
    }

    setMessage('Gift card created. PDF is ready.');
    setForm({ amount: '', recipientName: '', note: '', neverExpires: true });
    await loadGiftCards();

    if (data.giftCard?.id) {
      window.open(`/api/admin/gift-cards/${data.giftCard.id}/pdf`, '_blank');
    }
  }

  async function copyCode(card) {
    if (!card?.code) return;
    await navigator.clipboard.writeText(card.code);
    setCopiedId(card.id);
    setTimeout(() => setCopiedId(''), 1800);
  }

  async function setGiftCardActive(card, active) {
    setMessage(active ? 'Reactivating gift card...' : 'Deactivating gift card...');

    const res = await fetch('/api/admin/gift-cards', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: card.id, active }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || 'Could not update gift card.');
      return;
    }

    setMessage(active ? 'Gift card reactivated.' : 'Gift card deactivated.');
    await loadGiftCards();
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
              <p className="eyebrow">Manual Gift Cards</p>
              <h1>Gift Cards</h1>
              <p>
                Create Stripe promo-code gift cards, download a branded PDF, and let customers redeem the code on payment links.
              </p>
            </div>
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>

          <div className="statsGrid giftCardAnalytics">
            <div className="stat highlight"><span>Total issued</span><b>{analytics.total}</b></div>
            <div className="stat"><span>Active</span><b>{analytics.active}</b></div>
            <div className="stat"><span>Redeemed</span><b>{analytics.redeemed}</b></div>
            <div className="stat"><span>Issued value</span><b>{money(analytics.issued)}</b></div>
          </div>

          <div className="giftCardPageGrid">
            <form className="card giftCardBuilder" onSubmit={createGiftCard}>
              <p className="eyebrow">Create</p>
              <h2>New Gift Card</h2>

              <div className="formGrid">
                <label className="field">
                  Amount
                  <input
                    className="input"
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => updateForm('amount', e.target.value)}
                    required
                  />
                </label>

                <label className="field">
                  Recipient name
                  <input
                    className="input"
                    value={form.recipientName}
                    onChange={(e) => updateForm('recipientName', e.target.value)}
                  />
                </label>

                <label className="field formWide">
                  Optional message
                  <textarea
                    className="input"
                    rows="3"
                    value={form.note}
                    onChange={(e) => updateForm('note', e.target.value)}
                  />
                </label>
              </div>

              <div className="optionPanel">
                <label className="checkRow">
                  <input
                    type="checkbox"
                    checked={form.neverExpires}
                    onChange={(e) => updateForm('neverExpires', e.target.checked)}
                  />
                  <span>This gift card never expires</span>
                </label>
              </div>

              <div className="paymentLinkActions">
                <button className="button secondary" type="submit">Create Gift Card PDF</button>
                <a className="button ghost" href="/admin">Back to Dashboard</a>
              </div>

              {message && <div className="notice">{message}</div>}
            </form>

            <aside className="card giftCardPreview">
              <p className="eyebrow">Preview</p>
              <h2>PDF style</h2>

              <div className="giftPreviewTop"><img src="/logo.png" alt="Erendira's Boutique" /></div>
              <p className="giftPreviewTitle">Here&apos;s your e-gift card!</p>
              <div className="giftPreviewCard">
                <b>Erendira&apos;s Boutique</b>
                <h3>{form.amount ? money(form.amount) : '$0.00'}</h3>
                <span>Gift Card</span>
              </div>
              <div className="giftPreviewCode">EB-XXXX-XX-XXXX</div>
              <p className="mutedText">PDF includes a QR code, redemption instructions, and the gift card code.</p>
            </aside>
          </div>

          <section className="card savedGiftCardsCard">
            <div className="savedLinksHeader">
              <div>
                <p className="eyebrow">Saved Gift Cards</p>
                <h2>Generated gift cards</h2>
                <p className="mutedText">Copy codes, download PDFs, deactivate codes, and track redemption status.</p>
              </div>

              <div className="savedLinksActions">
                <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} />
                <button className="button ghost" type="button" onClick={loadGiftCards}>Refresh</button>
              </div>
            </div>

            {loading ? (
              <div className="emptyState">Loading gift cards...</div>
            ) : filteredGiftCards.length === 0 ? (
              <div className="emptyState">No gift cards yet.</div>
            ) : (
              <div className="savedPaymentLinksList">
                {filteredGiftCards.map((card) => (
                  <article className="savedPaymentLinkCard" key={card.id}>
                    <div>
                      <p className="eyebrow">Created {formatDate(card.created_at)}</p>
                      <h3>{card.code}</h3>
                      <p className="mutedText">{card.recipient_name || 'No recipient name'}</p>
                      <p className="mutedText">{card.note || '—'}</p>
                    </div>

                    <div className="savedLinkMeta">
                      <b>{money(card.amount)}</b>
                      <span className="pill">{card.active === false ? 'inactive' : card.status || 'active'}</span>
                      <p>Redeemed: {card.redeemed_at ? formatDate(card.redeemed_at) : 'Not yet'}</p>
                    </div>

                    <div className="savedLinkButtons">
                      <button className="button secondary mini" type="button" onClick={() => copyCode(card)}>
                        {copiedId === card.id ? 'Copied!' : 'Copy Code'}
                      </button>
                      <a className="button ghost mini" href={`/api/admin/gift-cards/${card.id}/pdf`} target="_blank" rel="noopener noreferrer">
                        PDF
                      </a>
                      <button className="button ghost mini" type="button" onClick={() => setGiftCardActive(card, card.active === false)}>
                        {card.active === false ? 'Reactivate' : 'Deactivate'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
