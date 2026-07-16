'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminShell from '@/components/AdminShell';

/* ============================================================
   Erendira's Boutique — Admin Studio · Payment links
   Same endpoints: GET /api/admin/payment-links,
   POST /api/admin/create-payment-link,
   POST /api/admin/update-payment-link.
   ============================================================ */

function money(value) {
  return '$' + Number(value || 0).toFixed(2);
}

var DEFAULT_REDIRECT = 'https://pay.erendiras.boutique/payment-complete?session_id={CHECKOUT_SESSION_ID}';

/* ---------------- Translations ---------------- */
const T = {
  en: {
    eyebrow: 'ADMIN STUDIO',
    title: 'Payment Links',
    sub: 'Create Stripe links, share them, and watch what gets paid.',
    heroLabel: 'Active',
    heroCap: 'links live now',
    statLinks: 'Links',
    statLinksCap: 'Created all-time',
    statActive: 'Active',
    statActiveCap: 'Not archived',
    statPaid: 'Paid links',
    statPaidCap: 'At least one payment',
    statCollected: 'Collected',
    statCollectedCap: 'Across all links',
    newLink: 'START HERE',
    newLinkTitle: 'New Link',
    editLinkTitle: 'Edit Link',
    cancelEdit: 'Cancel edit',
    productTitle: 'Product / payment title',
    amount: 'Amount',
    description: 'Description (optional)',
    collectName: 'Collect name',
    shippingAddress: 'Shipping address',
    billingAddress: 'Billing address',
    phoneNumber: 'Phone number',
    promoCodes: 'Promo codes',
    customerPicks: 'Customer picks amount',
    minAmount: 'Minimum amount',
    maxAmount: 'Maximum amount (optional)',
    redirectAfter: 'Redirect after payment',
    generate: 'Generate Stripe link',
    update: 'Update link',
    editHint: 'To change amount or collection settings, archive this link and create a new one.',
    summary: 'PREVIEW',
    summaryTitle: 'Link Summary',
    untitled: 'Untitled link',
    maxWord: 'Max',
    linkReady: 'PAYMENT LINK READY',
    linkPlaceholder: 'Your Stripe link will appear here once you generate it.',
    copyLink: 'Copy link',
    copied: 'Copied',
    open: 'Open',
    generated: 'LIBRARY',
    generatedTitle: 'Generated Links',
    searchLinks: 'Search links...',
    all: 'All',
    active: 'Active',
    archived: 'Archived',
    refresh: 'Refresh',
    loadingLinks: 'Loading saved payment links...',
    noLinks: 'No payment links match. Clear the search to see everything.',
    created: 'Created',
    paidCount: 'Paid',
    revenue: 'Revenue',
    pending: 'Pending',
    paid: 'Paid',
    copy: 'Copy',
    edit: 'Edit',
    archive: 'Archive',
    reactivate: 'Reactivate',
    msgTitle: 'Enter a payment title.',
    msgAmount: 'Enter a valid amount.',
    msgMin: 'Enter a minimum amount of at least $0.50.',
    msgCreating: 'Creating payment link...',
    msgUpdating: 'Updating payment link...',
    msgSaveFailed: 'Could not save payment link.',
    msgCreated: 'Payment link created.',
    msgUpdated: 'Payment link updated.',
    msgLoadFailed: 'Could not load saved payment links.',
    msgUpdateFailed: 'Could not update link.',
    msgArchived: 'Payment link archived.',
    msgReactivated: 'Payment link reactivated.',
    tipLabel: 'Quick tip',
    tipBody: 'Gift cards only work on links with promo codes turned on.',
  },
  es: {
    eyebrow: 'ADMIN STUDIO',
    title: 'Enlaces de Pago',
    sub: 'Crea enlaces de Stripe, comp\u00e1rtelos y mira cu\u00e1les se pagan.',
    heroLabel: 'Activos',
    heroCap: 'enlaces en uso',
    statLinks: 'Enlaces',
    statLinksCap: 'Creados en total',
    statActive: 'Activos',
    statActiveCap: 'Sin archivar',
    statPaid: 'Enlaces pagados',
    statPaidCap: 'Con al menos un pago',
    statCollected: 'Cobrado',
    statCollectedCap: 'De todos los enlaces',
    newLink: 'EMPIEZA AQU\u00cd',
    newLinkTitle: 'Nuevo Enlace',
    editLinkTitle: 'Editar Enlace',
    cancelEdit: 'Cancelar edici\u00f3n',
    productTitle: 'Producto / t\u00edtulo del pago',
    amount: 'Monto',
    description: 'Descripci\u00f3n (opcional)',
    collectName: 'Pedir nombre',
    shippingAddress: 'Direcci\u00f3n de env\u00edo',
    billingAddress: 'Direcci\u00f3n de facturaci\u00f3n',
    phoneNumber: 'Tel\u00e9fono',
    promoCodes: 'C\u00f3digos promo',
    customerPicks: 'La clienta elige el monto',
    minAmount: 'Monto m\u00ednimo',
    maxAmount: 'Monto m\u00e1ximo (opcional)',
    redirectAfter: 'Redirigir despu\u00e9s del pago',
    generate: 'Generar enlace de Stripe',
    update: 'Actualizar enlace',
    editHint: 'Para cambiar el monto o los datos a pedir, archiva este enlace y crea uno nuevo.',
    summary: 'VISTA PREVIA',
    summaryTitle: 'Resumen del Enlace',
    untitled: 'Enlace sin t\u00edtulo',
    maxWord: 'M\u00e1x',
    linkReady: 'ENLACE DE PAGO LISTO',
    linkPlaceholder: 'Tu enlace de Stripe aparecer\u00e1 aqu\u00ed cuando lo generes.',
    copyLink: 'Copiar enlace',
    copied: 'Copiado',
    open: 'Abrir',
    generated: 'BIBLIOTECA',
    generatedTitle: 'Enlaces Generados',
    searchLinks: 'Buscar enlaces...',
    all: 'Todos',
    active: 'Activos',
    archived: 'Archivados',
    refresh: 'Actualizar',
    loadingLinks: 'Cargando enlaces guardados...',
    noLinks: 'Ning\u00fan enlace coincide. Borra la b\u00fasqueda para ver todo.',
    created: 'Creado',
    paidCount: 'Pagado',
    revenue: 'Ingresos',
    pending: 'Pendiente',
    paid: 'Pagado',
    copy: 'Copiar',
    edit: 'Editar',
    archive: 'Archivar',
    reactivate: 'Reactivar',
    msgTitle: 'Escribe un t\u00edtulo para el pago.',
    msgAmount: 'Escribe un monto v\u00e1lido.',
    msgMin: 'Escribe un monto m\u00ednimo de al menos $0.50.',
    msgCreating: 'Creando enlace de pago...',
    msgUpdating: 'Actualizando enlace de pago...',
    msgSaveFailed: 'No se pudo guardar el enlace.',
    msgCreated: 'Enlace de pago creado.',
    msgUpdated: 'Enlace de pago actualizado.',
    msgLoadFailed: 'No se pudieron cargar los enlaces guardados.',
    msgUpdateFailed: 'No se pudo actualizar el enlace.',
    msgArchived: 'Enlace de pago archivado.',
    msgReactivated: 'Enlace de pago reactivado.',
    tipLabel: 'Tip r\u00e1pido',
    tipBody: 'Las tarjetas de regalo solo funcionan en enlaces con c\u00f3digos promo activados.',
  },
};

const dateLocale = { en: 'en-US', es: 'es-MX' };

function Icon(props) {
  return (
    <svg width={props.size || 15} height={props.size || 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {props.children}
    </svg>
  );
}
const IconSearch = function () { return (<Icon><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></Icon>); };

const pageCss = '' +
'.ebp-amt { font-size:46px; line-height:1.05; color:#806a52; margin:14px 0 0;' +
'  font-family:"La Luxes Serif","Recoleta",Georgia,serif; font-weight:400; }' +
'.ebp-name { font-size:14px; color:#8b7a64; margin:6px 0 0; }' +
'.ebp-linkbox { border:1px dashed #e8e2d8; border-radius:20px; padding:16px; margin-top:18px; font-size:12.5px;' +
'  color:#bda891; text-align:center; }' +
'.ebp-linkbox.ready { text-align:left; border-style:solid; border-color:#e8e2d8; background:#FAF8F4; color:#3d3428; }' +
'.ebp-url { margin:8px 0 12px; font-size:12px; word-break:break-all; color:#8b7a64; }' +
'.ebp-btnrow { display:flex; flex-wrap:wrap; gap:8px; }' +
'.ebp-redirect { display:flex; flex-wrap:wrap; align-items:center; gap:12px; margin-top:16px; padding-top:16px;' +
'  border-top:1px solid #e8e2d8; }' +
'.ebp-redirect .eba-in { flex:1; min-width:220px; width:auto; border-radius:999px; font-size:12px; }' +
'.ebp-tools { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; }';

/* ============================================================ */
export default function PaymentLinksPage() {
  const [lang, setLang] = useState('en');
  const t = T[lang];

  const [admin, setAdmin] = useState(null);
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

  useEffect(function () {
    const saved = localStorage.getItem('eb-lang');
    if (saved === 'en' || saved === 'es') setLang(saved);
  }, []);

  // Optional: if you expose the signed-in admin somewhere, drop it in here.
  // The shell falls back gracefully when admin is null.
  useEffect(function () {
    let cancelled = false;
    fetch('/api/admin/me', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (!cancelled && d) setAdmin(d.admin || d); })
      .catch(function () {});
    return function () { cancelled = true; };
  }, []);

  function formatDate(value) {
    if (!value) return '\u2014';
    return new Date(value).toLocaleString(dateLocale[lang], {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }

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
    setForm(function (current) { return { ...current, [field]: value }; });
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
        setMessage(data.error || t.msgLoadFailed);
        setSavedLinks([]);
        return;
      }
      setSavedLinks(data.paymentLinks || []);
    } catch (error) {
      setMessage(error.message || t.msgLoadFailed);
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

    if (!form.title.trim()) { setMessage(t.msgTitle); return; }
    if (!editingLink && !form.customerChoosesAmount && (!form.amount || Number(form.amount) <= 0)) {
      setMessage(t.msgAmount); return;
    }
    if (!editingLink && form.customerChoosesAmount && (!form.minimumAmount || Number(form.minimumAmount) < 0.5)) {
      setMessage(t.msgMin); return;
    }

    setMessage(editingLink ? t.msgUpdating : t.msgCreating);

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

    if (!res.ok) { setMessage(data.error || t.msgSaveFailed); return; }

    if (data.url) setCreatedLink(data.url);
    setMessage(editingLink ? t.msgUpdated : t.msgCreated);
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
    if (!res.ok) { setMessage(data.error || t.msgUpdateFailed); return; }
    setMessage(link.archived ? t.msgReactivated : t.msgArchived);
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

  function pillClass(link) {
    if (link.archived) return 'eba-pill off';
    if (link.status === 'paid' || Number(link.paid_count || 0) > 0) return 'eba-pill ok';
    return 'eba-pill mid';
  }
  function pillText(link) {
    if (link.archived) return t.archived;
    if (link.status === 'paid' || Number(link.paid_count || 0) > 0) return t.paid;
    return t.pending;
  }

  /* ============================================================ */
  return (
    <AdminShell
      admin={admin}
      active="payment-links"
      lang={lang}
      onLang={setLang}
      eyebrow={t.eyebrow}
      title={t.title}
      subtitle={t.sub}
      heroStat={{ label: t.heroLabel, value: analytics.activeLinks, caption: t.heroCap }}
      tip={{ label: t.tipLabel, body: t.tipBody }}
    >
      <style>{pageCss}</style>

      <section className="eba-stats" aria-label="Summary">
        <div className="eba-stat">
          <span className="lb">{t.statLinks}</span>
          <b>{analytics.totalLinks}</b>
          <span className="cap">{t.statLinksCap}</span>
        </div>
        <div className="eba-stat">
          <span className="lb">{t.statActive}</span>
          <b>{analytics.activeLinks}</b>
          <span className="cap">{t.statActiveCap}</span>
        </div>
        <div className="eba-stat">
          <span className="lb">{t.statPaid}</span>
          <b>{analytics.paidLinks}</b>
          <span className="cap">{t.statPaidCap}</span>
        </div>
        <div className="eba-stat">
          <span className="lb">{t.statCollected}</span>
          <b>{money(analytics.totalPaid)}</b>
          <span className="cap">{t.statCollectedCap}</span>
        </div>
      </section>

      <div className="eba-cols wide-left">
        <form className="eba-panel" onSubmit={savePaymentLink}>
          <div className="eba-panelhead">
            <div>
              <p className="eba-eyebrow">{t.newLink}</p>
              <h2>{editingLink ? t.editLinkTitle : t.newLinkTitle}</h2>
            </div>
            {editingLink && (
              <button className="eba-btn mini" type="button" onClick={resetForm}>{t.cancelEdit}</button>
            )}
          </div>

          <div className="eba-formrow">
            <div className="eba-field">
              <span className="eba-lb">{t.productTitle}</span>
              <input className="eba-in" value={form.title} onChange={function (e) { updateForm('title', e.target.value); }} required />
            </div>
            <div className="eba-field">
              <span className="eba-lb">{t.amount}</span>
              <input
                className="eba-in"
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

          <div className="eba-field">
            <span className="eba-lb">{t.description}</span>
            <textarea className="eba-in" rows={2} value={form.description} onChange={function (e) { updateForm('description', e.target.value); }} />
          </div>

          <div className="eba-checks">
            <label className="eba-check">
              <input type="checkbox" checked={form.collectName} disabled={Boolean(editingLink)} onChange={function (e) { updateForm('collectName', e.target.checked); }} />
              <span>{t.collectName}</span>
            </label>
            <label className="eba-check">
              <input type="checkbox" checked={form.collectShipping} disabled={Boolean(editingLink)} onChange={function (e) { updateForm('collectShipping', e.target.checked); }} />
              <span>{t.shippingAddress}</span>
            </label>
            <label className="eba-check">
              <input type="checkbox" checked={form.collectBilling} disabled={Boolean(editingLink)} onChange={function (e) { updateForm('collectBilling', e.target.checked); }} />
              <span>{t.billingAddress}</span>
            </label>
            <label className="eba-check">
              <input type="checkbox" checked={form.requirePhone} disabled={Boolean(editingLink)} onChange={function (e) { updateForm('requirePhone', e.target.checked); }} />
              <span>{t.phoneNumber}</span>
            </label>
            <label className="eba-check">
              <input type="checkbox" checked={form.allowPromotionCodes} disabled={Boolean(editingLink)} onChange={function (e) { updateForm('allowPromotionCodes', e.target.checked); }} />
              <span>{t.promoCodes}</span>
            </label>
            {!editingLink && (
              <label className="eba-check">
                <input type="checkbox" checked={form.customerChoosesAmount} onChange={function (e) { updateForm('customerChoosesAmount', e.target.checked); }} />
                <span>{t.customerPicks}</span>
              </label>
            )}
          </div>

          {editingLink && <p className="eba-muted" style={{ marginTop: 10 }}>{t.editHint}</p>}

          {!editingLink && form.customerChoosesAmount && (
            <div className="eba-formrow even" style={{ marginTop: 14 }}>
              <div>
                <span className="eba-lb">{t.minAmount}</span>
                <input className="eba-in" type="number" min="0.50" step="0.01" value={form.minimumAmount} onChange={function (e) { updateForm('minimumAmount', e.target.value); }} required />
              </div>
              <div>
                <span className="eba-lb">{t.maxAmount}</span>
                <input className="eba-in" type="number" min="0.50" step="0.01" value={form.maximumAmount} onChange={function (e) { updateForm('maximumAmount', e.target.value); }} />
              </div>
            </div>
          )}

          <div className="ebp-redirect">
            <label className="eba-check">
              <input type="checkbox" checked={form.redirectAfterPayment} onChange={function (e) { updateForm('redirectAfterPayment', e.target.checked); }} />
              <span>{t.redirectAfter}</span>
            </label>
            {form.redirectAfterPayment && (
              <input className="eba-in" value={form.redirectUrl} onChange={function (e) { updateForm('redirectUrl', e.target.value); }} />
            )}
          </div>

          <div className="eba-actions">
            <button className="eba-btn eba-btn-dark" type="submit">{editingLink ? t.update : t.generate}</button>
          </div>

          {message && <div className="eba-notice">{message}</div>}
        </form>

        <aside className="eba-panel">
          <p className="eba-eyebrow">{t.summary}</p>
          <h2>{t.summaryTitle}</h2>

          <p className="ebp-amt">
            {form.customerChoosesAmount
              ? money(form.minimumAmount || 0) + '+'
              : form.amount
              ? money(form.amount)
              : '$0.00'}
          </p>
          <p className="ebp-name">{form.title || t.untitled}</p>
          {form.description && <p className="eba-muted" style={{ marginTop: 8 }}>{form.description}</p>}
          {form.customerChoosesAmount && form.maximumAmount && (
            <p className="eba-muted" style={{ marginTop: 6 }}>{t.maxWord}: {money(form.maximumAmount)}</p>
          )}

          {createdLink ? (
            <div className="ebp-linkbox ready">
              <span className="eba-lb">{t.linkReady}</span>
              <p className="ebp-url">{createdLink}</p>
              <div className="ebp-btnrow">
                <button className="eba-btn eba-btn-dark mini" type="button" onClick={copyLink}>
                  {copied ? t.copied : t.copyLink}
                </button>
                <a className="eba-btn mini" href={createdLink} target="_blank" rel="noopener noreferrer">{t.open}</a>
              </div>
            </div>
          ) : (
            <div className="ebp-linkbox">{t.linkPlaceholder}</div>
          )}
        </aside>
      </div>

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">{t.generated}</p>
            <h2>{t.generatedTitle}</h2>
          </div>
        </div>

        <div className="ebp-tools">
          <label className="eba-search">
            <IconSearch />
            <input placeholder={t.searchLinks} value={linkSearch} onChange={function (e) { setLinkSearch(e.target.value); }} />
          </label>
          <select className="eba-select" value={linkFilter} onChange={function (e) { setLinkFilter(e.target.value); }}>
            <option value="all">{t.all}</option>
            <option value="active">{t.active}</option>
            <option value="archived">{t.archived}</option>
          </select>
          <button className="eba-btn" type="button" onClick={loadSavedPaymentLinks}>{t.refresh}</button>
        </div>

        <div className="eba-rows">
          {linksLoading ? (
            <div className="eba-empty">{t.loadingLinks}</div>
          ) : filteredSavedLinks.length === 0 ? (
            <div className="eba-empty">{t.noLinks}</div>
          ) : (
            filteredSavedLinks.map(function (link) {
              const sub = [
                t.created + ' ' + formatDate(link.created_at),
                t.paidCount + ' ' + (link.paid_count || 0),
                t.revenue + ' ' + money(link.total_paid || 0),
              ].join(' \u00b7 ');
              return (
                <div className={link.archived ? 'eba-row off' : 'eba-row'} key={link.id || link.stripe_payment_link_id}>
                  <span className="eba-who">
                    <span className="n">{link.title || 'Payment link'}</span>
                    <span className="s">{sub}</span>
                    {link.description && <span className="s">{link.description}</span>}
                  </span>
                  <span className={pillClass(link)}>{pillText(link)}</span>
                  <span className="eba-amt">
                    {link.customer_chooses_amount ? money(link.minimum_amount || 0) + '+' : money(link.amount)}
                  </span>
                  <span className="eba-rowbtns">
                    <button className="eba-btn eba-btn-dark mini" type="button" onClick={function () { copySavedLink(link); }}>
                      {copiedSavedLinkId === link.id ? t.copied : t.copy}
                    </button>
                    <a className="eba-btn mini" href={link.url} target="_blank" rel="noopener noreferrer">{t.open}</a>
                    <button className="eba-btn mini" type="button" onClick={function () { editSavedLink(link); }}>{t.edit}</button>
                    <button className="eba-btn mini" type="button" onClick={function () { archiveSavedLink(link); }}>
                      {link.archived ? t.reactivate : t.archive}
                    </button>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AdminShell>
  );
}
