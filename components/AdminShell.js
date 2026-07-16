'use client';

// components/AdminShell.js
//
// The Admin Studio chrome — espresso sidebar, ruled header, the .eba-* design
// system — pulled out so any admin page can sit inside it.
//
// AdminDashboard.js still carries its own copy of this markup and CSS. That's
// fine: they're separate pages, so only one ever renders at a time. When the
// dashboard redesign settles, it can drop its copy and wrap itself in this
// instead — then the sidebar lives in exactly one place.
//
// Usage:
//   <AdminShell admin={admin} active="live-link" lang={lang} onLang={setLang}
//               title="Live link" subtitle={someLine}>
//     ...page content...
//   </AdminShell>

import { useEffect, useRef, useState } from 'react';

const NAV_T = {
  en: {
    adminStudio: 'ADMIN STUDIO',
    overview: 'Overview',
    paymentLinks: 'Payment links',
    giftCards: 'Gift cards',
    liveLink: 'Live link',
    orders: 'Orders',
    shipping: 'Shipping',
    logOut: 'Log out',
  },
  es: {
    adminStudio: 'ADMIN STUDIO',
    overview: 'Resumen',
    paymentLinks: 'Enlaces de pago',
    giftCards: 'Tarjetas de regalo',
    liveLink: 'Enlace en vivo',
    orders: 'Pedidos',
    shipping: 'Env\u00edos',
    logOut: 'Cerrar sesi\u00f3n',
  },
};

function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(function (w) { return w[0]; })
    .join('')
    .toUpperCase();
}

/* ---------------- Icons (inline SVG) ---------------- */
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
const IconBroadcast = function () { return (<Icon><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 010 8.49" /><path d="M7.76 16.24a6 6 0 010-8.49" /><path d="M19.07 4.93a10 10 0 010 14.14" /><path d="M4.93 19.07a10 10 0 010-14.14" /></Icon>); };
const IconBox = function () { return (<Icon><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M12 12l8-4.5" /><path d="M12 12v9" /><path d="M12 12L4 7.5" /></Icon>); };
const IconTruck = function () { return (<Icon><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M5 17H3V6a1 1 0 011-1h9v12M9 17h6M15 8h4l2 3v6h-2" /></Icon>); };
const IconExternal = function () { return (<Icon size={11}><path d="M7 17L17 7" /><path d="M8 7h9v9" /></Icon>); };
const IconChevronDown = function () { return (<Icon size={13}><path d="M6 9l6 6 6-6" /></Icon>); };

/* ---------------- Styles ---------------- */
export const shellCss = '' +
'.eba { min-height: 100vh; background: #F5F3EF; color: #3d3128; }' +
'.eba * { box-sizing: border-box; }' +
'.eba a { color: inherit; text-decoration: none; }' +
'.eba button, .eba input, .eba select, .eba textarea { font-family: inherit; }' +
'.eba button { cursor: pointer; }' +
'.eba-shell { min-height: 100vh; display: grid; grid-template-columns: 236px minmax(0,1fr); }' +

/* sidebar */
'.eba-side { position: sticky; top: 0; height: 100vh; background: #3d3128; padding: 26px 16px 18px; display: flex; flex-direction: column; z-index: 30; }' +
'.eba-logo { width: 138px; height: auto; display: block; object-fit: contain; }' +
'.eba-side-eyebrow { margin: 14px 0 20px; font-size: 9px; letter-spacing: 0.3em; color: #bda891; }' +
'.eba-nav { display: grid; gap: 4px; }' +
'.eba-nav a { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 10px; color: #bda891; font-size: 13.5px; transition: background .15s ease, color .15s ease; }' +
'.eba-nav a:hover { background: rgba(245,243,239,0.07); color: #e3d9cc; }' +
'.eba-nav a.on { background: #806a52; color: #F5F3EF; }' +
'.eba-nav .ic { width: 18px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }' +
'.eba-nav .ext { margin-left: auto; opacity: .7; display: inline-flex; }' +
'.eba-side-div { border-top: 1px solid #5a4c3c; margin: 12px 4px; }' +
'.eba-side-spacer { flex: 1; }' +
'.eba-side-user { border-top: 1px solid #5a4c3c; padding-top: 12px; position: relative; }' +
'.eba-userpill { width: 100%; display: flex; align-items: center; gap: 10px; border: 0; background: transparent; padding: 8px; border-radius: 10px; text-align: left; color: #e3d9cc; }' +
'.eba-userpill:hover { background: rgba(245,243,239,0.07); }' +
'.eba-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; display: block; flex-shrink: 0; }' +
'.eba-avatar-fb { width: 32px; height: 32px; border-radius: 50%; background: #bda891; color: #3d3128; font-size: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }' +
'.eba-usertext { min-width: 0; flex: 1; }' +
'.eba-username, .eba-useremail { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
'.eba-username { font-size: 12.5px; color: #F5F3EF; }' +
'.eba-useremail { font-size: 10px; color: #bda891; margin-top: 1px; }' +
'.eba-menu { position: absolute; left: 0; bottom: calc(100% + 8px); z-index: 40; width: 100%; background: #F5F3EF; border: 1px solid #d8d2c8; border-radius: 12px; overflow: hidden; box-shadow: 0 14px 35px rgba(20,15,10,.35); }' +
'.eba-menu-head { padding: 11px 13px; border-bottom: 1px solid #e2dcd2; }' +
'.eba-menu-head p { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
'.eba-menu-name { font-size: 13px; color: #3d3128; }' +
'.eba-menu-email { font-size: 11px; color: #a08a71; margin-top: 2px !important; }' +
'.eba-menu button { width: 100%; border: 0; background: transparent; padding: 11px 13px; text-align: left; color: #6b5638; font-size: 13px; }' +
'.eba-menu button:hover { background: #EDEAE3; }' +

/* content */
'.eba-main { min-width: 0; }' +
'.eba-content { max-width: 1240px; margin: 0 auto; padding: 30px 36px 72px; }' +
'.eba-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }' +
'.eba-head h1 { margin: 0; font-size: 34px; font-weight: 400; font-style: italic; color: #3d3128; line-height: 1.1; }' +
'.eba-head .sub { margin: 5px 0 0; font-size: 12px; color: #a08a71; }' +
'.eba-langs { display: flex; border: 1px solid #cbb9a4; border-radius: 999px; overflow: hidden; flex-shrink: 0; }' +
'.eba-langs button { border: 0; background: transparent; padding: 7px 14px; font-size: 10px; letter-spacing: 1.5px; color: #806a52; }' +
'.eba-langs button.on { background: #3d3128; color: #F5F3EF; }' +
'.eba-rule { border-top: 2px solid #3d3128; margin-top: 16px; }' +

/* stat strip */
'.eba-stats { display: flex; flex-wrap: wrap; gap: 14px 40px; padding: 16px 2px; border-bottom: 1px solid #cbb9a4; }' +
'.eba-stat { border: 0; background: none; text-align: left; padding: 0; }' +
'.eba-stat b { display: block; font-size: 27px; font-weight: 400; color: #3d3128; line-height: 1.1; }' +
'.eba-stat span { display: block; margin-top: 3px; font-size: 9.5px; text-transform: uppercase; letter-spacing: .2em; color: #a08a71; }' +

/* toolbar + controls */
'.eba-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; margin-top: 18px; }' +
'.eba-search { flex: 1; min-width: 230px; display: flex; align-items: center; gap: 9px; border: 1px solid #d8d2c8; border-radius: 999px; padding: 10px 15px; background: #fff; }' +
'.eba-search svg { color: #a08a71; flex-shrink: 0; }' +
'.eba-search input { width: 100%; border: 0; outline: 0; background: transparent; color: #3d3128; font-size: 13px; }' +
'.eba-search input::placeholder { color: #a08a71; }' +
'.eba-btn { border: 1px solid #d8d2c8; border-radius: 999px; padding: 10px 17px; font-size: 12.5px; background: #fff; color: #6b5638; text-decoration: none; display: inline-block; }' +
'.eba-btn:hover { background: #EDEAE3; }' +
'.eba-btn:disabled { opacity: .45; cursor: default; }' +
'.eba-btn-dark { background: #3d3128; border-color: #3d3128; color: #F5F3EF; }' +
'.eba-btn-dark:hover { background: #2c241c; }' +
'.eba-notice { margin-top: 14px; background: #EDEAE3; border-radius: 12px; padding: 11px 15px; font-size: 12.5px; color: #806a52; }' +

/* cells */
'.eba-detail-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 10px; }' +
'.eba-cell { background: #EDEAE3; border-radius: 12px; padding: 12px 13px; font-size: 12px; line-height: 1.55; }' +
'.eba-cell .lb { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: .16em; color: #806a52; margin-bottom: 4px; }' +

/* responsive */
'@media (max-width: 1050px) { .eba-shell { grid-template-columns: 200px minmax(0,1fr); } .eba-content { padding: 24px 20px 60px; } .eba-head h1 { font-size: 28px; } }' +
'@media (max-width: 760px) {' +
' .eba-shell { display: block; }' +
' .eba-side { position: static; height: auto; padding: 14px 12px; }' +
' .eba-logo { width: 108px; }' +
' .eba-side-eyebrow { margin: 8px 0 10px; }' +
' .eba-nav { display: flex; overflow-x: auto; padding-bottom: 3px; }' +
' .eba-nav a { white-space: nowrap; padding: 8px 11px; }' +
' .eba-side-div, .eba-side-spacer { display: none; }' +
' .eba-side-user { border-top: 0; padding-top: 8px; }' +
' .eba-menu { bottom: auto; top: calc(100% + 6px); }' +
' .eba-content { padding: 18px 14px 52px; }' +
' .eba-head h1 { font-size: 25px; }' +
' .eba-stats { gap: 12px 26px; }' +
' .eba-stat b { font-size: 22px; }' +
'}' +
'@media print { .no-print { display: none !important; } .eba-shell { display: block; } .eba { background: #fff; } .eba-content { padding: 0; max-width: none; } }';

const SHIP = 'https://ship.erendirasboutique.com';

export default function AdminShell({ admin, active, lang, onLang, title, subtitle, children }) {
  const t = NAV_T[lang] || NAV_T.en;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(function () {
    function close(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', close);
    return function () { document.removeEventListener('mousedown', close); };
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  const avatarUrl = admin?.avatar_url || admin?.picture || admin?.avatar || null;

  return (
    <main className="eba">
      <style>{shellCss}</style>

      <div className="eba-shell">
        <aside className="eba-side no-print">
          <a href="/admin" aria-label="Erendira's Boutique admin home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo2.png" alt="Erendira&#8217;s Boutique" className="eba-logo" />
          </a>
          <p className="eba-side-eyebrow">{t.adminStudio}</p>

          <nav className="eba-nav" aria-label="Admin navigation">
            <a className={active === 'overview' ? 'on' : ''} href="/admin"><span className="ic"><IconHome /></span><span>{t.overview}</span></a>
            <a className={active === 'payment-links' ? 'on' : ''} href="/admin/payment-links"><span className="ic"><IconLink /></span><span>{t.paymentLinks}</span></a>
            <a className={active === 'gift-cards' ? 'on' : ''} href="/admin/gift-cards"><span className="ic"><IconGift /></span><span>{t.giftCards}</span></a>
            <a className={active === 'live-link' ? 'on' : ''} href="/admin/live-link"><span className="ic"><IconBroadcast /></span><span>{t.liveLink}</span></a>
          </nav>
          <div className="eba-side-div" />
          <nav className="eba-nav" aria-label="Shipping portal">
            <a href={SHIP + '/orders'} target="_blank" rel="noopener noreferrer"><span className="ic"><IconBox /></span><span>{t.orders}</span><span className="ext"><IconExternal /></span></a>
            <a href={SHIP} target="_blank" rel="noopener noreferrer"><span className="ic"><IconTruck /></span><span>{t.shipping}</span><span className="ext"><IconExternal /></span></a>
          </nav>

          <div className="eba-side-spacer" />

          <div className="eba-side-user" ref={menuRef}>
            <button
              className="eba-userpill"
              onClick={function () { setMenuOpen(function (v) { return !v; }); }}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="eba-avatar" />
              ) : (
                <span className="eba-avatar-fb">{initials(admin?.name || admin?.email)}</span>
              )}
              <span className="eba-usertext">
                <span className="eba-username">{admin?.name || 'Admin Studio'}</span>
                <span className="eba-useremail">{admin?.email || '...'}</span>
              </span>
              <IconChevronDown />
            </button>

            {menuOpen && (
              <div className="eba-menu" role="menu">
                <div className="eba-menu-head">
                  <p className="eba-menu-name">{admin?.name || 'Admin Studio'}</p>
                  <p className="eba-menu-email">{admin?.email}{admin?.role ? ' \u00b7 ' + admin.role : ''}</p>
                </div>
                <button role="menuitem" onClick={logout}>{t.logOut}</button>
              </div>
            )}
          </div>
        </aside>

        <section className="eba-main">
          <div className="eba-content">
            <div className="eba-head no-print">
              <div>
                <h1>{title}</h1>
                {subtitle && <p className="sub">{subtitle}</p>}
              </div>
              <div className="eba-langs" role="group" aria-label="Language">
                {['en', 'es'].map(function (l) {
                  return (
                    <button key={l} className={lang === l ? 'on' : ''} onClick={function () { onLang(l); }}>
                      {l.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="eba-rule" />

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
