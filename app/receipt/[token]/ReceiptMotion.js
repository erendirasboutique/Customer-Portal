'use client';

/* ============================================================
   Moving parts for the receipt page (/receipt/<token>).
   - ReceiptStage: optional full-screen video intro that plays once,
     then fades away and replays the confirmation animation.
   - HeaderVideo:  optional video that plays behind the brown header.
   - CountUp:      the amount counting up from $0.00.
   Everything here respects "Reduce motion" on the customer's phone.
   ============================================================ */

import { createContext, useContext, useEffect, useRef, useState } from 'react';

const Stage = createContext({ startedAt: 0 });

function reducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}

function playMuted(v) {
  if (!v) return;
  // React doesn't print the "muted" attribute in server HTML, and phones
  // only autoplay muted video — so set it here before playing.
  v.muted = true;
  v.defaultMuted = true;
  v.setAttribute('muted', '');
  const p = v.play();
  if (p && p.catch) p.catch(function () {});
}

/* ---------- full-screen intro (VIDEO_MODE = 'intro') ---------- */
export default function ReceiptStage(props) {
  const intro = !!props.video && props.mode === 'intro';
  const [show, setShow] = useState(intro);
  const [fading, setFading] = useState(false);
  const [round, setRound] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const vid = useRef(null);
  const done = useRef(false);

  useEffect(function () {
    if (!intro) return;
    let seen = false;
    try { seen = props.once && sessionStorage.getItem(props.storageKey) === '1'; } catch (e) {}
    if (seen || reducedMotion()) { done.current = true; setShow(false); return; }
    playMuted(vid.current);
    const safety = setTimeout(finish, (props.maxSeconds || 10) * 1000);
    return function () { clearTimeout(safety); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    if (done.current) return;
    done.current = true;
    try { sessionStorage.setItem(props.storageKey, '1'); } catch (e) {}
    setFading(true);
    // Remount the receipt so its confirmation animation plays fresh.
    setStartedAt(performance.now());
    setRound(function (n) { return n + 1; });
    setTimeout(function () { setShow(false); }, 450);
  }

  return (
    <Stage.Provider value={{ startedAt: startedAt }}>
      {show ? (
        <div className={'rc-intro no-print' + (fading ? ' out' : '')} aria-hidden="true">
          <video
            ref={vid}
            src={props.video}
            poster={props.poster || undefined}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={finish}
            onError={finish}
          />
          <button type="button" className="rc-skip" onClick={finish}>{props.skipLabel || 'Skip'}</button>
        </div>
      ) : null}
      <div key={round} className="rc-stage">{props.children}</div>
    </Stage.Provider>
  );
}

/* ---------- video behind the brown header (VIDEO_MODE = 'header') ---------- */
export function HeaderVideo(props) {
  const vid = useRef(null);
  useEffect(function () {
    if (reducedMotion()) { if (vid.current) vid.current.pause(); return; }
    playMuted(vid.current);
  }, []);
  return (
    <video
      ref={vid}
      className="rc-hvideo"
      src={props.src}
      poster={props.poster || undefined}
      autoPlay
      muted
      playsInline
      loop={!!props.loop}
      preload="auto"
      aria-hidden="true"
    />
  );
}

/* ---------- $0.00 → $53.00 ---------- */
export function CountUp(props) {
  const stage = useContext(Stage);
  const target = Math.round(Number(props.value || 0) * 100);
  const [cents, setCents] = useState(target); // server + no-JS show the real amount
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: String(props.currency || 'usd').toUpperCase() });

  useEffect(function () {
    if (reducedMotion() || !target) return;
    const delay = props.delay == null ? 1000 : props.delay;
    const dur = props.duration || 900;
    const since = performance.now() - stage.startedAt;
    // Page was slow to load and the number is already showing — leave it.
    if (since > delay - 100) return;
    let timer = null;
    let wait = null;
    // If they hit print/save before the count finishes, show the real amount.
    function full() { clearTimeout(wait); clearInterval(timer); setCents(target); }
    window.addEventListener('beforeprint', full);
    setCents(0);
    wait = setTimeout(function () {
      const start = performance.now();
      timer = setInterval(function () {
        const p = Math.min(1, (performance.now() - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setCents(Math.round(target * eased));
        if (p >= 1) clearInterval(timer);
      }, 30);
    }, delay - since);
    return function () { window.removeEventListener('beforeprint', full); clearTimeout(wait); clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return <span aria-label={fmt.format(target / 100)}>{fmt.format(cents / 100)}</span>;
}
