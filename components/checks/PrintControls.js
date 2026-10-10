"use client";

import { useEffect, useState } from "react";
import styles from "./checks.module.css";

/* Toolbar on the check print page (never printed).
   - Print check: marks it printed, then opens the print dialog.
   - Test on plain paper: prints a SAMPLE copy to check alignment
     against your check stock (does not mark the check printed).
   - Alignment: move everything left/right/up/down if your printer
     is a little off. Saved on this computer for next time. */

const STORE_KEY = "eb-check-offset";
const STEP = 0.03125; // 1/32 inch
const LIMIT = 0.5;

function clamp(n) {
  return Math.max(-LIMIT, Math.min(LIMIT, Math.round(n / STEP) * STEP));
}

function fmt(n) {
  if (!n) return "0";
  const sixteenths = Math.round(n * 32) / 2;
  return (n > 0 ? "+" : "−") + Math.abs(sixteenths) + "/16″";
}

export default function PrintControls({ checkId, canPrint }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [showAlign, setShowAlign] = useState(false);

  // Load saved alignment.
  useEffect(function () {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      if (typeof saved.x === "number") setX(clamp(saved.x));
      if (typeof saved.y === "number") setY(clamp(saved.y));
    } catch (e) {}
  }, []);

  // Apply + save alignment.
  useEffect(function () {
    const root = document.documentElement;
    root.style.setProperty("--ck-x", x + "in");
    root.style.setProperty("--ck-y", y + "in");
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ x: x, y: y })); } catch (e) {}
  }, [x, y]);

  // Remove the test-mode class after printing.
  useEffect(function () {
    function after() { document.documentElement.classList.remove("ck-test"); }
    window.addEventListener("afterprint", after);
    return function () { window.removeEventListener("afterprint", after); };
  }, []);

  async function printCheck() {
    if (!canPrint) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`/api/checks/${checkId}/print`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to mark the check as printed.");
      }

      document.documentElement.classList.remove("ck-test");
      window.print();
      setMessage("Print dialog opened. Confirm the physical check printed correctly.");
    } catch (error) {
      setMessage(error.message || "Unable to print.");
    } finally {
      setBusy(false);
    }
  }

  function printTest() {
    document.documentElement.classList.add("ck-test");
    setMessage("");
    setTimeout(function () { window.print(); }, 50);
  }

  return (
    <div className={`${styles.printToolbar} ck-noprint`}>
      <style>{css}</style>

      <div className="ckt-row">
        <button className={styles.button} disabled={busy || !canPrint} onClick={printCheck}>
          {busy ? "Preparing..." : "Print check"}
        </button>
        <button className={styles.secondaryButton} onClick={printTest}>
          Test on plain paper
        </button>
        <button className={styles.secondaryButton} onClick={function () { setShowAlign(!showAlign); }}>
          Alignment{x || y ? " ·  adjusted" : ""}
        </button>
        <button className={styles.secondaryButton} onClick={() => window.close()}>
          Close
        </button>
      </div>

      {!canPrint ? (
        <p className="ckt-note">This check needs to be approved before it can be printed.</p>
      ) : null}

      {showAlign ? (
        <div className="ckt-align">
          <div className="ckt-pad">
            <span>Left / right</span>
            <button type="button" onClick={function () { setX(clamp(x - STEP)); }} aria-label="Move left">←</button>
            <b>{fmt(x)}</b>
            <button type="button" onClick={function () { setX(clamp(x + STEP)); }} aria-label="Move right">→</button>
          </div>
          <div className="ckt-pad">
            <span>Up / down</span>
            <button type="button" onClick={function () { setY(clamp(y - STEP)); }} aria-label="Move up">↑</button>
            <b>{fmt(y)}</b>
            <button type="button" onClick={function () { setY(clamp(y + STEP)); }} aria-label="Move down">↓</button>
          </div>
          <button type="button" className="ckt-reset" onClick={function () { setX(0); setY(0); }}>Reset</button>
          <p className="ckt-help">
            Print a test on plain paper, hold it over a blank check against a window, and move it until the lines match.
            Each click moves 1/32″.
          </p>
        </div>
      ) : null}

      <p className="ckt-help">
        In the print window choose: <b>Paper Letter</b> · <b>Scale 100%</b> (not “Fit to page”) · <b>Margins None</b> ·
        turn off <b>Headers and footers</b>. Load check paper with the check at the top.
      </p>

      {message ? <p className="ckt-note">{message}</p> : null}
    </div>
  );
}

const css = `
.ckt-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.ckt-align { display:flex; flex-wrap:wrap; align-items:center; gap:10px 18px; margin-top:12px; padding:12px 14px; border:1px solid #e6dccf;
  border-radius:14px; background:#fff; }
.ckt-pad { display:flex; align-items:center; gap:6px; font-size:13px; }
.ckt-pad span { color:#7d6a56; margin-right:4px; }
.ckt-pad button, .ckt-reset { min-width:36px; height:34px; border:1px solid #e6dccf; border-radius:10px; background:#F5F3EF; color:#5f4e3d;
  font-size:15px; cursor:pointer; font-family:inherit; }
.ckt-reset { padding:0 12px; font-size:13px; }
.ckt-pad b { min-width:64px; text-align:center; font-weight:500; }
.ckt-help { flex-basis:100%; margin:8px 0 0; font-size:12.5px; line-height:1.5; color:#7d6a56; }
.ckt-note { margin:8px 0 0; font-size:13px; color:#5f4e3d; }
@media print { .ck-noprint { display:none !important; } }
`;
