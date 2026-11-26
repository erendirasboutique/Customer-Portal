'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AdminShell from '@/components/AdminShell';

/* ============================================================
   Erendira's Boutique — Admin Studio · Payment links
   Same endpoints: GET /api/admin/payment-links,
   POST /api/admin/create-payment-link,
   POST /api/admin/update-payment-link.

   Layout (Direction A):
     - "Waiting to be paid" first, then every link with filter tabs.
     - "+ New link" opens a panel (right side on a computer,
       bottom sheet on a phone). Add ?new=1 to the address to open it.
     - Tapping a link opens its detail: copy, text, share, QR,
       open, edit, archive.
   "Thank-you page after paying" is ON by default and sends
   customers to DEFAULT_REDIRECT.
   ============================================================ */

function money(value) {
  return '$' + Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

var DEFAULT_REDIRECT = 'https://my.erendirasboutique.com/payment-complete?session_id={CHECKOUT_SESSION_ID}';
const PAGE_SIZE = 30;

function blankForm() {
  return {
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
  };
}

/* ---------------- Translations ---------------- */
const T = {
  en: {
    title: 'Payment links',
    summary: function (live, paid, total) { return live + ' live · ' + paid + ' paid at least once · ' + total + ' collected'; },
    newLink: 'New link',
    newLinkTitle: 'New payment link',
    editLinkTitle: 'Edit link',
    close: 'Close',
    back: 'Back',
    amountLabel: 'Amount',
    forLabel: 'What is it for?',
    forPlaceholder: 'e.g. Custom order for Mayra',
    noteLabel: 'Note on the receipt (optional)',
    customerPays: 'Customer pays',
    checkoutOptions: 'At checkout',
    collectName: 'Name',
    shippingAddress: 'Shipping address',
    billingAddress: 'Billing address',
    phoneNumber: 'Phone',
    promoCodes: 'Promo & gift card codes',
    customerPicks: 'Customer picks amount',
    thankYou: 'Thank-you page after paying',
    afterPaying: 'After paying →',
    change: 'Change',
    done: 'Done',
    promoOffHint: 'Gift cards won’t work on this link while promo codes are off.',
    minAmount: 'Minimum amount',
    maxAmount: 'Maximum (optional)',
    generate: 'Create link',
    update: 'Save changes',
    editHint: 'To change the amount or what checkout asks for, archive this link and create a new one.',
    waiting: 'Waiting to be paid',
    allLinks: 'All links',
    searchLinks: 'Search name, note or amount',
    all: 'All',
    paidTab: 'Paid',
    pendingTab: 'Pending',
    archived: 'Archived',
    refresh: 'Refresh',
    loadingLinks: 'Loading payment links…',
    noLinks: 'No payment links match. Clear the search to see everything.',
    showing: function (n, total) { return 'Showing ' + n + ' of ' + total; },
    loadMore: 'Load more',
    paidTimes: function (n) { return n === 1 ? 'paid once' : 'paid ' + n + ' times'; },
    notPaid: 'not paid yet',
    pending: 'Pending',
    paid: 'Paid',
    copy: 'Copy',
    copied: 'Copied',
    text: 'Text',
    share: 'Share',
    qr: 'QR code',
    open: 'Open',
    edit: 'Edit',
    archive: 'Archive',
    reactivate: 'Reactivate',
    created: 'Created',
    timesPaid: 'Times paid',
    asksFor: 'Checkout asks for',
    nothing: 'Nothing extra',
    promoRow: 'Promo & gift codes',
    on: 'On',
    off: 'Off',
    goesTo: 'After paying, goes to',
    stripePage: 'Stripe’s own confirmation page',
    picksFrom: 'Customer picks, from',
    linkReady: 'Your link is ready. Copy it or send it below.',
    msgTitle: 'Enter what the link is for.',
    msgAmount: 'Enter a valid amount.',
    msgMin: 'Enter a minimum amount of at least $0.50.',
    msgCreating: 'Creating payment link…',
    msgUpdating: 'Saving…',
    msgSaveFailed: 'Could not save payment link.',
    msgUpdated: 'Payment link updated.',
    msgLoadFailed: 'Could not load saved payment links.',
    msgUpdateFailed: 'Could not update link.',
    msgArchived: 'Payment link archived.',
    msgReactivated: 'Payment link reactivated.',
  },
  es: {
    title: 'Enlaces de pago',
    summary: function (live, paid, total) { return live + ' activos · ' + paid + ' pagados al menos una vez · ' + total + ' cobrado'; },
    newLink: 'Nuevo enlace',
    newLinkTitle: 'Nuevo enlace de pago',
    editLinkTitle: 'Editar enlace',
    close: 'Cerrar',
    back: 'Atrás',
    amountLabel: 'Monto',
    forLabel: '¿Para qué es?',
    forPlaceholder: 'ej. Pedido especial para Mayra',
    noteLabel: 'Nota en el recibo (opcional)',
    customerPays: 'La clienta paga',
    checkoutOptions: 'Al pagar',
    collectName: 'Nombre',
    shippingAddress: 'Dirección de envío',
    billingAddress: 'Dirección de facturación',
    phoneNumber: 'Teléfono',
    promoCodes: 'Códigos promo y tarjetas',
    customerPicks: 'La clienta elige el monto',
    thankYou: 'Página de gracias al pagar',
    afterPaying: 'Después de pagar →',
    change: 'Cambiar',
    done: 'Listo',
    promoOffHint: 'Las tarjetas de regalo no funcionan en este enlace sin códigos promo.',
    minAmount: 'Monto mínimo',
    maxAmount: 'Máximo (opcional)',
    generate: 'Crear enlace',
    update: 'Guardar cambios',
    editHint: 'Para cambiar el monto o lo que se pide al pagar, archiva este enlace y crea uno nuevo.',
    waiting: 'Esperando pago',
    allLinks: 'Todos los enlaces',
    searchLinks: 'Buscar nombre, nota o monto',
    all: 'Todos',
    paidTab: 'Pagados',
    pendingTab: 'Pendientes',
    archived: 'Archivados',
    refresh: 'Actualizar',
    loadingLinks: 'Cargando enlaces…',
    noLinks: 'Ningún enlace coincide. Borra la búsqueda para ver todo.',
    showing: function (n, total) { return 'Mostrando ' + n + ' de ' + total; },
    loadMore: 'Ver más',
    paidTimes: function (n) { return n === 1 ? 'pagado una vez' : 'pagado ' + n + ' veces'; },
    notPaid: 'sin pagar',
    pending: 'Pendiente',
    paid: 'Pagado',
    copy: 'Copiar',
    copied: 'Copiado',
    text: 'Mensaje',
    share: 'Compartir',
    qr: 'Código QR',
    open: 'Abrir',
    edit: 'Editar',
    archive: 'Archivar',
    reactivate: 'Reactivar',
    created: 'Creado',
    timesPaid: 'Veces pagado',
    asksFor: 'Se pide al pagar',
    nothing: 'Nada extra',
    promoRow: 'Códigos promo y tarjetas',
    on: 'Sí',
    off: 'No',
    goesTo: 'Después de pagar, va a',
    stripePage: 'La página de confirmación de Stripe',
    picksFrom: 'La clienta elige, desde',
    linkReady: 'Tu enlace está listo. Cópialo o envíalo abajo.',
    msgTitle: 'Escribe para qué es el enlace.',
    msgAmount: 'Escribe un monto válido.',
    msgMin: 'Escribe un monto mínimo de al menos $0.50.',
    msgCreating: 'Creando enlace de pago…',
    msgUpdating: 'Guardando…',
    msgSaveFailed: 'No se pudo guardar el enlace.',
    msgUpdated: 'Enlace de pago actualizado.',
    msgLoadFailed: 'No se pudieron cargar los enlaces guardados.',
    msgUpdateFailed: 'No se pudo actualizar el enlace.',
    msgArchived: 'Enlace de pago archivado.',
    msgReactivated: 'Enlace de pago reactivado.',
  },
};

const dateLocale = { en: 'en-US', es: 'es-MX' };

function Icon(props) {
  return (
    <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {props.children}
    </svg>
  );
}
const IconSearch = function () { return (<Icon size={15}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></Icon>); };
const IconCopy = function () { return (<Icon><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" /></Icon>); };
const IconText = function () { return (<Icon><path d="M4 5h16v11H9l-4 4v-4H4z" /></Icon>); };
const IconShare = function () { return (<Icon><path d="M12 3v12" /><path d="M7 8l5-5 5 5" /><path d="M5 13v7h14v-7" /></Icon>); };
const IconQr = function () { return (<Icon><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v.01M14 21h3M20 18v3" /></Icon>); };
const IconOpen = function () { return (<Icon><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" /></Icon>); };
const IconClose = function () { return (<Icon size={16}><path d="M6 6l12 12M18 6L6 18" /></Icon>); };
const IconBack = function () { return (<Icon size={16}><path d="M15 5l-7 7 7 7" /></Icon>); };
const IconPlus = function () { return (<Icon size={16}><path d="M12 5v14M5 12h14" /></Icon>); };

const pageCss = '' +
/* list */
'.ebp-summary { margin:0; }' +
'.ebp-tabs { display:inline-flex; flex-wrap:wrap; gap:2px; padding:3px; border:1px solid var(--line); border-radius:999px; background:var(--card); }' +
'.ebp-tabs button { border:0; background:transparent; border-radius:999px; padding:8px 14px; min-height:36px; font-size:13.5px; color:var(--taupe); }' +
'.ebp-tabs button.on { background:var(--accent); color:var(--cream); }' +
'.ebp-tabs .n { opacity:.7; margin-left:4px; }' +
'.ebp-row { display:flex; align-items:center; gap:10px; border-top:1px solid var(--hair); }' +
'.ebp-row:first-child { border-top:0; }' +
'.ebp-row.off { opacity:.55; }' +
'.ebp-rowmain { flex:1; min-width:0; display:flex; align-items:center; gap:12px; padding:12px 4px; border:0; background:transparent; text-align:left; color:inherit; border-radius:12px; }' +
'.ebp-rowmain:hover { background:var(--wash); }' +
'.ebp-rowmain .eba-who { min-width:0; }' +
'.ebp-copy { flex-shrink:0; }' +
'.ebp-waitcard { background:var(--card); border:1px solid var(--line); border-radius:20px; padding:4px 16px; }' +
'.ebp-sechead { display:flex; align-items:center; gap:8px; margin:0 0 8px 4px; font-size:14px; color:var(--taupe); }' +
'.ebp-sechead .dot { width:8px; height:8px; border-radius:50%; }' +
'.ebp-sechead .r { margin-left:auto; font-size:13px; color:var(--mute); }' +
'.ebp-foot { display:flex; align-items:center; justify-content:space-between; gap:10px; padding-top:12px; margin-top:4px; border-top:1px solid var(--hair); font-size:13px; color:var(--mute); }' +
/* panel: right drawer on a computer, bottom sheet on a phone */
'.ebp-bg { position:fixed; inset:0; z-index:80; background:rgba(60,48,36,.3); border:0; }' +
'.ebp-sheet { position:fixed; z-index:81; background:var(--wash); display:flex; flex-direction:column; overflow:hidden;' +
'  right:0; top:0; bottom:0; width:min(460px, 100vw); border-left:1px solid var(--line); box-shadow:-20px 0 60px rgba(60,48,36,.16); }' +
'.ebp-sheethead { display:flex; align-items:center; gap:10px; padding:16px 18px 10px; }' +
'.ebp-sheethead h2 { margin:0; font-family:var(--font-heading); font-weight:400; font-size:24px; color:var(--taupe); flex:1; }' +
'.ebp-sheetbody { flex:1; overflow:auto; padding:6px 18px 24px; display:grid; gap:14px; align-content:start; }' +
'.ebp-grab { display:none; }' +
'@media (max-width:1023px) {' +
' .ebp-sheet { left:0; right:0; top:auto; bottom:0; width:auto; max-height:94vh; border-left:0; border-radius:26px 26px 0 0; box-shadow:0 -20px 60px rgba(60,48,36,.2); }' +
' .ebp-grab { display:block; width:40px; height:5px; border-radius:5px; background:#cfbda9; margin:10px auto 0; }' +
' .ebp-sheetbody { padding-bottom:calc(24px + env(safe-area-inset-bottom)); }' +
'}' +
/* create form */
'.ebp-amount { text-align:center; padding:6px 0 2px; }' +
'.ebp-amount label { display:block; font-size:13px; color:var(--mute); }' +
'.ebp-amtwrap { display:inline-flex; align-items:baseline; justify-content:center; gap:2px; font-family:var(--font-heading); color:var(--taupe); }' +
'.ebp-amtwrap span { font-size:40px; }' +
'.ebp-amtwrap input { width:6.2ch; border:0; background:transparent; outline:0; font-family:inherit; font-size:56px; line-height:1.1; color:inherit; text-align:left; padding:0; }' +
'.ebp-amtwrap input::placeholder { color:#cfbda9; }' +
'.ebp-amtwrap input:disabled { opacity:.6; }' +
'.ebp-chips { display:flex; flex-wrap:wrap; gap:6px; }' +
'.ebp-chip { border:1px solid var(--line); background:var(--card); color:var(--mute); border-radius:999px; padding:7px 12px; min-height:36px; font-size:13px; }' +
'.ebp-chip[aria-pressed="true"] { border-color:var(--accent); background:var(--soft); color:var(--taupe); }' +
'.ebp-chip:disabled { opacity:.55; cursor:not-allowed; }' +
'.ebp-redir { font-size:12px; color:var(--mute); word-break:break-all; line-height:1.5; }' +
'.ebp-linkbtn { border:0; background:transparent; padding:0 0 0 6px; color:var(--taupe); text-decoration:underline; font-size:12px; }' +
'.ebp-submit { min-height:50px; font-size:16px; width:100%; }' +
/* detail */
'.ebp-hero { background:var(--card); border:1px solid var(--hair); border-radius:22px; padding:18px; text-align:center; }' +
'.ebp-hero .big { font-family:var(--font-heading); font-size:46px; line-height:1.05; color:var(--taupe); margin:10px 0 0; }' +
'.ebp-hero .nm { font-size:16px; color:var(--ink); margin:6px 0 0; }' +
'.ebp-hero .when { font-size:12.5px; color:var(--mute); margin:2px 0 0; }' +
'.ebp-acts { display:grid; grid-template-columns:repeat(auto-fit,minmax(64px,1fr)); gap:8px; }' +
'.ebp-act { display:flex; flex-direction:column; align-items:center; gap:6px; border:0; background:transparent; color:var(--taupe); font-size:12.5px; padding:0; }' +
'.ebp-act .c { width:52px; height:52px; border-radius:50%; background:var(--card); border:1px solid var(--line); display:flex; align-items:center; justify-content:center; }' +
'.ebp-act.main .c { background:var(--accent); border-color:var(--accent); color:var(--cream); }' +
'.ebp-url { border:1px dashed #cfbda9; border-radius:14px; padding:10px 14px; font-size:12.5px; color:var(--mute); word-break:break-all; }' +
'.ebp-qr { display:flex; justify-content:center; background:var(--card); border:1px solid var(--hair); border-radius:18px; padding:14px; }' +
'.ebp-qr img { width:200px; height:200px; }' +
'.ebp-facts { background:var(--card); border:1px solid var(--hair); border-radius:18px; padding:0 14px; }' +
'.ebp-fact { display:flex; gap:12px; padding:11px 0; border-top:1px solid var(--hair); font-size:14px; }' +
'.ebp-fact:first-child { border-top:0; }' +
'.ebp-fact .k { color:var(--mute); flex-shrink:0; }' +
'.ebp-fact .v { margin-left:auto; text-align:right; min-width:0; overflow-wrap:anywhere; }' +
'.ebp-fact .v small { display:block; font-size:11.5px; color:var(--mute); word-break:break-all; margin-top:2px; }' +
'.ebp-two { display:grid; grid-template-columns:1fr 1fr; gap:8px; }' +
'@media (max-width:560px) { .ebp-tabs { width:100%; } .ebp-tabs button { flex:1; padding:8px 6px; } .ebp-copylabel { display:none; } }';

/* ============================================================ */
export default function PaymentLinksPage() {
  const [lang, setLang] = useState('en');
  const t = T[lang];

  const [admin, setAdmin] = useState(null);
  const [message, setMessage] = useState('');
  const [savedLinks, setSavedLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkFilter, setLinkFilter] = useState('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [copiedId, setCopiedId] = useState('');
  const [editingLink, setEditingLink] = useState(null);
  const [form, setForm] = useState(blankForm());
  const [editRedirect, setEditRedirect] = useState(false);
  const [saving, setSaving] = useState(false);

  // Panel: null | 'form' | 'detail'
  const [panel, setPanel] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [justCreated, setJustCreated] = useState(null);
  const [qr, setQr] = useState('');
  const [canShare, setCanShare] = useState(false);
  const amountRef = useRef(null);

  useEffect(function () {
    const saved = localStorage.getItem('eb-lang');
    if (saved === 'en' || saved === 'es') setLang(saved);
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('new') === '1') openCreate();
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(function () {
    let cancelled = false;
    fetch('/api/admin/me', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (!cancelled && d) setAdmin(d.admin || d); })
      .catch(function () {});
    return function () { cancelled = true; };
  }, []);

  useEffect(function () {
    if (!panel) return;
    function esc(e) { if (e.key === 'Escape') closePanel(); }
    document.addEventListener('keydown', esc);
    return function () { document.removeEventListener('keydown', esc); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString(dateLocale[lang], {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }
  function shortDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleDateString(dateLocale[lang], { month: 'short', day: 'numeric' });
  }

  function isPaidLink(link) { return link.status === 'paid' || Number(link.paid_count || 0) > 0; }
  function isPending(link) { return !link.archived && !isPaidLink(link); }

  const analytics = useMemo(function () {
    const activeLinks = savedLinks.filter(function (link) { return !link.archived; });
    const paidLinks = savedLinks.filter(isPaidLink);
    const totalPaid = savedLinks.reduce(function (sum, link) { return sum + Number(link.total_paid || 0); }, 0);
    const pending = savedLinks.filter(isPending);
    return {
      totalLinks: savedLinks.length,
      activeLinks: activeLinks.length,
      paidLinks: paidLinks.length,
      totalPaid: totalPaid,
      pending: pending,
      pendingTotal: pending.reduce(function (s, l) { return s + Number(l.amount || l.minimum_amount || 0); }, 0),
      archived: savedLinks.filter(function (l) { return l.archived; }).length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedLinks]);

  const filteredSavedLinks = savedLinks.filter(function (link) {
    if (linkFilter === 'active' && link.archived) return false;
    if (linkFilter === 'archived' && !link.archived) return false;
    if (linkFilter === 'paid' && (link.archived || !isPaidLink(link))) return false;
    if (linkFilter === 'pending' && !isPending(link)) return false;
    const query = linkSearch.trim().toLowerCase();
    if (!query) return true;
    return [link.title, link.description, link.status, link.url, link.stripe_payment_link_id, link.amount, money(link.amount)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  });
  const showWaiting = linkFilter === 'all' && !linkSearch.trim() && analytics.pending.length > 0;

  function updateForm(field, value) {
    setForm(function (current) { return { ...current, [field]: value }; });
  }

  async function loadSavedPaymentLinks() {
    setLinksLoading(true);
    try {
      const res = await fetch('/api/admin/payment-links', { method: 'GET', cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || t.msgLoadFailed);
        setSavedLinks([]);
        return [];
      }
      const list = data.paymentLinks || [];
      setSavedLinks(list);
      return list;
    } catch (error) {
      setMessage(error.message || t.msgLoadFailed);
      setSavedLinks([]);
      return [];
    } finally {
      setLinksLoading(false);
    }
  }

  useEffect(function () {
    loadSavedPaymentLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditingLink(null);
    setForm(blankForm());
    setEditRedirect(false);
    setMessage('');
    setJustCreated(null);
    setPanel('form');
    setTimeout(function () { if (amountRef.current) amountRef.current.focus(); }, 60);
  }

  function openDetail(link) {
    setDetailId(link.id || link.stripe_payment_link_id);
    setJustCreated(null);
    setQr('');
    setMessage('');
    setPanel('detail');
  }

  function closePanel() {
    setPanel(null);
    setEditingLink(null);
    setQr('');
    setJustCreated(null);
  }

  async function savePaymentLink(e) {
    e.preventDefault();
    setMessage('');

    if (!form.title.trim()) { setMessage(t.msgTitle); return; }
    if (!editingLink && !form.customerChoosesAmount && (!form.amount || Number(form.amount) <= 0)) {
      setMessage(t.msgAmount); return;
    }
    if (!editingLink && form.customerChoosesAmount && (!form.minimumAmount || Number(form.minimumAmount) < 0.5)) {
      setMessage(t.msgMin); return;
    }

    setSaving(true);
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

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.error || t.msgSaveFailed); return; }

      const list = await loadSavedPaymentLinks();
      if (editingLink) {
        setMessage(t.msgUpdated);
        setDetailId(editingLink.id || editingLink.stripe_payment_link_id);
        setEditingLink(null);
        setPanel('detail');
        return;
      }
      // Show the new link straight away, ready to copy and send.
      const made = data.url ? list.find(function (l) { return l.url === data.url; }) : null;
      setMessage(t.linkReady);
      if (made) {
        setDetailId(made.id || made.stripe_payment_link_id);
        setJustCreated(null);
      } else {
        setDetailId(null);
        setJustCreated({
          url: data.url || '',
          title: form.title,
          description: form.description,
          amount: form.amount,
          customer_chooses_amount: form.customerChoosesAmount,
          minimum_amount: form.minimumAmount,
          collect_name: form.collectName,
          collect_shipping: form.collectShipping,
          collect_billing: form.collectBilling,
          require_phone: form.requirePhone,
          allow_promotion_codes: form.allowPromotionCodes,
          redirect_after_payment: form.redirectAfterPayment,
          redirect_url: form.redirectUrl,
          created_at: new Date().toISOString(),
          paid_count: 0,
          total_paid: 0,
        });
      }
      setQr('');
      setPanel('detail');
    } catch (err) {
      setMessage(err.message || t.msgSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  function editSavedLink(link) {
    setEditingLink(link);
    setEditRedirect(false);
    setMessage('');
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
    setPanel('form');
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

  async function copyUrl(url, id) {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); } catch (e) { return; }
    setCopiedId(id || url);
    setTimeout(function () { setCopiedId(''); }, 1800);
  }

  async function shareUrl(link) {
    try { await navigator.share({ title: link.title || t.title, url: link.url }); } catch (e) {}
  }

  async function toggleQr(url) {
    if (qr) { setQr(''); return; }
    try {
      const mod = await import('qrcode');
      const QR = mod.default || mod;
      const data = await QR.toDataURL(url, { margin: 1, width: 400, color: { dark: '#4a3d30', light: '#ffffff' } });
      setQr(data);
    } catch (e) {}
  }

  function pillClass(link) {
    if (link.archived) return 'eba-pill off';
    if (isPaidLink(link)) return 'eba-pill ok';
    return 'eba-pill mid';
  }
  function pillText(link) {
    if (link.archived) return t.archived;
    if (isPaidLink(link)) return t.paid;
    return t.pending;
  }
  function linkAmount(link) {
    return link.customer_chooses_amount ? money(link.minimum_amount || 0) + '+' : money(link.amount);
  }
  function linkKey(link) { return link.id || link.stripe_payment_link_id || link.url; }

  function linkRow(link) {
    const n = Number(link.paid_count || 0);
    const sub = shortDate(link.created_at) + ' · ' + (n > 0 ? t.paidTimes(n) : t.notPaid);
    const key = linkKey(link);
    return (
      <div className={link.archived ? 'ebp-row off' : 'ebp-row'} key={key}>
        <button type="button" className="ebp-rowmain" onClick={function () { openDetail(link); }}>
          <span className="eba-who">
            <span className="n">{link.title || t.title}</span>
            <span className="s">{sub}</span>
          </span>
          <span className={pillClass(link)}>{pillText(link)}</span>
          <span className="eba-amt">{linkAmount(link)}</span>
        </button>
        <button type="button" className="eba-btn mini ebp-copy" aria-label={t.copy + ': ' + (link.title || '')}
          onClick={function () { copyUrl(link.url, key); }}>
          <IconCopy /><span className="ebp-copylabel">{copiedId === key ? t.copied : t.copy}</span>
        </button>
      </div>
    );
  }

  const detail = justCreated || (detailId ? savedLinks.find(function (l) { return linkKey(l) === detailId; }) : null);

  function asksFor(link) {
    const parts = [];
    if (link.collect_name !== false) parts.push(t.collectName);
    if (link.collect_shipping !== false) parts.push(t.shippingAddress);
    if (link.collect_billing !== false) parts.push(t.billingAddress);
    if (link.require_phone !== false) parts.push(t.phoneNumber);
    return parts.length ? parts.join(', ') : t.nothing;
  }

  function chip(field, label, disabled) {
    return (
      <button type="button" className="ebp-chip" aria-pressed={Boolean(form[field])} disabled={disabled}
        onClick={function () { updateForm(field, !form[field]); }}>
        {form[field] ? '✓ ' : ''}{label}
      </button>
    );
  }

  const visible = filteredSavedLinks.slice(0, limit);
  const tabs = [
    { key: 'all', label: t.all },
    { key: 'pending', label: t.pendingTab, n: analytics.pending.length },
    { key: 'paid', label: t.paidTab },
    { key: 'archived', label: t.archived },
  ];

  /* ============================================================ */
  return (
    <AdminShell
      admin={admin}
      active="payment-links"
      lang={lang}
      onLang={setLang}
      title={t.title}
      subtitle={linksLoading && !savedLinks.length ? ' ' : t.summary(analytics.activeLinks, analytics.paidLinks, money(analytics.totalPaid))}
      actions={
        <button type="button" className="eba-btn eba-btn-dark" onClick={openCreate}><IconPlus />{t.newLink}</button>
      }
    >
      <style>{pageCss}</style>

      {message && !panel && <div className="eba-notice" style={{ marginTop: 0 }}>{message}</div>}

      {showWaiting && (
        <section aria-label={t.waiting}>
          <div className="ebp-sechead">
            <span className="dot" style={{ background: '#b07a35' }} />{t.waiting}
            <span className="r">{analytics.pending.length} {'·'} {money(analytics.pendingTotal)}</span>
          </div>
          <div className="ebp-waitcard">
            {analytics.pending.slice(0, 5).map(linkRow)}
          </div>
        </section>
      )}

      <section className="eba-panel" aria-label={t.allLinks}>
        <div className="eba-toolbar" style={{ marginBottom: 8 }}>
          <label className="eba-search">
            <IconSearch />
            <input placeholder={t.searchLinks} aria-label={t.searchLinks} value={linkSearch}
              onChange={function (e) { setLinkSearch(e.target.value); setLimit(PAGE_SIZE); }} />
          </label>
          <div className="ebp-tabs" role="group" aria-label={t.allLinks}>
            {tabs.map(function (tb) {
              return (
                <button key={tb.key} type="button" className={linkFilter === tb.key ? 'on' : ''} aria-pressed={linkFilter === tb.key}
                  onClick={function () { setLinkFilter(tb.key); setLimit(PAGE_SIZE); }}>
                  {tb.label}{tb.n ? <span className="n">{tb.n}</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        {linksLoading && !savedLinks.length ? (
          <div className="eba-empty">{t.loadingLinks}</div>
        ) : filteredSavedLinks.length === 0 ? (
          <div className="eba-empty">{t.noLinks}</div>
        ) : (
          <div>{visible.map(linkRow)}</div>
        )}

        <div className="ebp-foot">
          <span>{t.showing(visible.length, filteredSavedLinks.length)}</span>
          <span style={{ display: 'flex', gap: 8 }}>
            {filteredSavedLinks.length > limit && (
              <button type="button" className="eba-btn mini" onClick={function () { setLimit(limit + PAGE_SIZE); }}>{t.loadMore}</button>
            )}
            <button type="button" className="eba-btn mini" onClick={loadSavedPaymentLinks}>{t.refresh}</button>
          </span>
        </div>
      </section>

      {/* ===== side panel / bottom sheet ===== */}
      {panel && <button type="button" className="ebp-bg no-print" aria-label={t.close} onClick={closePanel} />}

      {panel === 'form' && (
        <form className="ebp-sheet no-print" role="dialog" aria-label={editingLink ? t.editLinkTitle : t.newLinkTitle} onSubmit={savePaymentLink}>
          <span className="ebp-grab" />
          <div className="ebp-sheethead">
            {editingLink && (
              <button type="button" className="eba-roundbtn" aria-label={t.back} onClick={function () { setPanel('detail'); setEditingLink(null); }}><IconBack /></button>
            )}
            <h2>{editingLink ? t.editLinkTitle : t.newLinkTitle}</h2>
            <button type="button" className="eba-roundbtn" aria-label={t.close} onClick={closePanel}><IconClose /></button>
          </div>
          <div className="ebp-sheetbody">
            {!form.customerChoosesAmount ? (
              <div className="ebp-amount">
                <label htmlFor="ebp-amount">{t.customerPays}</label>
                <span className="ebp-amtwrap">
                  <span>$</span>
                  <input id="ebp-amount" ref={amountRef} type="number" inputMode="decimal" min="0.50" step="0.01" placeholder="0.00"
                    value={form.amount} disabled={Boolean(editingLink)}
                    onChange={function (e) { updateForm('amount', e.target.value); }} />
                </span>
              </div>
            ) : (
              <div className="eba-formrow even">
                <div>
                  <label className="eba-lb" htmlFor="ebp-min">{t.minAmount}</label>
                  <input id="ebp-min" className="eba-in" type="number" inputMode="decimal" min="0.50" step="0.01" value={form.minimumAmount}
                    disabled={Boolean(editingLink)} onChange={function (e) { updateForm('minimumAmount', e.target.value); }} />
                </div>
                <div>
                  <label className="eba-lb" htmlFor="ebp-max">{t.maxAmount}</label>
                  <input id="ebp-max" className="eba-in" type="number" inputMode="decimal" min="0.50" step="0.01" value={form.maximumAmount}
                    disabled={Boolean(editingLink)} onChange={function (e) { updateForm('maximumAmount', e.target.value); }} />
                </div>
              </div>
            )}

            <div>
              <label className="eba-lb" htmlFor="ebp-title">{t.forLabel}</label>
              <input id="ebp-title" className="eba-in" placeholder={t.forPlaceholder} value={form.title}
                onChange={function (e) { updateForm('title', e.target.value); }} />
            </div>
            <div>
              <label className="eba-lb" htmlFor="ebp-desc">{t.noteLabel}</label>
              <textarea id="ebp-desc" className="eba-in" rows={2} value={form.description}
                onChange={function (e) { updateForm('description', e.target.value); }} />
            </div>

            <div>
              <span className="eba-lb">{t.checkoutOptions}</span>
              <div className="ebp-chips">
                {chip('collectName', t.collectName, Boolean(editingLink))}
                {chip('collectShipping', t.shippingAddress, Boolean(editingLink))}
                {chip('collectBilling', t.billingAddress, Boolean(editingLink))}
                {chip('requirePhone', t.phoneNumber, Boolean(editingLink))}
                {chip('allowPromotionCodes', t.promoCodes, Boolean(editingLink))}
                {chip('redirectAfterPayment', t.thankYou, false)}
                {!editingLink && chip('customerChoosesAmount', t.customerPicks, false)}
              </div>
              {!form.allowPromotionCodes && <p className="ebp-redir" style={{ marginTop: 8, color: '#9a3d35' }}>{t.promoOffHint}</p>}
              {form.redirectAfterPayment && (
                editRedirect ? (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <input className="eba-in" aria-label={t.thankYou} value={form.redirectUrl} style={{ fontSize: 13 }}
                      onChange={function (e) { updateForm('redirectUrl', e.target.value); }} />
                    <button type="button" className="eba-btn mini" onClick={function () { setEditRedirect(false); }}>{t.done}</button>
                  </div>
                ) : (
                  <p className="ebp-redir" style={{ marginTop: 8 }}>
                    {t.afterPaying} {form.redirectUrl}
                    <button type="button" className="ebp-linkbtn" onClick={function () { setEditRedirect(true); }}>{t.change}</button>
                  </p>
                )
              )}
            </div>

            {editingLink && <p className="eba-muted" style={{ margin: 0 }}>{t.editHint}</p>}
            {message && <div className="eba-notice" style={{ marginTop: 0 }}>{message}</div>}

            <button className="eba-btn eba-btn-dark ebp-submit" type="submit" disabled={saving}>{editingLink ? t.update : t.generate}</button>
          </div>
        </form>
      )}

      {panel === 'detail' && detail && (
        <aside className="ebp-sheet no-print" role="dialog" aria-label={detail.title || t.title}>
          <span className="ebp-grab" />
          <div className="ebp-sheethead">
            <h2>{t.title}</h2>
            <button type="button" className="eba-roundbtn" aria-label={t.close} onClick={closePanel}><IconClose /></button>
          </div>
          <div className="ebp-sheetbody">
            {message && <div className="eba-notice" style={{ marginTop: 0 }}>{message}</div>}
            <div className="ebp-hero">
              <span className={pillClass(detail)}>{pillText(detail)}</span>
              <p className="big">{linkAmount(detail)}</p>
              <p className="nm">{detail.title || t.title}</p>
              <p className="when">{t.created} {formatDate(detail.created_at)}</p>
            </div>

            {detail.url && (
              <div className="ebp-acts">
                <button type="button" className="ebp-act main" onClick={function () { copyUrl(detail.url, 'detail'); }}>
                  <span className="c"><IconCopy /></span>{copiedId === 'detail' ? t.copied : t.copy}
                </button>
                <a className="ebp-act" href={'sms:?&body=' + encodeURIComponent(detail.url)}>
                  <span className="c"><IconText /></span>{t.text}
                </a>
                {canShare && (
                  <button type="button" className="ebp-act" onClick={function () { shareUrl(detail); }}>
                    <span className="c"><IconShare /></span>{t.share}
                  </button>
                )}
                <button type="button" className="ebp-act" aria-pressed={Boolean(qr)} onClick={function () { toggleQr(detail.url); }}>
                  <span className="c"><IconQr /></span>{t.qr}
                </button>
                <a className="ebp-act" href={detail.url} target="_blank" rel="noopener noreferrer">
                  <span className="c"><IconOpen /></span>{t.open}
                </a>
              </div>
            )}

            {qr && (
              <div className="ebp-qr">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt={t.qr + ': ' + (detail.title || '')} />
              </div>
            )}

            {detail.url && <div className="ebp-url">{detail.url}</div>}

            <div className="ebp-facts">
              <div className="ebp-fact"><span className="k">{t.timesPaid}</span><span className="v">{Number(detail.paid_count || 0)} {'·'} {money(detail.total_paid || 0)}</span></div>
              {detail.customer_chooses_amount && (
                <div className="ebp-fact"><span className="k">{t.amountLabel}</span><span className="v">{t.picksFrom} {money(detail.minimum_amount || 0)}</span></div>
              )}
              <div className="ebp-fact"><span className="k">{t.asksFor}</span><span className="v">{asksFor(detail)}</span></div>
              <div className="ebp-fact"><span className="k">{t.promoRow}</span><span className="v" style={{ color: detail.allow_promotion_codes !== false ? '#4f6b45' : '#9a3d35' }}>{detail.allow_promotion_codes !== false ? t.on : t.off}</span></div>
              <div className="ebp-fact">
                <span className="k">{t.goesTo}</span>
                <span className="v">
                  {detail.redirect_after_payment !== false ? t.thankYou : t.stripePage}
                  {detail.redirect_after_payment !== false && detail.redirect_url && <small>{detail.redirect_url}</small>}
                </span>
              </div>
              {detail.description && <div className="ebp-fact"><span className="k">{t.noteLabel.replace(/ \(.*\)$/, '')}</span><span className="v">{detail.description}</span></div>}
            </div>

            {!justCreated && (
              <div className="ebp-two">
                <button type="button" className="eba-btn" onClick={function () { editSavedLink(detail); }}>{t.edit}</button>
                <button type="button" className="eba-btn" onClick={function () { archiveSavedLink(detail); }}>{detail.archived ? t.reactivate : t.archive}</button>
              </div>
            )}
          </div>
        </aside>
      )}
    </AdminShell>
  );
}
