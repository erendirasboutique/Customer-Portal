'use client';

import { useEffect, useMemo, useState } from 'react';

function money(value) {
  return '$' + Number(value || 0).toFixed(2);
}

function formatDate(value) {
  if (!value) return '\u2014';
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

var css = '' +
'.eb-admin { min-height: 100vh; background: #e9e3d9; color: #332b23; font-family: inherit; padding: 24px 16px 64px; }' +
'.eb-wrap { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 24px; }' +
'@media (min-width: 1024px) { .eb-wrap { grid-template-columns: 232px 1fr; } }' +
'.eb-side { background: #fff; border: 0.5px solid rgba(128,106,82,0.3); border-radius: 24px; padding: 24px; align-self: start; position: sticky; top: 24px; }' +
'.eb-side img { width: 88px; height: auto; }' +
'.eb-side h2 { font-size: 26px; color: #806a52; margin: 14px 0 2px; font-weight: 400; }' +
'.eb-side .eb-sub { font-size: 12px; color: rgba(51,43,35,0.65); margin: 0; }' +
'.eb-nav { display: flex; flex-direction: column; gap: 8px; margin-top: 18px; }' +
'.eb-nav a, .eb-nav button { display: block; width: 100%; box-sizing: border-box; text-align: center; border-radius: 999px; padding: 10px 14px; font-size: 13px; text-decoration: none; cursor: pointer; font-family: inherit; }' +
'.eb-nav .on { background: #806a52; color: #e9e3d9; border: 0.5px solid #806a52; }' +
'.eb-nav .off { background: transparent; color: #806a52; border: 0.5px solid rgba(128,106,82,0.4); }' +
'.eb-nav .off:hover { background: rgba(128,106,82,0.08); }' +
'.eb-head h1 { font-size: 40px; color: #806a52; margin: 2px 0 0; font-weight: 400; }' +
'.eb-eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: 0.3em; color: #806a52; margin: 0; }' +
'.eb-stats { display: flex; flex-wrap: wrap; background: #fff; border: 0.5px solid rgba(128,106,82,0.25); border-radius: 20px; margin-top: 16px; padding: 16px 0; }' +
'.eb-stat { flex: 1; min-width: 110px; padding: 0 20px; }' +
'.eb-stat + .eb-stat { border-left: 0.5px solid rgba(128,106,82,0.2); }' +
'.eb-stat span { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #806a52; }' +
'.eb-stat b { display: block; font-size: 24px; color: #806a52; font-weight: 400; margin-top: 4px; }' +
'.eb-grid2 { display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 14px; }' +
'@media (min-width: 900px) { .eb-grid2 { grid-template-columns: 1.5fr 1fr; } }' +
'.eb-card { background: #fff; border: 0.5px solid rgba(128,106,82,0.25); border-radius: 20px; padding: 20px; }' +
'.eb-card.self { align-self: start; }' +
'.eb-formrow { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }' +
'@media (max-width: 560px) { .eb-formrow { grid-template-columns: 1fr; } }' +
'.eb-lb { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: #806a52; margin: 0 0 4px; }' +
'.eb-in { box-sizing: border-box; border: 0.5px solid rgba(128,106,82,0.35); border-radius: 14px; background: #fff; padding: 10px 14px; font-size: 13px; color: #332b23; font-family: inherit; outline: none; width: 100%; }' +
'.eb-in:focus { border-color: #806a52; }' +
'textarea.eb-in { resize: vertical; }' +
'.eb-btn { border: 0; border-radius: 999px; padding: 10px 20px; font-size: 13px; cursor: pointer; font-family: inherit; text-decoration: none; display: inline-block; }' +
'.eb-btn.solid { background: #806a52; color: #e9e3d9; }' +
'.eb-btn.solid:hover { opacity: 0.92; }' +
'.eb-btn.line { background: #fff; color: #806a52; border: 0.5px solid rgba(128,106,82,0.4); }' +
'.eb-btn.line:hover { background: rgba(128,106,82,0.08); }' +
'.eb-btn.mini { padding: 6px 14px; font-size: 11px; }' +
'.eb-notice { margin-top: 12px; background: #e9e3d9; border-radius: 14px; padding: 10px 16px; font-size: 13px; color: #806a52; }' +
'.eb-hint { margin-top: 14px; padding-top: 12px; border-top: 0.5px dashed rgba(128,106,82,0.35); font-size: 12px; color: rgba(51,43,35,0.6); }' +
'.eb-sum-amt { font-size: 28px; color: #806a52; margin: 0; }' +
'.eb-code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; letter-spacing: 0.08em; }' +
'.eb-linkbox { border: 1px dashed rgba(128,106,82,0.45); border-radius: 14px; padding: 14px; margin-top: 14px; font-size: 12px; color: #7a6c5c; text-align: center; }' +
'.eb-linkbox.ready { text-align: left; border-style: solid; color: #332b23; }' +
'.eb-listhead { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 10px; margin-top: 24px; }' +
'.eb-ledger { background: #fff; border: 0.5px solid rgba(128,106,82,0.25); border-radius: 20px; overflow: hidden; margin-top: 8px; }' +
'.eb-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; padding: 14px 18px; border-bottom: 0.5px solid rgba(128,106,82,0.18); }' +
'.eb-row:last-child { border-bottom: 0; }' +
'.eb-row.off { opacity: 0.6; }' +
'.eb-who { min-width: 220px; flex: 1; }' +
'.eb-who .n { display: block; font-size: 15px; font-weight: 600; }' +
'.eb-who .s { display: block; font-size: 12px; color: #7a6c5c; }' +
'.eb-pill { border-radius: 999px; padding: 3px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; }' +
'.eb-pill.ok { border: 0.5px solid rgba(88,128,82,0.5); background: rgba(120,150,110,0.12); color: #4c6a44; }' +
'.eb-pill.off { border: 0.5px solid rgba(128,106,82,0.4); background: #e9e3d9; color: #5c4d3b; }' +
'.eb-pill.used { border: 0.5px solid #806a52; background: #806a52; color: #f2ede4; }' +
'.eb-rowbtns { display: flex; flex-wrap: wrap; gap: 6px; }' +
'.eb-empty { padding: 40px 18px; text-align: center; font-size: 14px; color: rgba(51,43,35,0.55); }' +
'@media (max-width: 720px) {' +
' .eb-admin { padding: 16px 12px 48px; }' +
' .eb-side { position: static; display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; padding: 16px; }' +
' .eb-side img { width: 56px; }' +
' .eb-side h2 { font-size: 20px; margin: 0; }' +
' .eb-side .eb-sub { display: none; }' +
' .eb-nav { flex-direction: row; flex-wrap: wrap; margin-top: 4px; width: 100%; gap: 6px; }' +
' .eb-nav a, .eb-nav button { width: auto; flex: 1 1 40%; padding: 9px 8px; font-size: 12px; }' +
' .eb-head h1 { font-size: 30px; }' +
' .eb-stats { display: grid; grid-template-columns: 1fr 1fr; row-gap: 14px; padding: 14px 0; }' +
' .eb-stat { min-width: 0; padding: 0 16px; }' +
' .eb-stat + .eb-stat { border-left: 0; }' +
' .eb-stat:nth-child(even) { border-left: 0.5px solid rgba(128,106,82,0.2); }' +
' .eb-stat b { font-size: 20px; }' +
' .eb-card { padding: 16px; }' +
' .eb-row { padding: 12px 14px; row-gap: 8px; }' +
' .eb-who { flex: 1 1 100%; min-width: 0; }' +
' .eb-rowbtns { flex: 1 1 100%; }' +
' .eb-rowbtns .eb-btn { flex: 1; text-align: center; }' +
'}';

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
    setForm(function (current) {
      return { ...current, [field]: value };
    });
  }

  const stats = useMemo(function () {
    const active = giftCards.filter(function (c) { return c.status === 'active'; }).length;
    const redeemed = giftCards.reduce(function (sum, c) { return sum + Number(c.redeemed_count || 0); }, 0);
    const total = giftCards.reduce(function (sum, c) { return sum + Number(c.total_redeemed || 0); }, 0);
    return { count: giftCards.length, active: active, redeemed: redeemed, total: total };
  }, [giftCards]);

  async function loadGiftCards() {
    const res = await fetch('/api/admin/gift-cards/list', { cache: 'no-store' });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || 'Could not load gift cards.');
      return;
    }

    setGiftCards(data.giftCards || []);
  }

  useEffect(function () {
    loadGiftCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createGiftCard(e) {
    e.preventDefault();

    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount < 1) {
      setMessage('Enter a gift card amount of at least $1.00.');
      return;
    }

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

  async function redeemGiftCard(card) {
    const ok = confirm(
      'Mark the ' + money(card.amount) + ' gift card ' + card.code +
      ' as redeemed? This deactivates the code so it cannot be used again.'
    );
    if (!ok) return;

    const note = prompt('Optional note (e.g. "Redeemed in store 7/10"):', '') || '';

    const res = await fetch('/api/admin/gift-cards/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: card.id, note: note }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || 'Could not redeem gift card.');
      return;
    }

    setMessage('Gift card ' + card.code + ' marked as redeemed.');
    await loadGiftCards();
  }

  async function copyText(text, id) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(function () { setCopiedId(''); }, 1800);
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
          <img src="/logo-icon.png" alt="Erendira&#8217;s Boutique" />
          <h2>Admin Studio</h2>
          <p className="eb-sub">Gift Cards</p>
          <nav className="eb-nav">
            <a className="off" href="/admin">Dashboard</a>
            <a className="off" href="/admin/payment-links">Payment Links</a>
            <a className="on" href="/admin/gift-cards">Gift Cards</a>
            <button className="off" onClick={logout}>Logout</button>
          </nav>
        </aside>

        <section>
          <div className="eb-head">
            <p className="eb-eyebrow">Erendira&#8217;s Boutique</p>
            <h1>Gift Cards</h1>
          </div>

          <div className="eb-stats">
            <div className="eb-stat"><span>Gift cards</span><b>{stats.count}</b></div>
            <div className="eb-stat"><span>Active</span><b>{stats.active}</b></div>
            <div className="eb-stat"><span>Redemptions</span><b>{stats.redeemed}</b></div>
            <div className="eb-stat"><span>Total redeemed</span><b>{money(stats.total)}</b></div>
          </div>

          <div className="eb-grid2">
            <form className="eb-card" onSubmit={createGiftCard}>
              <p className="eb-eyebrow" style={{ letterSpacing: '0.25em', marginBottom: 12 }}>New gift card</p>

              <div className="eb-formrow">
                <div>
                  <span className="eb-lb">Amount</span>
                  <input className="eb-in" type="number" min="1" step="0.01" value={form.amount} onChange={function (e) { updateForm('amount', e.target.value); }} required />
                </div>
                <div>
                  <span className="eb-lb">Custom code (optional)</span>
                  <input className="eb-in" value={form.customCode} onChange={function (e) { updateForm('customCode', e.target.value.toUpperCase()); }} placeholder="EB-XXXX-XXXX" />
                </div>
              </div>

              <div className="eb-formrow" style={{ marginTop: 10 }}>
                <div>
                  <span className="eb-lb">Customer name</span>
                  <input className="eb-in" value={form.customerName} onChange={function (e) { updateForm('customerName', e.target.value); }} />
                </div>
                <div>
                  <span className="eb-lb">Customer email</span>
                  <input className="eb-in" type="email" value={form.customerEmail} onChange={function (e) { updateForm('customerEmail', e.target.value); }} />
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <span className="eb-lb">Message (printed on the PDF)</span>
                <textarea className="eb-in" rows={2} value={form.message} onChange={function (e) { updateForm('message', e.target.value); }} />
              </div>

              <div style={{ marginTop: 16 }}>
                <button className="eb-btn solid" type="submit">Create Gift Card</button>
              </div>

              {message && <div className="eb-notice">{message}</div>}

              <p className="eb-hint">
                Gift cards work as Stripe promotion codes &mdash; payment links must have
                &ldquo;Allow promotion codes&rdquo; enabled.
              </p>
            </form>

            <aside className="eb-card self">
              <p className="eb-eyebrow" style={{ letterSpacing: '0.25em', marginBottom: 12 }}>Latest gift card</p>

              {createdGiftCard ? (
                <div>
                  <p className="eb-sum-amt">{money(createdGiftCard.amount)}</p>
                  <p className="eb-code" style={{ marginTop: 6 }}>{createdGiftCard.code}</p>
                  <div className="eb-linkbox ready">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <button className="eb-btn solid mini" type="button" onClick={function () { copyText(createdGiftCard.code, 'created-code'); }}>
                        {copiedId === 'created-code' ? 'Copied!' : 'Copy Code'}
                      </button>
                      <a className="eb-btn line mini" href={createdGiftCard.gift_card_url} target="_blank" rel="noopener noreferrer">Open Portal</a>
                      <a className="eb-btn line mini" href={createdGiftCard.pdf_url} target="_blank" rel="noopener noreferrer">View PDF</a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="eb-linkbox">Create a gift card to see its code, portal link, and PDF here.</div>
              )}
            </aside>
          </div>

          <div className="eb-listhead">
            <p className="eb-eyebrow" style={{ letterSpacing: '0.25em' }}>Saved gift cards</p>
            <button className="eb-btn line" type="button" onClick={loadGiftCards}>Refresh</button>
          </div>

          <div className="eb-ledger">
            {giftCards.map(function (card) {
              const active = card.status === 'active';
              const redeemed = card.status === 'redeemed';
              const subParts = [];
              if (card.customer_name) subParts.push(card.customer_name);
              if (card.customer_email) subParts.push(card.customer_email);
              subParts.push('Created ' + formatDate(card.created_at));
              if (redeemed && card.redeemed_at) {
                subParts.push('Redeemed ' + formatDate(card.redeemed_at));
              } else {
                subParts.push('Redeemed ' + (card.redeemed_count || 0));
              }
              subParts.push('Total ' + money(card.total_redeemed || 0));
              if (card.redeemed_note) subParts.push(card.redeemed_note);
              return (
                <div className={active ? 'eb-row' : 'eb-row off'} key={card.id}>
                  <span className="eb-who">
                    <span className="n">{money(card.amount)} Gift Card</span>
                    <span className="s">{subParts.join(' \u00b7 ')}</span>
                    <span className="s eb-code">{card.code}</span>
                  </span>
                  <span className={redeemed ? 'eb-pill used' : active ? 'eb-pill ok' : 'eb-pill off'}>{card.status || 'active'}</span>
                  <span className="eb-rowbtns">
                    <button className="eb-btn solid mini" onClick={function () { copyText(card.code, card.id + '-code'); }}>
                      {copiedId === card.id + '-code' ? 'Copied!' : 'Code'}
                    </button>
                    <button className="eb-btn line mini" onClick={function () { copyText(card.gift_card_url, card.id + '-url'); }}>
                      {copiedId === card.id + '-url' ? 'Copied!' : 'Portal'}
                    </button>
                    <a className="eb-btn line mini" href={card.gift_card_url} target="_blank" rel="noopener noreferrer">Open</a>
                    <a className="eb-btn line mini" href={card.pdf_url} target="_blank" rel="noopener noreferrer">PDF</a>
                    {active && (
                      <button className="eb-btn line mini" onClick={function () { redeemGiftCard(card); }}>
                        Mark Redeemed
                      </button>
                    )}
                    {!redeemed && (
                      <button className="eb-btn line mini" onClick={function () { toggleGiftCard(card); }}>
                        {active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </span>
                </div>
              );
            })}
            {giftCards.length === 0 && <div className="eb-empty">No gift cards yet.</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
