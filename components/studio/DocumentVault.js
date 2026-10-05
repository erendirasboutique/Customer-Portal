'use client';

// components/studio/DocumentVault.js
// Upload (drag & drop or phone camera), details, expiry tracking,
// search, open / download / edit / delete.

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DOC_CATEGORIES, DOC_TYPES, MAX_DOC_MB } from '@/lib/studio/document-types';

const EMPTY = {
  id: null, title: '', category: 'Permits & licenses', expires_on: '', remind_days: '30',
  issued_by: '', number: '', notes: '',
};

function size(n) {
  if (!n) return '';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}
function days(a, b) {
  const x = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const y = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round((y - x) / 86400000);
}
function pretty(d) {
  return new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
}
function titleFromFile(name) {
  return String(name || '').replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
}
function guessType(file) {
  if (file.type && DOC_TYPES[file.type]) return file.type;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  return { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', csv: 'text/csv', txt: 'text/plain' }[ext] || file.type;
}

const css = '' +
'.eba a.eba-btn-dark { color:var(--cream); }' +
'.ebd-drop { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; text-align:center;' +
'  border:1.5px dashed var(--line); border-radius:20px; background:var(--wash); padding:26px 16px; cursor:pointer;' +
'  transition:border-color .16s ease, background .16s ease; }' +
'.ebd-drop:hover, .ebd-drop.over { border-color:var(--accent); background:#fff8ee; }' +
'.ebd-drop b { font-weight:400; font-size:15px; color:var(--ink); }' +
'.ebd-drop span { font-size:12px; color:var(--mute); }' +
'.ebd-file { display:flex; align-items:center; gap:12px; background:var(--wash); border:1px solid var(--line); border-radius:16px; padding:12px 14px; }' +
'.ebd-file .ic { width:38px; height:38px; border-radius:12px; background:#fcefdc; display:flex; align-items:center; justify-content:center; font-size:10px; letter-spacing:.08em; color:var(--taupe); flex-shrink:0; }' +
'.ebd-file .nm { flex:1; min-width:0; font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }' +
'.ebd-bar { height:6px; border-radius:999px; background:#fcefdc; overflow:hidden; margin-top:10px; }' +
'.ebd-bar span { display:block; height:100%; background:var(--accent); transition:width .2s ease; }' +
'.ebd-cat { margin:22px 2px 10px; font-size:10px; letter-spacing:.24em; text-transform:uppercase; color:var(--sand); }' +
'.ebd-cat:first-of-type { margin-top:4px; }' +
'.ebd-type { width:40px; height:40px; border-radius:12px; flex-shrink:0; background:#fcefdc; color:var(--taupe);' +
'  display:inline-flex; align-items:center; justify-content:center; font-size:9.5px; letter-spacing:.08em; }';

export default function DocumentVault(props) {
  const router = useRouter();
  const today = props.today;
  const docs = props.docs || [];
  const inputRef = useRef(null);

  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  function update(field, value) {
    setForm(function (f) { return { ...f, [field]: value }; });
    setError('');
  }

  function pickFile(f) {
    if (!f) return;
    const type = guessType(f);
    if (!DOC_TYPES[type]) { setError('That file type isn’t supported. Use a PDF, photo, Word or Excel file.'); return; }
    if (f.size > MAX_DOC_MB * 1024 * 1024) { setError('Files can be up to ' + MAX_DOC_MB + ' MB.'); return; }
    setFile(f);
    setError('');
    setMessage('');
    if (!form.title) update('title', titleFromFile(f.name));
  }

  async function api(body) {
    const res = await fetch('/api/admin/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }

  function uploadTo(url, f) {
    return new Promise(function (resolve, reject) {
      const fd = new FormData();
      fd.append('cacheControl', '3600');
      fd.append('', f);
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.upload.onprogress = function (e) { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = function () { xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed (' + xhr.status + ').')); };
      xhr.onerror = function () { reject(new Error('Upload failed. Check your connection.')); };
      xhr.send(fd);
    });
  }

  async function save(e) {
    e.preventDefault();
    setBusy('save');
    setError('');
    setMessage('');
    try {
      if (form.id) {
        await api({ action: 'update', ...form });
        setMessage('Saved.');
      } else {
        if (!file) throw new Error('Choose a file first.');
        const type = guessType(file);
        setProgress(1);
        const up = await api({ action: 'upload-url', fileName: file.name, type: type, size: file.size });
        await uploadTo(up.uploadUrl, file);
        await api({ action: 'create', path: up.path, fileName: file.name, type: type, size: file.size, ...form });
        setMessage('Saved ' + form.title + ' to the vault.');
      }
      setForm(EMPTY);
      setFile(null);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } catch (err) {
      setError(err.message);
      setProgress(0);
    } finally {
      setBusy('');
    }
  }

  function edit(d) {
    setFile(null);
    setForm({
      id: d.id, title: d.title || '', category: d.category || 'Other', expires_on: d.expires_on || '',
      remind_days: String(d.remind_days ?? 30), issued_by: d.issued_by || '', number: d.number || '', notes: d.notes || '',
    });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(d) {
    if (!confirm('Delete "' + d.title + '"? The file is removed for good.')) return;
    setBusy('del-' + d.id);
    try {
      await api({ action: 'delete', id: d.id });
      if (form.id === d.id) setForm(EMPTY);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  function expiry(d) {
    if (!d.expires_on) return null;
    const n = days(today, d.expires_on);
    if (n < 0) return { pill: 'eba-pill mid', text: 'Expired ' + pretty(d.expires_on) };
    if (n <= (d.remind_days ?? 30)) return { pill: 'eba-pill ok', text: n === 0 ? 'Expires today' : 'Expires in ' + n + (n === 1 ? ' day' : ' days') };
    return { pill: 'eba-pill off', text: 'Expires ' + pretty(d.expires_on) };
  }

  const query = q.trim().toLowerCase();
  const shown = docs.filter(function (d) {
    if (cat !== 'all' && d.category !== cat) return false;
    if (!query) return true;
    return [d.title, d.category, d.issued_by, d.number, d.notes, d.file_name].filter(Boolean).join(' ').toLowerCase().includes(query);
  });
  const groups = DOC_CATEGORIES.map(function (c) {
    return { cat: c, items: shown.filter(function (d) { return (d.category || 'Other') === c; }) };
  }).filter(function (g) { return g.items.length; });
  const usedCats = DOC_CATEGORIES.filter(function (c) { return docs.some(function (d) { return d.category === c; }); });

  return (
    <>
      <style>{css}</style>

      <form className="eba-panel" onSubmit={save}>
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">{form.id ? 'EDITING' : 'START HERE'}</p>
            <h2>{form.id ? 'Edit Details' : 'Add a Document'}</h2>
          </div>
          {form.id && <button className="eba-btn mini" type="button" onClick={function () { setForm(EMPTY); }}>Cancel edit</button>}
        </div>

        {!form.id && (
          file ? (
            <div className="ebd-file">
              <span className="ic">{DOC_TYPES[guessType(file)]}</span>
              <span className="nm">{file.name}<br /><span className="eba-muted">{size(file.size)}</span></span>
              <button className="eba-btn mini" type="button" disabled={busy === 'save'} onClick={function () { setFile(null); if (inputRef.current) inputRef.current.value = ''; }}>Change</button>
            </div>
          ) : (
            <label
              className={over ? 'ebd-drop over' : 'ebd-drop'}
              onDragOver={function (e) { e.preventDefault(); setOver(true); }}
              onDragLeave={function () { setOver(false); }}
              onDrop={function (e) { e.preventDefault(); setOver(false); pickFile(e.dataTransfer.files && e.dataTransfer.files[0]); }}
            >
              <b>Drop a file here, or tap to choose</b>
              <span>PDF, photo, Word or Excel &middot; up to {MAX_DOC_MB} MB &middot; on a phone you can take a photo</span>
              <input ref={inputRef} type="file" hidden
                accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx,.xls,.xlsx,.csv,.txt,application/pdf,image/*"
                onChange={function (e) { pickFile(e.target.files && e.target.files[0]); }} />
            </label>
          )
        )}
        {progress > 0 && <div className="ebd-bar"><span style={{ width: progress + '%' }} /></div>}

        <div className="eba-formrow" style={{ marginTop: 14 }}>
          <div>
            <span className="eba-lb">Name</span>
            <input className="eba-in" value={form.title} maxLength={140} required placeholder="California seller's permit"
              onChange={function (e) { update('title', e.target.value); }} />
          </div>
          <div>
            <span className="eba-lb">Category</span>
            <select className="eba-in" value={form.category} onChange={function (e) { update('category', e.target.value); }}>
              {DOC_CATEGORIES.map(function (c) { return <option key={c} value={c}>{c}</option>; })}
            </select>
          </div>
        </div>

        <div className="eba-formrow even" style={{ marginTop: 12 }}>
          <div>
            <span className="eba-lb">Expires on (optional)</span>
            <input className="eba-in" type="date" value={form.expires_on} onChange={function (e) { update('expires_on', e.target.value); }} />
          </div>
          <div>
            <span className="eba-lb">Remind me</span>
            <select className="eba-in" value={form.remind_days} disabled={!form.expires_on} onChange={function (e) { update('remind_days', e.target.value); }}>
              {[7, 14, 30, 60, 90].map(function (n) { return <option key={n} value={n}>{n} days before</option>; })}
            </select>
          </div>
        </div>

        <div className="eba-formrow even" style={{ marginTop: 12 }}>
          <div>
            <span className="eba-lb">Issued by (optional)</span>
            <input className="eba-in" value={form.issued_by} maxLength={120} placeholder="CDTFA, City of..., State Farm"
              onChange={function (e) { update('issued_by', e.target.value); }} />
          </div>
          <div>
            <span className="eba-lb">Number (optional)</span>
            <input className="eba-in" value={form.number} maxLength={80} placeholder="Permit or policy #"
              onChange={function (e) { update('number', e.target.value); }} />
          </div>
        </div>

        <div className="eba-field" style={{ marginTop: 12 }}>
          <span className="eba-lb">Notes (optional)</span>
          <textarea className="eba-in" rows={2} maxLength={1000} value={form.notes}
            placeholder="Where the original is, who to call to renew..."
            onChange={function (e) { update('notes', e.target.value); }} />
        </div>

        <div className="eba-actions">
          <button className="eba-btn eba-btn-dark" type="submit" disabled={busy === 'save' || (!form.id && !file)}>
            {busy === 'save' ? (progress > 0 && progress < 100 ? 'Uploading ' + progress + '%...' : 'Saving...') : form.id ? 'Save changes' : 'Save to vault'}
          </button>
        </div>

        {error && <div className="eba-err">{error}</div>}
        {message && <div className="eba-notice">{message}</div>}
      </form>

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">VAULT</p>
            <h2>Your Documents</h2>
          </div>
        </div>

        <div className="eba-toolbar" style={{ marginBottom: 6 }}>
          <label className="eba-search">
            <input placeholder="Search name, number, issuer..." value={q} onChange={function (e) { setQ(e.target.value); }} />
          </label>
          <select className="eba-select" value={cat} onChange={function (e) { setCat(e.target.value); }}>
            <option value="all">All categories</option>
            {usedCats.map(function (c) { return <option key={c} value={c}>{c}</option>; })}
          </select>
        </div>

        {!docs.length ? (
          <div className="eba-empty">No documents yet. Start with your seller&rsquo;s permit and business license.</div>
        ) : !groups.length ? (
          <div className="eba-empty">Nothing matches that search.</div>
        ) : (
          groups.map(function (g) {
            return (
              <div key={g.cat}>
                <p className="ebd-cat">{g.cat}</p>
                <div className="eba-rows">
                  {g.items.map(function (d) {
                    const ex = expiry(d);
                    const sub = [d.issued_by, d.number ? '#' + d.number : null, size(d.file_size), 'Added ' + new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })]
                      .filter(Boolean).join(' · ');
                    return (
                      <div className="eba-row" key={d.id}>
                        <span className="ebd-type">{DOC_TYPES[d.file_type] || 'FILE'}</span>
                        <span className="eba-who">
                          <span className="n">{d.title}</span>
                          <span className="s">{sub}</span>
                          {d.notes && <span className="s">{d.notes}</span>}
                        </span>
                        {ex && <span className={ex.pill}>{ex.text}</span>}
                        <span className="eba-rowbtns">
                          <a className="eba-btn eba-btn-dark mini" href={'/api/admin/documents/' + d.id + '/download?view=1'} target="_blank" rel="noopener noreferrer">Open</a>
                          <a className="eba-btn mini" href={'/api/admin/documents/' + d.id + '/download'}>Download</a>
                          <button className="eba-btn mini" type="button" onClick={function () { edit(d); }}>Edit</button>
                          <button className="eba-btn mini" type="button" disabled={busy === 'del-' + d.id} onClick={function () { remove(d); }}>Delete</button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
