'use client';

// components/account/BrandingForm.js
// Brand settings with a live checkout-page preview.
// Saves to /api/admin/settings as { key: "branding", value }.

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULTS = {
  logo_url: '',
  brand_color: '#eda033',
  accent_color: '#da5e16',
  button_text_color: '#ffffff',
  checkout_headline: 'Thank you for shopping with us',
  checkout_message: '',
  support_email: '',
};

const HEX = /^#[0-9a-fA-F]{6}$/;

const pageCss = '' +
'.eab-color { display:flex; align-items:center; gap:10px; }' +
'.eab-color input[type=color] { width:44px; height:44px; padding:0; border:1px solid var(--line); border-radius:50%;' +
'  background:none; cursor:pointer; flex-shrink:0; overflow:hidden; }' +
'.eab-color input[type=color]::-webkit-color-swatch-wrapper { padding:0; }' +
'.eab-color input[type=color]::-webkit-color-swatch { border:0; border-radius:50%; }' +
'.eab-color .eba-in { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; text-transform:lowercase; }' +
'.eab-colors { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:12px; }' +
'.eab-preview { border:1px solid var(--line); border-radius:24px; overflow:hidden; background:#fff; }' +
'.eab-pbar { height:8px; }' +
'.eab-pbody { padding:26px 24px 24px; text-align:center; }' +
'.eab-plogo { max-width:150px; max-height:60px; object-fit:contain; display:block; margin:0 auto 16px; }' +
'.eab-pname { margin:0 0 14px; font-size:11px; letter-spacing:.24em; text-transform:uppercase; }' +
'.eab-pcheck { width:46px; height:46px; border-radius:50%; margin:0 auto 14px; display:flex; align-items:center;' +
'  justify-content:center; font-size:22px; }' +
'.eab-phead { margin:0; font-size:26px; line-height:1.1; font-family:"La Luxes Serif","Recoleta",Georgia,serif; font-weight:400; }' +
'.eab-pmsg { margin:10px auto 0; max-width:300px; font-size:13px; line-height:1.5; color:#6b6b6b; white-space:pre-line; }' +
'.eab-pbtn { display:inline-block; margin-top:18px; border-radius:999px; padding:11px 22px; font-size:12.5px; border:0; }' +
'.eab-psupport { margin:16px 0 0; font-size:11.5px; color:#8a8a8a; }' +
'@media (max-width:560px) { .eab-colors { grid-template-columns:1fr; } }';

export default function BrandingForm(props) {
  const router = useRouter();
  const [form, setForm] = useState({ ...DEFAULTS, ...(props.initial || {}) });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [logoBroken, setLogoBroken] = useState(false);

  function updateForm(field, value) {
    setForm(function (current) { return { ...current, [field]: value }; });
    if (field === 'logo_url') setLogoBroken(false);
  }

  function color(field) {
    return HEX.test(form[field]) ? form[field] : DEFAULTS[field];
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
        body: JSON.stringify({ key: 'branding', value: form }),
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || 'Could not save branding.');
      setForm({ ...DEFAULTS, ...data.setting.value });
      setMessage('Branding saved.');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setForm({ ...DEFAULTS });
    setMessage('Colors and text reset. Save to keep them.');
  }

  function ColorField(p) {
    return (
      <div>
        <span className="eba-lb">{p.label}</span>
        <div className="eab-color">
          <input type="color" value={color(p.field)} onChange={function (e) { updateForm(p.field, e.target.value); }} aria-label={p.label} />
          <input className="eba-in" value={form[p.field]} maxLength={7} onChange={function (e) { updateForm(p.field, e.target.value); }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{pageCss}</style>

      <div className="eba-cols wide-left">
        <form className="eba-panel" onSubmit={save}>
          <div className="eba-panelhead">
            <div>
              <p className="eba-eyebrow">START HERE</p>
              <h2>Your Brand</h2>
            </div>
            <button className="eba-btn mini" type="button" onClick={reset}>Reset</button>
          </div>

          <div className="eba-field">
            <span className="eba-lb">Logo URL</span>
            <input
              className="eba-in"
              value={form.logo_url}
              onChange={function (e) { updateForm('logo_url', e.target.value); }}
              placeholder="/logo.png or https://..."
            />
          </div>

          <div className="eab-colors">
            {ColorField({ label: 'Brand color', field: 'brand_color' })}
            {ColorField({ label: 'Accent / text', field: 'accent_color' })}
            {ColorField({ label: 'Button text', field: 'button_text_color' })}
          </div>

          <div className="eba-field" style={{ marginTop: 12 }}>
            <span className="eba-lb">Thank-you headline</span>
            <input className="eba-in" value={form.checkout_headline} maxLength={120} onChange={function (e) { updateForm('checkout_headline', e.target.value); }} />
          </div>

          <div className="eba-field" style={{ marginTop: 12 }}>
            <span className="eba-lb">Thank-you message (optional)</span>
            <textarea
              className="eba-in"
              rows={3}
              value={form.checkout_message}
              maxLength={500}
              onChange={function (e) { updateForm('checkout_message', e.target.value); }}
              placeholder="Your order is being prepared. We'll text you when it ships."
            />
          </div>

          <div className="eba-field" style={{ marginTop: 12 }}>
            <span className="eba-lb">Customer support email</span>
            <input className="eba-in" type="email" value={form.support_email} onChange={function (e) { updateForm('support_email', e.target.value); }} placeholder="hello@erendirasboutique.com" />
          </div>

          <div className="eba-actions">
            <button className="eba-btn eba-btn-dark" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save branding'}
            </button>
          </div>

          {error && <div className="eba-err">{error}</div>}
          {message && <div className="eba-notice">{message}</div>}
        </form>

        <aside className="eba-panel">
          <p className="eba-eyebrow">PREVIEW</p>
          <h2>After Checkout</h2>

          <div className="eab-preview">
            <div className="eab-pbar" style={{ background: color('brand_color') }} />
            <div className="eab-pbody">
              {form.logo_url && !logoBroken ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="eab-plogo" src={form.logo_url} alt="" onError={function () { setLogoBroken(true); }} />
              ) : (
                <p className="eab-pname" style={{ color: color('accent_color') }}>Erendira&rsquo;s Boutique</p>
              )}
              <div className="eab-pcheck" style={{ background: color('brand_color'), color: color('button_text_color') }}>&#10003;</div>
              <p className="eab-phead" style={{ color: color('accent_color') }}>{form.checkout_headline || DEFAULTS.checkout_headline}</p>
              {form.checkout_message && <p className="eab-pmsg">{form.checkout_message}</p>}
              <span className="eab-pbtn" style={{ background: color('brand_color'), color: color('button_text_color') }}>
                Track my order
              </span>
              {form.support_email && <p className="eab-psupport">Questions? {form.support_email}</p>}
            </div>
          </div>

          {logoBroken && <div className="eba-err">That logo URL didn&rsquo;t load. Check the link.</div>}
        </aside>
      </div>
    </>
  );
}
