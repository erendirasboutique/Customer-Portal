'use client';

// components/LiveLinkAdmin.js
// One field. Paste the link after the live ends, hit save, done.
//
// Renders inside AdminShell, so it uses the same .eba-* design system as the
// dashboard — floating cream canvas, white cards, pill controls.
//
// No auth plumbing here — /api/live-link checks the Supabase session cookie
// server-side, and cookies ride along with fetch automatically.

import { useCallback, useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { describeAge, isStale } from '@/lib/liveLink';

const T = {
  en: {
    eyebrow: 'ADMIN STUDIO',
    title: 'Live Link',
    sub: 'Point live.erendirasboutique.com at this week\u2019s Facebook video.',
    heroLabel: 'Status',
    lastUpdated: 'Last updated',
    lastUpdatedCap: 'Since the link changed',
    never: 'Never',
    publicLink: 'Public link',
    publicLinkCap: 'What customers open',
    statusWord: 'Link status',
    statusCap: 'Fresh links point at tonight\u2019s live',
    statusFresh: 'Current',
    statusStale: 'Check this',
    statusNone: 'Not set',
    paste: 'PASTE IT HERE',
    pasteTitle: 'This Week\u2019s Video',
    label: 'Facebook video link',
    placeholder: 'https://www.facebook.com/...',
    save: 'Save link',
    saving: 'Saving...',
    savedBtn: 'Saved',
    test: 'Test redirect',
    loading: 'Loading...',
    byLine: 'Set by',
    notes: 'GOOD TO KNOW',
    notesTitle: 'How This Works',
    howItWorks: 'The redirect',
    howBody: 'Customers open live.erendirasboutique.com and land wherever this points. Paste the new video link after each live and they follow along automatically.',
    reminder: 'One thing to watch',
    reminderBody: 'The video has to be set to Public on Facebook. Friends-only videos hit a login wall for customers who are not your friends.',
    fallback: 'If nothing is set',
    fallbackBody: 'Visitors go to the boutique Facebook page instead of an error screen.',
    staleNote: 'This link is more than a week old, so it is probably from last week\u2019s live.',
    noneNote: 'No link set yet. Paste one below.',
    tipLabel: 'Quick tip',
    tipBody: 'Update this right after the live ends \u2014 customers keep opening the short link for days.',
  },
  es: {
    eyebrow: 'ADMIN STUDIO',
    title: 'Enlace en Vivo',
    sub: 'Apunta live.erendirasboutique.com al video de Facebook de esta semana.',
    heroLabel: 'Estado',
    lastUpdated: 'Actualizado',
    lastUpdatedCap: 'Desde el \u00faltimo cambio',
    never: 'Nunca',
    publicLink: 'Enlace p\u00fablico',
    publicLinkCap: 'Lo que abren las clientas',
    statusWord: 'Estado del enlace',
    statusCap: 'Al d\u00eda significa que apunta al live de hoy',
    statusFresh: 'Al d\u00eda',
    statusStale: 'Rev\u00edsalo',
    statusNone: 'Sin definir',
    paste: 'P\u00c9GALO AQU\u00cd',
    pasteTitle: 'El Video de Esta Semana',
    label: 'Enlace del video de Facebook',
    placeholder: 'https://www.facebook.com/...',
    save: 'Guardar enlace',
    saving: 'Guardando...',
    savedBtn: 'Guardado',
    test: 'Probar enlace',
    loading: 'Cargando...',
    byLine: 'Puesto por',
    notes: 'PARA SABER',
    notesTitle: 'C\u00f3mo Funciona',
    howItWorks: 'El redirecci\u00f3n',
    howBody: 'Las clientas abren live.erendirasboutique.com y llegan a donde apunte esto. Pega el enlace nuevo despu\u00e9s de cada live y todo se actualiza solo.',
    reminder: 'Importante',
    reminderBody: 'El video tiene que estar en P\u00fablico en Facebook. Los videos solo para amigos les piden iniciar sesi\u00f3n a las clientas.',
    fallback: 'Si no hay nada',
    fallbackBody: 'Las visitas van a la p\u00e1gina de Facebook de la boutique en vez de ver un error.',
    staleNote: 'Este enlace tiene m\u00e1s de una semana, seguramente es del live pasado.',
    noneNote: 'A\u00fan no hay enlace. Pega uno abajo.',
    tipLabel: 'Tip r\u00e1pido',
    tipBody: 'Actual\u00edzalo apenas termine el live \u2014 las clientas siguen abriendo el enlace corto por d\u00edas.',
  },
};

const dateLocale = { en: 'en-US', es: 'es-MX' };

const pageCss = '' +
'.ebl-stale b { color:#a8702f; }' +
'.ebl-none b { color:#bda891; }' +
'.ebl-host { font-size:20px !important; word-break:break-all; }' +
'.ebl-by { margin:14px 2px 0; font-size:11.5px; color:#bda891; }' +
'@media (max-width:560px) { .ebl-toolbar .eba-btn { flex:1; } }';

export default function LiveLinkAdmin({ admin }) {
  const [lang, setLang] = useState(admin?.language === 'es' ? 'es' : 'en');
  const t = T[lang];

  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [updatedBy, setUpdatedBy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(function () {
    const stored = localStorage.getItem('eb-lang');
    if (stored === 'en' || stored === 'es') setLang(stored);
  }, []);

  const load = useCallback(async function () {
    try {
      const res = await fetch('/api/live-link', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load the current link.');

      setValue(data.url || '');
      setSaved(data.url || '');
      setUpdatedAt(data.updated_at);
      setUpdatedBy(data.updated_by);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(function () { load(); }, [load]);

  const dirty = value.trim() !== (saved ?? '').trim();

  async function save() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/live-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the link.');

      setValue(data.url);
      setSaved(data.url);
      setUpdatedAt(data.updated_at);
      setUpdatedBy(data.updated_by);
      setJustSaved(true);
      setTimeout(function () { setJustSaved(false); }, 2600);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!saving && dirty) save();
    }
  }

  const stale = isStale(updatedAt);
  const age = describeAge(updatedAt);
  const todayLine = new Date().toLocaleDateString(dateLocale[lang], { weekday: 'long', month: 'long', day: 'numeric' });

  let statusWord = t.statusFresh;
  let statClass = '';
  if (!updatedAt) { statusWord = t.statusNone; statClass = 'ebl-none'; }
  else if (stale) { statusWord = t.statusStale; statClass = 'ebl-stale'; }

  const notice = !updatedAt ? t.noneNote : (stale ? t.staleNote : null);

  return (
    <AdminShell
      admin={admin}
      active="live-link"
      lang={lang}
      onLang={setLang}
      eyebrow={t.eyebrow}
      title={t.title}
      subtitle={t.sub}
      heroStat={{ label: t.heroLabel, value: loading ? '\u2014' : statusWord, caption: todayLine }}
      tip={{ label: t.tipLabel, body: t.tipBody }}
    >
      <style>{pageCss}</style>

      {loading ? (
        <div className="eba-panel"><div className="eba-empty">{t.loading}</div></div>
      ) : (
        <>
          <section className="eba-stats" aria-label="Live link summary">
            <div className={'eba-stat ' + statClass}>
              <span className="lb">{t.lastUpdated}</span>
              <b>{updatedAt ? age : t.never}</b>
              <span className="cap">{t.lastUpdatedCap}</span>
            </div>
            <div className={'eba-stat ' + statClass}>
              <span className="lb">{t.statusWord}</span>
              <b>{statusWord}</b>
              <span className="cap">{t.statusCap}</span>
            </div>
            <div className="eba-stat">
              <span className="lb">{t.publicLink}</span>
              <b className="ebl-host">live.erendirasboutique.com</b>
              <span className="cap">{t.publicLinkCap}</span>
            </div>
          </section>

          <div className="eba-panel">
            <p className="eba-eyebrow">{t.paste}</p>
            <h2>{t.pasteTitle}</h2>

            <div className="eba-toolbar ebl-toolbar">
              <label className="eba-search">
                <input
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck="false"
                  aria-label={t.label}
                  placeholder={t.placeholder}
                  value={value}
                  onChange={function (e) { setValue(e.target.value); }}
                  onKeyDown={onKeyDown}
                  disabled={saving}
                />
              </label>

              <button className="eba-btn eba-btn-dark" onClick={save} disabled={saving || !dirty}>
                {saving ? t.saving : justSaved ? t.savedBtn : t.save}
              </button>

              {saved && <a className="eba-btn" href="/live" target="_blank" rel="noreferrer">{t.test}</a>}
            </div>

            {error && <div className="eba-err">{error}</div>}
            {!error && notice && <div className="eba-notice">{notice}</div>}
            {updatedBy && <p className="ebl-by">{t.byLine} {updatedBy}</p>}
          </div>

          <div className="eba-panel">
            <p className="eba-eyebrow">{t.notes}</p>
            <h2>{t.notesTitle}</h2>
            <div className="eba-cells">
              <div className="eba-cell">
                <span className="lb">{t.howItWorks}</span>
                {t.howBody}
              </div>
              <div className="eba-cell">
                <span className="lb">{t.reminder}</span>
                {t.reminderBody}
              </div>
              <div className="eba-cell">
                <span className="lb">{t.fallback}</span>
                {t.fallbackBody}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
