/* ============================================================
   /receipt/<token> — public, branded receipt for one payment.
   Anyone with the link can view it; the token is long and random,
   so receipts can't be found by guessing. Not indexed by search engines.
   ============================================================ */

import { getReceiptByToken } from '@/lib/receipts';
import PrintButton from './PrintButton';
import CardBrand from './CardBrand';

export const dynamic = 'force-dynamic';

const LOGO_SRC = '/EB_Logo_Fall BGBLANK.png'; // same dark logo as the admin sidebar
const SHOP_EMAIL = 'info@erendirasboutique.com';
const SHOP_SITE = 'erendirasboutique.com';

// Stripe Climate: shown on Stripe payments only (Clover isn't part of it).
// Change the percent here if you change it in Stripe → Climate.
const CLIMATE_PERCENT = '0.1%';
const CLIMATE_ICON = '/stripe-climate.png';

const T = {
  en: {
    eyebrow: 'PAYMENT RECEIPT',
    paid: 'Paid',
    refunded: 'Refunded',
    thanks: 'Thank you for your purchase',
    billedTo: 'Billed to',
    method: 'Payment method',
    card: 'card',
    phoneOrder: 'Phone order',
    inStore: 'In store',
    online: 'Online',
    methods: { cash: 'Cash', check: 'Check', gift_card: 'Gift card', 'gift card': 'Gift card', debit: 'Debit' },
    date: 'Date',
    receiptNo: 'Receipt no.',
    txn: 'Transaction ID',
    auth: 'Authorization',
    forWhat: 'For',
    total: 'Total paid',
    questions: 'Questions about this payment? Email us at',
    print: 'Print or save as PDF',
    climate: function (pct) { return <>Erendira&#8217;s Boutique LLC contributed <b>{pct} of your purchase</b> to remove CO<sub>2</sub> from the atmosphere.</>; },
    notFoundTitle: 'Receipt not found',
    notFoundBody: 'This receipt link may be incomplete. Please check the link or contact us.',
    locale: 'en-US',
  },
  es: {
    eyebrow: 'RECIBO DE PAGO',
    paid: 'Pagado',
    refunded: 'Reembolsado',
    thanks: 'Gracias por tu compra',
    billedTo: 'Cliente',
    method: 'Método de pago',
    card: 'tarjeta',
    phoneOrder: 'Pedido por teléfono',
    inStore: 'En tienda',
    online: 'En línea',
    methods: { cash: 'Efectivo', check: 'Cheque', gift_card: 'Tarjeta de regalo', 'gift card': 'Tarjeta de regalo', debit: 'Débito' },
    date: 'Fecha',
    receiptNo: 'Recibo núm.',
    txn: 'ID de transacción',
    auth: 'Autorización',
    forWhat: 'Concepto',
    total: 'Total pagado',
    questions: '¿Preguntas sobre este pago? Escríbenos a',
    print: 'Imprimir o guardar como PDF',
    climate: function (pct) { return <>Erendira&#8217;s Boutique LLC contribuy&oacute; el <b>{pct} de tu compra</b> para eliminar CO<sub>2</sub> de la atm&oacute;sfera.</>; },
    notFoundTitle: 'Recibo no encontrado',
    notFoundBody: 'Es posible que el enlace esté incompleto. Revísalo o contáctanos.',
    locale: 'es-MX',
  },
};

export const metadata = {
  title: "Receipt — Erendira's Boutique",
  robots: { index: false, follow: false },
};

function money(n, currency) {
  // Always "$125.50" style, even on the Spanish receipt.
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: String(currency || 'usd').toUpperCase() }).format(Number(n || 0));
}

function when(iso, locale) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function brandName(b) {
  const map = { VISA: 'Visa', MC: 'Mastercard', MASTERCARD: 'Mastercard', AMEX: 'American Express', DISCOVER: 'Discover', JCB: 'JCB', DINERS_CLUB: 'Diners Club' };
  return map[String(b || '').toUpperCase()] || (b ? String(b) : '');
}

export default async function ReceiptPage(props) {
  const params = await props.params;
  const search = (await props.searchParams) || {};
  const lang = search.lang === 'es' ? 'es' : 'en';
  const t = T[lang];
  const r = await getReceiptByToken(params.token);
  const base = '/receipt/' + encodeURIComponent(params.token);

  const langToggle = (
    <div className="rcpt-langs no-print" role="group" aria-label="Language">
      <a href={base} className={lang === 'en' ? 'on' : ''}>EN</a>
      <a href={base + '?lang=es'} className={lang === 'es' ? 'on' : ''}>ES</a>
    </div>
  );

  if (!r) {
    return (
      <main className="rcpt">
        <style>{css}</style>
        <div className="rcpt-card rcpt-missing">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={encodeURI(LOGO_SRC)} alt="Erendira&#8217;s Boutique" className="rcpt-logo" />
          <h1 className="rcpt-display">{t.notFoundTitle}</h1>
          <p className="rcpt-muted">{t.notFoundBody}</p>
          <p className="rcpt-muted"><a href={'mailto:' + SHOP_EMAIL}>{SHOP_EMAIL}</a></p>
          {langToggle}
        </div>
      </main>
    );
  }

  const refunded = r.status === 'refunded';
  const nonCard = r.payment_method && !r.card_last4 && !r.card_brand;
  const method = nonCard ? (
    <span>{t.methods[r.payment_method] || String(r.payment_method).replace(/(^|\s|_)\w/g, function (m) { return m.toUpperCase(); }).replace(/_/g, ' ')}</span>
  ) : (
    <span className="rcpt-method">
      <CardBrand brand={r.card_brand} label={brandName(r.card_brand) || t.card} />
      {r.card_last4 ? <span>{'•••• ' + r.card_last4}</span> : null}
    </span>
  );
  const sourceLabel = { card_terminal: t.phoneOrder, in_store: t.inStore, online: t.online }[r.source] || null;

  const rows = [
    r.customer_name ? { k: t.billedTo, v: r.customer_name, sub: r.customer_email } : null,
    { k: t.method, v: method, sub: sourceLabel },
    { k: t.date, v: when(r.created_at, t.locale) },
    r.note ? { k: t.forWhat, v: r.note } : null,
    { k: t.receiptNo, v: r.receipt_number, mono: true },
    (r.payment_ref || r.clover_charge_id) ? { k: t.txn, v: r.payment_ref || r.clover_charge_id, mono: true } : null,
    r.auth_code ? { k: t.auth, v: r.auth_code, mono: true } : null,
  ].filter(Boolean);

  return (
    <main className="rcpt">
      <style>{css}</style>

      <div className="rcpt-top no-print">
        {langToggle}
      </div>

      <article className="rcpt-card">
        <header className="rcpt-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={encodeURI(LOGO_SRC)} alt="Erendira&#8217;s Boutique" className="rcpt-logo" />
          <p className="rcpt-eyebrow">{t.eyebrow}</p>
          <p className="rcpt-amount rcpt-display">{money(r.amount, r.currency, t.locale)}</p>
          <span className={'rcpt-pill' + (refunded ? ' off' : '')}>{refunded ? t.refunded : t.paid}</span>
          <p className="rcpt-thanks rcpt-display">{t.thanks}{r.customer_name ? ', ' + String(r.customer_name).split(' ')[0] : ''}</p>
        </header>

        <dl className="rcpt-rows">
          {rows.map(function (row) {
            return (
              <div className="rcpt-row" key={row.k}>
                <dt>{row.k}</dt>
                <dd>
                  <span className={row.mono ? 'mono' : ''}>{row.v}</span>
                  {row.sub ? <span className="sub">{row.sub}</span> : null}
                </dd>
              </div>
            );
          })}
        </dl>

        <div className="rcpt-total">
          <span>{t.total}</span>
          <b className="rcpt-display">{money(refunded ? 0 : r.amount, r.currency, t.locale)}</b>
        </div>

        {r.provider === 'stripe' && !refunded && (
          <div className="rcpt-climate">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CLIMATE_ICON} alt="" width="30" height="21" />
            <p>{t.climate(CLIMATE_PERCENT)}</p>
          </div>
        )}

        <footer className="rcpt-foot">
          <p>{t.questions} <a href={'mailto:' + SHOP_EMAIL + '?subject=' + encodeURIComponent('Receipt ' + r.receipt_number)}>{SHOP_EMAIL}</a></p>
          <p className="rcpt-shop">Erendira&#8217;s Boutique &middot; <a href={'https://' + SHOP_SITE}>{SHOP_SITE}</a></p>
        </footer>
      </article>

      <div className="rcpt-actions no-print">
        <PrintButton label={t.print} />
      </div>
    </main>
  );
}

const css = '' +
'.rcpt { --cream:#fdfcf7; --card:#ffffff; --wash:#fffdf8; --sand:#eda033; --taupe:#da5e16; --line:#f6d3a8; --accent:#eda033;' +
'  min-height:100vh; background:var(--cream); color:var(--taupe); padding:28px 16px 56px;' +
'  font-family:"Recoleta", Georgia, serif; -webkit-font-smoothing:antialiased; }' +
'.rcpt * { box-sizing:border-box; }' +
'.rcpt a { color:var(--taupe); }' +
'.rcpt-display { font-family:"La Luxes Serif", "Recoleta", Georgia, serif; font-weight:400; letter-spacing:-0.01em; }' +
'.rcpt-top { max-width:520px; margin:0 auto 12px; display:flex; justify-content:flex-end; }' +
'.rcpt-langs { display:inline-flex; border:1px solid var(--line); border-radius:999px; overflow:hidden; background:var(--card); }' +
'.rcpt-langs a { padding:7px 13px; font-size:10px; letter-spacing:.14em; text-decoration:none; }' +
'.rcpt-langs a.on { background:var(--accent); color:var(--cream); }' +
'.rcpt-card { max-width:520px; margin:0 auto; background:var(--card); border-radius:30px; padding:34px 32px 28px;' +
'  box-shadow:0 1px 2px rgba(218,94,22,.04), 0 14px 40px rgba(218,94,22,.08); position:relative; overflow:hidden; }' +
'.rcpt-card::after { content:""; position:absolute; right:-80px; top:-100px; width:260px; height:260px; border-radius:50%;' +
'  background:radial-gradient(circle at 30% 30%, rgba(237,160,51,.22), rgba(237,160,51,0) 65%); pointer-events:none; }' +
'.rcpt-head { text-align:center; position:relative; z-index:1; }' +
'.rcpt-logo { width:150px; max-width:60%; height:auto; display:block; margin:0 auto 22px; }' +
'.rcpt-eyebrow { margin:0; font-size:10px; letter-spacing:.3em; color:var(--sand); }' +
'.rcpt-amount { margin:8px 0 10px; font-size:60px; line-height:1; }' +
'.rcpt-pill { display:inline-block; border-radius:999px; padding:5px 14px; font-size:9.5px; letter-spacing:.16em; text-transform:uppercase;' +
'  background:var(--accent); color:var(--cream); }' +
'.rcpt-pill.off { background:var(--card); border:1px solid var(--line); color:var(--taupe); }' +
'.rcpt-thanks { margin:18px 0 0; font-size:22px; }' +
'.rcpt-rows { margin:26px 0 0; padding:6px 20px; background:var(--wash); border:1px solid var(--line); border-radius:22px; }' +
'.rcpt-row { display:flex; justify-content:space-between; align-items:flex-start; gap:18px; padding:13px 0; border-top:1px dotted var(--line); }' +
'.rcpt-row:first-child { border-top:0; }' +
'.rcpt-row dt { font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--sand); padding-top:3px; flex-shrink:0; }' +
'.rcpt-row dd { margin:0; text-align:right; font-size:14px; min-width:0; overflow-wrap:anywhere; }' +
'.rcpt-row dd .sub { display:block; font-size:11.5px; color:var(--sand); margin-top:2px; }' +
'.rcpt-row dd .mono { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12.5px; letter-spacing:.02em; }' +
'.rcpt-method { display:inline-flex; align-items:center; gap:8px; }' +
'.rcpt-brand { height:22px; width:auto; display:block; border-radius:4px; }' +
'.rcpt-total { display:flex; justify-content:space-between; align-items:baseline; margin:18px 4px 0; padding-top:16px; border-top:2px solid var(--taupe); }' +
'.rcpt-total span { font-size:11px; letter-spacing:.2em; text-transform:uppercase; }' +
'.rcpt-total b { font-size:30px; }' +
'.rcpt-foot { margin-top:26px; text-align:center; font-size:12.5px; line-height:1.6; color:var(--sand); }' +
'.rcpt-climate { display:flex; align-items:center; gap:14px; margin:20px 0 0; padding:14px 16px; background:var(--wash);' +
'  border:1px solid var(--line); border-radius:18px; }' +
'.rcpt-climate img { flex-shrink:0; width:30px; height:auto; }' +
'.rcpt-climate p { margin:0; font-size:13px; line-height:1.5; }' +
'.rcpt-climate b { font-weight:600; }' +
'.rcpt-climate sub { font-size:.7em; }' +
'.rcpt-foot p { margin:0; }' +
'.rcpt-shop { margin-top:6px !important; }' +
'.rcpt-actions { max-width:520px; margin:16px auto 0; display:flex; justify-content:center; }' +
'.rcpt-btn { border:1px solid var(--line); background:var(--card); color:var(--taupe); border-radius:999px; padding:11px 20px;' +
'  font-family:inherit; font-size:13px; cursor:pointer; }' +
'.rcpt-btn:hover { background:var(--wash); }' +
'.rcpt-missing { text-align:center; }' +
'.rcpt-missing h1 { font-size:34px; margin:0 0 8px; }' +
'.rcpt-muted { color:var(--sand); font-size:14px; }' +
'@media (max-width:480px) {' +
' .rcpt-card { padding:26px 18px 22px; border-radius:24px; }' +
' .rcpt-amount { font-size:48px; }' +
' .rcpt-rows { padding:4px 14px; }' +
' .rcpt-row { flex-direction:column; gap:4px; }' +
' .rcpt-row dd { text-align:left; }' +
'}' +
'@media print {' +
' .no-print { display:none !important; }' +
' .rcpt { background:#fff; padding:0; }' +
' .rcpt-card { box-shadow:none; border:1px solid var(--line); }' +
' .rcpt-card::after { display:none; }' +
'}';
