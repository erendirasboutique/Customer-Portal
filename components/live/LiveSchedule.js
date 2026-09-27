'use client';

// components/live/LiveSchedule.js
// Public /live-schedule. Times show in the viewer's own time zone.
// Each live has Add to calendar (Apple/Outlook .ics and Google) and Share.

import { useEffect, useState } from 'react';
import { LOGO_SRC, publicCss, locales, readLang, saveLang } from '@/components/shop/publicStyles';

const WATCH_FALLBACK = '/live';

const T = {
  en: {
    eyebrow: "ERENDIRA'S BOUTIQUE",
    title: 'Live Schedule',
    sub: 'Shop with us live. Add a live to your calendar and your phone will remind you.',
    next: 'NEXT LIVE',
    later: 'COMING UP',
    liveNow: 'Live now',
    watch: 'Watch now',
    addCal: 'Add to calendar',
    apple: 'Apple / Outlook',
    google: 'Google Calendar',
    share: 'Share',
    shared: 'Link copied',
    none: 'No lives on the calendar right now. Check back soon!',
    follow: 'Follow us on Facebook',
    gift: 'Gift cards',
    starts: 'Starts in',
    min: 'min',
    platforms: { facebook: 'Facebook Live', instagram: 'Instagram Live', tiktok: 'TikTok Live', 'in-store': 'In store', other: 'Live' },
  },
  es: {
    eyebrow: "ERENDIRA'S BOUTIQUE",
    title: 'Calendario de Lives',
    sub: 'Compra con nosotras en vivo. Agrega un live a tu calendario y tu tel\u00e9fono te lo recuerda.',
    next: 'PR\u00d3XIMO LIVE',
    later: 'M\u00c1S ADELANTE',
    liveNow: 'En vivo',
    watch: 'Ver ahora',
    addCal: 'Agregar al calendario',
    apple: 'Apple / Outlook',
    google: 'Google Calendar',
    share: 'Compartir',
    shared: 'Enlace copiado',
    none: 'No hay lives en el calendario por ahora. \u00a1Vuelve pronto!',
    follow: 'S\u00edguenos en Facebook',
    gift: 'Tarjetas de regalo',
    starts: 'Empieza en',
    min: 'min',
    platforms: { facebook: 'Facebook Live', instagram: 'Instagram Live', tiktok: 'TikTok Live', 'in-store': 'En la tienda', other: 'En vivo' },
  },
};

const css = '' +
'.ebl-list { display:grid; gap:12px; }' +
'.ebl-item { display:flex; gap:16px; align-items:flex-start; background:var(--card); border-radius:24px; padding:18px;' +
'  box-shadow:0 1px 2px rgba(218,94,22,.04), 0 10px 30px rgba(218,94,22,.06); }' +
'.ebl-date { flex-shrink:0; width:64px; text-align:center; background:var(--wash); border:1px solid var(--line); border-radius:18px; padding:9px 4px; }' +
'.ebl-date .m { display:block; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--accent); }' +
'.ebl-date .d { display:block; font-family:"La Luxes Serif","Recoleta",Georgia,serif; font-size:30px; line-height:1.05; }' +
'.ebl-date .w { display:block; font-size:10.5px; }' +
'.ebl-body { flex:1; min-width:0; }' +
'.ebl-title { margin:0; font-size:18px; line-height:1.25; overflow-wrap:anywhere; }' +
'.ebl-meta { margin:4px 0 0; font-size:12.5px; opacity:.9; }' +
'.ebl-desc { margin:8px 0 0; font-size:13px; line-height:1.5; }' +
'.ebl-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; position:relative; }' +
'.ebl-menu { position:absolute; top:calc(100% + 6px); left:0; z-index:5; background:var(--card); border:1px solid var(--line);' +
'  border-radius:16px; overflow:hidden; box-shadow:0 14px 34px rgba(218,94,22,.16); min-width:190px; }' +
'.ebl-menu a, .ebl-menu button { display:block; width:100%; text-align:left; padding:11px 14px; border:0; background:transparent;' +
'  font:inherit; font-size:13px; color:var(--ink); text-decoration:none; cursor:pointer; }' +
'.ebl-menu a:hover, .ebl-menu button:hover { background:var(--wash); }' +
'.ebl-now { display:inline-flex; align-items:center; gap:7px; font-size:10px; letter-spacing:.16em; text-transform:uppercase;' +
'  background:var(--accent); color:#fff; border-radius:999px; padding:5px 11px; }' +
'.ebl-now::before { content:""; width:7px; height:7px; border-radius:50%; background:#fff; animation:ebl-pulse 1.4s ease-in-out infinite; }' +
'@keyframes ebl-pulse { 50% { opacity:.3; } }' +
'.ebl-hero .ebl-title { font-family:"La Luxes Serif","Recoleta",Georgia,serif; font-size:clamp(28px,7vw,36px); line-height:1.05; margin-top:4px; }' +
'.ebl-hero .ebl-when { margin:8px 0 0; font-size:15px; }' +
'.ebl-count { margin:10px 0 0; font-size:12.5px; }' +
'.ebl-section { margin:22px 4px 10px; font-size:10px; letter-spacing:.28em; color:var(--accent); }' +
'@media (prefers-reduced-motion:reduce) { .ebl-now::before { animation:none; } }';

function pad(n) { return String(n).padStart(2, '0'); }
function icsDate(d) {
  return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00Z';
}
function icsEscape(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1'); }

function eventLinks(ev, origin, t) {
  const start = new Date(ev.starts_at);
  const end = new Date(start.getTime() + (ev.duration_minutes || 90) * 60000);
  const watch = ev.watch_url || origin + WATCH_FALLBACK;
  const title = "Erendira's Boutique \u2014 " + ev.title;
  const details = [ev.description, (t.platforms[ev.platform] || '') + ': ' + watch].filter(Boolean).join('\n\n');

  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Erendiras Boutique//Live Schedule//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:' + ev.id + '@erendirasboutique',
    'DTSTAMP:' + icsDate(new Date()),
    'DTSTART:' + icsDate(start),
    'DTEND:' + icsDate(end),
    'SUMMARY:' + icsEscape(title),
    'DESCRIPTION:' + icsEscape(details),
    'LOCATION:' + icsEscape(watch),
    'URL:' + watch,
    'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(title), 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');

  const google = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent(title) +
    '&dates=' + icsDate(start) + '/' + icsDate(end) +
    '&details=' + encodeURIComponent(details) +
    '&location=' + encodeURIComponent(watch);

  return { ics: ics, google: google, watch: watch, start: start, end: end };
}

export default function LiveSchedule(props) {
  const events = props.events || [];
  const [lang, setLangState] = useState('en');
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);
  const [openMenu, setOpenMenu] = useState(null);
  const [sharedId, setSharedId] = useState(null);
  const t = T[lang];

  useEffect(function () {
    const l = readLang();
    if (l) setLangState(l);
    setMounted(true);
    setNow(Date.now());
    const id = setInterval(function () { setNow(Date.now()); }, 30000);
    function close() { setOpenMenu(null); }
    document.addEventListener('click', close);
    return function () { clearInterval(id); document.removeEventListener('click', close); };
  }, []);

  function setLang(l) { setLangState(l); saveLang(l); }

  const origin = mounted ? window.location.origin : '';
  const loc = locales[lang];

  function downloadIcs(ev) {
    const blob = new Blob([eventLinks(ev, origin, t).ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'erendiras-live-' + ev.starts_at.slice(0, 10) + '.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  async function share(ev) {
    const url = origin + '/live-schedule';
    const text = ev.title + ' \u2014 ' + new Date(ev.starts_at).toLocaleString(loc, { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    try {
      if (navigator.share) { await navigator.share({ title: "Erendira's Boutique", text: text, url: url }); return; }
      await navigator.clipboard.writeText(text + '\n' + url);
      setSharedId(ev.id);
      setTimeout(function () { setSharedId(null); }, 1800);
    } catch (e) {}
  }

  function Actions(ev, isLive, big) {
    const links = eventLinks(ev, origin, t);
    return (
      <div className="ebl-actions" onClick={function (e) { e.stopPropagation(); }}>
        {isLive && <a className={'ebp-btn small'} href={links.watch} target="_blank" rel="noopener noreferrer">{t.watch}</a>}
        {!isLive && (
          <button className={big ? 'ebp-btn small' : 'ebp-btn quiet small'} type="button"
            onClick={function () { setOpenMenu(openMenu === ev.id ? null : ev.id); }} aria-expanded={openMenu === ev.id}>
            {t.addCal}
          </button>
        )}
        <button className="ebp-btn quiet small" type="button" onClick={function () { share(ev); }}>
          {sharedId === ev.id ? t.shared : t.share}
        </button>
        {openMenu === ev.id && (
          <div className="ebl-menu" role="menu">
            <button type="button" role="menuitem" onClick={function () { downloadIcs(ev); setOpenMenu(null); }}>{t.apple}</button>
            <a role="menuitem" href={links.google} target="_blank" rel="noopener noreferrer" onClick={function () { setOpenMenu(null); }}>{t.google}</a>
          </div>
        )}
      </div>
    );
  }

  const next = events[0];
  const rest = events.slice(1);

  function isLiveNow(ev) {
    const s = new Date(ev.starts_at).getTime();
    return now >= s && now < s + (ev.duration_minutes || 90) * 60000;
  }

  function countdown(ev) {
    const mins = Math.round((new Date(ev.starts_at).getTime() - now) / 60000);
    if (mins <= 0 || mins > 48 * 60) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return t.starts + ' ' + (h ? h + 'h ' : '') + m + ' ' + t.min;
  }

  return (
    <main className="ebp">
      <style>{publicCss + css}</style>
      <div className="ebp-wrap">
        <div className="ebp-top">
          <a href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SRC} alt="Erendira&#8217;s Boutique" className="ebp-logo" />
          </a>
          <div className="ebp-langs" role="group" aria-label="Language">
            {['en', 'es'].map(function (l) {
              return <button key={l} type="button" className={lang === l ? 'on' : ''} onClick={function () { setLang(l); }}>{l.toUpperCase()}</button>;
            })}
          </div>
        </div>

        <div className="ebp-card glow">
          <p className="ebp-eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p className="ebp-sub" style={{ marginBottom: next ? 18 : 0 }}>{t.sub}</p>

          {!next ? (
            <div className="ebp-msg">{t.none}</div>
          ) : (
            <div className="ebl-hero">
              <p className="ebp-lb">{isLiveNow(next) ? '' : t.next}</p>
              {mounted && isLiveNow(next) && <span className="ebl-now">{t.liveNow}</span>}
              <p className="ebl-title">{next.title}</p>
              <p className="ebl-when">
                {mounted
                  ? new Date(next.starts_at).toLocaleString(loc, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
                  : '\u00a0'}
              </p>
              <p className="ebl-meta">{t.platforms[next.platform] || ''}</p>
              {mounted && countdown(next) && <p className="ebl-count">{countdown(next)}</p>}
              {next.description && <p className="ebl-desc">{next.description}</p>}
              {mounted && Actions(next, isLiveNow(next), true)}
            </div>
          )}
        </div>

        {rest.length > 0 && <p className="ebl-section">{t.later}</p>}
        <div className="ebl-list">
          {rest.map(function (ev) {
            const d = new Date(ev.starts_at);
            const live = mounted && isLiveNow(ev);
            return (
              <div className="ebl-item" key={ev.id}>
                <div className="ebl-date" aria-hidden="true">
                  <span className="m">{mounted ? d.toLocaleDateString(loc, { month: 'short' }) : ''}</span>
                  <span className="d">{mounted ? d.getDate() : ''}</span>
                  <span className="w">{mounted ? d.toLocaleDateString(loc, { weekday: 'short' }) : ''}</span>
                </div>
                <div className="ebl-body">
                  {live && <span className="ebl-now">{t.liveNow}</span>}
                  <p className="ebl-title">{ev.title}</p>
                  <p className="ebl-meta">
                    {mounted ? d.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) : ''}
                    {' \u00b7 '}{t.platforms[ev.platform] || ''}
                  </p>
                  {ev.description && <p className="ebl-desc">{ev.description}</p>}
                  {mounted && Actions(ev, live, false)}
                </div>
              </div>
            );
          })}
        </div>

        <p className="ebp-foot">
          <a href="/buy-gift-card">{t.gift}</a>
        </p>
      </div>
    </main>
  );
}
