'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';
import { money, formatDate, formatAddress, paymentMethodLabel } from '@/lib/format';
import LanguageToggle from './LanguageToggle';
import styles from './CustomerPortal.module.css';

const RETURNS_URL = 'https://returns.erendirasboutique.com';
const CONTACT_PHONE_DISPLAY = '909.401.7221';
const CONTACT_PHONE_TEL = 'tel:+19094017221';
const CONTACT_WHATSAPP = 'https://wa.me/19094017221';
const CONTACT_EMAIL = 'hello@erendirasboutique.com';

const T = {
  en: {
    portalEyebrow: 'Secure billing portal',
    loginTitle: 'Your payments, beautifully organized.',
    loginSub: 'Sign in with the email you used at checkout to view your payment history, receipts, shipments, and gift cards.',
    emailLabel: 'Email',
    sendLink: 'Send secure link',
    sending: 'Sending secure login link...',
    checkEmail: 'Check your email for the secure login link.',
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
    portalEyebrow: 'Portal seguro de facturación',
    loginTitle: 'Tus pagos, en un solo lugar.',
    loginSub: 'Ingresa con el correo que usaste al pagar para ver tu historial de pagos, recibos, envíos y tarjetas de regalo.',
    emailLabel: 'Correo electrónico',
    sendLink: 'Enviar enlace seguro',
    sending: 'Enviando enlace de acceso seguro...',
    checkEmail: 'Revisa tu correo para encontrar el enlace de acceso seguro.',
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
  const [shipments, setShipments] = useState([]);
  const [giftCards, setGiftCards] = useState([]);
  const [addressOnFile, setAddressOnFile] = useState(null);
  const [shipmentsLoading, setShipmentsLoading] = useState(true);
  const [copiedTn, setCopiedTn] = useState(null);
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

    setMessage(error ? error.message : t.checkEmail);
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
    return (
      <main className="page">
        <span className="flower one">✿</span><span className="flower two">❀</span>
        <div className="shell">
          <div className="topbar">
            <div className="brand">
              <img src="/logo2.png" className="logo" alt="Erendira's Boutique" />
              <div className="brand-title">Erendira&apos;s Boutique</div>
            </div>
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>
          <section className="hero">
            <div className="card loginCard">
              <p className="eyebrow">{t.portalEyebrow}</p>
              <h1>{t.loginTitle}</h1>
              <p>{t.loginSub}</p>
              <form onSubmit={sendMagicLink}>
                <label className="field">
                  {t.emailLabel}
                  <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@email.com" />
                </label>
                <button className="button secondary" type="submit">{t.sendLink}</button>
              </form>
              {message && <div className="notice">{message}</div>}
            </div>
            <div className="card brandShowcase">
              <img src="/logo2.png" alt="Erendira's Boutique" />
            </div>
          </section>
          <div className="footer">{t.footer}</div>
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
            <img src="/logo2.png" className={styles.brandLogo} alt="Erendira's Boutique" />
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
