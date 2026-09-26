'use client';

// components/account/SettingsSection.js
// A generic settings panel: pass the section key, its fields and the
// saved values. Saves to /api/admin/settings as { key, value }.
//
// fields: [{ name, label, type?: 'text'|'email'|'tel'|'url'|'textarea'|'select', options?, placeholder?, half? }]

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsSection(props) {
  const router = useRouter();
  const [form, setForm] = useState(props.initial || {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateForm(field, value) {
    setForm(function (current) { return { ...current, [field]: value }; });
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
        body: JSON.stringify({ key: props.sectionKey, value: form }),
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || 'Could not save.');
      setForm(data.setting.value);
      setMessage('Saved.');
      router.refresh();
      setTimeout(function () { setMessage(''); }, 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function renderInput(f) {
    const value = form[f.name] ?? '';
    const onChange = function (e) { updateForm(f.name, e.target.value); };

    if (f.type === 'textarea') {
      return <textarea className="eba-in" rows={3} value={value} maxLength={500} placeholder={f.placeholder} onChange={onChange} />;
    }
    if (f.type === 'select') {
      return (
        <select className="eba-in" value={value} onChange={onChange}>
          {f.options.map(function (o) {
            return <option key={o.value} value={o.value}>{o.label}</option>;
          })}
        </select>
      );
    }
    return <input className="eba-in" type={f.type || 'text'} value={value} maxLength={500} placeholder={f.placeholder} onChange={onChange} />;
  }

  // Pair up fields marked half: true into two-column rows.
  const groups = [];
  props.fields.forEach(function (f) {
    const last = groups[groups.length - 1];
    if (f.half && last && last.length === 1 && last[0].half) last.push(f);
    else groups.push([f]);
  });

  return (
    <form className="eba-panel" onSubmit={save}>
      <div className="eba-panelhead">
        <div>
          <p className="eba-eyebrow">{props.eyebrow}</p>
          <h2>{props.title}</h2>
        </div>
      </div>

      {props.intro && <p className="eba-muted" style={{ margin: '-6px 0 16px' }}>{props.intro}</p>}

      {groups.map(function (g, i) {
        const style = i ? { marginTop: 12 } : undefined;
        if (g.length === 2) {
          return (
            <div className="eba-formrow even" key={g[0].name} style={style}>
              {g.map(function (f) {
                return (
                  <div key={f.name}>
                    <span className="eba-lb">{f.label}</span>
                    {renderInput(f)}
                  </div>
                );
              })}
            </div>
          );
        }
        return (
          <div key={g[0].name} style={style}>
            <span className="eba-lb">{g[0].label}</span>
            {renderInput(g[0])}
          </div>
        );
      })}

      <div className="eba-actions">
        <button className="eba-btn eba-btn-dark" type="submit" disabled={saving}>
          {saving ? 'Saving...' : props.saveLabel || 'Save'}
        </button>
      </div>

      {error && <div className="eba-err">{error}</div>}
      {message && <div className="eba-notice">{message}</div>}
    </form>
  );
}
