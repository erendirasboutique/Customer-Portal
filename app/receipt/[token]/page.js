/* ============================================================
   /receipt/<token> — public, branded receipt for one payment.
   Anyone with the link can view it; the token is long and random,
   so receipts can't be found by guessing. Not indexed by search engines.
   Design: R6 — brown header with an animated "payment confirmed"
   moment, then the receipt slides up as a ticket.
   ============================================================ */

import { getReceiptByToken } from '@/lib/receipts';
import PrintButton from './PrintButton';
import CardBrand from './CardBrand';
import ReceiptStage, { HeaderVideo, CountUp } from './ReceiptMotion';

export const dynamic = 'force-dynamic';

const LOGO_SRC = '/EB_Logo_Fall BGBLANK.png'; // same dark logo as the admin sidebar
const SHOP_EMAIL = 'info@erendirasboutique.com';
const SHOP_SITE = 'erendirasboutique.com';

// Stripe Climate: shown on Stripe payments only (Clover isn't part of it).
// Change the percent here if you change it in Stripe → Climate.
const CLIMATE_PERCENT = '0.1%';
const CLIMATE_ICON = '/stripe-climate.png';

/* ---------- Optional confirmation video ----------
   Leave CONFIRM_VIDEO empty to use the built-in animation (check mark,
   falling leaves, amount counting up).
   To use your own clip: put it in /public (e.g. public/receipt-confirm.mp4)
   and set the path below.
     VIDEO_MODE 'header' → plays behind the brown header, text on top.
     VIDEO_MODE 'intro'  → plays full screen first, then fades into the receipt
                           (customer can tap Skip). */
const CONFIRM_VIDEO = '';                    // e.g. '/receipt-confirm.mp4'
const CONFIRM_POSTER = '';                   // optional still image, e.g. '/receipt-confirm.jpg'
const VIDEO_MODE = 'header';                 // 'header' or 'intro'
const VIDEO_LOOP = false;                    // header mode: loop, or stop on the last frame
const INTRO_ONCE = true;                     // intro mode: only the first time they open the link
const INTRO_MAX_SECONDS = 10;                // intro mode: always moves on after this

const LEAF_COLORS = ['#c0612b', '#d98a2b', '#a8452a', '#cfbda9', '#e3a84a'];

const T = {
  en: {
    paid: 'Paid',
    refunded: 'Refunded',
    confirmed: 'Payment confirmed',
    refundedTitle: 'Payment refunded',
    thanksName: function (n) { return 'Thank you, ' + n + '!'; },
    thanksNoName: 'Thank you for your purchase!',
    refundNote: 'This payment was returned to you.',
    billedTo: 'Billed to',
    method: 'Paid with',
    card: 'card',
    phoneOrder: 'Phone order',
    inStore: 'In store',
    online: 'Online',
    methods: { cash: 'Cash', check: 'Check', gift_card: 'Gift card', 'gift card': 'Gift card', debit: 'Debit' },
    date: 'Date',
    reference: 'REFERENCE',
    receiptNo: 'Receipt no.',
    txn: 'Transaction ID',
    auth: 'Authorization',
    forWhat: 'For',
    total: 'TOTAL PAID',
    questions: 'Questions?',
    print: 'Save as PDF',
    emailUs: 'Email us',
    skip: 'Skip',
    climate: function (pct) { return <>Erendira&#8217;s Boutique LLC contributed <b>{pct} of your purchase</b> to remove CO<sub>2</sub> from the atmosphere.</>; },
    notFoundTitle: 'Receipt not found',
    notFoundBody: 'This receipt link may be incomplete. Please check the link or contact us.',
    locale: 'en-US',
  },
  es: {
    paid: 'Pagado',
    refunded: 'Reembolsado',
    confirmed: 'Pago confirmado',
    refundedTitle: 'Pago reembolsado',
    thanksName: function (n) { return '¡Gracias, ' + n + '!'; },
    thanksNoName: '¡Gracias por tu compra!',
    refundNote: 'Este pago te fue devuelto.',
    billedTo: 'Cliente',
    method: 'Pagado con',
    card: 'tarjeta',
    phoneOrder: 'Pedido por teléfono',
    inStore: 'En tienda',
    online: 'En línea',
    methods: { cash: 'Efectivo', check: 'Cheque', gift_card: 'Tarjeta de regalo', 'gift card': 'Tarjeta de regalo', debit: 'Débito' },
    date: 'Fecha',
    reference: 'REFERENCIA',
    receiptNo: 'Recibo núm.',
    txn: 'ID de transacción',
    auth: 'Autorización',
    forWhat: 'Concepto',
    total: 'TOTAL PAGADO',
    questions: '¿Preguntas?',
    print: 'Guardar PDF',
    emailUs: 'Escríbenos',
    skip: 'Saltar',
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

function Row(props) {
  return (
    <div className="rcpt-row">
      <dt>{props.k}</dt>
      <dd>
        <span className={props.mono ? 'mono' : ''}>{props.v}</span>
        {props.sub ? <span className="sub">{props.sub}</span> : null}
      </dd>
    </div>
  );
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
      <main className="rcpt rcpt-nf">
        <style>{css}</style>
        <div className="rcpt-missing">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={encodeURI(LOGO_SRC)} alt="Erendira&#8217;s Boutique" className="rcpt-logo" />
          <h1 className="rcpt-display">{t.notFoundTitle}</h1>
          <p className="rcpt-muted">{t.notFoundBody}</p>
          <p className="rcpt-muted"><a href={'mailto:' + SHOP_EMAIL}>{SHOP_EMAIL}</a></p>
          <div className="rcpt-missing-langs">{langToggle}</div>
        </div>
      </main>
    );
  }

  const refunded = r.status === 'refunded';
  const firstName = r.customer_name ? String(r.customer_name).trim().split(/\s+/)[0] : '';
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

  const details = [
    r.customer_name ? { k: t.billedTo, v: r.customer_name, sub: r.customer_email } : null,
    { k: t.method, v: method, sub: sourceLabel },
    { k: t.date, v: when(r.created_at, t.locale) },
    r.note ? { k: t.forWhat, v: r.note } : null,
  ].filter(Boolean);

  const reference = [
    { k: t.receiptNo, v: r.receipt_number, mono: true },
    (r.payment_ref || r.clover_charge_id) ? { k: t.txn, v: r.payment_ref || r.clover_charge_id, mono: true } : null,
    r.auth_code ? { k: t.auth, v: r.auth_code, mono: true } : null,
  ].filter(Boolean);

  const video = CONFIRM_VIDEO ? encodeURI(CONFIRM_VIDEO) : '';
  const poster = CONFIRM_POSTER ? encodeURI(CONFIRM_POSTER) : '';
  const headerVideo = video && VIDEO_MODE !== 'intro';
  const introVideo = video && VIDEO_MODE === 'intro';
  const introKey = 'eb-rc-intro-' + params.token;
  const mailto = 'mailto:' + SHOP_EMAIL + '?subject=' + encodeURIComponent('Receipt ' + r.receipt_number);

  const leaves = [];
  if (!refunded && !headerVideo) {
    for (let i = 0; i < 12; i++) {
      leaves.push(
        <span
          key={i}
          className="rc-leaf"
          style={{
            left: (6 + i * 8) + '%',
            background: LEAF_COLORS[i % LEAF_COLORS.length],
            animationDelay: (0.2 + (i % 5) * 0.18) + 's',
            animationDuration: (2.2 + (i % 4) * 0.35) + 's',
          }}
        />
      );
    }
  }

  return (
    <main className={'rcpt' + (refunded ? ' is-refunded' : '') + (headerVideo ? ' has-video' : '')}>
      <style>{css}</style>
      {introVideo && INTRO_ONCE ? (
        // Hide the intro before it paints if they've already seen it this visit.
        <script dangerouslySetInnerHTML={{ __html: "try{if(sessionStorage.getItem(" + JSON.stringify(introKey) + ")==='1')document.documentElement.setAttribute('data-rc-seen','1')}catch(e){}" }} />
      ) : null}

      <ReceiptStage
        video={introVideo ? video : ''}
        poster={poster}
        mode="intro"
        once={INTRO_ONCE}
        storageKey={introKey}
        maxSeconds={INTRO_MAX_SECONDS}
        skipLabel={t.skip}
      >
        <div className="rcpt-wrap">
          {/* ---- brown header: the confirmation moment ---- */}
          <header className="rcpt-head rc-head">
            {headerVideo ? <HeaderVideo src={video} poster={poster} loop={VIDEO_LOOP} /> : null}
            {headerVideo ? <span className="rc-tint" aria-hidden="true" /> : null}
            {leaves}

            <div className="rcpt-topbar">
              <span className="rcpt-logo-pill">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={encodeURI(LOGO_SRC)} alt="Erendira&#8217;s Boutique" className="rcpt-logo" />
              </span>
              {langToggle}
            </div>

            <span className="rcpt-badge rc-badge" aria-hidden="true">
              {refunded ? (
                <svg width="76" height="76" viewBox="0 0 76 76" fill="none">
                  <circle className="rc-ring" cx="38" cy="38" r="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" transform="rotate(-90 38 38)" />
                  <path className="rc-check" d="M30 30h14a9 9 0 0 1 0 18h-8M30 30l6-6M30 30l6 6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="76" height="76" viewBox="0 0 76 76" fill="none">
                  <circle className="rc-ring" cx="38" cy="38" r="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" transform="rotate(-90 38 38)" />
                  <path className="rc-check" d="M25 39.5l9 9 17-19" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>

            <p className="rcpt-l1 rc-l1">{refunded ? t.refundedTitle : t.confirmed}</p>
            <p className="rcpt-amount rcpt-display rc-l2">
              {refunded ? <s>{money(r.amount, r.currency)}</s> : <CountUp value={r.amount} currency={r.currency} />}
            </p>
            <p className="rcpt-l3 rc-l3">
              {refunded ? t.refundNote : (firstName ? t.thanksName(firstName) : t.thanksNoName)}
            </p>
          </header>

          {/* ---- white ticket ---- */}
          <article className="rcpt-sheet rc-sheet">
            <section className="rcpt-sec">
              <dl className="rcpt-rows">
                {details.map(function (row) { return <Row key={row.k} {...row} />; })}
              </dl>

              <div className="rcpt-total">
                <span>{t.total}</span>
                <b className="rcpt-display">{money(refunded ? 0 : r.amount, r.currency)}</b>
              </div>
              {refunded ? <p className="rcpt-pill-row"><span className="rcpt-pill off">&#8617; {t.refunded}</span></p> : null}

              {r.provider === 'stripe' && !refunded && (
                <div className="rcpt-climate">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={CLIMATE_ICON} alt="" width="30" height="21" />
                  <p>{t.climate(CLIMATE_PERCENT)}</p>
                </div>
              )}
            </section>

            <div className="rcpt-tear" aria-hidden="true"><i /><b /><b /></div>

            <section className="rcpt-sec rcpt-ref">
              <p className="rcpt-cap">{t.reference}</p>
              <dl className="rcpt-rows">
                {reference.map(function (row) { return <Row key={row.k} {...row} />; })}
              </dl>
            </section>
          </article>

          <footer className="rcpt-foot rc-bar">
            <p>{t.questions} <a href={mailto}>{SHOP_EMAIL}</a></p>
            <p className="rcpt-shop">Erendira&#8217;s Boutique &middot; <a href={'https://' + SHOP_SITE}>{SHOP_SITE}</a></p>
          </footer>

          {/* ---- sticky actions ---- */}
          <nav className="rcpt-actions rc-bar no-print">
            <PrintButton label={t.print} />
            <a className="rcpt-act2" href={mailto}>{t.emailUs}</a>
          </nav>
        </div>
      </ReceiptStage>
    </main>
  );
}

const css = '' +
'.rcpt { --bg:#F5F3EF; --card:#ffffff; --brand:#957f67; --brand-dark:#7f6b55; --soft:#cfbda9; --line:#e6dccf; --line2:#efe8de;' +
'  --ink:#5f4e3d; --muted:#7d6a56;' +
'  min-height:100vh; background:var(--bg); color:var(--ink); padding:0 0 calc(110px + env(safe-area-inset-bottom));' +
'  font-family:"Recoleta", "Fraunces", Georgia, serif; -webkit-font-smoothing:antialiased; overflow-x:hidden; overflow-x:clip; }' +
'.rcpt * { box-sizing:border-box; }' +
'.rcpt a { color:var(--brand-dark); }' +
'.rcpt-display { font-family:"La Luxes Serif", "Cormorant Garamond", "Recoleta", Georgia, serif; font-weight:400; letter-spacing:-0.01em; }' +
'.rcpt-wrap { max-width:480px; margin:0 auto; }' +

/* header */
'.rcpt-head { position:relative; overflow:hidden; background:var(--brand); color:var(--bg); padding:16px 18px 84px; text-align:center;' +
'  border-radius:0 0 36px 36px; isolation:isolate; }' +
'.rcpt-head > * { position:relative; z-index:2; }' +
'.rcpt-head > .rc-hvideo, .rcpt-head > .rc-tint, .rcpt-head > .rc-leaf { position:absolute; z-index:0; }' +
'.rc-hvideo { inset:0; width:100%; height:100%; object-fit:cover; }' +
'.rc-tint { inset:0; z-index:1 !important; background:linear-gradient(180deg, rgba(95,78,61,.35), rgba(149,127,103,.72) 55%, rgba(149,127,103,.92)); }' +
'.rcpt-topbar { display:flex; justify-content:space-between; align-items:center; gap:12px; }' +
'.rcpt-logo-pill { display:inline-flex; background:var(--bg); border-radius:999px; padding:6px 14px; }' +
'.rcpt-logo { width:92px; height:auto; display:block; }' +
'.rcpt-langs { display:inline-flex; border:1px solid rgba(245,243,239,.45); border-radius:999px; overflow:hidden; }' +
'.rcpt .rcpt-langs a { padding:8px 13px; font-size:10.5px; letter-spacing:.14em; text-decoration:none; color:var(--bg); }' +
'.rcpt .rcpt-langs a.on { background:var(--bg); color:var(--brand-dark); }' +
'.rcpt-badge { display:inline-flex; width:76px; height:76px; border-radius:50%; margin:26px 0 12px; background:rgba(245,243,239,.14);' +
'  align-items:center; justify-content:center; color:var(--bg); }' +
'.rcpt-l1 { margin:0; font-size:14px; opacity:.95; }' +
'.rcpt-amount { margin:6px 0 4px; font-size:64px; line-height:1; font-variant-numeric:tabular-nums; }' +
'.rcpt-amount s { text-decoration-thickness:2px; opacity:.85; }' +
'.rcpt-l3 { margin:0; font-size:14px; opacity:.92; }' +

/* sheet */
'.rcpt-sheet { position:relative; z-index:3; margin:-60px 14px 0; background:var(--card); border-radius:26px; box-shadow:0 18px 44px rgba(149,127,103,.16); }' +
'.rcpt-sec { padding:16px 18px 8px; }' +
'.rcpt-ref { padding:0 18px 14px; }' +
'.rcpt-rows { margin:0; }' +
'.rcpt-row { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; padding:12px 0; border-top:1px solid var(--line2); }' +
'.rcpt-row:first-child { border-top:0; }' +
'.rcpt-row dt { font-size:13px; color:var(--muted); flex-shrink:0; padding-top:1px; }' +
'.rcpt-row dd { margin:0; text-align:right; font-size:14px; min-width:0; overflow-wrap:anywhere; color:var(--ink); }' +
'.rcpt-row dd .sub { display:block; font-size:12px; color:var(--muted); margin-top:2px; }' +
'.rcpt-row dd .mono { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12px; letter-spacing:.02em; color:var(--muted); }' +
'.rcpt-ref .rcpt-row { padding:9px 0; }' +
'.rcpt-method { display:inline-flex; align-items:center; gap:8px; }' +
'.rcpt-brand { height:22px; width:auto; display:block; border-radius:4px; }' +
'.rcpt-total { display:flex; justify-content:space-between; align-items:center; gap:12px; background:var(--bg); border-radius:18px; padding:14px 16px; margin:10px 0 6px; }' +
'.rcpt-total span { font-size:11px; letter-spacing:.2em; color:var(--brand-dark); }' +
'.rcpt-total b { font-size:30px; color:var(--brand); font-weight:400; }' +
'.rcpt-pill-row { margin:8px 0 4px; text-align:center; }' +
'.rcpt-pill { display:inline-block; border-radius:999px; padding:6px 14px; font-size:10px; letter-spacing:.16em; text-transform:uppercase; }' +
'.rcpt-pill.off { background:var(--card); border:1px solid var(--line); color:var(--brand-dark); }' +
'.rcpt-climate { display:flex; align-items:center; gap:12px; margin:10px 0 6px; padding:12px 14px; border:1px solid var(--line); border-radius:18px; }' +
'.rcpt-climate img { flex-shrink:0; width:30px; height:auto; }' +
'.rcpt-climate p { margin:0; font-size:12.5px; line-height:1.5; color:var(--muted); }' +
'.rcpt-climate b { font-weight:600; color:var(--ink); }' +
'.rcpt-climate sub { font-size:.7em; }' +
'.rcpt-tear { position:relative; height:24px; margin:6px 14px; }' +
'.rcpt-tear i { position:absolute; left:0; right:0; top:11px; border-top:2px dashed var(--line); }' +
'.rcpt-tear b { position:absolute; top:0; width:24px; height:24px; border-radius:50%; background:var(--bg); left:-26px; }' +
'.rcpt-tear b + b { left:auto; right:-26px; }' +
'.rcpt-cap { margin:4px 0 2px; font-size:10.5px; letter-spacing:.24em; color:var(--muted); }' +
'.rcpt-foot { margin:18px 20px 0; text-align:center; font-size:12.5px; line-height:1.6; color:var(--muted); }' +
'.rcpt-foot p { margin:0; }' +
'.rcpt-shop { margin-top:4px !important; }' +

/* sticky actions */
'.rcpt-actions { position:fixed; z-index:20; left:12px; right:12px; bottom:calc(14px + env(safe-area-inset-bottom)); max-width:456px; margin:0 auto;' +
'  display:flex; gap:8px; background:var(--card); border-radius:24px; padding:8px; box-shadow:0 10px 30px rgba(149,127,103,.22); }' +
'.rcpt-actions > * { flex:1; min-height:48px; display:inline-flex; align-items:center; justify-content:center; border-radius:18px;' +
'  font-family:inherit; font-size:14px; text-decoration:none; cursor:pointer; }' +
'.rcpt .rcpt-actions .rcpt-btn { flex:1.3; border:0; background:var(--brand); color:#fff; padding:0 16px; }' +
'.rcpt .rcpt-actions .rcpt-btn:hover { background:var(--brand-dark); }' +
'.rcpt .rcpt-actions .rcpt-act2 { background:var(--bg); color:var(--brand-dark); }' +
'.rcpt .rcpt-actions .rcpt-act2:hover { background:#ece6dd; }' +

/* not found */
'.rcpt-nf { padding:40px 16px; }' +
'.rcpt-missing { max-width:440px; margin:0 auto; background:var(--card); border-radius:28px; padding:34px 24px; text-align:center;' +
'  box-shadow:0 18px 44px rgba(149,127,103,.12); }' +
'.rcpt-missing .rcpt-logo { width:130px; margin:0 auto 18px; }' +
'.rcpt-missing h1 { font-size:34px; margin:0 0 8px; color:var(--brand); }' +
'.rcpt-muted { color:var(--muted); font-size:14px; }' +
'.rcpt-missing-langs { margin-top:12px; }' +
'.rcpt-missing .rcpt-langs { border-color:var(--line); }' +
'.rcpt .rcpt-missing .rcpt-langs a { color:var(--brand-dark); }' +
'.rcpt .rcpt-missing .rcpt-langs a.on { background:var(--brand); color:#fff; }' +

/* video intro (VIDEO_MODE = intro) */
'.rc-intro { position:fixed; inset:0; z-index:50; background:var(--brand); display:flex; align-items:center; justify-content:center;' +
'  animation:rcIntroOut .4s 12s ease forwards; }' +
'.rc-intro video { width:100%; height:100%; object-fit:cover; }' +
'.rc-intro.out { opacity:0; transition:opacity .45s ease; pointer-events:none; }' +
'.rc-skip { position:absolute; right:16px; bottom:calc(20px + env(safe-area-inset-bottom)); min-height:44px; padding:0 18px; border:0; border-radius:999px;' +
'  background:rgba(245,243,239,.9); color:var(--brand-dark); font:inherit; font-size:13px; cursor:pointer; }' +
'html[data-rc-seen] .rc-intro { display:none; }' +
'@keyframes rcIntroOut { to { opacity:0; visibility:hidden; pointer-events:none; } }' +

/* the confirmation moment */
'@keyframes rcHeader { from { opacity:0; transform:scale(1.04); } to { opacity:1; transform:none; } }' +
'@keyframes rcRing { from { stroke-dashoffset:202; } to { stroke-dashoffset:0; } }' +
'@keyframes rcCheck { from { stroke-dashoffset:100; } to { stroke-dashoffset:0; } }' +
'@keyframes rcPop { 0% { transform:scale(.6); opacity:0; } 60% { transform:scale(1.08); opacity:1; } 100% { transform:scale(1); } }' +
'@keyframes rcUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }' +
'@keyframes rcSheet { from { opacity:0; transform:translateY(60px); } to { opacity:1; transform:none; } }' +
'@keyframes rcLeaf { 0% { transform:translateY(-40px) rotate(0deg); opacity:0; } 10% { opacity:1; } 100% { transform:translateY(330px) rotate(260deg); opacity:0; } }' +
'@keyframes rcGlow { 0%,100% { box-shadow:0 0 0 0 rgba(245,243,239,0); } 50% { box-shadow:0 0 0 14px rgba(245,243,239,.12); } }' +
'.rc-head { animation:rcHeader .5s ease-out both; }' +
'.rc-badge { animation:rcPop .6s .15s cubic-bezier(.2,1.4,.4,1) both, rcGlow 1.6s 1s ease-in-out 1; }' +
'.rc-ring { stroke-dasharray:202; animation:rcRing .7s .2s ease-out both; }' +
'.rc-check { stroke-dasharray:100; animation:rcCheck .45s .75s ease-out both; }' +
'.rc-l1 { animation:rcUp .5s 1.0s ease-out both; }' +
'.rc-l2 { animation:rcUp .5s 1.15s ease-out both; }' +
'.rc-l3 { animation:rcUp .5s 1.6s ease-out both; }' +
'.rc-sheet { animation:rcSheet .7s 1.7s cubic-bezier(.2,.9,.3,1) both; }' +
'.rc-bar { animation:rcUp .5s 2.2s ease-out both; }' +
'.rc-leaf { top:0; width:14px; height:14px; border-radius:0 70% 0 70%; animation:rcLeaf 2.6s ease-in both; pointer-events:none; }' +
'.has-video .rc-sheet { animation-delay:2.4s; }' +
'.has-video .rc-bar { animation-delay:2.9s; }' +
'@media (prefers-reduced-motion: reduce) {' +
' .rc-head,.rc-badge,.rc-ring,.rc-check,.rc-l1,.rc-l2,.rc-l3,.rc-sheet,.rc-bar { animation:none !important; }' +
' .rc-ring,.rc-check { stroke-dashoffset:0; }' +
' .rc-leaf, .rc-intro { display:none !important; }' +
'}' +

/* bigger screens: header becomes a rounded card */
'@media (min-width:560px) {' +
' .rcpt { padding-top:28px; }' +
' .rcpt-head { border-radius:36px; }' +
' .rcpt-sheet { margin:-60px 18px 0; }' +
'}' +
'@media (max-width:360px) {' +
' .rcpt-amount { font-size:52px; }' +
' .rcpt-row { flex-direction:column; gap:3px; }' +
' .rcpt-row dd { text-align:left; }' +
'}' +

/* print / save as PDF */
'@media print {' +
' .no-print, .rc-leaf, .rc-hvideo, .rc-tint, .rc-intro { display:none !important; }' +
' .rc-head,.rc-badge,.rc-ring,.rc-check,.rc-l1,.rc-l2,.rc-l3,.rc-sheet,.rc-bar { animation:none !important; }' +
' .rc-ring,.rc-check { stroke-dashoffset:0; }' +
' .rcpt { background:#fff; padding:0; min-height:0; }' +
' .rcpt-head { background:#fff; color:var(--ink); padding:10px 0 16px; border-radius:0; }' +
' .rcpt-badge { color:var(--brand); background:var(--bg); width:56px; height:56px; margin:12px 0 6px; }' +
' .rcpt-badge svg { width:56px; height:56px; }' +
' .rcpt-amount { color:var(--brand); }' +
' .rcpt-sheet { margin:0; box-shadow:none; border:1px solid var(--line); }' +
' .rcpt-tear b { display:none; }' +
'}';
