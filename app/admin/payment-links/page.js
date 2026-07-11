'use client';

import { useEffect, useMemo, useState } from 'react';
import LanguageToggle from '@/components/LanguageToggle';

function money(value) {
  return '$' + Number(value || 0).toFixed(2);
}

function formatDate(value) {
  if (!value) return '\u2014';
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

var DEFAULT_REDIRECT = 'https://pay.erendiras.boutique/payment-complete?session_id={CHECKOUT_SESSION_ID}';

var css = '' +
'.eb-admin { min-height: 100vh; background: #e9e3d9; color: #332b23; font-family: inherit; padding: 24px 16px 64px; }' +
'.eb-wrap { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 24px; }' +
'@media (min-width: 1024px) { .eb-wrap { grid-template-columns: 232px 1fr; } }' +
'.eb-side { background: #fff; border: 0.5px solid rgba(128,106,82,0.3); border-radius: 24px; padding: 24px; align-self: start; position: sticky; top: 24px; }' +
'.eb-side img { width: 120px; height: auto; }' +
'.eb-side h2 { font-size: 26px; color: #806a52; margin: 14px 0 2px; font-weight: 400; }' +
'.eb-side .eb-sub { font-size: 12px; color: rgba(51,43,35,0.65); margin: 0; }' +
'.eb-nav { display: flex; flex-direction: column; gap: 8px; margin-top: 18px; }' +
'.eb-nav a, .eb-nav button { display: block; width: 100%; box-sizing: border-box; text-align: center; border-radius: 999px; padding: 10px 14px; font-size: 13px; text-decoration: none; cursor: pointer; font-family: inherit; }' +
'.eb-nav .on { background: #806a52; color: #e9e3d9; border: 0.5px solid #806a52; }' +
'.eb-nav .off { background: transparent; color: #806a52; border: 0.5px solid rgba(128,106,82,0.4); }' +
'.eb-nav .off:hover { background: rgba(128,106,82,0.08); }' +
'.eb-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; }' +
'.eb-eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: 0.3em; color: #806a52; margin: 0; }' +
'.eb-head h1 { font-size: 40px; color: #806a52; margin: 2px 0 0; font-weight: 400; }' +
'.eb-stats { display: flex; flex-wrap: wrap; background: #fff; border: 0.5px solid rgba(128,106,82,0.25); border-radius: 20px; margin-top: 16px; padding: 16px 0; }' +
'.eb-stat { flex: 1; min-width: 110px; padding: 0 20px; }' +
'.eb-stat + .eb-stat { border-left: 0.5px solid rgba(128,106,82,0.2); }' +
'.eb-stat span { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #806a52; }' +
'.eb-stat b { display: block; font-size: 24px; color: #806a52; font-weight: 400; margin-top: 4px; }' +
'.eb-grid2 { display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 14px; }' +
'@media (min-width: 900px) { .eb-grid2 { grid-template-columns: 1.5fr 1fr; } }' +
'.eb-card { background: #fff; border: 0.5px solid rgba(128,106,82,0.25); border-radius: 20px; padding: 20px; }' +
'.eb-card.self { align-self: start; }' +
'.eb-formrow { display: grid; grid-template-columns: 1.6fr 1fr; gap: 10px; }' +
'@media (max-width: 560px) { .eb-formrow { grid-template-columns: 1fr; } }' +
'.eb-lb { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: #806a52; margin: 0 0 4px; }' +
'.eb-in { box-sizing: border-box; border: 0.5px solid rgba(128,106,82,0.35); border-radius: 14px; background: #fff; padding: 10px 14px; font-size: 13px; color: #332b23; font-family: inherit; outline: none; width: 100%; }' +
'.eb-in:focus { border-color: #806a52; }' +
'.eb-in:disabled { background: rgba(233,227,217,0.5); color: rgba(51,43,35,0.5); }' +
'textarea.eb-in { resize: vertical; }' +
'.eb-checks { display: flex; flex-wrap: wrap; gap: 10px 18px; margin-top: 14px; padding-top: 14px; border-top: 0.5px dashed rgba(128,106,82,0.35); }' +
'.eb-check { display: flex; align-items: center; gap: 7px; font-size: 13px; cursor: pointer; }' +
'.eb-check input { accent-color: #806a52; width: 15px; height: 15px; }' +
'.eb-redirect { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 0.5px dashed rgba(128,106,82,0.35); }' +
'.eb-redirect .eb-in { flex: 1; min-width: 220px; width: auto; border-radius: 999px; font-size: 12px; }' +
'.eb-btn { border: 0; border-radius: 999px; padding: 10px 20px; font-size: 13px; cursor: pointer; font-family: inherit; text-decoration: none; display: inline-block; }' +
'.eb-btn.solid { background: #806a52; color: #e9e3d9; }' +
'.eb-btn.solid:hover { opacity: 0.92; }' +
'.eb-btn.line { background: #fff; color: #806a52; border: 0.5px solid rgba(128,106,82,0.4); }' +
'.eb-btn.line:hover { background: rgba(128,106,82,0.08); }' +
'.eb-btn.mini { padding: 6px 14px; font-size: 11px; }' +
'.eb-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }' +
'.eb-notice { margin-top: 12px; background: #e9e3d9; border-radius: 14px; padding: 10px 16px; font-size: 13px; color: #806a52; }' +
'.eb-muted { font-size: 12px; color: rgba(51,43,35,0.55); }' +
'.eb-sum-amt { font-size: 28px; color: #806a52; margin: 0; }' +
'.eb-sum-title { font-size: 13px; color: #7a6c5c; margin: 4px 0 0; }' +
'.eb-linkbox { border: 1px dashed rgba(128,106,82,0.45); border-radius: 14px; padding: 14px; margin-top: 14px; font-size: 12px; color: #7a6c5c; text-align: center; word-break: break-all; }' +
'.eb-linkbox.ready { text-align: left; border-style: solid; color: #332b23; }' +
'.eb-listhead { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 10px; margin-top: 24px; }' +
'.eb-listtools { display: flex; flex-wrap: wrap; gap: 8px; }' +
'.eb-listtools .eb-in { width: auto; border-radius: 999px; }' +
'.eb-ledger { background: #fff; border: 0.5px solid rgba(128,106,82,0.25); border-radius: 20px; overflow: hidden; margin-top: 8px; }' +
'.eb-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; padding: 14px 18px; border-bottom: 0.5px solid rgba(128,106,82,0.18); }' +
'.eb-row:last-child { border-bottom: 0; }' +
'.eb-row.archived { opacity: 0.6; }' +
'.eb-who { min-width: 200px; flex: 1; }' +
'.eb-who .n { display: block; font-size: 15px; font-weight: 600; }' +
'.eb-who .s { display: block; font-size: 12px; color: #7a6c5c; }' +
'.eb-pill { border-radius: 999px; padding: 3px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; }' +
'.eb-pill.pending { border: 0.5px solid rgba(180,140,60,0.5); background: rgba(200,160,80,0.1); color: #8a6420; }' +
'.eb-pill.paid { border: 0.5px solid rgba(88,128,82,0.5); background: rgba(120,150,110,0.12); color: #4c6a44; }' +
'.eb-pill.archived { border: 0.5px solid rgba(128,106,82,0.4); background: #e9e3d9; color: #5c4d3b; }' +
'.eb-amt { font-size: 16px; color: #806a52; white-space: nowrap; }' +
'.eb-rowbtns { display: flex; flex-wrap: wrap; gap: 6px; }' +
'.eb-empty { padding: 40px 18px; text-align: center; font-size: 14px; color: rgba(51,43,35,0.55); }';

export default function PaymentLinksPage() {
  const [lang, setLang] = useState('en');
  const [message, setMessage] = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedLinks, setSavedLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkFilter, setLinkFilter] = useState('all');
  const [copiedSavedLinkId, setCopiedSavedLinkId] = useState('');
  const [editingLink, setEditingLink] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
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
    redirectUrl: DEFAULT_REDIRECT,
  });

  const analytics = useMemo(function () {
    const activeLinks = savedLinks.filter(function (link) { return !link.archived; });
    const paidLinks = savedLinks.filter(function (link) {
      return Number(link.paid_count || 0) > 0 || link.status === 'paid';
    });
    const totalPaid = savedLinks.reduce(function (sum, link) {
      return sum + Number(link.total_paid || 0);
    }, 0);
    return {
      totalLinks: savedLinks.length,
      activeLinks: activeLinks.length,
      paidLinks: paidLinks.length,
      totalPaid: totalPaid,
    };
  }, [savedLinks]);

  const filteredSavedLinks = savedLinks.filter(function (link) {
    if (linkFilter === 'active' && link.archived) return false;
    if (linkFilter === 'archived' && !link.archived) return false;
    const query = linkSearch.trim().toLowerCase();
    if (!query) return true;
    return [link.title, link.description, link.status, link.url, link.stripe_payment_link_id]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  function updateForm(field, value) {
    setForm(function (current) {
      return { ...current, [field]: value };
    });
  }

  function resetForm() {
    setEditingLink(null);
    setCreatedLink('');
    setCopied(false);
    setForm({
      title: '',
      description: '',
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
      redirectUrl: DEFAULT_REDIRECT,
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

  useEffect(function () {
    loadSavedPaymentLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setTimeout(function () { setCopied(false); }, 1800);
  }

  async function copySavedLink(link) {
    if (!link?.url) return;
    await navigator.clipboard.writeText(link.url);
    setCopiedSavedLinkId(link.id);
    setTimeout(function () { setCopiedSavedLinkId(''); }, 1800);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  function pillClass(link) {
    if (link.archived) return 'eb-pill archived';
    if (link.status === 'paid' || Number(link.paid_count || 0) > 0) return 'eb-pill paid';
    return 'eb-pill pending';
  }

  return (
    <main className="eb-admin">
      <style>{css}</style>
      <div className="eb-wrap">
        <aside className="eb-side no-print">
          <img src="/logo2.png" alt="Erendira&#8217;s Boutique" />
          <h2>Admin Studio</h2>
          <p className="eb-sub">Payment Links</p>
          <nav className="eb-nav">
            <a className="off" href="/admin">Dashboard</a>
            <a className="on" href="/admin/payment-links">Payment Links</a>
            <a className="off" href="/admin/gift-cards">Gift Cards</a>
            <button className="off" onClick={logout}>Logout</button>
          </nav>
        </aside>

        <section>
          <div className="eb-head">
            <div>
              <p className="eb-eyebrow">Stripe payment links</p>
              <h1>Payment Links</h1>
            </div>
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>

          <div className="eb-stats">
            <div className="eb-stat"><span>Total links</span><b>{analytics.totalLinks}</b></div>
            <div className="eb-stat"><span>Active</span><b>{analytics.activeLinks}</b></div>
            <div className="eb-stat"><span>Paid</span><b>{analytics.paidLinks}</b></div>
            <div className="eb-stat"><span>Total paid</span><b>{money(analytics.totalPaid)}</b></div>
          </div>

          <div className="eb-grid2">
            <form className="eb-card" onSubmit={savePaymentLink}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p className="eb-eyebrow" style={{ letterSpacing: '0.25em' }}>
                  {editingLink ? 'Edit link' : 'New link'}
                </p>
                {editingLink && (
                  <button className="eb-btn line mini" type="button" onClick={resetForm}>Cancel edit</button>
                )}
              </div>

              <div className="eb-formrow">
                <div>
                  <span className="eb-lb">Product / payment title</span>
                  <input className="eb-in" value={form.title} onChange={function (e) { updateForm('title', e.target.value); }} required />
                </div>
                <div>
                  <span className="eb-lb">Amount</span>
                  <input
                    className="eb-in"
                    type="number"
                    min="0.50"
                    step="0.01"
                    value={form.amount}
                    onChange={function (e) { updateForm('amount', e.target.value); }}
                    disabled={form.customerChoosesAmount || Boolean(editingLink)}
                    required={!form.customerChoosesAmount}
                  />
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <span className="eb-lb">Description (optional)</span>
                <textarea className="eb-in" rows={2} value={form.description} onChange={function (e) { updateForm('description', e.target.value); }} />
              </div>

              <div className="eb-checks">
                <label className="eb-check">
                  <input type="checkbox" checked={form.collectName} disabled={Boolean(editingLink)} onChange={function (e) { updateForm('collectName', e.target.checked); }} />
                  <span>Collect name</span>
                </label>
                <label className="eb-check">
                  <input type="checkbox" checked={form.collectShipping} disabled={Boolean(editingLink)} onChange={function (e) { updateForm('collectShipping', e.target.checked); }} />
                  <span>Shipping address</span>
                </label>
                <label className="eb-check">
                  <input type="checkbox" checked={form.collectBilling} disabled={Boolean(editingLink)} onChange={function (e) { updateForm('collectBilling', e.target.checked); }} />
                  <span>Billing address</span>
                </label>
                <label className="eb-check">
                  <input type="checkbox" checked={form.requirePhone} disabled={Boolean(editingLink)} onChange={function (e) { updateForm('requirePhone', e.target.checked); }} />
                  <span>Phone number</span>
                </label>
                <label className="eb-check">
                  <input type="checkbox" checked={form.allowPromotionCodes} disabled={Boolean(editingLink)} onChange={function (e) { updateForm('allowPromotionCodes', e.target.checked); }} />
                  <span>Promo codes</span>
                </label>
                {!editingLink && (
                  <label className="eb-check">
                    <input type="checkbox" checked={form.customerChoosesAmount} onChange={function (e) { updateForm('customerChoosesAmount', e.target.checked); }} />
                    <span>Customer picks amount</span>
                  </label>
                )}
              </div>
              {editingLink && (
                <p className="eb-muted" style={{ marginTop: 8 }}>
                  To change amount or collection settings, archive this link and create a new one.
                </p>
              )}

              {!editingLink && form.customerChoosesAmount && (
                <div className="eb-formrow" style={{ marginTop: 12 }}>
                  <div>
                    <span className="eb-lb">Minimum amount</span>
                    <input className="eb-in" type="number" min="0.50" step="0.01" value={form.minimumAmount} onChange={function (e) { updateForm('minimumAmount', e.target.value); }} required />
                  </div>
                  <div>
                    <span className="eb-lb">Maximum amount (optional)</span>
                    <input className="eb-in" type="number" min="0.50" step="0.01" value={form.maximumAmount} onChange={function (e) { updateForm('maximumAmount', e.target.value); }} />
                  </div>
                </div>
              )}

              <div className="eb-redirect">
                <label className="eb-check">
                  <input type="checkbox" checked={form.redirectAfterPayment} onChange={function (e) { updateForm('redirectAfterPayment', e.target.checked); }} />
                  <span>Redirect after payment</span>
                </label>
                {form.redirectAfterPayment && (
                  <input className="eb-in" value={form.redirectUrl} onChange={function (e) { updateForm('redirectUrl', e.target.value); }} />
                )}
              </div>

              <div className="eb-actions">
                <button className="eb-btn solid" type="submit">
                  {editingLink ? 'Update Link' : 'Generate Stripe Link'}
                </button>
              </div>
              {message && <div className="eb-notice">{message}</div>}
            </form>

            <aside className="eb-card self">
              <p className="eb-eyebrow" style={{ letterSpacing: '0.25em', marginBottom: 12 }}>Link summary</p>
              <p className="eb-sum-amt">
                {form.customerChoosesAmount
                  ? money(form.minimumAmount || 0) + '+'
                  : form.amount
                  ? money(form.amount)
                  : '$0.00'}
              </p>
              <p className="eb-sum-title">{form.title || 'Untitled link'}</p>
              {form.description && <p className="eb-muted" style={{ marginTop: 6 }}>{form.description}</p>}
              {form.customerChoosesAmount && form.maximumAmount && (
                <p className="eb-muted" style={{ marginTop: 6 }}>Max: {money(form.maximumAmount)}</p>
              )}

              {createdLink ? (
                <div className="eb-linkbox ready">
                  <span className="eb-lb">Payment link ready</span>
                  <p style={{ margin: '6px 0 12px', fontSize: 12 }}>{createdLink}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="eb-btn solid mini" type="button" onClick={copyLink}>
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                    <a className="eb-btn line mini" href={createdLink} target="_blank" rel="noopener noreferrer">Open</a>
                  </div>
                </div>
              ) : (
                <div className="eb-linkbox">Your Stripe link will appear here.</div>
              )}
            </aside>
          </div>

          <div className="eb-listhead">
            <p className="eb-eyebrow" style={{ letterSpacing: '0.25em' }}>Generated payment links</p>
            <div className="eb-listtools">
              <input
                className="eb-in"
                placeholder="Search links..."
                value={linkSearch}
                onChange={function (e) { setLinkSearch(e.target.value); }}
              />
              <select className="eb-in" value={linkFilter} onChange={function (e) { setLinkFilter(e.target.value); }}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
              <button className="eb-btn line" type="button" onClick={loadSavedPaymentLinks}>Refresh</button>
            </div>
          </div>

          <div className="eb-ledger">
            {linksLoading ? (
              <div className="eb-empty">Loading saved payment links...</div>
            ) : filteredSavedLinks.length === 0 ? (
              <div className="eb-empty">No payment links match.</div>
            ) : (
              filteredSavedLinks.map(function (link) {
                const sub = [
                  'Created ' + formatDate(link.created_at),
                  'Paid ' + (link.paid_count || 0),
                  'Revenue ' + money(link.total_paid || 0),
                ].join(' \u00b7 ');
                return (
                  <div className={link.archived ? 'eb-row archived' : 'eb-row'} key={link.id || link.stripe_payment_link_id}>
                    <span className="eb-who">
                      <span className="n">{link.title || 'Payment Link'}</span>
                      <span className="s">{sub}</span>
                      {link.description && <span className="s">{link.description}</span>}
                    </span>
                    <span className={pillClass(link)}>{link.archived ? 'archived' : (link.status || 'pending')}</span>
                    <span className="eb-amt">
                      {link.customer_chooses_amount ? money(link.minimum_amount || 0) + '+' : money(link.amount)}
                    </span>
                    <span className="eb-rowbtns">
                      <button className="eb-btn solid mini" type="button" onClick={function () { copySavedLink(link); }}>
                        {copiedSavedLinkId === link.id ? 'Copied!' : 'Copy'}
                      </button>
                      <a className="eb-btn line mini" href={link.url} target="_blank" rel="noopener noreferrer">Open</a>
                      <button className="eb-btn line mini" type="button" onClick={function () { editSavedLink(link); }}>Edit</button>
                      <button className="eb-btn line mini" type="button" onClick={function () { archiveSavedLink(link); }}>
                        {link.archived ? 'Reactivate' : 'Archive'}
                      </button>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
