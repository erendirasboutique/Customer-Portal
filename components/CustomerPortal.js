'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';
import { money, formatDate, formatAddress, paymentMethodLabel } from '@/lib/format';
import LanguageToggle from './LanguageToggle';
import LiveBaskets from './LiveBaskets';
import styles from './CustomerPortal.module.css';

const RETURNS_URL = 'https://returns.erendirasboutique.com';
const CONTACT_PHONE_DISPLAY = '909.401.7221';
const CONTACT_PHONE_TEL = 'tel:+19094017221';
const CONTACT_WHATSAPP = 'https://wa.me/19094017221';
const CONTACT_EMAIL = 'hello@erendirasboutique.com';
const SUPPORT_EMAIL = 'info@erendirasboutique.com';
const SHOP_URL = 'https://facebook.erendirasboutique.com';
const HELP_URL = 'https://help.erendirasboutique.com';

const T = {
  en: {
    loginEyebrow: 'Customer portal',
    loginTitle: 'Welcome back',
    tabEmail: 'With my email',
    tabNoEmail: 'No email',
    noEmailBody: 'Find your account with one of your packages or your order number, plus your last name and ZIP code.',
    noEmailTip: 'The last 4 digits of the tracking number are on your package label.',
    findButton: 'Find my account',
    limitNote: 'We limit tries to protect your account',
    langSwitch: 'ES',
    langSwitchLabel: 'Ver en español',
    footShop: 'Shop',
    footContact: 'Contact',
    footReturns: 'Returns',
    loginHeadline: "Welcome back to Erendira's Boutique",
    loginNote: "Enter the email you used at checkout and we'll send you a secure sign-in link. No password needed.",
    lockNote: 'One-tap sign in · link expires after use',
    chipReceipts: 'Receipts',
    chipShipments: 'Shipment tracking',
    chipGift: 'Gift cards',
    emailLabel: 'Email',
    sendLink: 'Send secure link',
    noEmail: 'No email on file?',
    findAccount: 'Find your account',
    sending: 'Sending secure login link...',
    sentTitle: 'Check your email for your login link',
    sentBodyA: 'If ',
    sentBodyB: " is active with Erendira's Boutique, you'll receive a link. The link will be active for 1 hour.",
    differentEmail: 'Use a different email',
    supportNoteA: 'Need support? Contact us at ',
    supportNoteB: ' for assistance.',
    welcome: 'Welcome back',
    heroSub: 'Your orders, shipments, and receipts — all in one place.',
    logout: 'Log out',
    statLatest: 'Latest order',
    statOrders: 'Orders',
    statShipments: 'Shipments',
    statGift: 'Gift card balance',
    myShipments: 'My shipments',
    loadingShipments: 'Looking up your shipments...',
    noShipments: 'No shipments for your account yet.',
    shipment: 'Shipment',
    order: 'Order',
    to: 'to',
    stepCreated: 'Label created',
    stepTransit: 'In transit',
    stepDelivered: 'Delivered',
    track: 'Track package',
    copyTracking: 'Copy tracking #',
    copied: 'Copied!',
    statusPreparing: 'Preparing',
    statusShipped: 'Shipped',
    statusCanceled: 'Canceled',
    giftCards: 'My gift cards',
    remaining: 'remaining',
    of: 'of',
    lastUsed: 'Last used',
    neverUsed: 'Never used',
    giftActive: 'Active',
    giftRedeemed: 'Redeemed',
    giftDisabled: 'Disabled',
    paymentHistory: 'Payment history',
    noPayments: 'No payments found for this email yet.',
    purchase: 'Boutique purchase',
    paid: 'Paid',
    refunded: 'Refunded',
    receipt: 'Receipt',
    returnsTitle: 'Need a return?',
    returnsBody: 'Start a return request in a couple of taps and we will email you a return label.',
    returnsBtn: 'Start a return',
    contactTitle: 'Questions about an order?',
    contactBody: 'Reach us any time — we are happy to help.',
    contactCall: 'Call',
    contactEmail: 'Email',
    addressTitle: 'Address on file',
    addressBody: 'From your most recent payment. Contact us if it needs updating.',
    footer: "Erendira's Boutique LLC",
  },
  es: {
    loginEyebrow: 'Portal de clientes',
    loginTitle: 'Bienvenida de nuevo',
    tabEmail: 'Con mi correo',
    tabNoEmail: 'Sin correo',
    noEmailBody: 'Encuentra tu cuenta con uno de tus paquetes o tu número de pedido, más tu apellido y código postal.',
    noEmailTip: 'Los últimos 4 dígitos del rastreo están en la etiqueta de tu paquete.',
    findButton: 'Buscar mi cuenta',
    limitNote: 'Limitamos los intentos para proteger tu cuenta',
    langSwitch: 'EN',
    langSwitchLabel: 'View in English',
    footShop: 'Tienda',
    footContact: 'Contacto',
    footReturns: 'Devoluciones',
    loginHeadline: "Bienvenida de nuevo a Erendira's Boutique",
    loginNote: 'Escribe el correo que usaste al pagar y te enviaremos un enlace seguro para ingresar. Sin contraseña.',
    lockNote: 'Ingreso con un toque · el enlace expira después de usarse',
    chipReceipts: 'Recibos',
    chipShipments: 'Rastreo de envíos',
    chipGift: 'Tarjetas de regalo',
    emailLabel: 'Correo electrónico',
    sendLink: 'Enviar enlace seguro',
    noEmail: '¿No tienes correo registrado?',
    findAccount: 'Busca tu cuenta',
    sending: 'Enviando enlace de acceso seguro...',
    sentTitle: 'Revisa tu correo para encontrar tu enlace de acceso',
    sentBodyA: 'Si ',
    sentBodyB: " está activo con Erendira's Boutique, recibirás un enlace. El enlace estará activo por 1 hora.",
    differentEmail: 'Usar otro correo',
    supportNoteA: '¿Necesitas ayuda? Escríbenos a ',
    supportNoteB: ' y con gusto te asistimos.',
    welcome: 'Bienvenida de nuevo',
    heroSub: 'Tus pedidos, envíos y recibos, todo en un solo lugar.',
    logout: 'Cerrar sesión',
    statLatest: 'Último pedido',
    statOrders: 'Pedidos',
    statShipments: 'Envíos',
    statGift: 'Saldo de regalo',
    myShipments: 'Mis envíos',
    loadingShipments: 'Buscando tus envíos...',
    noShipments: 'Aún no hay envíos en tu cuenta.',
    shipment: 'Envío',
    order: 'Pedido',
    to: 'a',
    stepCreated: 'Etiqueta creada',
    stepTransit: 'En camino',
    stepDelivered: 'Entregado',
    track: 'Rastrear paquete',
    copyTracking: 'Copiar rastreo',
    copied: '¡Copiado!',
    statusPreparing: 'Preparando',
    statusShipped: 'Enviado',
    statusCanceled: 'Cancelado',
    giftCards: 'Mis tarjetas de regalo',
    remaining: 'disponible',
    of: 'de',
    lastUsed: 'Último uso',
    neverUsed: 'Sin usar',
    giftActive: 'Activa',
    giftRedeemed: 'Canjeada',
    giftDisabled: 'Desactivada',
    paymentHistory: 'Historial de pagos',
    noPayments: 'Aún no hay pagos con este correo.',
    purchase: 'Compra en la boutique',
    paid: 'Pagado',
    refunded: 'Reembolsado',
    receipt: 'Recibo',
    returnsTitle: '¿Necesitas una devolución?',
    returnsBody: 'Inicia una solicitud de devolución en un par de pasos y te enviaremos una etiqueta por correo.',
    returnsBtn: 'Iniciar devolución',
    contactTitle: '¿Preguntas sobre un pedido?',
    contactBody: 'Contáctanos cuando quieras, con gusto te ayudamos.',
    contactCall: 'Llamar',
    contactEmail: 'Correo',
    addressTitle: 'Dirección registrada',
    addressBody: 'De tu pago más reciente. Contáctanos si necesita actualizarse.',
    footer: "Erendira's Boutique LLC",
  },
};

function initials(name) {
  return String(name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(function (w) {
      return w[0];
    })
    .join('')
    .toUpperCase();
}

function shipmentState(s) {
  if (s.status === 'refunded' || s.refund_status) return 'canceled';
  if (s.tracking_number) return 'shipped';
  return 'preparing';
}

function giftStatusLabel(status, t) {
  const v = String(status || '').toLowerCase();
  if (v === 'active') return t.giftActive;
  if (v === 'redeemed') return t.giftRedeemed;
  if (v === 'disabled') return t.giftDisabled;
  return status || '-';
}

export default function CustomerPortal({ initialUser, initialPayments }) {
  const [lang, setLangState] = useState('en');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [shipments, setShipments] = useState([]);
  const [giftCards, setGiftCards] = useState([]);
  const [addressOnFile, setAddressOnFile] = useState(null);
  const [shipmentsLoading, setShipmentsLoading] = useState(true);
  const [copiedTn, setCopiedTn] = useState(null);
  const [signTab, setSignTab] = useState('email'); // sign-in tabs: email | noemail
  const supabase = getSupabaseBrowser();
  const payments = initialPayments || [];
  const name = payments.find(p => p.customer_name)?.customer_name || initialUser?.email || 'Customer';
  const latest = payments[0];
  const t = T[lang] || T.en;

  function setLang(l) {
    setLangState(l);
    try {
      localStorage.setItem('ebtq_lang', l);
    } catch {}
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ebtq_lang');
      if (saved === 'es' || saved === 'en') {
        setLangState(saved);
      } else if ((navigator.language || '').toLowerCase().startsWith('es')) {
        setLangState('es');
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!initialUser) {
      setShipmentsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (!token) {
          if (!cancelled) setShipmentsLoading(false);
          return;
        }
        const res = await fetch('/api/customer-shipments', {
          headers: { Authorization: 'Bearer ' + token },
        });
        const json = await res.json();
        if (!cancelled) {
          setShipments(json.shipments || []);
          setGiftCards(json.giftCards || []);
          setAddressOnFile(json.addressOnFile || null);
        }
      } catch {
        if (!cancelled) setShipments([]);
      }
      if (!cancelled) setShipmentsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUser]);

  async function sendMagicLink(e) {
    e.preventDefault();
    setMessage(t.sending);

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, '');
    const redirectTo = siteUrl + '/auth/callback?next=/customer';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    // Only surface real delivery problems (rate limits, network issues).
    // "User not found"-style errors still show the confirmation screen so the
    // form never reveals whether an email has an account.
    if (error && /rate|network|fetch|timeout/i.test(error.message || '')) {
      setMessage(error.message);
      return;
    }

    setMessage('');
    setSentTo(email);
    setLinkSent(true);
  }

  function useDifferentEmail() {
    setLinkSent(false);
    setSentTo('');
    setEmail('');
    setMessage('');
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  function copyTracking(tn) {
    navigator.clipboard.writeText(tn);
    setCopiedTn(tn);
    setTimeout(function () {
      setCopiedTn(null);
    }, 2000);
  }

  const giftBalance = giftCards.reduce(function (sum, c) {
    return sum + Number(c.remaining || 0);
  }, 0);

  if (!initialUser) {
    const onEmail = signTab === 'email';
    return (
      <main className="si">
        <style>{signInCss}</style>
        <div className="si-wrap">
          <header className="si-top">
            <img src="/brand/logo.png" className="si-logo" alt="Erendira's Boutique" />
            <button type="button" className="si-lang" aria-label={t.langSwitchLabel} onClick={() => setLang(lang === 'es' ? 'en' : 'es')}>
              {t.langSwitch}
            </button>
          </header>

          <div className="si-head">
            <p className="si-eyebrow">{t.loginEyebrow}</p>
            <h1 className="si-h1">{linkSent ? t.sentTitle : t.loginTitle}</h1>
          </div>

          <section className="si-card" aria-label={t.loginEyebrow}>
            {linkSent ? (
              <>
                <p className="si-p">
                  {t.sentBodyA}<strong>{sentTo}</strong>{t.sentBodyB}
                </p>
                <button type="button" className="si-btn" onClick={useDifferentEmail}>
                  {t.differentEmail}
                </button>
                <p className="si-note">
                  {t.supportNoteA}
                  <a href={'mailto:' + SUPPORT_EMAIL}>{SUPPORT_EMAIL}</a>
                  {t.supportNoteB}
                </p>
              </>
            ) : (
              <>
                <div role="tablist" aria-label={t.loginEyebrow} className="si-tabs">
                  <button type="button" role="tab" id="si-tab-email" aria-controls="si-panel" aria-selected={onEmail} className={'si-tab' + (onEmail ? ' on' : '')} onClick={() => setSignTab('email')}>
                    {t.tabEmail}
                  </button>
                  <button type="button" role="tab" id="si-tab-noemail" aria-controls="si-panel" aria-selected={!onEmail} className={'si-tab' + (!onEmail ? ' on' : '')} onClick={() => setSignTab('noemail')}>
                    {t.tabNoEmail}
                  </button>
                </div>

                <div id="si-panel" role="tabpanel" aria-labelledby={onEmail ? 'si-tab-email' : 'si-tab-noemail'} className="si-panel">
                  {onEmail ? (
                    <>
                      <p className="si-p">{t.loginNote}</p>
                      <form onSubmit={sendMagicLink} className="si-panel">
                        <label htmlFor="si-email" className="si-label">{t.emailLabel}</label>
                        <div className="si-box">
                          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
                          <input
                            id="si-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            placeholder="you@email.com"
                          />
                        </div>
                        <button className="si-btn" type="submit">{t.sendLink}</button>
                      </form>
                      {message && <div role="status" className="si-notice">{message}</div>}
                      <p className="si-note">
                        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
                        {t.lockNote}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="si-p">{t.noEmailBody}</p>
                      <div className="si-tip">
                        <span className="si-tip-ico" aria-hidden="true">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round"><path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z" /><path d="M3 7.5L12 12l9-4.5M12 12v9" /></svg>
                        </span>
                        <span>{t.noEmailTip}</span>
                      </div>
                      <a className="si-btn" href={'/find-account?lang=' + lang}>{t.findButton}</a>
                      <p className="si-note">
                        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
                        {t.limitNote}
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </section>

          <div className="si-tiles">
            <div className="si-tile">
              <span aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" /></svg></span>
              {t.chipReceipts}
            </div>
            <div className="si-tile">
              <span aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z" /><path d="M3 7.5L12 12l9-4.5M12 12v9" /></svg></span>
              {t.chipShipments}
            </div>
            <div className="si-tile">
              <span aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="9" width="17" height="11.5" rx="1.5" /><path d="M2.5 9h19M12 9v11.5M12 9c-1.5-3.5-6-4-6-1.5S9 9 12 9zm0 0c1.5-3.5 6-4 6-1.5S15 9 12 9z" /></svg></span>
              {t.chipGift}
            </div>
          </div>

          <footer className="si-foot">
            <nav aria-label="Erendira's Boutique" className="si-foot-nav">
              <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" className="si-foot-btn main">
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 016 0v2" /></svg>
                {t.footShop}
              </a>
              <a href={HELP_URL} target="_blank" rel="noopener noreferrer" className="si-foot-btn">
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4z" /></svg>
                {t.footContact}
              </a>
              <a href={RETURNS_URL} target="_blank" rel="noopener noreferrer" className="si-foot-btn">
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 010 12h-3" /></svg>
                {t.footReturns}
              </a>
            </nav>
            <div className="si-foot-small">
              <a href={'mailto:' + SUPPORT_EMAIL}>{SUPPORT_EMAIL}</a>
              <span>© {new Date().getFullYear()} {t.footer}</span>
            </div>
          </footer>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <span className="flower one">✿</span><span className="flower two">❀</span>
      <div className={styles.wrap}>

        <header className={styles.header}>
          <div className={styles.brand}>
            <img src="/brand/logo.png" className={styles.brandLogo} alt="Erendira's Boutique" />
            <span className={styles.brandName}>Erendira&apos;s Boutique</span>
          </div>
          <div className={styles.headerRight}>
            <LanguageToggle lang={lang} setLang={setLang} />
            <button className={styles.btnGhost} onClick={logout}>{t.logout}</button>
          </div>
        </header>

        <section className={styles.hero}>
          <div className={styles.avatar}>{initials(name)}</div>
          <div>
            <p className={styles.eyebrow}>{t.welcome}</p>
            <h1 className={styles.heroName}>{name} 🌸</h1>
            <p className={styles.heroSub}>{t.heroSub}</p>
          </div>
        </section>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <p className={styles.statLabel}>{t.statLatest}</p>
            <p className={styles.statValue}>{latest ? formatDate(latest.created_at) : '—'}</p>
          </div>
          <div className={styles.stat}>
            <p className={styles.statLabel}>{t.statOrders}</p>
            <p className={styles.statValue}>{payments.length}</p>
          </div>
          <div className={styles.stat}>
            <p className={styles.statLabel}>{t.statShipments}</p>
            <p className={styles.statValue}>{shipmentsLoading ? '—' : shipments.length}</p>
          </div>
          {giftCards.length > 0 && (
            <div className={styles.stat}>
              <p className={styles.statLabel}>{t.statGift}</p>
              <p className={styles.statValue}>{money(giftBalance)}</p>
            </div>
          )}
        </div>

        <p className={styles.sectionTitle}>{t.myShipments}</p>
        {shipmentsLoading && <div className={styles.empty}>{t.loadingShipments}</div>}
        {!shipmentsLoading && shipments.length === 0 && <div className={styles.empty}>{t.noShipments}</div>}
        {!shipmentsLoading && shipments.map(function (s, i) {
          const state = shipmentState(s);
          const shippedDone = state === 'shipped';
          return (
            <div className={styles.card} key={s.tracking_number || s.order_number || i}>
              <div className={styles.shipTop}>
                <div>
                  <h3 className={styles.shipTitle}>
                    {s.order_number != null ? t.order + ' #EB-' + s.order_number : t.shipment}
                  </h3>
                  <p className={styles.shipMeta}>
                    {(s.carrier || '—') + (s.mail_class ? ' · ' + s.mail_class : '')}
                    {s.city ? ' · ' + t.to + ' ' + s.city + ', ' + s.state : ''}
                    {' · ' + formatDate(s.created_at)}
                  </p>
                </div>
                {state === 'canceled' && <span className={styles.pill + ' ' + styles.pillRed}>{t.statusCanceled}</span>}
                {state === 'shipped' && <span className={styles.pill + ' ' + styles.pillGreen}>{t.statusShipped}</span>}
                {state === 'preparing' && <span className={styles.pill}>{t.statusPreparing}</span>}
              </div>

              {state !== 'canceled' && (
                <>
                  <div className={styles.progress}>
                    <div className={styles.dot + ' ' + styles.dotDone}></div>
                    <div className={styles.bar + (shippedDone ? ' ' + styles.barDone : '')}></div>
                    <div className={styles.dot + (shippedDone ? ' ' + styles.dotDone : '')}></div>
                    <div className={styles.bar}></div>
                    <div className={styles.dot}></div>
                  </div>
                  <div className={styles.progressLabels}>
                    <span>{t.stepCreated}</span>
                    <span className={shippedDone ? '' : styles.dim}>{t.stepTransit}</span>
                    <span className={styles.dim}>{t.stepDelivered}</span>
                  </div>
                </>
              )}

              {s.tracking_url && (
                <div className={styles.btnRow}>
                  <a className={styles.btnSolid} href={s.tracking_url} target="_blank" rel="noopener noreferrer">{t.track}</a>
                  <button className={styles.btnGhost} onClick={function () { copyTracking(s.tracking_number); }}>
                    {copiedTn === s.tracking_number ? t.copied : t.copyTracking}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <LiveBaskets lang={lang} />

        {giftCards.length > 0 && (
          <>
            <p className={styles.sectionTitle}>{t.giftCards}</p>
            <div className={styles.list}>
              {giftCards.map(function (c, i) {
                return (
                  <div className={styles.row} key={c.code || i}>
                    <div>
                      <p className={styles.rowTitle}>
                        <span className={styles.giftCode}>{c.code}</span>
                        {'  '}{money(c.remaining)} {t.remaining} {t.of} {money(c.amount)}
                      </p>
                      <p className={styles.rowMeta}>
                        {c.last_redeemed_at ? t.lastUsed + ': ' + formatDate(c.last_redeemed_at) : t.neverUsed}
                      </p>
                    </div>
                    <div className={styles.rowRight}>
                      <span className={styles.pill}>{giftStatusLabel(c.status, t)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <p className={styles.sectionTitle}>{t.paymentHistory}</p>
        {payments.length === 0 && <div className={styles.empty}>{t.noPayments}</div>}
        {payments.length > 0 && (
          <div className={styles.list}>
            {payments.map(function (p) {
              const refunded = p.refund_status === 'refunded';
              return (
                <div className={styles.row} key={p.id || p.stripe_session_id || p.clover_payment_id}>
                  <div>
                    <p className={styles.rowTitle}>
                      {money(p.amount_total, p.currency)} · {p.description || t.purchase}
                    </p>
                    <p className={styles.rowMeta}>
                      {formatDate(p.created_at)} · {paymentMethodLabel(p)}
                    </p>
                  </div>
                  <div className={styles.rowRight}>
                    {refunded
                      ? <span className={styles.pill + ' ' + styles.pillRed}>{t.refunded}</span>
                      : <span className={styles.pill}>{t.paid}</span>}
                    {p.receipt_url && (
                      <a className={styles.link} href={p.receipt_url} target="_blank" rel="noopener noreferrer">{t.receipt}</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.grid2}>
          <div className={styles.card}>
            <p className={styles.miniTitle}>{t.returnsTitle}</p>
            <p className={styles.miniBody}>{t.returnsBody}</p>
            <div className={styles.btnRow}>
              <a className={styles.btnSolid} href={RETURNS_URL} target="_blank" rel="noopener noreferrer">{t.returnsBtn}</a>
            </div>
          </div>
          <div className={styles.card}>
            <p className={styles.miniTitle}>{t.contactTitle}</p>
            <p className={styles.miniBody}>{t.contactBody} · {CONTACT_PHONE_DISPLAY}</p>
            <div className={styles.btnRow}>
              <a className={styles.btnGhost} href={CONTACT_WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <a className={styles.btnGhost} href={CONTACT_PHONE_TEL}>{t.contactCall}</a>
              <a className={styles.btnGhost} href={'mailto:' + CONTACT_EMAIL}>{t.contactEmail}</a>
            </div>
          </div>
          {addressOnFile && (
            <div className={styles.card}>
              <p className={styles.miniTitle}>{t.addressTitle}</p>
              <p className={styles.miniBody}>{formatAddress(addressOnFile)}</p>
              <p className={styles.rowMeta}>{t.addressBody}</p>
            </div>
          )}
        </div>

        <p className={styles.footer}>{t.footer}</p>
      </div>
    </main>
  );
}

/* Sign-in screen (version C: "With my email" / "No email" tabs).
   Shared brand colors from /brand/brand.css, with fallbacks. */
const signInCss = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");
.si { --bg:var(--brand-cream, #F5F3EF); --brand:var(--brand-taupe, #957f67); --sand:var(--brand-sand, #cfbda9); --ink:var(--brand-ink, #5F4E3D);
  min-height:100vh; background:var(--bg); color:var(--ink); font-family:Inter, system-ui, sans-serif; -webkit-font-smoothing:antialiased; padding:16px 16px 36px; box-sizing:border-box; }
.si *, .si *::before, .si *::after { box-sizing:border-box; }
.si a { color:var(--ink); }
.si-wrap { max-width:440px; margin:0 auto; display:flex; flex-direction:column; gap:22px; }
.si-top { display:flex; align-items:center; justify-content:space-between; }
.si-logo { width:118px; height:auto; display:block; }
.si-lang { min-width:44px; min-height:44px; padding:0 14px; border:0; border-radius:999px; background:#fff; color:var(--ink); font:600 13px Inter, sans-serif; cursor:pointer; }
.si-head { padding:8px 4px 0; display:flex; flex-direction:column; gap:8px; }
.si-eyebrow { margin:0; font-size:14px; color:var(--brand); }
.si-h1 { margin:0; font-family:var(--font-heading, Georgia, serif); font-weight:400; font-size:36px; line-height:1.05; letter-spacing:-.01em; }
.si-card { border-radius:26px; background:#fff; padding:20px 16px 16px; display:flex; flex-direction:column; gap:14px; }
.si-panel { display:flex; flex-direction:column; gap:14px; }
.si-panel form.si-panel { gap:6px; }
.si-panel form .si-btn { margin-top:8px; }
.si-tabs { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:4px; padding:4px; border-radius:16px; background:var(--bg); }
.si-tab { min-height:46px; border:0; border-radius:12px; background:transparent; color:var(--brand); font:500 14.5px Inter, sans-serif; cursor:pointer; }
.si-tab.on { background:#fff; color:var(--ink); font-weight:600; box-shadow:0 1px 6px rgba(149,127,103,.18); }
.si-p { margin:0; padding:0 4px; font-size:14.5px; line-height:1.5; }
.si-label { padding:0 4px; font-size:13px; font-weight:600; }
.si-box { display:flex; align-items:center; gap:12px; min-height:56px; padding:0 16px; border-radius:16px; background:var(--bg); color:var(--brand); }
.si-box:focus-within { box-shadow:0 0 0 2px var(--brand); background:#fff; }
.si-box input { flex:1; min-width:0; border:0; background:transparent; outline:none; font:16px Inter, sans-serif; color:var(--ink); }
.si-box input::placeholder { color:var(--brand); opacity:.7; }
.si-btn { min-height:56px; border:0; border-radius:16px; background:var(--brand); color:#fff !important; font:600 16px Inter, sans-serif; display:flex; align-items:center; justify-content:center; text-decoration:none; cursor:pointer; width:100%; }
.si-note { margin:0; text-align:center; font-size:12.5px; line-height:1.45; color:var(--brand); }
.si-note svg { vertical-align:-2px; margin-right:4px; }
.si-note a { font-weight:500; }
.si-notice { padding:10px 14px; border-radius:12px; background:var(--bg); font-size:14px; }
.si-tip { display:flex; gap:12px; align-items:center; padding:14px; border-radius:18px; background:var(--bg); font-size:14px; line-height:1.45; }
.si-tip-ico { flex:none; width:44px; height:44px; border-radius:14px; background:var(--brand); display:grid; place-items:center; }
.si-tiles { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; }
.si-tile { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; min-height:84px; border-radius:18px; background:#fff; font-size:12.5px; font-weight:500; text-align:center; padding:8px; }
.si-tile span { width:34px; height:34px; border-radius:12px; background:var(--bg); color:var(--brand); display:grid; place-items:center; }
.si-foot { margin-top:6px; padding-top:22px; border-top:1px solid var(--sand); display:flex; flex-direction:column; gap:16px; }
.si-foot-nav { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; }
.si-foot-btn { min-height:76px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; border-radius:18px; background:#fff; text-decoration:none; font-size:14px; font-weight:600; }
.si-foot-btn svg { color:var(--brand); }
.si-foot-btn.main { background:var(--brand); color:#fff !important; }
.si-foot-btn.main svg { color:#fff; }
.si-foot-small { display:flex; flex-direction:column; align-items:center; gap:6px; font-size:13px; color:var(--brand); }
.si-foot-small a { font-weight:500; }
`;
