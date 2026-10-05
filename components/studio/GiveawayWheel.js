'use client';

// components/studio/GiveawayWheel.js
// Names in → spin → fair random winner → saved to history.
// The winner is picked with the browser's secure random generator
// BEFORE the wheel moves; the animation just lands on them.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const DRAFT_KEY = 'eb-giveaway-draft';
const SPIN_MS = 6200;
const COLORS = [
  { fill: '#eda033', text: '#ffffff' },
  { fill: '#fdf1df', text: '#da5e16' },
  { fill: '#da5e16', text: '#ffffff' },
  { fill: '#f6d3a8', text: '#b4470c' },
];

/* ---------------- Translations ---------------- */
export const WHEEL_T = {
  en: {
    step: 'STEP 1', whoIn: 'Who\u2019s In?', prizeQ: 'What are they winning?', prizePh: '$50 gift card',
    addName: 'Add a name', add: 'Add', pasteList: 'Or paste a list (one per line)', addList: 'Add list',
    once: 'One spot per person', removeWin: 'Take the winner off for the next spin',
    onceHint: 'Typed a name twice? It still gets one spot.',
    multiHint: 'Each time you add a name counts as an extra entry \u2014 good for \u201cone entry per purchase.\u201d',
    onWheel: 'On the wheel', shuffle: 'Shuffle', clearAll: 'Clear all', noNames: 'No names yet.',
    clearConfirm: function (n) { return 'Clear all ' + n + ' names?'; },
    removeLabel: function (n) { return 'Remove ' + n; },
    giveaway: 'Giveaway', entry: 'entry', entries: 'entries',
    emptyWheel: 'Add names on the left and they\u2019ll show up here.',
    spinHub: 'SPIN', spinBtn: 'Spin the wheel', spinning: 'Spinning...', fullscreen: 'Full screen',
    tooMany: 'Over 80 names, so they\u2019re hidden on the wheel. The winner still shows big.',
    needTwo: 'Add at least 2 names to spin.',
    saveFailed: 'Couldn\u2019t save the winner. The winner is still shown \u2014 write it down.',
    winner: 'WINNER', pickedFrom: function (n) { return 'picked from ' + n + ' entries'; },
    headsUp: function (w, prize, date) { return 'Heads up: ' + w + ' also won ' + prize + ' on ' + date + '.'; },
    doneRemove: 'Done \u00b7 remove from wheel', done: 'Done', copy: 'Copy announcement', copied: 'Copied',
    redo: 'Doesn\u2019t count \u00b7 spin again',
    announce: function (w, prize) { return '\uD83C\uDF89 Congratulations ' + w + '! You won ' + (prize || 'our giveaway') + ' at Erendira\u2019s Boutique! Message us to claim your prize \uD83D\uDC9B'; },
    history: 'HISTORY', pastWinners: 'Past Winners', remove: 'Remove', spunBy: 'Spun by',
    removeConfirm: function (w) { return 'Remove ' + w + ' from the winners list?'; },
    noHistory: 'Winners show up here after each spin.',
    wheelLabel: 'Giveaway wheel', winnerLabel: 'Winner',
  },
  es: {
    step: 'PASO 1', whoIn: '\u00bfQui\u00e9n Participa?', prizeQ: '\u00bfQu\u00e9 se van a ganar?', prizePh: 'Tarjeta de regalo de $50',
    addName: 'Agregar un nombre', add: 'Agregar', pasteList: 'O pega una lista (uno por l\u00ednea)', addList: 'Agregar lista',
    once: 'Un lugar por persona', removeWin: 'Quitar a la ganadora para el siguiente giro',
    onceHint: '\u00bfEscribiste un nombre dos veces? Igual cuenta solo una vez.',
    multiHint: 'Cada vez que agregas un nombre cuenta como otra entrada \u2014 ideal para \u201cuna entrada por compra.\u201d',
    onWheel: 'En la ruleta', shuffle: 'Revolver', clearAll: 'Borrar todo', noNames: 'A\u00fan no hay nombres.',
    clearConfirm: function (n) { return '\u00bfBorrar los ' + n + ' nombres?'; },
    removeLabel: function (n) { return 'Quitar a ' + n; },
    giveaway: 'Sorteo', entry: 'entrada', entries: 'entradas',
    emptyWheel: 'Agrega nombres a la izquierda y aparecer\u00e1n aqu\u00ed.',
    spinHub: 'GIRAR', spinBtn: 'Girar la ruleta', spinning: 'Girando...', fullscreen: 'Pantalla completa',
    tooMany: 'M\u00e1s de 80 nombres, as\u00ed que no se ven en la ruleta. La ganadora igual aparece en grande.',
    needTwo: 'Agrega al menos 2 nombres para girar.',
    saveFailed: 'No se pudo guardar la ganadora. Igual se muestra \u2014 an\u00f3tala.',
    winner: 'GANADORA', pickedFrom: function (n) { return 'elegida entre ' + n + ' entradas'; },
    headsUp: function (w, prize, date) { return 'Ojo: ' + w + ' tambi\u00e9n gan\u00f3 ' + prize + ' el ' + date + '.'; },
    doneRemove: 'Listo \u00b7 quitar de la ruleta', done: 'Listo', copy: 'Copiar anuncio', copied: 'Copiado',
    redo: 'No cuenta \u00b7 girar otra vez',
    announce: function (w, prize) { return '\uD83C\uDF89 \u00a1Felicidades ' + w + '! Ganaste ' + (prize || 'nuestro sorteo') + ' en Erendira\u2019s Boutique. \u00a1M\u00e1ndanos mensaje para reclamar tu premio! \uD83D\uDC9B'; },
    history: 'HISTORIAL', pastWinners: 'Ganadoras Anteriores', remove: 'Quitar', spunBy: 'Girada por',
    removeConfirm: function (w) { return '\u00bfQuitar a ' + w + ' de la lista de ganadoras?'; },
    noHistory: 'Las ganadoras aparecen aqu\u00ed despu\u00e9s de cada giro.',
    wheelLabel: 'Ruleta de regalos', winnerLabel: 'Ganadora',
  },
};
const LOCALE = { en: 'en-US', es: 'es-MX' };

/* Uniform random integer in [0, n) using crypto, no bias. */
function fairIndex(n) {
  if (n <= 1) return 0;
  const max = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  let x;
  do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= max);
  return x % n;
}

function point(angleDeg, r) {
  const a = (angleDeg * Math.PI) / 180;
  return [Math.sin(a) * r, -Math.cos(a) * r];
}

function slicePath(start, end) {
  const [x1, y1] = point(start, 1);
  const [x2, y2] = point(end, 1);
  const large = end - start > 180 ? 1 : 0;
  return 'M0 0 L' + x1.toFixed(5) + ' ' + y1.toFixed(5) + ' A1 1 0 ' + large + ' 1 ' + x2.toFixed(5) + ' ' + y2.toFixed(5) + ' Z';
}

function cleanName(s) {
  return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

const css = '' +
'.eba a.eba-btn-dark { color:var(--cream); }' +
'.ebg-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.25fr); gap:16px; align-items:start; }' +
'.ebg-stage { position:relative; background:var(--card); border-radius:30px; padding:26px 22px 24px; text-align:center; overflow:hidden;' +
'  box-shadow:0 1px 2px rgba(218,94,22,.04), 0 14px 40px rgba(218,94,22,.06); }' +
'.ebg-stage:fullscreen { border-radius:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#fdfcf7; }' +
'.ebg-stage:fullscreen .ebg-wheelwrap { width:min(78vh, 90vw); }' +
'.ebg-stage:fullscreen .ebg-prize { font-size:clamp(28px,4vw,48px); }' +
'.ebg-prize { margin:0 0 4px; font-family:"La Luxes Serif","Recoleta",Georgia,serif; font-size:clamp(24px,3vw,34px); line-height:1.05; color:var(--taupe); }' +
'.ebg-count { margin:0 0 16px; font-size:12px; color:var(--mute); }' +
'.ebg-wheelwrap { position:relative; width:min(100%, 520px); margin:0 auto; aspect-ratio:1; }' +
'.ebg-wheel { width:100%; height:100%; border-radius:50%; overflow:hidden; pointer-events:none; box-shadow:0 18px 50px rgba(218,94,22,.22), 0 0 0 8px #fff, 0 0 0 10px #f6d3a8; }' +
'.ebg-wheel svg { width:100%; height:100%; display:block; }' +
'.ebg-pointer { position:absolute; left:50%; top:-14px; transform:translateX(-50%); width:0; height:0; z-index:3;' +
'  border-left:18px solid transparent; border-right:18px solid transparent; border-top:34px solid #da5e16;' +
'  filter:drop-shadow(0 4px 6px rgba(0,0,0,.18)); }' +
'.ebg-hub { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); z-index:2; width:24%; aspect-ratio:1; border-radius:50%;' +
'  border:0; background:#fff; color:#da5e16; font-family:"La Luxes Serif","Recoleta",Georgia,serif; font-size:clamp(16px,2.6vw,26px);' +
'  box-shadow:0 6px 20px rgba(218,94,22,.28), inset 0 0 0 4px #f6d3a8; cursor:pointer; transition:transform .15s ease; }' +
'.ebg-hub:hover:not(:disabled) { transform:translate(-50%,-50%) scale(1.05); }' +
'.ebg-hub:disabled { cursor:default; color:#efc28c; }' +
'.ebg-empty { position:absolute; inset:0; border-radius:50%; display:flex; align-items:center; justify-content:center; padding:20%;' +
'  background:repeating-conic-gradient(#fdf1df 0 15deg, #fff 15deg 30deg); color:var(--mute); font-size:13px; }' +
'.ebg-controls { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin-top:18px; }' +
'.ebg-win { position:absolute; inset:0; z-index:5; display:flex; align-items:center; justify-content:center; padding:20px;' +
'  background:rgba(253,252,247,.82); backdrop-filter:blur(3px); animation:ebg-fade .3s ease; }' +
'.ebg-wincard { position:relative; z-index:2; background:#fff; border-radius:28px; padding:28px 30px; max-width:420px; width:100%;' +
'  box-shadow:0 24px 60px rgba(218,94,22,.25); animation:ebg-pop .45s cubic-bezier(.2,1.4,.4,1); }' +
'.ebg-wincard .lb { font-size:10px; letter-spacing:.3em; color:var(--accent); }' +
'.ebg-wincard .nm { margin:10px 0 6px; font-family:"La Luxes Serif","Recoleta",Georgia,serif; font-size:clamp(34px,6vw,54px); line-height:1.02; color:var(--taupe); overflow-wrap:anywhere; }' +
'.ebg-wincard .pz { font-size:14px; color:var(--mute); }' +
'.ebg-wincard .warn { margin-top:12px; font-size:12.5px; color:#a8702f; background:#fff6ea; border-radius:12px; padding:8px 12px; }' +
'.ebg-wincard .eba-actions { justify-content:center; }' +
'.ebg-confetti { position:absolute; inset:0; pointer-events:none; overflow:hidden; }' +
'.ebg-confetti i { position:absolute; top:-12px; width:9px; height:14px; border-radius:2px; opacity:.95; animation:ebg-fall linear forwards; }' +
'@keyframes ebg-fall { to { transform:translateY(110vh) rotate(720deg); } }' +
'@keyframes ebg-fade { from { opacity:0; } }' +
'@keyframes ebg-pop { from { transform:scale(.7); opacity:0; } }' +
'.ebg-chips { display:flex; flex-wrap:wrap; gap:6px; max-height:260px; overflow:auto; padding:2px; }' +
'.ebg-chip { display:inline-flex; align-items:center; gap:6px; background:var(--wash); border:1px solid var(--line); border-radius:999px;' +
'  padding:5px 6px 5px 12px; font-size:12.5px; color:var(--ink); max-width:100%; }' +
'.ebg-chip span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }' +
'.ebg-chip .x { width:20px; height:20px; border-radius:50%; border:0; background:#fcefdc; color:var(--taupe); font-size:12px; line-height:1; flex-shrink:0; }' +
'.ebg-chip .c { font-size:10px; background:var(--accent); color:#fff; border-radius:999px; padding:1px 6px; }' +
'.ebg-add { display:flex; gap:8px; }' +
'.ebg-add .eba-in { flex:1; }' +
'.ebg-hist { display:grid; gap:8px; }' +
'@media (max-width:1100px) { .ebg-grid { grid-template-columns:minmax(0,1fr); } .ebg-stagecol { order:-1; } }' +
'@media (prefers-reduced-motion:reduce) { .ebg-wincard, .ebg-win { animation:none; } .ebg-confetti { display:none; } }';

export default function GiveawayWheel(props) {
  const router = useRouter();
  // The admin page uses the admin API; the PIN page passes its own.
  const api = props.apiPath || '/api/admin/giveaways';
  const canEditHistory = props.canEditHistory !== false;
  const lang = props.lang === 'es' ? 'es' : 'en';
  const t = WHEEL_T[lang];
  const stageRef = useRef(null);
  const timer = useRef(null);

  const [title, setTitle] = useState('');
  const [entries, setEntries] = useState([]);
  const [bulk, setBulk] = useState('');
  const [one, setOne] = useState('');
  const [oncePerName, setOncePerName] = useState(true);
  const [removeWinner, setRemoveWinner] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [history, setHistory] = useState(props.history || []);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [reduced, setReduced] = useState(false);

  /* keep the list if the page refreshes */
  useEffect(function () {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (d) {
        setTitle(d.title || '');
        setEntries(Array.isArray(d.entries) ? d.entries : []);
        if (typeof d.oncePerName === 'boolean') setOncePerName(d.oncePerName);
        if (typeof d.removeWinner === 'boolean') setRemoveWinner(d.removeWinner);
      }
    } catch (e) {}
    setReduced(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    return function () { clearTimeout(timer.current); };
  }, []);
  useEffect(function () {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ title: title, entries: entries, oncePerName: oncePerName, removeWinner: removeWinner })); } catch (e) {}
  }, [title, entries, oncePerName, removeWinner]);
  useEffect(function () { setHistory(props.history || []); }, [props.history]);

  /* the names actually on the wheel */
  const wheel = useMemo(function () {
    if (!oncePerName) return entries;
    const seen = new Set();
    return entries.filter(function (n) { const k = n.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  }, [entries, oncePerName]);

  const grouped = useMemo(function () {
    const map = new Map();
    entries.forEach(function (n) { const k = n.toLowerCase(); const g = map.get(k); if (g) g.count++; else map.set(k, { name: n, count: 1 }); });
    return Array.from(map.values());
  }, [entries]);

  const seg = wheel.length ? 360 / wheel.length : 360;
  const showLabels = wheel.length > 0 && wheel.length <= 80;
  const fontSize = Math.max(0.028, Math.min(0.085, 1.5 / Math.max(wheel.length, 1)));

  function addNames(text) {
    const names = String(text).split(/[\n,;]+/).map(cleanName).filter(Boolean);
    if (!names.length) return;
    setEntries(function (cur) { return cur.concat(names).slice(0, 2000); });
    setWinner(null);
    setError('');
  }

  function removeOne(name) {
    setEntries(function (cur) {
      const i = cur.findIndex(function (n) { return n.toLowerCase() === name.toLowerCase(); });
      if (i < 0) return cur;
      const next = cur.slice(); next.splice(i, 1); return next;
    });
  }

  function removeAll(name) {
    setEntries(function (cur) { return cur.filter(function (n) { return n.toLowerCase() !== name.toLowerCase(); }); });
  }

  function shuffle() {
    setEntries(function (cur) {
      const a = cur.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = fairIndex(i + 1); const t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    });
  }

  function clearAll() {
    if (entries.length && !confirm(t.clearConfirm(entries.length))) return;
    setEntries([]);
    setWinner(null);
  }

  function wonBefore(name) {
    const k = name.toLowerCase();
    const cutoff = Date.now() - 30 * 86400000;
    return history.find(function (h) { return h.winner.toLowerCase() === k && new Date(h.created_at).getTime() > cutoff; });
  }

  async function saveWinner(name, count) {
    try {
      const res = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', title: title, winner: name, entries: count }),
      });
      const data = await res.json().catch(function () { return {}; });
      if (res.status === 401 && props.onLocked) props.onLocked();
      if (!res.ok) throw new Error(data.error || 'save failed');
      setHistory(function (h) { return [data.item].concat(h); });
      router.refresh();
      return data.item;
    } catch (e) {
      setError(t.saveFailed);
      return null;
    }
  }

  function spin() {
    if (spinning || wheel.length < 2) {
      if (wheel.length < 2) setError(t.needTwo);
      return;
    }
    setError('');
    setWinner(null);
    setCopied(false);

    const idx = fairIndex(wheel.length);
    const name = wheel[idx];
    const mid = idx * seg + seg / 2;
    const jitter = (Math.random() - 0.5) * seg * 0.7;
    const current = ((rotation % 360) + 360) % 360;
    const target = (((-mid + jitter) % 360) + 360) % 360;
    const extra = ((target - current) + 360) % 360;
    const turns = reduced ? 1 : 7 + fairIndex(3);
    const next = rotation + turns * 360 + extra;

    const count = wheel.length;
    const previous = wonBefore(name);
    setSpinning(true);
    setRotation(next);
    timer.current = setTimeout(async function () {
      setSpinning(false);
      const saved = await saveWinner(name, count);
      setWinner({ name: name, previous: previous, saved: saved, count: count });
    }, reduced ? 900 : SPIN_MS);
  }

  function keepGoing() {
    if (winner && removeWinner) removeAll(winner.name);
    setWinner(null);
  }

  async function undoWinner() {
    if (!winner) return;
    if (winner.saved) {
      await fetch(api, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: winner.saved.id }),
      });
      setHistory(function (h) { return h.filter(function (x) { return x.id !== winner.saved.id; }); });
      router.refresh();
    }
    setWinner(null);
  }

  async function copyAnnouncement() {
    if (!winner) return;
    const text = t.announce(winner.name, title);
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch (e) {}
  }

  function fullscreen() {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }

  async function removeHistory(h) {
    if (!confirm(t.removeConfirm(h.winner))) return;
    await fetch(api, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: h.id }),
    });
    setHistory(function (cur) { return cur.filter(function (x) { return x.id !== h.id; }); });
    router.refresh();
  }

  const confetti = useMemo(function () {
    const colors = ['#eda033', '#da5e16', '#f6d3a8', '#ffffff', '#fcefdc'];
    return Array.from({ length: 70 }, function (_, i) {
      return {
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 2.2 + Math.random() * 1.8,
        color: colors[i % colors.length],
        rot: Math.random() * 360,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner && winner.name]);

  return (
    <>
      <style>{css}</style>

      <div className="ebg-grid">
        <div className="eba-panel">
          <p className="eba-eyebrow">{t.step}</p>
          <h2>{t.whoIn}</h2>

          <div className="eba-field">
            <span className="eba-lb">{t.prizeQ}</span>
            <input className="eba-in" value={title} maxLength={140} placeholder={t.prizePh}
              onChange={function (e) { setTitle(e.target.value); }} />
          </div>

          <div className="eba-field" style={{ marginTop: 12 }}>
            <span className="eba-lb">{t.addName}</span>
            <form className="ebg-add" onSubmit={function (e) { e.preventDefault(); addNames(one); setOne(''); }}>
              <input className="eba-in" value={one} maxLength={60} placeholder="Maria Lopez" disabled={spinning}
                onChange={function (e) { setOne(e.target.value); }} />
              <button className="eba-btn eba-btn-dark" type="submit" disabled={!one.trim() || spinning}>{t.add}</button>
            </form>
          </div>

          <div className="eba-field" style={{ marginTop: 12 }}>
            <span className="eba-lb">{t.pasteList}</span>
            <textarea className="eba-in" rows={4} value={bulk} disabled={spinning}
              placeholder={'Maria Lopez\nAna G.\nJessica R.'}
              onChange={function (e) { setBulk(e.target.value); }} />
            <div className="eba-actions" style={{ marginTop: 8 }}>
              <button className="eba-btn" type="button" disabled={!bulk.trim() || spinning} onClick={function () { addNames(bulk); setBulk(''); }}>
                {t.addList}
              </button>
            </div>
          </div>

          <div className="eba-checks">
            <label className="eba-check">
              <input type="checkbox" checked={oncePerName} onChange={function (e) { setOncePerName(e.target.checked); }} />
              <span>{t.once}</span>
            </label>
            <label className="eba-check">
              <input type="checkbox" checked={removeWinner} onChange={function (e) { setRemoveWinner(e.target.checked); }} />
              <span>{t.removeWin}</span>
            </label>
          </div>
          <p className="eba-muted" style={{ margin: '8px 0 0' }}>
            {oncePerName ? t.onceHint : t.multiHint}
          </p>

          <div className="eba-panelhead" style={{ marginTop: 18 }}>
            <div><span className="eba-lb" style={{ margin: 0 }}>{t.onWheel} &middot; {wheel.length}</span></div>
            <span className="eba-rowbtns">
              <button className="eba-btn mini" type="button" disabled={entries.length < 2 || spinning} onClick={shuffle}>{t.shuffle}</button>
              <button className="eba-btn mini" type="button" disabled={!entries.length || spinning} onClick={clearAll}>{t.clearAll}</button>
            </span>
          </div>
          {grouped.length ? (
            <div className="ebg-chips" style={{ marginTop: 10 }}>
              {grouped.map(function (g) {
                return (
                  <span className="ebg-chip" key={g.name.toLowerCase()}>
                    <span>{g.name}</span>
                    {!oncePerName && g.count > 1 && <span className="c">&times;{g.count}</span>}
                    <button className="x" type="button" aria-label={t.removeLabel(g.name)} disabled={spinning}
                      onClick={function () { oncePerName ? removeAll(g.name) : removeOne(g.name); }}>&times;</button>
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="eba-empty" style={{ marginTop: 10, padding: '24px 14px' }}>{t.noNames}</div>
          )}
        </div>

        <div className="ebg-stagecol">
          <div className="ebg-stage" ref={stageRef}>
            <p className="ebg-prize">{title || t.giveaway}</p>
            <p className="ebg-count">{wheel.length} {wheel.length === 1 ? t.entry : t.entries}</p>

            <div className="ebg-wheelwrap">
              <span className="ebg-pointer" aria-hidden="true" />
              {wheel.length ? (
                <div className="ebg-wheel" style={{
                  transform: 'rotate(' + rotation + 'deg)',
                  transition: spinning ? 'transform ' + (reduced ? 900 : SPIN_MS) + 'ms cubic-bezier(.12,.62,.08,1)' : 'none',
                }}>
                  <svg viewBox="-1.02 -1.02 2.04 2.04" role="img" aria-label={t.wheelLabel}>
                    {wheel.length === 1 ? (
                      <circle r="1" fill={COLORS[0].fill} />
                    ) : (
                      wheel.map(function (n, i) {
                        const c = COLORS[wheel.length % 4 === 1 && i === wheel.length - 1 ? 1 : i % 4];
                        return <path key={i} d={slicePath(i * seg, (i + 1) * seg)} fill={c.fill} stroke="#fff" strokeWidth={wheel.length > 60 ? 0.002 : 0.006} />;
                      })
                    )}
                    {showLabels && wheel.map(function (n, i) {
                      const c = COLORS[wheel.length % 4 === 1 && i === wheel.length - 1 ? 1 : i % 4];
                      const mid = i * seg + seg / 2;
                      const label = n.length > 18 ? n.slice(0, 17) + '…' : n;
                      return (
                        <text key={'t' + i} transform={'rotate(' + (mid - 90) + ')'} x="0.9" y="0" textAnchor="end" dominantBaseline="central"
                          fontSize={fontSize} fill={c.text} fontFamily="Recoleta, Georgia, serif">
                          {label}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              ) : (
                <div className="ebg-empty">{t.emptyWheel}</div>
              )}
              <button className="ebg-hub" type="button" onClick={spin} disabled={spinning || wheel.length < 2}>
                {spinning ? '…' : t.spinHub}
              </button>
            </div>

            <div className="ebg-controls">
              <button className="eba-btn eba-btn-dark" type="button" onClick={spin} disabled={spinning || wheel.length < 2}>
                {spinning ? t.spinning : t.spinBtn}
              </button>
              <button className="eba-btn" type="button" onClick={fullscreen}>{t.fullscreen}</button>
            </div>
            {error && <div className="eba-err" style={{ textAlign: 'left' }}>{error}</div>}
            {!showLabels && wheel.length > 0 && <p className="eba-muted" style={{ marginTop: 10 }}>{t.tooMany}</p>}

            {winner && (
              <div className="ebg-win" role="dialog" aria-label={t.winnerLabel}>
                <div className="ebg-confetti" aria-hidden="true">
                  {confetti.map(function (p, i) {
                    return <i key={i} style={{ left: p.left + '%', background: p.color, animationDelay: p.delay + 's', animationDuration: p.dur + 's', transform: 'rotate(' + p.rot + 'deg)' }} />;
                  })}
                </div>
                <div className="ebg-wincard">
                  <span className="lb">{t.winner}</span>
                  <p className="nm">{winner.name}</p>
                  <p className="pz">{title || t.giveaway} &middot; {t.pickedFrom(winner.count)}</p>
                  {winner.previous && (
                    <p className="warn">
                      {t.headsUp(winner.previous.winner, winner.previous.title,
                        new Date(winner.previous.created_at).toLocaleDateString(LOCALE[lang], { month: 'short', day: 'numeric' }))}
                    </p>
                  )}
                  <div className="eba-actions">
                    <button className="eba-btn eba-btn-dark" type="button" onClick={keepGoing}>
                      {removeWinner ? t.doneRemove : t.done}
                    </button>
                    <button className="eba-btn" type="button" onClick={copyAnnouncement}>{copied ? t.copied : t.copy}</button>
                    <button className="eba-btn" type="button" onClick={undoWinner}>{t.redo}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">{t.history}</p>
            <h2>{t.pastWinners}</h2>
          </div>
        </div>
        {history.length ? (
          <div className="eba-rows">
            {history.map(function (h) {
              const sub = [
                new Date(h.created_at).toLocaleString(LOCALE[lang], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
                h.entries ? h.entries + ' ' + t.entries : null,
                h.picked_by ? t.spunBy + ' ' + h.picked_by.split('@')[0] : null,
              ].filter(Boolean).join(' · ');
              return (
                <div className="eba-row" key={h.id}>
                  <span className="eba-who">
                    <span className="n">{h.winner}</span>
                    <span className="s">{sub}</span>
                  </span>
                  <span className="eba-pill ok">{h.title}</span>
                  {canEditHistory && (
                    <span className="eba-rowbtns">
                      <button className="eba-btn mini" type="button" onClick={function () { removeHistory(h); }}>{t.remove}</button>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="eba-empty">{t.noHistory}</div>
        )}
      </div>
    </>
  );
}
