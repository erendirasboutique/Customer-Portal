'use client';

import { useEffect, useState } from 'react';
import LanguageToggle from '@/components/LanguageToggle';

export default function PaymentLinksPage() {
  const [lang, setLang] = useState('en');
  const [message, setMessage] = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedLinks, setSavedLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [linkSearch, setLinkSearch] = useState('');
  const [copiedSavedLinkId, setCopiedSavedLinkId] = useState('');
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    title: 'Custom Boutique Payment',
    description: 'Order payment',
    amount: '',
    quantity: 1,
    collectName: true,
    collectShipping: true,
    collectBilling: true,
    requirePhone: true,
    allowPromotionCodes: true,
    redirectAfterPayment: true,
    redirectUrl: 'https://ebtq.io/cc',
  });

  async function loadSavedPaymentLinks() {
    setLinksLoading(true);

    try {
      const res = await fetch('/api/admin/payment-links', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Could not load saved payment links.');
        setSavedLinks([]);
        return;
      }

      setSavedLinks(data.paymentLinks || []);
    } catch (error) {
      setMessage(error.message || 'Could not load saved payment links.');
      setSavedLinks([]);
    } finally {
      setLinksLoading(false);
    }
  }

  useEffect(() => {
    loadSavedPaymentLinks();
  }, []);

  const filteredSavedLinks = savedLinks.filter((link) => {
    const query = linkSearch.trim().toLowerCase();

    if (!query) return true;

    return [
      link.customer_name,
      link.customer_email,
      link.customer_phone,
      link.title,
      link.description,
      link.status,
      link.url,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function createPaymentLink(e) {
    e.preventDefault();
    setMessage('');
    setCreatedLink('');
    setCopied(false);

    if (!form.title.trim()) {
      setMessage('Enter a payment title.');
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setMessage('Enter a valid amount.');
      return;
    }

    setMessage('Creating payment link...');

    const res = await fetch('/api/admin/create-payment-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || 'Could not create payment link.');
      return;
    }

    setCreatedLink(data.url);
    setMessage('Payment link created.');
    await loadSavedPaymentLinks();
  }

  async function copyLink() {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function copySavedLink(link) {
    if (!link?.url) return;

    await navigator.clipboard.writeText(link.url);
    setCopiedSavedLinkId(link.id);
    setTimeout(() => setCopiedSavedLinkId(''), 1800);
  }

  function formatSavedLinkAmount(link) {
    return `$${Number(link.amount || 0).toFixed(2)}`;
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  return (
    <main className="page adminPage">
      <span className="flower one no-print">✿</span>
      <span className="flower two no-print">❀</span>

      <div className="shell split adminShell">
        <aside className="card sidebar no-print">
          <img src="/logo.png" className="logo" alt="Erendira's Boutique" />
          <h2>Admin Studio</h2>
          <p>Payment Links</p>

          <div className="side-links">
            <a className="button ghost" href="/admin">
              Dashboard
            </a>
            <a className="button secondary" href="/admin/payment-links">
              Payment Links
            </a>
            <button className="button ghost" onClick={logout}>
              Logout
            </button>
          </div>
        </aside>

        <section className="adminContent">
          <div className="adminHero no-print">
            <div>
              <p className="eyebrow">Stripe Payment Links</p>
              <h1>Create Payment Link</h1>
              <p>
                Create a branded Stripe payment link from the billing portal, copy it,
                open it, and send it to your customer.
              </p>
            </div>

            <LanguageToggle lang={lang} setLang={setLang} />
          </div>

          <div className="paymentLinkPageGrid">
            <form className="card paymentLinkBuilder" onSubmit={createPaymentLink}>
              <div className="builderHeader">
                <div>
                  <p className="eyebrow">Details</p>
                  <h2>Payment information</h2>
                </div>
              </div>

              <div className="formGrid">
                <label className="field">
                  Customer name
                  <input
                    className="input"
                    value={form.customerName}
                    onChange={(e) => updateForm('customerName', e.target.value)}
                  />
                </label>

                <label className="field">
                  Customer email
                  <input
                    className="input"
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => updateForm('customerEmail', e.target.value)}
                  />
                </label>

                <label className="field">
                  Customer phone
                  <input
                    className="input"
                    value={form.customerPhone}
                    onChange={(e) => updateForm('customerPhone', e.target.value)}
                  />
                </label>

                <label className="field">
                  Product/payment title
                  <input
                    className="input"
                    value={form.title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    required
                  />
                </label>

                <label className="field formWide">
                  Description
                  <textarea
                    className="input"
                    rows="3"
                    value={form.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                  />
                </label>

                <label className="field">
                  Amount
                  <input
                    className="input"
                    type="number"
                    min="0.50"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => updateForm('amount', e.target.value)}
                    required
                  />
                </label>

                <label className="field">
                  Quantity
                  <input
                    className="input"
                    type="number"
                    min="1"
                    step="1"
                    value={form.quantity}
                    onChange={(e) => updateForm('quantity', e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="optionPanel">
                <p className="eyebrow">Checkout options</p>
                <h3>Customer information</h3>

                <label className="checkRow">
                  <input
                    type="checkbox"
                    checked={form.collectName}
                    onChange={(e) => updateForm('collectName', e.target.checked)}
                  />
                  <span>Collect customer name</span>
                </label>

                <label className="checkRow">
                  <input
                    type="checkbox"
                    checked={form.collectShipping}
                    onChange={(e) => updateForm('collectShipping', e.target.checked)}
                  />
                  <span>Collect shipping address</span>
                </label>

                <label className="checkRow">
                  <input
                    type="checkbox"
                    checked={form.collectBilling}
                    onChange={(e) => updateForm('collectBilling', e.target.checked)}
                  />
                  <span>Collect billing address</span>
                </label>

                <label className="checkRow">
                  <input
                    type="checkbox"
                    checked={form.requirePhone}
                    onChange={(e) => updateForm('requirePhone', e.target.checked)}
                  />
                  <span>Require phone number</span>
                </label>

                <label className="checkRow">
                  <input
                    type="checkbox"
                    checked={form.allowPromotionCodes}
                    onChange={(e) => updateForm('allowPromotionCodes', e.target.checked)}
                  />
                  <span>Allow promotion codes</span>
                </label>
              </div>

              <div className="optionPanel">
                <p className="eyebrow">After payment</p>
                <h3>Confirmation</h3>

                <label className="checkRow">
                  <input
                    type="checkbox"
                    checked={form.redirectAfterPayment}
                    onChange={(e) => updateForm('redirectAfterPayment', e.target.checked)}
                  />
                  <span>Redirect customer after payment</span>
                </label>

                {form.redirectAfterPayment && (
                  <label className="field">
                    Redirect URL
                    <input
                      className="input"
                      value={form.redirectUrl}
                      onChange={(e) => updateForm('redirectUrl', e.target.value)}
                    />
                  </label>
                )}
              </div>

              <div className="paymentLinkActions">
                <button className="button secondary" type="submit">
                  Generate Stripe Link
                </button>

                <a className="button ghost" href="/admin">
                  Back to Dashboard
                </a>
              </div>

              {message && <div className="notice">{message}</div>}
            </form>

            <aside className="card paymentLinkPreview">
              <p className="eyebrow">Preview</p>
              <h2>Link summary</h2>

              <div className="previewCard">
                <b>{form.title || 'Custom Boutique Payment'}</b>
                <p>{form.description || 'Order payment'}</p>
                <h3>{form.amount ? `$${Number(form.amount).toFixed(2)}` : '$0.00'}</h3>
                <p>Quantity: {form.quantity || 1}</p>
              </div>

              {createdLink ? (
                <div className="createdLinkBox">
                  <b>Payment link ready</b>
                  <p>{createdLink}</p>

                  <div className="paymentLinkActions">
                    <button className="button secondary" type="button" onClick={copyLink}>
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>

                    <a
                      className="button ghost"
                      href={createdLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Link
                    </a>
                  </div>
                </div>
              ) : (
                <div className="emptyState">
                  Your generated Stripe payment link will appear here.
                </div>
              )}
            </aside>
          </div>

          <section className="card savedPaymentLinksCard">
            <div className="savedLinksHeader">
              <div>
                <p className="eyebrow">Saved Links</p>
                <h2>Generated payment links</h2>
                <p className="mutedText">
                  View, copy, and reopen payment links created from this admin portal.
                </p>
              </div>

              <div className="savedLinksActions">
                <input
                  className="input"
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                />

                <button className="button ghost" type="button" onClick={loadSavedPaymentLinks}>
                  Refresh
                </button>
              </div>
            </div>

            {linksLoading ? (
              <div className="emptyState">Loading saved payment links...</div>
            ) : filteredSavedLinks.length === 0 ? (
              <div className="emptyState">No saved payment links yet.</div>
            ) : (
              <div className="savedPaymentLinksList">
                {filteredSavedLinks.map((link) => (
                  <article className="savedPaymentLinkCard" key={link.id || link.stripe_payment_link_id}>
                    <div>
                      <p className="eyebrow">{new Date(link.created_at).toLocaleString()}</p>
                      <h3>{link.title || 'Payment Link'}</h3>
                      <p className="mutedText">
                        {link.customer_name || 'No customer name'} {link.customer_email ? `• ${link.customer_email}` : ''}
                      </p>
                      <p>{link.description || '—'}</p>
                    </div>

                    <div className="savedLinkMeta">
                      <b>{formatSavedLinkAmount(link)}</b>
                      <span className="pill">{link.status || 'pending'}</span>
                      <p>Qty: {link.quantity || 1}</p>
                    </div>

                    <div className="savedLinkButtons">
                      <button className="button secondary mini" type="button" onClick={() => copySavedLink(link)}>
                        {copiedSavedLinkId === link.id ? 'Copied!' : 'Copy'}
                      </button>

                      <a
                        className="button ghost mini"
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open
                      </a>
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
