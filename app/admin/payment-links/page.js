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

export default function PaymentLinksPage() {
  const [lang, setLang] = useState('en');
  const [message, setMessage] = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedLinks, setSavedLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [linkSearch, setLinkSearch] = useState('');
  const [copiedSavedLinkId, setCopiedSavedLinkId] = useState('');
  const [editingLink, setEditingLink] = useState(null);
  const [form, setForm] = useState({
    title: 'Custom Boutique Payment',
    description: 'Order payment',
    amount: '',
    customerChoosesAmount: false,
    minimumAmount: '',
    maximumAmount: '',
    collectName: true,
    collectShipping: true,
    collectBilling: true,
    requirePhone: true,
    allowPromotionCodes: true,
    redirectAfterPayment: true,
    redirectUrl: 'https://ebtq.io/cc',
  });

  const analytics = useMemo(() => {
    const activeLinks = savedLinks.filter((link) => !link.archived);
    const paidLinks = savedLinks.filter((link) => Number(link.paid_count || 0) > 0 || link.status === 'paid');
    const totalPaid = savedLinks.reduce((sum, link) => sum + Number(link.total_paid || 0), 0);
    return {
      totalLinks: savedLinks.length,
      activeLinks: activeLinks.length,
      paidLinks: paidLinks.length,
      totalPaid,
    };
  }, [savedLinks]);

  const filteredSavedLinks = savedLinks.filter((link) => {
    const query = linkSearch.trim().toLowerCase();
    if (!query) return true;
    return [link.title, link.description, link.status, link.url, link.stripe_payment_link_id]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setEditingLink(null);
    setCreatedLink('');
    setCopied(false);
    setForm({
      title: 'Custom Boutique Payment',
      description: 'Order payment',
      amount: '',
      customerChoosesAmount: false,
      minimumAmount: '',
      maximumAmount: '',
      collectName: true,
      collectShipping: true,
      collectBilling: true,
      requirePhone: true,
      allowPromotionCodes: true,
      redirectAfterPayment: true,
      redirectUrl: 'https://ebtq.io/cc',
    });
  }

  async function loadSavedPaymentLinks() {
    setLinksLoading(true);
    try {
      const res = await fetch('/api/admin/payment-links', { method: 'GET', cache: 'no-store' });
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

  async function savePaymentLink(e) {
    e.preventDefault();
    setMessage('');
    setCreatedLink('');
    setCopied(false);

    if (!form.title.trim()) {
      setMessage('Enter a payment title.');
      return;
    }

    if (!editingLink && !form.customerChoosesAmount && (!form.amount || Number(form.amount) <= 0)) {
      setMessage('Enter a valid amount.');
      return;
    }

    if (!editingLink && form.customerChoosesAmount && (!form.minimumAmount || Number(form.minimumAmount) < 0.5)) {
      setMessage('Enter a minimum amount of at least $0.50.');
      return;
    }

    setMessage(editingLink ? 'Updating payment link...' : 'Creating payment link...');

    const url = editingLink ? '/api/admin/update-payment-link' : '/api/admin/create-payment-link';
    const payload = editingLink
      ? {
          id: editingLink.id,
          stripePaymentLinkId: editingLink.stripe_payment_link_id,
          title: form.title,
          description: form.description,
          active: !editingLink.archived,
          redirectAfterPayment: form.redirectAfterPayment,
          redirectUrl: form.redirectUrl,
        }
      : form;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || 'Could not save payment link.');
      return;
    }

    if (data.url) setCreatedLink(data.url);
    setMessage(editingLink ? 'Payment link updated.' : 'Payment link created.');
    await loadSavedPaymentLinks();
    if (editingLink) setEditingLink(null);
  }

  function editSavedLink(link) {
    setEditingLink(link);
    setCreatedLink(link.url || '');
    setForm({
      title: link.title || '',
      description: link.description || '',
      amount: link.amount || '',
      customerChoosesAmount: Boolean(link.customer_chooses_amount),
      minimumAmount: link.minimum_amount || '',
      maximumAmount: link.maximum_amount || '',
      collectName: link.collect_name !== false,
      collectShipping: link.collect_shipping !== false,
      collectBilling: link.collect_billing !== false,
      requirePhone: link.require_phone !== false,
      allowPromotionCodes: link.allow_promotion_codes !== false,
      redirectAfterPayment: link.redirect_after_payment !== false,
      redirectUrl: link.redirect_url || 'https://ebtq.io/cc',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function archiveSavedLink(link) {
    const res = await fetch('/api/admin/update-payment-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: link.id,
        stripePaymentLinkId: link.stripe_payment_link_id,
        active: Boolean(link.archived),
        archived: !link.archived,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Could not update link.');
      return;
    }
    setMessage(link.archived ? 'Payment link reactivated.' : 'Payment link archived.');
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
          <img src="/logo2.png" className="logo" alt="Erendira's Boutique" />
          <h2>Admin Studio</h2>
          <p>Payment Links</p>
          <div className="side-links">
            <a className="button ghost" href="/admin">Dashboard</a>
            <a className="button secondary" href="/admin/payment-links">Payment Links</a>
            <button className="button ghost" onClick={logout}>Logout</button>
          </div>
        </aside>

        <section className="adminContent">
          <div className="adminHero no-print">
            <div>
              <p className="eyebrow">Stripe Payment Links</p>
              <h1>Payment Links</h1>
              <p>Create, copy, edit, archive, and track Stripe payment links from your billing portal.</p>
            </div>
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>

          <div className="statsGrid paymentLinkAnalytics">
            <div className="stat highlight"><span>Total links</span><b>{analytics.totalLinks}</b></div>
            <div className="stat"><span>Active links</span><b>{analytics.activeLinks}</b></div>
            <div className="stat"><span>Paid links</span><b>{analytics.paidLinks}</b></div>
            <div className="stat"><span>Total paid</span><b>{money(analytics.totalPaid)}</b></div>
          </div>

          <div className="paymentLinkPageGrid">
            <form className="card paymentLinkBuilder" onSubmit={savePaymentLink}>
              <div className="builderHeader">
                <div>
                  <p className="eyebrow">{editingLink ? 'Edit link' : 'New link'}</p>
                  <h2>{editingLink ? 'Edit Payment Link' : 'Payment information'}</h2>
                </div>
                {editingLink && <button className="button ghost mini" type="button" onClick={resetForm}>Cancel Edit</button>}
              </div>

              <div className="formGrid">
                <label className="field">
                  Product/payment title
                  <input className="input" value={form.title} onChange={(e) => updateForm('title', e.target.value)} required />
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
                    disabled={form.customerChoosesAmount || Boolean(editingLink)}
                    required={!form.customerChoosesAmount}
                  />
                </label>

                <label className="field formWide">
                  Description
                  <textarea className="input" rows="3" value={form.description} onChange={(e) => updateForm('description', e.target.value)} />
                </label>
              </div>

              {!editingLink && (
                <div className="optionPanel">
                  <p className="eyebrow">Flexible pricing</p>
                  <h3>Customer chooses what to pay</h3>
                  <label className="checkRow">
                    <input type="checkbox" checked={form.customerChoosesAmount} onChange={(e) => updateForm('customerChoosesAmount', e.target.checked)} />
                    <span>Allow customer to choose the payment amount</span>
                  </label>
                  {form.customerChoosesAmount && (
                    <div className="formGrid">
                      <label className="field">
                        Minimum amount
                        <input className="input" type="number" min="0.50" step="0.01" value={form.minimumAmount} onChange={(e) => updateForm('minimumAmount', e.target.value)} required />
                      </label>
                      <label className="field">
                        Maximum amount
                        <input className="input" type="number" min="0.50" step="0.01" value={form.maximumAmount} onChange={(e) => updateForm('maximumAmount', e.target.value)} />
                      </label>
                    </div>
                  )}
                </div>
              )}

              <div className="optionPanel">
                <p className="eyebrow">Checkout options</p>
                <h3>Customer information</h3>
                <label className="checkRow"><input type="checkbox" checked={form.collectName} disabled={Boolean(editingLink)} onChange={(e) => updateForm('collectName', e.target.checked)} /><span>Collect customer name</span></label>
                <label className="checkRow"><input type="checkbox" checked={form.collectShipping} disabled={Boolean(editingLink)} onChange={(e) => updateForm('collectShipping', e.target.checked)} /><span>Collect shipping address</span></label>
                <label className="checkRow"><input type="checkbox" checked={form.collectBilling} disabled={Boolean(editingLink)} onChange={(e) => updateForm('collectBilling', e.target.checked)} /><span>Collect billing address</span></label>
                <label className="checkRow"><input type="checkbox" checked={form.requirePhone} disabled={Boolean(editingLink)} onChange={(e) => updateForm('requirePhone', e.target.checked)} /><span>Require phone number</span></label>
                <label className="checkRow"><input type="checkbox" checked={form.allowPromotionCodes} disabled={Boolean(editingLink)} onChange={(e) => updateForm('allowPromotionCodes', e.target.checked)} /><span>Allow promotion codes</span></label>
                {editingLink && <p className="mutedText">To change amount or collection settings, archive this link and create a new one.</p>}
              </div>

              <div className="optionPanel">
                <p className="eyebrow">After payment</p>
                <h3>Confirmation</h3>
                <label className="checkRow">
                  <input type="checkbox" checked={form.redirectAfterPayment} onChange={(e) => updateForm('redirectAfterPayment', e.target.checked)} />
                  <span>Redirect customer after payment</span>
                </label>
                {form.redirectAfterPayment && (
                  <label className="field">
                    Redirect URL
                    <input className="input" value={form.redirectUrl} onChange={(e) => updateForm('redirectUrl', e.target.value)} />
                  </label>
                )}
              </div>

              <div className="paymentLinkActions">
                <button className="button secondary" type="submit">{editingLink ? 'Update Link' : 'Generate Stripe Link'}</button>
                <a className="button ghost" href="/admin">Back to Dashboard</a>
              </div>
              {message && <div className="notice">{message}</div>}
            </form>

            <aside className="card paymentLinkPreview">
              <p className="eyebrow">Preview</p>
              <h2>Link summary</h2>
              <div className="previewCard">
                <b>{form.title || 'Payment Link'}</b>
                <p>{form.description || '—'}</p>
                <h3>{form.customerChoosesAmount ? `${money(form.minimumAmount || 0)} minimum` : form.amount ? money(form.amount) : '$0.00'}</h3>
                {form.customerChoosesAmount && form.maximumAmount && <p>Max: {money(form.maximumAmount)}</p>}
              </div>
              {createdLink ? (
                <div className="createdLinkBox">
                  <b>Payment link ready</b>
                  <p>{createdLink}</p>
                  <div className="paymentLinkActions">
                    <button className="button secondary" type="button" onClick={copyLink}>{copied ? 'Copied!' : 'Copy Link'}</button>
                    <a className="button ghost" href={createdLink} target="_blank" rel="noopener noreferrer">Open Link</a>
                  </div>
                </div>
              ) : <div className="emptyState">Your generated Stripe payment link will appear here.</div>}
            </aside>
          </div>

          <section className="card savedPaymentLinksCard">
            <div className="savedLinksHeader">
              <div>
                <p className="eyebrow">Saved Links</p>
                <h2>Generated payment links</h2>
                <p className="mutedText">View created time, payment status, paid count, revenue, and quick actions.</p>
              </div>
              <div className="savedLinksActions">
                <input className="input" value={linkSearch} onChange={(e) => setLinkSearch(e.target.value)} />
                <button className="button ghost" type="button" onClick={loadSavedPaymentLinks}>Refresh</button>
              </div>
            </div>

            {linksLoading ? <div className="emptyState">Loading saved payment links...</div> : filteredSavedLinks.length === 0 ? <div className="emptyState">No saved payment links yet.</div> : (
              <div className="savedPaymentLinksList">
                {filteredSavedLinks.map((link) => (
                  <article className={`savedPaymentLinkCard ${link.archived ? 'archivedLink' : ''}`} key={link.id || link.stripe_payment_link_id}>
                    <div>
                      <p className="eyebrow">Created {formatDate(link.created_at)}</p>
                      <h3>{link.title || 'Payment Link'}</h3>
                      <p className="mutedText">{link.description || '—'}</p>
                      <p className="mutedText">Updated {formatDate(link.updated_at)}</p>
                    </div>
                    <div className="savedLinkMeta">
                      <b>{link.customer_chooses_amount ? `${money(link.minimum_amount || 0)}+` : money(link.amount)}</b>
                      <span className="pill">{link.archived ? 'archived' : (link.status || 'pending')}</span>
                      <p>Paid: {link.paid_count || 0}</p>
                      <p>Revenue: {money(link.total_paid || 0)}</p>
                    </div>
                    <div className="savedLinkButtons">
                      <button className="button secondary mini" type="button" onClick={() => copySavedLink(link)}>{copiedSavedLinkId === link.id ? 'Copied!' : 'Copy'}</button>
                      <a className="button ghost mini" href={link.url} target="_blank" rel="noopener noreferrer">Open</a>
                      <button className="button ghost mini" type="button" onClick={() => editSavedLink(link)}>Edit</button>
                      <button className="button ghost mini" type="button" onClick={() => archiveSavedLink(link)}>{link.archived ? 'Reactivate' : 'Archive'}</button>
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
