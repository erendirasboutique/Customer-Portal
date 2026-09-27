'use client';

// components/live/LiveScheduleManager.js
// Add / edit / hide / delete lives on /admin/live-schedule.
// Times are entered in this device's time zone (Pacific for you).

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PLATFORMS = [
  { value: 'facebook', label: 'Facebook Live' },
  { value: 'instagram', label: 'Instagram Live' },
  { value: 'tiktok', label: 'TikTok Live' },
  { value: 'in-store', label: 'In store' },
  { value: 'other', label: 'Other' },
];

const EMPTY = {
  id: null, title: '', when: '', duration_minutes: 90, platform: 'facebook',
  watch_url: '', description: '', is_published: true, repeat: 1,
};

function toLocalInput(iso) {
  const d = new Date(iso);
  const p = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
}

function label(iso) {
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function LiveScheduleManager(props) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const now = Date.now();
  const events = props.events || [];
  const upcoming = events.filter(function (e) { return new Date(e.starts_at).getTime() + e.duration_minutes * 60000 > now; });
  const past = events.filter(function (e) { return new Date(e.starts_at).getTime() + e.duration_minutes * 60000 <= now; }).reverse();

  function update(field, value) {
    setForm(function (f) { return { ...f, [field]: value }; });
    setError('');
  }

  async function call(method, body) {
    const res = await fetch('/api/admin/live-schedule', {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }

  async function save(e) {
    e.preventDefault();
    if (!form.when) { setError('Pick a date and time.'); return; }
    setBusy('save');
    setError('');
    setMessage('');
    try {
      const base = new Date(form.when);
      const payload = {
        title: form.title,
        duration_minutes: Number(form.duration_minutes),
        platform: form.platform,
        watch_url: form.watch_url,
        description: form.description,
        is_published: form.is_published,
      };
      if (form.id) {
        await call('PATCH', { ...payload, id: form.id, starts_at: base.toISOString() });
        setMessage('Live updated.');
      } else {
        const times = Math.max(1, Math.min(12, Number(form.repeat) || 1));
        for (let i = 0; i < times; i++) {
          const d = new Date(base);
          d.setDate(d.getDate() + 7 * i);
          await call('POST', { ...payload, starts_at: d.toISOString() });
        }
        setMessage(times > 1 ? 'Added ' + times + ' weekly lives.' : 'Live added.');
      }
      setForm(EMPTY);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  function edit(ev) {
    setForm({
      id: ev.id,
      title: ev.title,
      when: toLocalInput(ev.starts_at),
      duration_minutes: ev.duration_minutes,
      platform: ev.platform || 'facebook',
      watch_url: ev.watch_url || '',
      description: ev.description || '',
      is_published: ev.is_published,
      repeat: 1,
    });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function togglePublished(ev) {
    setBusy(ev.id);
    try {
      await call('PATCH', {
        id: ev.id, title: ev.title, starts_at: ev.starts_at, duration_minutes: ev.duration_minutes,
        platform: ev.platform, watch_url: ev.watch_url, description: ev.description, is_published: !ev.is_published,
      });
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  async function remove(ev) {
    if (!confirm('Delete "' + ev.title + '" on ' + label(ev.starts_at) + '?')) return;
    setBusy(ev.id);
    try {
      await call('DELETE', { id: ev.id });
      if (form.id === ev.id) setForm(EMPTY);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  function Row(ev, isPast) {
    const p = PLATFORMS.find(function (x) { return x.value === ev.platform; });
    const live = !isPast && new Date(ev.starts_at).getTime() <= now;
    const sub = [label(ev.starts_at), ev.duration_minutes + ' min', p ? p.label : null].filter(Boolean).join(' · ');
    return (
      <div className={!ev.is_published || isPast ? 'eba-row off' : 'eba-row'} key={ev.id}>
        <span className="eba-who">
          <span className="n">{ev.title}</span>
          <span className="s">{sub}</span>
          {ev.description && <span className="s">{ev.description}</span>}
        </span>
        <span className={live ? 'eba-pill ok' : ev.is_published ? 'eba-pill mid' : 'eba-pill off'}>
          {live ? 'Live now' : isPast ? 'Done' : ev.is_published ? 'Showing' : 'Hidden'}
        </span>
        {!isPast && (
          <span className="eba-rowbtns">
            <button className="eba-btn mini" type="button" disabled={busy === ev.id} onClick={function () { edit(ev); }}>Edit</button>
            <button className="eba-btn mini" type="button" disabled={busy === ev.id} onClick={function () { togglePublished(ev); }}>
              {ev.is_published ? 'Hide' : 'Show'}
            </button>
            <button className="eba-btn mini" type="button" disabled={busy === ev.id} onClick={function () { remove(ev); }}>Delete</button>
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="eba-cols wide-left">
        <form className="eba-panel" onSubmit={save}>
          <div className="eba-panelhead">
            <div>
              <p className="eba-eyebrow">{form.id ? 'EDITING' : 'START HERE'}</p>
              <h2>{form.id ? 'Edit Live' : 'Add a Live'}</h2>
            </div>
            {form.id && <button className="eba-btn mini" type="button" onClick={function () { setForm(EMPTY); }}>Cancel edit</button>}
          </div>

          <div className="eba-field">
            <span className="eba-lb">Title</span>
            <input className="eba-in" value={form.title} maxLength={120} required placeholder="Friday Night Fall Drop"
              onChange={function (e) { update('title', e.target.value); }} />
          </div>

          <div className="eba-formrow" style={{ marginTop: 12 }}>
            <div>
              <span className="eba-lb">Date &amp; time</span>
              <input className="eba-in" type="datetime-local" value={form.when} required
                onChange={function (e) { update('when', e.target.value); }} />
            </div>
            <div>
              <span className="eba-lb">Length (minutes)</span>
              <input className="eba-in" type="number" min="15" max="600" step="15" value={form.duration_minutes}
                onChange={function (e) { update('duration_minutes', e.target.value); }} />
            </div>
          </div>

          <div className="eba-formrow even" style={{ marginTop: 12 }}>
            <div>
              <span className="eba-lb">Where</span>
              <select className="eba-in" value={form.platform} onChange={function (e) { update('platform', e.target.value); }}>
                {PLATFORMS.map(function (p) { return <option key={p.value} value={p.value}>{p.label}</option>; })}
              </select>
            </div>
            <div>
              <span className="eba-lb">Watch link (optional)</span>
              <input className="eba-in" value={form.watch_url} placeholder="Leave blank to use your live link"
                onChange={function (e) { update('watch_url', e.target.value); }} />
            </div>
          </div>

          <div className="eba-field" style={{ marginTop: 12 }}>
            <span className="eba-lb">What&rsquo;s on (optional)</span>
            <textarea className="eba-in" rows={2} maxLength={600} value={form.description}
              placeholder="New fall sweaters, restocked denim, and a gift card giveaway"
              onChange={function (e) { update('description', e.target.value); }} />
          </div>

          <div className="eba-checks">
            <label className="eba-check">
              <input type="checkbox" checked={form.is_published} onChange={function (e) { update('is_published', e.target.checked); }} />
              <span>Show on the public schedule</span>
            </label>
            {!form.id && (
              <label className="eba-check">
                <span>Repeat weekly for</span>
                <select className="eba-select" value={form.repeat} onChange={function (e) { update('repeat', e.target.value); }}>
                  {[1, 2, 3, 4, 6, 8, 12].map(function (n) {
                    return <option key={n} value={n}>{n === 1 ? 'just this once' : n + ' weeks'}</option>;
                  })}
                </select>
              </label>
            )}
          </div>

          <div className="eba-actions">
            <button className="eba-btn eba-btn-dark" type="submit" disabled={busy === 'save'}>
              {busy === 'save' ? 'Saving...' : form.id ? 'Save changes' : 'Add live'}
            </button>
            <a className="eba-btn" href="/live-schedule" target="_blank" rel="noopener noreferrer">View public page</a>
          </div>

          {error && <div className="eba-err">{error}</div>}
          {message && <div className="eba-notice">{message}</div>}
        </form>

        <div className="eba-panel">
          <p className="eba-eyebrow">GOOD TO KNOW</p>
          <h2>How It Works</h2>
          <div className="eba-cells">
            <div className="eba-cell">
              <span className="lb">For customers</span>
              Each live gets an &ldquo;Add to calendar&rdquo; button, so their phone reminds them. Times show in their own time zone.
            </div>
            <div className="eba-cell">
              <span className="lb">When you go live</span>
              The live shows a &ldquo;Watch now&rdquo; button that opens your live link, or the watch link you set here.
            </div>
            <div className="eba-cell">
              <span className="lb">Hidden lives</span>
              Hide a live to plan ahead without customers seeing it yet.
            </div>
          </div>
        </div>
      </div>

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">SCHEDULE</p>
            <h2>Upcoming</h2>
          </div>
        </div>
        {upcoming.length ? (
          <div className="eba-rows">{upcoming.map(function (ev) { return Row(ev, false); })}</div>
        ) : (
          <div className="eba-empty">No lives scheduled. Add one above.</div>
        )}
      </div>

      {past.length > 0 && (
        <div className="eba-panel">
          <div className="eba-panelhead">
            <div>
              <p className="eba-eyebrow">HISTORY</p>
              <h2>Recent Lives</h2>
            </div>
          </div>
          <div className="eba-rows">{past.map(function (ev) { return Row(ev, true); })}</div>
        </div>
      )}
    </>
  );
}
