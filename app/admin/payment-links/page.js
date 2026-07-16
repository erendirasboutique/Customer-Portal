'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/* ============================================================
   Erendira's Boutique — Admin Studio · Payment links
   "Atelier" design: espresso sidebar, ruled ledger content.
   Same endpoints: GET /api/admin/payment-links,
   POST /api/admin/create-payment-link,
   POST /api/admin/update-payment-link, POST /api/auth/logout.
   Requires /public/logo2.png (light logo, shown on espresso).
   ============================================================ */

function money(value) {
  return '$' + Number(value || 0).toFixed(2);
}

var DEFAULT_REDIRECT = 'https://pay.erendiras.boutique/payment-complete?session_id={CHECKOUT_SESSION_ID}';

/* ---------------- Translations ---------------- */
const T = {
  en: {
    adminStudio: 'ADMIN STUDIO',
    overview: 'Overview',
    paymentLinks: 'Payment links',
    giftCards: 'Gift cards',
    orders: 'Orders',
    shipping: 'Shipping',
    logOut: 'Log out',
    title: 'Payment links',
    sumLinks: 'links',
    sumActive: 'active',
    sumPaid: 'paid',
    sumCollected: 'collected',
    newLink: 'NEW LINK',
    editLink: 'EDIT LINK',
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
    linkSummary: 'LINK SUMMARY',
    untitled: 'Untitled link',
    maxWord: 'Max',
    linkReady: 'PAYMENT LINK READY',
    linkPlaceholder: 'Your Stripe link will appear here.',
    copyLink: 'Copy link',
    copied: 'Copied!',
    open: 'Open',
    generated: 'Generated links',
    searchLinks: 'Search links...',
    all: 'All',
    active: 'Active',
    archived: 'Archived',
    refresh: 'Refresh',
    loadingLinks: 'Loading saved payment links...',
    noLinks: 'No payment links match.',
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
  },
  es: {
    adminStudio: 'ADMIN STUDIO',
    overview: 'Resumen',
    paymentLinks: 'Enlaces de pago',
    giftCards: 'Tarjetas de regalo',
    orders: 'Pedidos',
    shipping: 'Env\u00edos',
    logOut: 'Cerrar sesi\u00f3n',
    title: 'Enlaces de pago',
    sumLinks: 'enlaces',
    sumActive: 'activos',
    sumPaid: 'pagados',
    sumCollected: 'cobrado',
    newLink: 'NUEVO ENLACE',
    editLink: 'EDITAR ENLACE',
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
    linkSummary: 'RESUMEN DEL ENLACE',
    untitled: 'Enlace sin t\u00edtulo',
    maxWord: 'M\u00e1x',
    linkReady: 'ENLACE DE PAGO LISTO',
    linkPlaceholder: 'Tu enlace de Stripe aparecer\u00e1 aqu\u00ed.',
    copyLink: 'Copiar enlace',
    copied: '\u00a1Copiado!',
    open: 'Abrir',
    generated: 'Enlaces generados',
    searchLinks: 'Buscar enlaces...',
    all: 'Todos',
    active: 'Activos',
    archived: 'Archivados',
    refresh: 'Actualizar',
    loadingLinks: 'Cargando enlaces guardados...',
    noLinks: 'Ning\u00fan enlace coincide.',
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
  },
};

const dateLocale = { en: 'en-US', es: 'es-MX' };

/* ---------------- Icons ---------------- */
function Icon(props) {
  return (
    <svg width={props.size || 17} height={props.size || 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {props.children}
    </svg>
  );
}
const IconHome = function () { return (<Icon><path d="M5 12l7-8 7 8" /><path d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9" /></Icon>); };
const IconLink = function () { return (<Icon><path d="M9 15l6-6" /><path d="M11 6l.5-.5a4.95 4.95 0 017 7L18 13" /><path d="M13 18l-.5.5a4.95 4.95 0 01-7-7L6 11" /></Icon>); };
const IconGift = function () { return (<Icon><path d="M3 9h18v3H3z" /><path d="M12 9v12" /><path d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" /><path d="M7.5 9a2.5 2.5 0 010-5C11 4 12 9 12 9s1-5 4.5-5a2.5 2.5 0 010 5" /></Icon>); };
const IconBox = function () { return (<Icon><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M12 12l8-4.5" /><path d="M12 12v9" /><path d="M12 12L4 7.5" /></Icon>); };
const IconTruck = function () { return (<Icon><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M5 17H3V6a1 1 0 011-1h9v12M9 17h6M15 8h4l2 3v6h-2" /></Icon>); };
const IconExternal = function () { return (<Icon size={11}><path d="M7 17L17 7" /><path d="M8 7h9v9" /></Icon>); };
const IconLogout = function () { return (<Icon><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></Icon>); };
const IconSearch = function () { return (<Icon size={15}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></Icon>); };

/* ---------------- Styles ---------------- */
var css = '' +
'.eba { min-height: 100vh; background: #F5F3EF; color: #3d3128; }' +
'.eba * { box-sizing: border-box; }' +
'.eba a { color: inherit; text-decoration: none; }' +
'.eba button, .eba input, .eba select, .eba textarea { font-family: inherit; }' +
'.eba button { cursor: pointer; }' +
'.eba-shell { min-height: 100vh; display: grid; grid-template-columns: 236px minmax(0,1fr); }' +
'.eba-side { position: sticky; top: 0; height: 100vh; background: #3d3128; padding: 26px 16px 18px; display: flex; flex-direction: column; z-index: 30; }' +
'.eba-logo { width: 138px; height: auto; display: block; object-fit: contain; }' +
'.eba-side-eyebrow { margin: 14px 0 20px; font-size: 9px; letter-spacing: 0.3em; color: #bda891; }' +
'.eba-nav { display: grid; gap: 4px; }' +
'.eba-nav a, .eba-nav button { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 10px; color: #bda891; font-size: 13.5px; border: 0; background: transparent; width: 100%; text-align: left; transition: background .15s ease, color .15s ease; }' +
'.eba-nav a:hover, .eba-nav button:hover { background: rgba(245,243,239,0.07); color: #e3d9cc; }' +
'.eba-nav a.on { background: #806a52; color: #F5F3EF; }' +
'.eba-nav .ic { width: 18px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }' +
'.eba-nav .ext { margin-left: auto; opacity: .7; display: inline-flex; }' +
'.eba-side-div { border-top: 1px solid #5a4c3c; margin: 12px 4px; }' +
'.eba-side-spacer { flex: 1; }' +
'.eba-side-bottom { border-top: 1px solid #5a4c3c; padding-top: 10px; }' +
'.eba-main { min-width: 0; }' +
'.eba-content { max-width: 1240px; margin: 0 auto; padding: 30px 36px 72px; }' +
'.eba-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }' +
'.eba-head h1 { margin: 0; font-size: 34px; font-weight: 400; font-style: italic; color: #3d3128; line-height: 1.1; }' +
'.eba-head .sub { margin: 5px 0 0; font-size: 12px; color: #a08a71; }' +
'.eba-langs { display: flex; border: 1px solid #cbb9a4; border-radius: 999px; overflow: hidden; flex-shrink: 0; }' +
'.eba-langs button { border: 0; background: transparent; padding: 7px 14px; font-size: 10px; letter-spacing: 1.5px; color: #806a52; }' +
'.eba-langs button.on { background: #3d3128; color: #F5F3EF; }' +
'.eba-rule { border-top: 2px solid #3d3128; margin-top: 16px; }' +

/* form + summary */
'.eba-grid2 { display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 20px; }' +
'@media (min-width: 940px) { .eba-grid2 { grid-template-columns: 1.55fr 1fr; } }' +
'.eba-eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: 0.24em; color: #806a52; margin: 0; }' +
'.eba-panel { background: #EDEAE3; border-radius: 16px; padding: 20px; }' +
'.eba-panel.self { align-self: start; background: #fff; border: 1px solid #d8d2c8; }' +
'.eba-formrow { display: grid; grid-template-columns: 1.6fr 1fr; gap: 10px; }' +
'@media (max-width: 560px) { .eba-formrow { grid-template-columns: 1fr; } }' +
'.eba-lb { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: #806a52; margin: 0 0 4px; }' +
'.eba-in { border: 1px solid #d8d2c8; border-radius: 12px; background: #fff; padding: 10px 14px; font-size: 13px; color: #3d3128; outline: none; width: 100%; }' +
'.eba-in:focus { border-color: #806a52; }' +
'.eba-in:disabled { background: #F5F3EF; color: #a08a71; }' +
'textarea.eba-in { resize: vertical; }' +
'.eba-checks { display: flex; flex-wrap: wrap; gap: 10px 18px; margin-top: 14px; padding-top: 14px; border-top: 1px dotted #bda891; }' +
'.eba-check { display: flex; align-items: center; gap: 7px; font-size: 13px; cursor: pointer; }' +
'.eba-check input { accent-color: #806a52; width: 15px; height: 15px; }' +
'.eba-redirect { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px dotted #bda891; }' +
'.eba-redirect .eba-in { flex: 1; min-width: 220px; width: auto; border-radius: 999px; font-size: 12px; }' +
'.eba-btn { border: 1px solid #d8d2c8; border-radius: 999px; padding: 10px 18px; font-size: 12.5px; background: #fff; color: #6b5638; text-decoration: none; display: inline-block; }' +
'.eba-btn:hover { background: #F5F3EF; }' +
'.eba-btn-dark { background: #3d3128; border-color: #3d3128; color: #F5F3EF; }' +
'.eba-btn-dark:hover { background: #2c241c; }' +
'.eba-btn.mini { padding: 6px 13px; font-size: 11px; }' +
'.eba-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }' +
'.eba-notice { margin-top: 12px; background: #fff; border: 1px solid #d8d2c8; border-radius: 12px; padding: 10px 15px; font-size: 12.5px; color: #806a52; }' +
'.eba-muted { font-size: 12px; color: #a08a71; }' +
'.eba-sum-amt { font-size: 30px; color: #3d3128; margin: 8px 0 0; font-weight: 400; }' +
'.eba-sum-title { font-size: 13px; color: #806a52; margin: 4px 0 0; }' +
'.eba-linkbox { border: 1px dashed #bda891; border-radius: 12px; padding: 14px; margin-top: 14px; font-size: 12px; color: #a08a71; text-align: center; word-break: break-all; }' +
'.eba-linkbox.ready { text-align: left; border-style: solid; border-color: #806a52; color: #3d3128; background: #F5F3EF; }' +

/* generated list */
'.eba-listhead { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 10px; margin-top: 30px; border-bottom: 1px solid #cbb9a4; padding-bottom: 10px; }' +
'.eba-listhead h2 { margin: 0; font-size: 19px; font-weight: 400; font-style: italic; color: #806a52; }' +
'.eba-listtools { display: flex; flex-wrap: wrap; gap: 8px; }' +
'.eba-search { display: flex; align-items: center; gap: 8px; border: 1px solid #d8d2c8; border-radius: 999px; padding: 8px 14px; background: #fff; }' +
'.eba-search svg { color: #a08a71; flex-shrink: 0; }' +
'.eba-search input { border: 0; outline: 0; background: transparent; color: #3d3128; font-size: 12.5px; width: 160px; }' +
'.eba-search input::placeholder { color: #a08a71; }' +
'.eba-select { appearance: none; border: 1px solid #d8d2c8; border-radius: 999px; padding: 8px 30px 8px 14px; background: #fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'11\' height=\'11\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23806a52\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 12px center; color: #6b5638; font-size: 12px; outline: 0; }' +
'.eba-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; padding: 14px 4px; border-bottom: 1px dotted #bda891; }' +
'.eba-row.archived { opacity: 0.55; }' +
'.eba-who { min-width: 200px; flex: 1; }' +
'.eba-who .n { display: block; font-size: 14.5px; color: #3d3128; }' +
'.eba-who .s { display: block; margin-top: 2px; font-size: 11px; color: #a08a71; }' +
'.eba-pill { border-radius: 999px; padding: 3px 10px; font-size: 9px; letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; }' +
'.eba-pill.pending { background: #f3e9d8; color: #8a6420; }' +
'.eba-pill.paid { background: #e7efe0; color: #3b5a2a; }' +
'.eba-pill.archived { background: #fff; border: 1px solid #d8d2c8; color: #806a52; }' +
'.eba-amt { font-size: 16px; color: #3d3128; white-space: nowrap; }' +
'.eba-rowbtns { display: flex; flex-wrap: wrap; gap: 6px; }' +
'.eba-empty { padding: 44px 18px; text-align: center; font-size: 13.5px; color: #a08a71; border-bottom: 1px dotted #bda891; }' +

/* responsive */
'@media (max-width: 1050px) { .eba-shell { grid-template-columns: 200px minmax(0,1fr); } .eba-content { padding: 24px 20px 60px; } .eba-head h1 { font-size: 28px; } }' +
'@media (max-width: 760px) {' +
' .eba-shell { display: block; }' +
' .eba-side { position: static; height: auto; padding: 14px 12px; }' +
' .eba-logo { width: 108px; }' +
' .eba-side-eyebrow { margin: 8px 0 10px; }' +
' .eba-nav { display: flex; overflow-x: auto; padding-bottom: 3px; }' +
' .eba-nav a, .eba-nav button { white-space: nowrap; padding: 8px 11px; width: auto; }' +
' .eba-side-div, .eba-side-spacer { display: none; }' +
' .eba-side-bottom { border-top: 0; padding-top: 6px; }' +
' .eba-content { padding: 18px 14px 52px; }' +
' .eba-head h1 { font-size: 25px; }' +
' .eba-panel { padding: 16px; }' +
' .eba-listtools { width: 100%; }' +
' .eba-search { flex: 1 1 100%; }' +
' .eba-search input { width: 100%; }' +
' .eba-select { flex: 1; }' +
' .eba-row { padding: 12px 2px; row-gap: 8px; }' +
' .eba-who { flex: 1 1 100%; min-width: 0; }' +
' .eba-amt { margin-left: auto; }' +
' .eba-rowbtns { flex: 1 1 100%; }' +
' .eba-rowbtns .eba-btn { flex: 1; text-align: center; }' +
'}';

/* ============================================================ */
export default function PaymentLinksPage() {
  const [lang, setLangState] = useState('en');
  const t = T[lang];

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
    if (saved === 'en' || saved === 'es') setLangState(saved);
  }, []);
  function setLang(l) {
    setLangState(l);
    localStorage.setItem('eb-lang', l);
    document.documentElement.lang = l;
  }

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

    if (!form.title.trim()) {
      setMessage(t.msgTitle);
      return;
    }

    if (!editingLink && !form.customerChoosesAmount && (!form.amount || Number(form.amount) <= 0)) {
      setMessage(t.msgAmount);
      return;
    }

    if (!editingLink && form.customerChoosesAmount && (!form.minimumAmount || Number(form.minimumAmount) < 0.5)) {
      setMessage(t.msgMin);
      return;
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

    if (!res.ok) {
      setMessage(data.error || t.msgSaveFailed);
      return;
    }

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
    if (!res.ok) {
      setMessage(data.error || t.msgUpdateFailed);
      return;
    }
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

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  function pillClass(link) {
    if (link.archived) return 'eba-pill archived';
    if (link.status === 'paid' || Number(link.paid_count || 0) > 0) return 'eba-pill paid';
    return 'eba-pill pending';
  }
  function pillText(link) {
    if (link.archived) return t.archived;
    if (link.status === 'paid' || Number(link.paid_count || 0) > 0) return t.paid;
    return t.pending;
  }

  const SHIP = 'https://ship.erendirasboutique.com';

  /* ============================================================ */
  return (
    <main className="eba">
      <style>{css}</style>

      <div className="eba-shell">
        <aside className="eba-side no-print">
          <a href="/admin" aria-label="Erendira's Boutique admin home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo2.png" alt="Erendira&#8217;s Boutique" className="eba-logo" />
          </a>
          <p className="eba-side-eyebrow">{t.adminStudio}</p>

          <nav className="eba-nav" aria-label="Admin navigation">
            <a href="/admin"><span className="ic"><IconHome /></span><span>{t.overview}</span></a>
            <a className="on" href="/admin/payment-links"><span className="ic"><IconLink /></span><span>{t.paymentLinks}</span></a>
            <a href="/admin/gift-cards"><span className="ic"><IconGift /></span><span>{t.giftCards}</span></a>
          </nav>
          <div className="eba-side-div" />
          <nav className="eba-nav" aria-label="Shipping portal">
            <a href={SHIP + '/orders'} target="_blank" rel="noopener noreferrer"><span className="ic"><IconBox /></span><span>{t.orders}</span><span className="ext"><IconExternal /></span></a>
            <a href={SHIP} target="_blank" rel="noopener noreferrer"><span className="ic"><IconTruck /></span><span>{t.shipping}</span><span className="ext"><IconExternal /></span></a>
          </nav>

          <div className="eba-side-spacer" />

          <div className="eba-side-bottom">
            <nav className="eba-nav">
              <button onClick={logout}><span className="ic"><IconLogout /></span><span>{t.logOut}</span></button>
            </nav>
          </div>
        </aside>

        <section className="eba-main">
          <div className="eba-content">
            <div className="eba-head">
              <div>
                <h1>{t.title}</h1>
                <p className="sub">
                  {analytics.totalLinks} {t.sumLinks}{' \u00b7 '}{analytics.activeLinks} {t.sumActive}{' \u00b7 '}{analytics.paidLinks} {t.sumPaid}{' \u00b7 '}{money(analytics.totalPaid)} {t.sumCollected}
                </p>
              </div>
              <div className="eba-langs" role="group" aria-label="Language">
                {['en', 'es'].map(function (l) {
                  return (
                    <button key={l} className={lang === l ? 'on' : ''} onClick={function () { setLang(l); }}>
                      {l.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="eba-rule" />

            <div className="eba-grid2">
              <form className="eba-panel" onSubmit={savePaymentLink}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <p className="eba-eyebrow">{editingLink ? t.editLink : t.newLink}</p>
                  {editingLink && (
                    <button className="eba-btn mini" type="button" onClick={resetForm}>{t.cancelEdit}</button>
                  )}
                </div>

                <div className="eba-formrow">
                  <div>
                    <span className="eba-lb">{t.productTitle}</span>
                    <input className="eba-in" value={form.title} onChange={function (e) { updateForm('title', e.target.value); }} required />
                  </div>
                  <div>
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

                <div style={{ marginTop: 10 }}>
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
                {editingLink && (
                  <p className="eba-muted" style={{ marginTop: 8 }}>{t.editHint}</p>
                )}

                {!editingLink && form.customerChoosesAmount && (
                  <div className="eba-formrow" style={{ marginTop: 12 }}>
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

                <div className="eba-redirect">
                  <label className="eba-check">
                    <input type="checkbox" checked={form.redirectAfterPayment} onChange={function (e) { updateForm('redirectAfterPayment', e.target.checked); }} />
                    <span>{t.redirectAfter}</span>
                  </label>
                  {form.redirectAfterPayment && (
                    <input className="eba-in" value={form.redirectUrl} onChange={function (e) { updateForm('redirectUrl', e.target.value); }} />
                  )}
                </div>

                <div className="eba-actions">
                  <button className="eba-btn eba-btn-dark" type="submit">
                    {editingLink ? t.update : t.generate}
                  </button>
                </div>
                {message && <div className="eba-notice">{message}</div>}
              </form>

              <aside className="eba-panel self">
                <p className="eba-eyebrow">{t.linkSummary}</p>
                <p className="eba-sum-amt">
                  {form.customerChoosesAmount
                    ? money(form.minimumAmount || 0) + '+'
                    : form.amount
                    ? money(form.amount)
                    : '$0.00'}
                </p>
                <p className="eba-sum-title">{form.title || t.untitled}</p>
                {form.description && <p className="eba-muted" style={{ marginTop: 6 }}>{form.description}</p>}
                {form.customerChoosesAmount && form.maximumAmount && (
                  <p className="eba-muted" style={{ marginTop: 6 }}>{t.maxWord}: {money(form.maximumAmount)}</p>
                )}

                {createdLink ? (
                  <div className="eba-linkbox ready">
                    <span className="eba-lb">{t.linkReady}</span>
                    <p style={{ margin: '6px 0 12px', fontSize: 12 }}>{createdLink}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="eba-btn eba-btn-dark mini" type="button" onClick={copyLink}>
                        {copied ? t.copied : t.copyLink}
                      </button>
                      <a className="eba-btn mini" href={createdLink} target="_blank" rel="noopener noreferrer">{t.open}</a>
                    </div>
                  </div>
                ) : (
                  <div className="eba-linkbox">{t.linkPlaceholder}</div>
                )}
              </aside>
            </div>

            <div className="eba-listhead">
              <h2>{t.generated}</h2>
              <div className="eba-listtools">
                <label className="eba-search">
                  <IconSearch />
                  <input
                    placeholder={t.searchLinks}
                    value={linkSearch}
                    onChange={function (e) { setLinkSearch(e.target.value); }}
                  />
                </label>
                <select className="eba-select" value={linkFilter} onChange={function (e) { setLinkFilter(e.target.value); }}>
                  <option value="all">{t.all}</option>
                  <option value="active">{t.active}</option>
                  <option value="archived">{t.archived}</option>
                </select>
                <button className="eba-btn" type="button" onClick={loadSavedPaymentLinks}>{t.refresh}</button>
              </div>
            </div>

            <div>
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
                    <div className={link.archived ? 'eba-row archived' : 'eba-row'} key={link.id || link.stripe_payment_link_id}>
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
        </section>
      </div>
    </main>
  );
}
