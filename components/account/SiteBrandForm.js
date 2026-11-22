'use client';

// components/account/SiteBrandForm.js
// "Your brand on every site": the logo, colors and season that the customer
// portal, shipping portal and tracker all load from /brand/.
// Saves to /api/admin/settings as { key: "site_brand", value }.

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULTS = {
  logo_url: '/brand/default-logo.png',
  cream: '#F5F3EF',
  taupe: '#957f67',
  sand: '#cfbda9',
  ink: '#5F4E3D',
  season: 'fall',
};

const SEASONS = [
  { value: 'everyday', label: 'Everyday' },
  { value: 'fall', label: 'Fall' },
  { value: 'christmas', label: 'Christmas' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

const css = '' +
'.esb-colors { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:12px; }' +
'.esb-color { display:flex; align-items:center; gap:10px; }' +
'.esb-color input[type=color] { width:44px; height:44px; padding:0; border:1px solid var(--line, #e6dccf); border-radius:50%; background:none; cursor:pointer; flex:none; }' +
'.esb-color input[type=color]::-webkit-color-swatch-wrapper { padding:0; }' +
'.esb-color input[type=color]::-webkit-color-swatch { border:0; border-radius:50%; }' +
'.esb-color .eba-in { text-transform:lowercase; }' +
'.esb-hint { margin:6px 0 0; font-size:12.5px; line-height:1.45; color:#8d7c69; }' +
'.esb-logo { display:flex; align-items:center; gap:14px; flex-wrap:wrap; }' +
'.esb-logo-box { width:150px; height:70px; border-radius:14px; display:grid; place-items:center; padding:8px; }' +
'.esb-logo-box img { max-width:100%; max-height:100%; object-fit:contain; }' +
'.esb-file { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }' +
'.esb-link { margin-top:10px; }' +
'.esb-site { border-radius:20px; padding:18px; display:flex; flex-direction:column; gap:12px; }' +
'.esb-site-top { display:flex; align-items:center; justify-content:space-between; }' +
'.esb-site-top img { height:38px; width:auto; }' +
'.esb-site-card { border-radius:16px; background:#fff; padding:14px; display:flex; flex-direction:column; gap:8px; }' +
'.esb-site-h { margin:0; font-family:var(--font-heading); font-size:22px; line-height:1.1; }' +
'.esb-site-p { margin:0; font-size:13px; line-height:1.45; }' +
'.esb-site-chip { align-self:flex-start; padding:4px 10px; border-radius:999px; font-size:12px; }' +
'.esb-site-bar { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:5px; }' +
'.esb-site-bar span { height:5px; border-radius:3px; }' +
'.esb-site-btn { text-align:center; padding:11px; border-radius:999px; color:#fff; font-size:14px; }' +
'.esb-where { margin:12px 0 0; font-size:12.5px; line-height:1.5; color:#8d7c69; }' +
'@media (max-width:560px) { .esb-colors { grid-template-columns:1fr; } }';

export default function SiteBrandForm(props) {
  const router = useRouter();
  const [form, setForm] = useState({ ...DEFAULTS, ...(props.initial || {}) });
  const [preview, setPreview] = useState(''); // local preview of a just-uploaded file
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [logoBroken, setLogoBroken] = useState(false);

  function updateForm(field, value) {
    setForm(function (current) { return { ...current, [field]: value }; });
    setMessage('');
    if (field === 'logo_url') { setLogoBroken(false); setPreview(''); }
  }

  function color(field) {
    return HEX.test(form[field]) ? form[field] : DEFAULTS[field];
  }

  // What the preview shows: a fresh upload, the saved logo, or a pasted link.
  function logoSrc() {
    if (preview) return preview;
    const v = form.logo_url || DEFAULTS.logo_url;
    if (v.indexOf('storage:') === 0) return '/brand/logo.png?v=' + encodeURIComponent(v);
    return v;
  }

  async function upload(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/brand-logo', { method: 'POST', body: body });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || 'Could not upload the logo.');
      setForm(function (current) { return { ...current, logo_url: data.logo_url }; });
      setPreview(URL.createObjectURL(file));
      setLogoBroken(false);
      setMessage('Logo uploaded. Press Save to use it on every site.');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'site_brand', value: form }),
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || 'Could not save.');
      setForm({ ...DEFAULTS, ...data.setting.value });
      setMessage('Saved. Every site will show it within a few minutes.');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setForm({ ...DEFAULTS });
    setPreview('');
    setLogoBroken(false);
    setMessage('Back to the original logo and colors. Press Save to keep them.');
  }

  function ColorField(p) {
    return (
      <div>
        <span className="eba-lb">{p.label}</span>
        <div className="esb-color">
          <input type="color" value={color(p.field)} onChange={function (e) { updateForm(p.field, e.target.value); }} aria-label={p.label} />
          <input className="eba-in" value={form[p.field]} maxLength={7} aria-label={p.label + ' hex code'} onChange={function (e) { updateForm(p.field, e.target.value); }} />
        </div>
        <p className="esb-hint">{p.hint}</p>
      </div>
    );
  }

  const linkValue = form.logo_url && form.logo_url.indexOf('storage:') === 0 ? '' : form.logo_url;

  return (
    <>
      <style>{css}</style>

      <div className="eba-cols wide-left">
        <form className="eba-panel" onSubmit={save}>
          <div className="eba-panelhead">
            <div>
              <p className="eba-eyebrow">EVERY SITE</p>
              <h2>Your brand on every site</h2>
            </div>
            <button className="eba-btn mini" type="button" onClick={reset}>Reset</button>
          </div>

          <div className="eba-field">
            <span className="eba-lb">Logo</span>
            <div className="esb-logo">
              <div className="esb-logo-box" style={{ background: color('cream') }}>
                {!logoBroken ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoSrc()} alt="Current logo" onError={function () { setLogoBroken(true); }} />
                ) : (
                  <span style={{ fontSize: 12, color: '#8d7c69' }}>Logo not found</span>
                )}
              </div>
              <label className="eba-btn" style={{ cursor: uploading ? 'wait' : 'pointer' }}>
                {uploading ? 'Uploading...' : 'Upload a new logo'}
                <input className="esb-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} disabled={uploading} />
              </label>
            </div>
            <p className="esb-hint">PNG with a see-through background works best, about 900px wide. Up to 3 MB.</p>
            <input
              className="eba-in esb-link"
              value={linkValue}
              onChange={function (e) { updateForm('logo_url', e.target.value); }}
              placeholder="…or paste a link: https://… or /file.png"
              aria-label="Logo link"
            />
          </div>

          <div className="esb-colors">
            {ColorField({ label: 'Background', field: 'cream', hint: 'Page backgrounds' })}
            {ColorField({ label: 'Main color', field: 'taupe', hint: 'Buttons, headings, highlights' })}
            {ColorField({ label: 'Accent', field: 'sand', hint: 'Lines, borders, progress bars' })}
            {ColorField({ label: 'Text', field: 'ink', hint: 'Body text (keep it dark so it’s easy to read)' })}
          </div>

          <div className="eba-field" style={{ marginTop: 12 }}>
            <span className="eba-lb">Season</span>
            <select className="eba-in" value={form.season} onChange={function (e) { updateForm('season', e.target.value); }}>
              {SEASONS.map(function (s) { return <option key={s.value} value={s.value}>{s.label}</option>; })}
            </select>
            <p className="esb-hint">Saved for seasonal touches like the Christmas snow and lights. It doesn&rsquo;t change anything on its own yet.</p>
          </div>

          <div className="eba-actions">
            <button className="eba-btn eba-btn-dark" type="submit" disabled={saving || uploading}>
              {saving ? 'Saving...' : 'Save for every site'}
            </button>
          </div>

          {error && <div className="eba-err">{error}</div>}
          {message && <div className="eba-notice">{message}</div>}
        </form>

        <aside className="eba-panel">
          <p className="eba-eyebrow">PREVIEW</p>
          <h2>How your sites will look</h2>

          <div className="esb-site" style={{ background: color('cream'), color: color('ink') }}>
            <div className="esb-site-top">
              {!logoBroken ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc()} alt="" />
              ) : <span />}
              <span className="esb-site-chip" style={{ background: '#fff', color: color('ink') }}>ES</span>
            </div>
            <div className="esb-site-card">
              <span className="esb-site-chip" style={{ background: color('taupe'), color: '#fff' }}>On the way</span>
              <p className="esb-site-h" style={{ color: color('ink') }}>Your package is on the way</p>
              <div className="esb-site-bar">
                <span style={{ background: color('taupe') }} />
                <span style={{ background: color('taupe') }} />
                <span style={{ background: color('taupe') }} />
                <span style={{ background: color('sand') }} />
              </div>
              <p className="esb-site-p" style={{ color: color('ink') }}>Order #2441 · Shipped Nov 21</p>
            </div>
            <span className="esb-site-btn" style={{ background: color('taupe') }}>Track package</span>
          </div>

          <p className="esb-where">
            Used by my.erendirasboutique.com, the shipping portal and the tracking page. Changes show within a few minutes.
          </p>
          {logoBroken && <div className="eba-err">That logo didn&rsquo;t load. Check the link or upload the file.</div>}
        </aside>
      </div>
    </>
  );
}
