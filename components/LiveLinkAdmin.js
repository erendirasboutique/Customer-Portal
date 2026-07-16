'use client';

// components/LiveLinkAdmin.js
// One field. Paste the link after the live ends, hit save, done.
//
// Renders inside AdminShell, so it uses the same .eba-* design system as the
// dashboard — espresso sidebar, ruled header, stat strip, pill controls.
//
// No auth plumbing here — /api/live-link checks the Supabase session cookie
// server-side, and cookies ride along with fetch automatically.

import { useCallback, useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { describeAge, isStale } from '@/lib/liveLink';

const T = {
  en: {
    title: 'Live link',
    lastUpdated: 'Last updated',
    never: 'Never',
    publicLink: 'Public link',
    statusFresh: 'Current',
    statusStale: 'Check this',
    statusNone: 'Not set',
    label: 'Facebook video link',
    placeholder: 'https://www.facebook.com/...',
    save: 'Save link',
    saving: 'Saving...',
    savedBtn: 'Saved',
    test: 'Test redirect',
    loading: 'Loading...',
    byLine: 'Set by',
    howItWorks: 'How it works',
    howBody: 'Customers open live.erendirasboutique.com and land wherever this points. Paste the new video link after each live and they follow along automatically.',
    reminder: 'One thing to watch',
    reminderBody: 'The video has to be set to Public on Facebook. Friends-only videos hit a login wall for customers who are not your friends.',
    fallback: 'If nothing is set',
    fallbackBody: 'Visitors go to the boutique Facebook page instead of an error screen.',
    staleNote: 'This link is more than a week old, so it is probably from last week\u2019s live.',
    noneNote: 'No link set yet. Paste one below.',
  },
  es: {
    title: 'Enlace en vivo',
    lastUpdated: 'Actualizado',
    never: 'Nunca',
    publicLink: 'Enlace p\u00fablico',
    statusFresh: 'Al d\u00eda',
    statusStale: 'Rev\u00edsalo',
    statusNone: 'Sin definir',
    label: 'Enlace del video de Facebook',
    placeholder: 'https://www.facebook.com/...',
    save: 'Guardar enlace',
    saving: 'Guardando...',
    savedBtn: 'Guardado',
    test: 'Probar enlace',
    loading: 'Cargando...',
    byLine: 'Puesto por',
    howItWorks: 'C\u00f3mo funciona',
    howBody: 'Las clientas abren live.erendirasboutique.com y llegan a donde apunte esto. Pega el enlace nuevo despu\u00e9s de cada live y todo se actualiza solo.',
    reminder: 'Importante',
    reminderBody: 'El video tiene que estar en P\u00fablico en Facebook. Los videos solo para amigos les piden iniciar sesi\u00f3n a las clientas.',
    fallback: 'Si no hay nada',
    fallbackBody: 'Las visitas van a la p\u00e1gina de Facebook de la boutique en vez de ver un error.',
    staleNote: 'Este enlace tiene m\u00e1s de una semana, seguramente es del live pasado.',
    noneNote: 'A\u00fan no hay enlace. Pega uno abajo.',
  },
};

const dateLocale = { en: 'en-US', es: 'es-MX' };

const extraCss = '' +
'.ebl-stat-stale b { color: #a8702f; }' +
'.ebl-stat-none b { color: #a08a71; }' +
'.ebl-host { font-size: 19px !important; }' +
'.ebl-err { margin-top: 14px; background: #f7e3e0; border-radius: 12px; padding: 11px 15px; font-size: 12.5px; color: #a03535; }' +
'.ebl-cells { margin-top: 24px; }' +
'.ebl-by { margin: 14px 2px 0; font-size: 11px; color: #a08a71; }' +
'@media (max-width: 760px) { .ebl-toolbar .eba-btn { flex: 1; text-align: center; } }';

export default function LiveLinkAdmin({ admin }) {
  const [lang, setLangState] = useState(admin?.language === 'es' ? 'es' : 'en');
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
    if (stored === 'en' || stored === 'es') setLangState(stored);
  }, []);

  function setLang(l) {
    setLangState(l);
    localStorage.setItem('eb-lang', l);
    document.documentElement.lang = l;
  }

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

  const dirty = value.trim() !== (saved ?? '').trim();
  const stale = isStale(updatedAt);
  const age = describeAge(updatedAt);
  const todayLine = new Date().toLocaleDateString(dateLocale[lang], { weekday: 'long', month: 'long', day: 'numeric' });

  let statusWord = t.statusFresh;
  let statClass = '';
  if (!updatedAt) { statusWord = t.statusNone; statClass = 'ebl-stat-none'; }
  else if (stale) { statusWord = t.statusStale; statClass = 'ebl-stat-stale'; }

  const notice = !updatedAt ? t.noneNote : (stale ? t.staleNote : null);

  return (
    <AdminShell
      admin={admin}
      active="live-link"
      lang={lang}
      onLang={setLang}
      title={t.title}
      subtitle={todayLine}
    >
      <style>{extraCss}</style>

      {loading ? (
        <div className="eba-notice">{t.loading}</div>
      ) : (
        <>
          <section className="eba-stats" aria-label="Live link summary">
            <div className={'eba-stat ' + statClass}>
              <b>{updatedAt ? age : t.never}</b>
              <span>{t.lastUpdated}</span>
            </div>
            <div className={'eba-stat ' + statClass}>
              <b>{statusWord}</b>
              <span>{t.title}</span>
            </div>
            <div className="eba-stat">
              <b className="ebl-host">live.erendirasboutique.com</b>
              <span>{t.publicLink}</span>
            </div>
          </section>

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

            {saved && (
              <a className="eba-btn" href="/live" target="_blank" rel="noreferrer">{t.test}</a>
            )}
          </div>

          {error && <div className="ebl-err">{error}</div>}
          {!error && notice && <div className="eba-notice">{notice}</div>}

          {updatedBy && <p className="ebl-by">{t.byLine} {updatedBy}</p>}

          <div className="eba-detail-grid ebl-cells">
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
        </>
      )}
    </AdminShell>
  );
}
