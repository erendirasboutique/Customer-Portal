'use client';

// components/studio/RemindersManager.js
// Bills & supplies: add / edit, mark paid or reordered, count supplies,
// starter items, and a history of what was done.

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PRESETS, REPEAT_LABELS, CATEGORY_SUGGESTIONS } from '@/lib/studio/reminder-presets';

const KIND_LABEL = { bill: 'Bill', supply: 'Supply', task: 'Other' };
const DONE_WORD = { bill: 'Mark paid', supply: 'Reordered', task: 'Done' };
const LOG_WORD = { paid: 'Paid', reordered: 'Reordered', done: 'Done', stock: 'Counted' };

const EMPTY = {
  id: null, kind: 'supply', name: '', category: '', vendor: '', amount: '', next_due: '',
  repeat: 'none', every_days: '', link: '', notes: '', unit: '', on_hand: '', reorder_at: '',
};

function days(a, b) {
  const x = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const y = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round((y - x) / 86400000);
}
function pretty(d) {
  return new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
}
function money(v) {
  return v == null || v === '' ? '' : '$' + Number(v).toFixed(2);
}

const css = '' +
'.eba a.eba-btn-dark { color:var(--cream); }' +
'.ebr-seg { display:inline-grid; grid-auto-flow:column; gap:4px; padding:4px; background:var(--wash); border:1px solid var(--line); border-radius:999px; }' +
'.ebr-seg button { border:0; background:transparent; border-radius:999px; padding:8px 16px; font-size:12.5px; color:var(--taupe); }' +
'.ebr-seg button.on { background:var(--accent); color:var(--cream); }' +
'.ebr-filters { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px; }' +
'.ebr-filters button { border:1px solid var(--line); background:var(--card); color:var(--taupe); border-radius:999px; padding:7px 13px; font-size:12px; }' +
'.ebr-filters button.on { background:var(--accent); border-color:var(--accent); color:var(--cream); }' +
'.ebr-filters .n { margin-left:6px; opacity:.75; }' +
'.ebr-stock { display:inline-flex; align-items:center; gap:2px; background:var(--card); border:1px solid var(--line); border-radius:999px; padding:3px; }' +
'.ebr-stock button { width:28px; height:28px; border-radius:50%; border:0; background:var(--wash); color:var(--taupe); font-size:15px; line-height:1; }' +
'.ebr-stock button:hover { background:#fcefdc; }' +
'.ebr-stock input { width:54px; border:0; background:transparent; text-align:center; font:inherit; font-size:14px; color:var(--ink); outline:0; }' +
'.ebr-stock .u { font-size:10.5px; color:var(--sand); padding-right:8px; }' +
'.ebr-done { flex-basis:100%; display:flex; flex-wrap:wrap; align-items:flex-end; gap:8px; padding-top:10px; border-top:1px dashed var(--line); margin-top:4px; }' +
'.ebr-done .eba-in { width:auto; flex:1; min-width:120px; padding:8px 12px; border-radius:12px; font-size:12.5px; }' +
'.ebr-done .eba-lb { margin-bottom:4px; }' +
'.ebr-pick { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,200px),1fr)); gap:8px; margin-top:6px; }' +
'.ebr-pick label { display:flex; align-items:center; gap:9px; background:var(--wash); border:1px solid var(--line); border-radius:14px; padding:10px 12px; font-size:13px; cursor:pointer; }' +
'.ebr-pick input { accent-color:var(--accent); width:16px; height:16px; }' +
'.ebr-pick .k { margin-left:auto; font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:var(--sand); }' +
'.ebr-hist { display:grid; gap:6px; }' +
'.ebr-hist div { display:flex; flex-wrap:wrap; gap:4px 12px; font-size:12.5px; color:var(--mute); padding:9px 12px; background:var(--wash); border-radius:12px; }' +
'.ebr-hist b { font-weight:400; color:var(--ink); }';

export default function RemindersManager(props) {
  const router = useRouter();
  const today = props.today;
  const items = props.items || [];
  const log = props.log || [];

  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState('attention');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [doneFor, setDoneFor] = useState(null);
  const [doneForm, setDoneForm] = useState({ amount: '', received: '', note: '' });
  const [counts, setCounts] = useState({});
  const [picked, setPicked] = useState(['poly-mailers', 'packing-tape', 'shipping-labels', 'tissue-paper', 'rent']);

  function status(i) {
    if (!i.is_active) return { key: 'done', pill: 'eba-pill off', text: 'Done', rank: 9 };
    const lowNow = i.kind === 'supply' && i.on_hand != null && i.reorder_at != null && i.on_hand <= i.reorder_at;
    if (i.next_due) {
      const d = days(today, i.next_due);
      if (d < 0) return { key: 'overdue', pill: 'eba-pill mid', text: 'Overdue ' + -d + (d === -1 ? ' day' : ' days'), rank: 0, attention: true };
      if (d === 0) return { key: 'today', pill: 'eba-pill ok', text: 'Due today', rank: 1, attention: true };
      if (lowNow) return { key: 'low', pill: 'eba-pill mid', text: 'Running low', rank: 2, attention: true };
      if (d <= 7) return { key: 'soon', pill: 'eba-pill ok', text: 'Due in ' + d + (d === 1 ? ' day' : ' days'), rank: 3, attention: true };
      return { key: 'later', pill: 'eba-pill off', text: 'Due ' + pretty(i.next_due), rank: 5 };
    }
    if (lowNow) return { key: 'low', pill: 'eba-pill mid', text: 'Running low', rank: 2, attention: true };
    if (i.kind === 'supply' && i.on_hand != null) return { key: 'ok', pill: 'eba-pill off', text: 'Stocked', rank: 6 };
    return { key: 'nodate', pill: 'eba-pill off', text: 'No date', rank: 7 };
  }

  const enriched = useMemo(function () {
    return items.map(function (i) { return { ...i, _s: status(i) }; }).sort(function (a, b) {
      if (a._s.rank !== b._s.rank) return a._s.rank - b._s.rank;
      return String(a.next_due || '9999').localeCompare(String(b.next_due || '9999')) || a.name.localeCompare(b.name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, today]);

  const filters = [
    { key: 'attention', label: 'Needs attention', test: function (i) { return i._s.attention; } },
    { key: 'all', label: 'All', test: function (i) { return i.is_active; } },
    { key: 'bill', label: 'Bills', test: function (i) { return i.is_active && i.kind === 'bill'; } },
    { key: 'supply', label: 'Supplies', test: function (i) { return i.is_active && i.kind === 'supply'; } },
    { key: 'task', label: 'Other', test: function (i) { return i.is_active && i.kind === 'task'; } },
    { key: 'done', label: 'Done', test: function (i) { return !i.is_active; } },
  ];
  const activeFilter = filters.find(function (f) { return f.key === filter; }) || filters[0];
  const query = q.trim().toLowerCase();
  const shown = enriched.filter(activeFilter.test).filter(function (i) {
    if (!query) return true;
    return [i.name, i.category, i.vendor, i.notes].filter(Boolean).join(' ').toLowerCase().includes(query);
  });
  const categories = Array.from(new Set(CATEGORY_SUGGESTIONS.concat(items.map(function (i) { return i.category; }).filter(Boolean))));
  const byId = {};
  items.forEach(function (i) { byId[i.id] = i; });

  function update(field, value) {
    setForm(function (f) { return { ...f, [field]: value }; });
    setError('');
  }

  async function call(body) {
    const res = await fetch('/api/admin/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }

  async function run(key, body, okMessage) {
    setBusy(key);
    setError('');
    setMessage('');
    try {
      const data = await call(body);
      if (okMessage) setMessage(typeof okMessage === 'function' ? okMessage(data) : okMessage);
      router.refresh();
      return data;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setBusy('');
    }
  }

  async function save(e) {
    e.preventDefault();
    const ok = await run('save', { action: form.id ? 'update' : 'create', ...form }, form.id ? 'Saved.' : 'Added ' + form.name + '.');
    if (ok) setForm({ ...EMPTY, kind: form.kind });
  }

  function edit(i) {
    setForm({
      id: i.id, kind: i.kind, name: i.name || '', category: i.category || '', vendor: i.vendor || '',
      amount: i.amount == null ? '' : String(i.amount), next_due: i.next_due || '', repeat: i.repeat || 'none',
      every_days: i.every_days == null ? '' : String(i.every_days), link: i.link || '', notes: i.notes || '',
      unit: i.unit || '', on_hand: i.on_hand == null ? '' : String(i.on_hand), reorder_at: i.reorder_at == null ? '' : String(i.reorder_at),
    });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openDone(i) {
    setDoneFor(doneFor === i.id ? null : i.id);
    setDoneForm({ amount: i.amount == null ? '' : String(i.amount), received: '', note: '' });
  }

  async function confirmDone(i) {
    const ok = await run('done-' + i.id, { action: 'done', id: i.id, ...doneForm }, function () {
      const next = i.repeat !== 'none' ? ' Next one is set.' : '';
      return (i.kind === 'bill' ? 'Marked ' + i.name + ' paid.' : i.kind === 'supply' ? 'Logged the ' + i.name + ' reorder.' : 'Checked off ' + i.name + '.') + next;
    });
    if (ok) setDoneFor(null);
  }

  async function stock(i, delta, set) {
    await run('stock-' + i.id, { action: 'stock', id: i.id, delta: delta, set: set });
    setCounts(function (c) { const n = { ...c }; delete n[i.id]; return n; });
  }

  async function remove(i) {
    if (!confirm('Delete "' + i.name + '"? Its history goes too.')) return;
    await run('del-' + i.id, { action: 'delete', id: i.id }, 'Deleted.');
    if (form.id === i.id) setForm(EMPTY);
  }

  async function seed() {
    await run('seed', { action: 'seed', keys: picked }, function (d) { return 'Added ' + d.added + ' items. Fill in counts and due dates below.'; });
  }

  const isBill = form.kind === 'bill';
  const isSupply = form.kind === 'supply';

  return (
    <>
      <style>{css}</style>

      <div className="eba-cols wide-left">
        <form className="eba-panel" onSubmit={save}>
          <div className="eba-panelhead">
            <div>
              <p className="eba-eyebrow">{form.id ? 'EDITING' : 'START HERE'}</p>
              <h2>{form.id ? 'Edit ' + (form.name || 'Item') : 'Add Something'}</h2>
            </div>
            {form.id && <button className="eba-btn mini" type="button" onClick={function () { setForm(EMPTY); }}>Cancel edit</button>}
          </div>

          <div className="ebr-seg" role="group" aria-label="Type">
            {['supply', 'bill', 'task'].map(function (k) {
              return <button key={k} type="button" className={form.kind === k ? 'on' : ''} onClick={function () { update('kind', k); }}>{KIND_LABEL[k]}</button>;
            })}
          </div>

          <div className="eba-formrow" style={{ marginTop: 14 }}>
            <div>
              <span className="eba-lb">Name</span>
              <input className="eba-in" value={form.name} maxLength={120} required
                placeholder={isSupply ? 'Poly mailers 10x13' : isBill ? 'Rent' : 'Renew business license'}
                onChange={function (e) { update('name', e.target.value); }} />
            </div>
            <div>
              <span className="eba-lb">Category</span>
              <input className="eba-in" value={form.category} maxLength={60} list="ebr-cats" placeholder="Type or pick"
                onChange={function (e) { update('category', e.target.value); }} />
              <datalist id="ebr-cats">{categories.map(function (c) { return <option key={c} value={c} />; })}</datalist>
            </div>
          </div>

          {isSupply && (
            <div className="eba-formrow even" style={{ marginTop: 12, gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
              <div>
                <span className="eba-lb">On hand</span>
                <input className="eba-in" type="number" min="0" inputMode="numeric" value={form.on_hand} placeholder="120"
                  onChange={function (e) { update('on_hand', e.target.value); }} />
              </div>
              <div>
                <span className="eba-lb">Reorder at</span>
                <input className="eba-in" type="number" min="0" inputMode="numeric" value={form.reorder_at} placeholder="50"
                  onChange={function (e) { update('reorder_at', e.target.value); }} />
              </div>
              <div>
                <span className="eba-lb">Counted in</span>
                <input className="eba-in" value={form.unit} maxLength={30} placeholder="mailers, rolls..."
                  onChange={function (e) { update('unit', e.target.value); }} />
              </div>
            </div>
          )}

          <div className="eba-formrow even" style={{ marginTop: 12 }}>
            <div>
              <span className="eba-lb">{isBill ? 'Due date' : 'Remind me on (optional)'}</span>
              <input className="eba-in" type="date" value={form.next_due} required={isBill}
                onChange={function (e) { update('next_due', e.target.value); }} />
            </div>
            <div>
              <span className="eba-lb">Repeats</span>
              <select className="eba-in" value={form.repeat} onChange={function (e) { update('repeat', e.target.value); }}>
                {Object.keys(REPEAT_LABELS).map(function (k) { return <option key={k} value={k}>{REPEAT_LABELS[k]}</option>; })}
              </select>
            </div>
          </div>
          {form.repeat === 'custom' && (
            <div className="eba-field" style={{ marginTop: 12 }}>
              <span className="eba-lb">Every how many days?</span>
              <input className="eba-in" type="number" min="1" max="730" value={form.every_days} placeholder="45"
                onChange={function (e) { update('every_days', e.target.value); }} />
            </div>
          )}

          <div className="eba-formrow even" style={{ marginTop: 12 }}>
            <div>
              <span className="eba-lb">{isSupply ? 'Usual cost (optional)' : 'Amount (optional)'}</span>
              <input className="eba-in" type="number" min="0" step="0.01" inputMode="decimal" value={form.amount} placeholder="0.00"
                onChange={function (e) { update('amount', e.target.value); }} />
            </div>
            <div>
              <span className="eba-lb">{isSupply ? 'Where you buy it' : 'Who you pay'}</span>
              <input className="eba-in" value={form.vendor} maxLength={120} placeholder={isSupply ? 'Amazon, Uline...' : 'Landlord, PG&E...'}
                onChange={function (e) { update('vendor', e.target.value); }} />
            </div>
          </div>

          <div className="eba-field" style={{ marginTop: 12 }}>
            <span className="eba-lb">{isSupply ? 'Reorder link (optional)' : 'Pay link (optional)'}</span>
            <input className="eba-in" value={form.link} placeholder="https://..." onChange={function (e) { update('link', e.target.value); }} />
          </div>

          <div className="eba-field" style={{ marginTop: 12 }}>
            <span className="eba-lb">Notes (optional)</span>
            <textarea className="eba-in" rows={2} maxLength={1000} value={form.notes}
              placeholder={isSupply ? 'Size 10x13, white, pack of 200' : 'Account #, autopay, who to call...'}
              onChange={function (e) { update('notes', e.target.value); }} />
          </div>

          <div className="eba-actions">
            <button className="eba-btn eba-btn-dark" type="submit" disabled={busy === 'save'}>
              {busy === 'save' ? 'Saving...' : form.id ? 'Save changes' : 'Add ' + KIND_LABEL[form.kind].toLowerCase()}
            </button>
          </div>

          {error && <div className="eba-err">{error}</div>}
          {message && <div className="eba-notice">{message}</div>}
        </form>

        {items.length === 0 ? (
          <div className="eba-panel">
            <p className="eba-eyebrow">QUICK START</p>
            <h2>Add Common Items</h2>
            <p className="eba-muted" style={{ marginTop: -6 }}>Tick what you use. You can rename, change or delete any of them after.</p>
            <div className="ebr-pick">
              {Object.keys(PRESETS).map(function (k) {
                const p = PRESETS[k];
                return (
                  <label key={k}>
                    <input type="checkbox" checked={picked.includes(k)} onChange={function (e) {
                      setPicked(function (cur) { return e.target.checked ? cur.concat(k) : cur.filter(function (x) { return x !== k; }); });
                    }} />
                    <span>{p.name}</span>
                    <span className="k">{KIND_LABEL[p.kind]}</span>
                  </label>
                );
              })}
            </div>
            <div className="eba-actions">
              <button className="eba-btn eba-btn-dark" type="button" disabled={busy === 'seed' || !picked.length} onClick={seed}>
                {busy === 'seed' ? 'Adding...' : 'Add ' + picked.length + ' items'}
              </button>
            </div>
          </div>
        ) : (
          <div className="eba-panel">
            <p className="eba-eyebrow">HISTORY</p>
            <h2>Recently Done</h2>
            {log.length ? (
              <div className="ebr-hist">
                {log.slice(0, 12).map(function (l) {
                  const it = byId[l.reminder_id];
                  return (
                    <div key={l.id}>
                      <b>{LOG_WORD[l.action] || l.action}: {it ? it.name : 'Deleted item'}</b>
                      {l.amount != null && <span>{money(l.amount)}</span>}
                      {l.qty ? <span>+{l.qty} {it && it.unit ? it.unit : ''}</span> : null}
                      <span>{new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      {l.done_by && <span>{l.done_by.split('@')[0]}</span>}
                      {l.note && <span>&ldquo;{l.note}&rdquo;</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="eba-empty">When you mark a bill paid or log a reorder, it shows up here.</div>
            )}
          </div>
        )}
      </div>

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">YOUR LIST</p>
            <h2>{activeFilter.label}</h2>
          </div>
        </div>

        <div className="ebr-filters">
          {filters.map(function (f) {
            const n = enriched.filter(f.test).length;
            return (
              <button key={f.key} type="button" className={filter === f.key ? 'on' : ''} onClick={function () { setFilter(f.key); }}>
                {f.label}<span className="n">{n}</span>
              </button>
            );
          })}
        </div>
        <label className="eba-search" style={{ marginBottom: 14 }}>
          <input placeholder="Search name, category, vendor..." value={q} onChange={function (e) { setQ(e.target.value); }} />
        </label>

        {!shown.length ? (
          <div className="eba-empty">
            {filter === 'attention' ? 'Nothing overdue or running low. Nice.' : 'Nothing here yet.'}
          </div>
        ) : (
          <div className="eba-rows">
            {shown.map(function (i) {
              const s = i._s;
              const sub = [
                KIND_LABEL[i.kind],
                i.category,
                i.vendor,
                i.repeat && i.repeat !== 'none' ? (i.repeat === 'custom' ? 'Every ' + i.every_days + ' days' : REPEAT_LABELS[i.repeat]) : null,
                i.kind === 'supply' && i.reorder_at != null ? 'Reorder at ' + i.reorder_at : null,
              ].filter(Boolean).join(' · ');
              const countVal = counts[i.id] != null ? counts[i.id] : (i.on_hand == null ? '' : String(i.on_hand));
              return (
                <div className={i.is_active ? 'eba-row' : 'eba-row off'} key={i.id}>
                  <span className="eba-who">
                    <span className="n">{i.name}</span>
                    <span className="s">{sub}</span>
                    {i.notes && <span className="s">{i.notes}</span>}
                  </span>

                  <span className={s.pill}>{s.text}</span>
                  {i.amount != null && i.kind !== 'supply' && <span className="eba-amt">{money(i.amount)}</span>}

                  {i.kind === 'supply' && i.is_active && (
                    <span className="ebr-stock" aria-label={'On hand for ' + i.name}>
                      <button type="button" aria-label="One less" disabled={busy === 'stock-' + i.id} onClick={function () { stock(i, -1); }}>&minus;</button>
                      <input inputMode="numeric" value={countVal} placeholder="?"
                        onChange={function (e) { const v = e.target.value.replace(/[^0-9]/g, ''); setCounts(function (c) { return { ...c, [i.id]: v }; }); }}
                        onBlur={function () { if (counts[i.id] != null && counts[i.id] !== String(i.on_hand ?? '')) stock(i, 0, counts[i.id]); }}
                        onKeyDown={function (e) { if (e.key === 'Enter') e.currentTarget.blur(); }} />
                      <button type="button" aria-label="One more" disabled={busy === 'stock-' + i.id} onClick={function () { stock(i, 1); }}>+</button>
                      {i.unit && <span className="u">{i.unit}</span>}
                    </span>
                  )}

                  <span className="eba-rowbtns">
                    {i.is_active ? (
                      <button className="eba-btn eba-btn-dark mini" type="button" onClick={function () { openDone(i); }}>{DONE_WORD[i.kind]}</button>
                    ) : (
                      <button className="eba-btn mini" type="button" onClick={function () { run('re-' + i.id, { action: 'reopen', id: i.id }, 'Moved back to your list.'); }}>Reopen</button>
                    )}
                    {i.link && (
                      <a className="eba-btn mini" href={i.link} target="_blank" rel="noopener noreferrer">{i.kind === 'supply' ? 'Reorder ↗' : 'Pay ↗'}</a>
                    )}
                    {i.kind === 'bill' && i.is_active && <a className="eba-btn mini" href="/admin/checks/new">Write check</a>}
                    <button className="eba-btn mini" type="button" onClick={function () { edit(i); }}>Edit</button>
                    <button className="eba-btn mini" type="button" disabled={busy === 'del-' + i.id} onClick={function () { remove(i); }}>Delete</button>
                  </span>

                  {doneFor === i.id && (
                    <div className="ebr-done">
                      {i.kind === 'bill' && (
                        <div style={{ flex: 1, minWidth: 120 }}>
                          <span className="eba-lb">Amount paid</span>
                          <input className="eba-in" style={{ width: '100%' }} type="number" min="0" step="0.01" value={doneForm.amount}
                            onChange={function (e) { setDoneForm({ ...doneForm, amount: e.target.value }); }} />
                        </div>
                      )}
                      {i.kind === 'supply' && (
                        <div style={{ flex: 1, minWidth: 120 }}>
                          <span className="eba-lb">Already arrived? Add to count</span>
                          <input className="eba-in" style={{ width: '100%' }} type="number" min="0" value={doneForm.received} placeholder="0"
                            onChange={function (e) { setDoneForm({ ...doneForm, received: e.target.value }); }} />
                        </div>
                      )}
                      <div style={{ flex: 2, minWidth: 160 }}>
                        <span className="eba-lb">Note (optional)</span>
                        <input className="eba-in" style={{ width: '100%' }} value={doneForm.note} maxLength={300}
                          placeholder={i.kind === 'bill' ? 'Check #1042, autopay...' : i.kind === 'supply' ? 'Ordered 2 packs on Amazon' : ''}
                          onChange={function (e) { setDoneForm({ ...doneForm, note: e.target.value }); }} />
                      </div>
                      <button className="eba-btn eba-btn-dark mini" type="button" disabled={busy === 'done-' + i.id} onClick={function () { confirmDone(i); }}>
                        {busy === 'done-' + i.id ? 'Saving...' : 'Confirm'}
                      </button>
                      <button className="eba-btn mini" type="button" onClick={function () { setDoneFor(null); }}>Cancel</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
