// app/find-account/page.jsx
// "Find my account" for customers with no email or phone on file.
// One page: pick what you have handy (a package or an order number), then
// last name and ZIP. Opens in Spanish; add ?lang=en for English.
// See lib/findAccount.js for the matching rules.

"use client";

import { useEffect, useState } from "react";

const T = {
  en: {
    title: "Find your account",
    intro: "No email or phone on file? Tell us a few things and we'll take you to your account.",
    handy: "What do you have handy?",
    havePackage: "One of my packages",
    haveOrder: "My order number",
    labelTop: "GROUND ADVANTAGE",
    labelShip: "SHIP TO:",
    labelName: "[NAME]",
    labelAddress: "[ADDRESS]",
    labelHelp: "On the shipping label, find the tracking number under the barcode. We only need the",
    labelHelpBold: "last 4 digits",
    digits: "Last 4 digits of the tracking number",
    orderHelp: "Your order number starts with EB. You'll find it on your packing slip or in your shipping messages.",
    order: "Order number",
    lastName: "Last name",
    lastNameHint: "The last name we ship to",
    zip: "ZIP code",
    submit: "Find my account",
    finding: "Looking...",
    notFound: "We couldn't find an account with those details. Check them and try again, or contact us and we'll send you your link.",
    tooMany: "Too many tries. Please wait an hour, or contact us and we'll send you your link.",
    missingDigits: "Enter the last 4 digits of the tracking number.",
    missingOrder: "Enter your order number, like EB-2441.",
    missing: "Please fill in your last name and ZIP code.",
    error: "Something went wrong. Please try again in a moment.",
    privacy: "For your security we never show which detail didn't match, and we limit how many times anyone can try.",
    haveEmail: "Have an email on file?",
    signIn: "Get a sign-in link",
    noneHandy: "Don't have either?",
    contact: "Contact us",
    langShort: "ES",
    langLabel: "Ver en español",
  },
  es: {
    title: "Encuentra tu cuenta",
    intro: "¿No tienes correo ni teléfono registrado? Danos unos datos y te llevamos a tu cuenta.",
    handy: "¿Qué tienes a la mano?",
    havePackage: "Uno de mis paquetes",
    haveOrder: "Mi número de pedido",
    labelTop: "GROUND ADVANTAGE",
    labelShip: "SHIP TO:",
    labelName: "[NOMBRE]",
    labelAddress: "[DIRECCIÓN]",
    labelHelp: "En la etiqueta de envío, busca el número de rastreo debajo del código de barras. Solo necesitamos los",
    labelHelpBold: "últimos 4 dígitos",
    digits: "Últimos 4 dígitos del rastreo",
    orderHelp: "Tu número de pedido empieza con EB. Lo encuentras en tu hoja de empaque o en los mensajes de envío.",
    order: "Número de pedido",
    lastName: "Apellido",
    lastNameHint: "El apellido al que enviamos tus pedidos",
    zip: "Código postal",
    submit: "Buscar mi cuenta",
    finding: "Buscando...",
    notFound: "No encontramos una cuenta con esos datos. Revísalos e intenta de nuevo, o escríbenos y te enviamos tu enlace.",
    tooMany: "Demasiados intentos. Espera una hora, o escríbenos y te enviamos tu enlace.",
    missingDigits: "Escribe los últimos 4 dígitos del número de rastreo.",
    missingOrder: "Escribe tu número de pedido, como EB-2441.",
    missing: "Escribe tu apellido y código postal, por favor.",
    error: "Algo salió mal. Intenta de nuevo en un momento.",
    privacy: "Por tu seguridad nunca mostramos qué dato no coincidió, y limitamos cuántas veces se puede intentar.",
    haveEmail: "¿Tienes correo registrado?",
    signIn: "Recibe un enlace para entrar",
    noneHandy: "¿No tienes ninguno?",
    contact: "Escríbenos",
    langShort: "EN",
    langLabel: "View in English",
  },
};

export default function FindAccountPage() {
  const [lang, setLang] = useState("es");
  const [kind, setKind] = useState("package"); // package | order
  const [digits, setDigits] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [lastName, setLastName] = useState("");
  const [zip, setZip] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const t = T[lang];

  useEffect(function () {
    const q = new URLSearchParams(window.location.search);
    const l = q.get("lang");
    if (l === "en" || l === "es") setLang(l);
    // From the sign-in page's label scan: the tracking number's last 4 digits.
    const last4 = (q.get("last4") || "").replace(/\D/g, "").slice(0, 4);
    if (last4.length === 4) setDigits(last4);
  }, []);

  function pick(next) {
    setKind(next);
    setMsg("");
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    let code;
    if (kind === "package") {
      if (!/^\d{4}$/.test(digits)) { setMsg("missingDigits"); return; }
      code = digits;
    } else {
      const n = orderNo.replace(/\D/g, "");
      if (!n) { setMsg("missingOrder"); return; }
      code = "EB-" + n;
    }
    if (!lastName.trim() || !/\d{5}/.test(zip)) { setMsg("missing"); return; }

    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/account/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastName: lastName, zip: zip, code: code }),
      });
      const data = await res.json().catch(function () { return {}; });
      if (res.ok && data.token) {
        window.location.href = "/account?t=" + encodeURIComponent(data.token) + "&lang=" + lang;
        return;
      }
      setMsg(res.status === 404 ? "notFound" : res.status === 429 ? "tooMany" : res.status === 422 ? "missing" : "error");
    } catch (err) {
      setMsg("error");
    }
    setBusy(false);
  }

  const isPackage = kind === "package";

  return (
    <main className="fa">
      <style>{css}</style>
      <div className="fa-wrap">
        <div className="fa-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.png" alt="Erendira's Boutique" className="fa-logo" />
          <button type="button" className="fa-lang" aria-label={t.langLabel} onClick={function () { setLang(lang === "es" ? "en" : "es"); setMsg(""); }}>
            {t.langShort}
          </button>
        </div>

        <h1 className="fa-h1">{t.title}</h1>
        <p className="fa-intro">{t.intro}</p>

        <form className="fa-card" onSubmit={submit} noValidate>
          <fieldset className="fa-choose">
            <legend className="fa-label">{t.handy}</legend>
            <div className="fa-choices">
              <button type="button" className={"fa-choice" + (isPackage ? " on" : "")} aria-pressed={isPackage} onClick={function () { pick("package"); }}>
                <span className="fa-choice-ico" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z" /><path d="M3 7.5L12 12l9-4.5M12 12v9" /></svg>
                </span>
                {t.havePackage}
              </button>
              <button type="button" className={"fa-choice" + (!isPackage ? " on" : "")} aria-pressed={!isPackage} onClick={function () { pick("order"); }}>
                <span className="fa-choice-ico" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h9l5 5v15H6zM15 2v5h5M9 12h6M9 16h6" /></svg>
                </span>
                {t.haveOrder}
              </button>
            </div>
          </fieldset>

          {isPackage ? (
            <>
              <figure className="fa-label-fig">
                {/* A sample shipping label, showing where the last 4 digits are. */}
                <div className="fa-ship" aria-hidden="true">
                  <div className="fa-ship-row"><span>{t.labelTop}</span><span>LBS 1</span></div>
                  <div className="fa-ship-line" />
                  <div className="fa-ship-to">{t.labelShip}<br />{t.labelName}<br />{t.labelAddress}</div>
                  <div className="fa-ship-line" />
                  <div className="fa-ship-tn">TRACKING #</div>
                  <div className="fa-ship-bars" />
                  <div className="fa-ship-num">9400 1000 0000 0000 00<span>8507</span></div>
                </div>
                <figcaption>
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
                  <span>{t.labelHelp} <b>{t.labelHelpBold}</b>.</span>
                </figcaption>
              </figure>
              <label className="fa-field">
                <span className="fa-label">{t.digits}</span>
                <input
                  className="fa-in fa-digits"
                  value={digits}
                  onChange={function (e) { setDigits(e.target.value.replace(/\D/g, "").slice(0, 4)); setMsg(""); }}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  placeholder="8507"
                />
              </label>
            </>
          ) : (
            <>
              <p className="fa-order-help">
                <span className="fa-pill" aria-hidden="true">EB-2441</span>
                <span>{t.orderHelp}</span>
              </p>
              <label className="fa-field">
                <span className="fa-label">{t.order}</span>
                <input
                  className="fa-in"
                  value={orderNo}
                  onChange={function (e) { setOrderNo(e.target.value); setMsg(""); }}
                  autoComplete="off"
                  autoCapitalize="characters"
                  maxLength={12}
                  placeholder="EB-2441"
                />
              </label>
            </>
          )}

          <label className="fa-field">
            <span className="fa-label">{t.lastName}</span>
            <input
              className="fa-in"
              value={lastName}
              onChange={function (e) { setLastName(e.target.value); setMsg(""); }}
              autoComplete="family-name"
              autoCapitalize="words"
              maxLength={60}
            />
            <span className="fa-hint">{t.lastNameHint}</span>
          </label>

          <label className="fa-field">
            <span className="fa-label">{t.zip}</span>
            <input
              className="fa-in"
              value={zip}
              onChange={function (e) { setZip(e.target.value); setMsg(""); }}
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={10}
            />
          </label>

          {msg ? <p role="alert" className="fa-err">{t[msg]}</p> : null}

          <button type="submit" className="fa-btn" disabled={busy}>{busy ? t.finding : t.submit}</button>
          <p className="fa-note">{t.privacy}</p>
        </form>

        <div className="fa-links">
          <span>{t.haveEmail} <a href="/">{t.signIn}</a></span>
          <span>{t.noneHandy} <a href="https://help.erendirasboutique.com" target="_blank" rel="noopener noreferrer">{t.contact}</a></span>
        </div>
      </div>
    </main>
  );
}

const css = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");
.fa { --bg:var(--brand-cream, #F5F3EF); --brand:var(--brand-taupe, #957f67); --sand:var(--brand-sand, #cfbda9); --ink:var(--brand-ink, #5F4E3D); --err:#a8452a;
  min-height:100vh; background:var(--bg); color:var(--ink); font-family:Inter, system-ui, sans-serif; -webkit-font-smoothing:antialiased; padding:16px 16px 40px; box-sizing:border-box; }
.fa *, .fa *::before, .fa *::after { box-sizing:border-box; }
.fa a { color:var(--ink); font-weight:500; }
.fa-wrap { max-width:440px; margin:0 auto; display:flex; flex-direction:column; gap:16px; }
.fa-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
.fa-logo { width:118px; height:auto; display:block; }
.fa-lang { min-width:44px; min-height:44px; padding:0 14px; border:0; border-radius:999px; background:#fff; color:var(--ink); font:600 13px Inter, sans-serif; cursor:pointer; }
.fa-h1 { margin:0; padding:0 4px; font-family:var(--font-heading, Georgia, serif); font-weight:400; font-size:34px; line-height:1.06; }
.fa-intro { margin:0; padding:0 4px; font-size:15px; line-height:1.5; }
.fa-card { background:#fff; border-radius:24px; padding:20px 16px 16px; display:flex; flex-direction:column; gap:16px; }
.fa-field { display:flex; flex-direction:column; gap:6px; }
.fa-label { padding:0 4px; font-size:13px; font-weight:600; }
.fa-hint { padding:0 4px; font-size:12.5px; line-height:1.45; color:var(--brand); }
.fa-in { width:100%; min-height:54px; border:1px solid var(--sand); border-radius:14px; padding:0 16px; font:16px Inter, sans-serif; color:var(--ink); background:var(--bg); outline:none; -webkit-appearance:none; appearance:none; }
.fa-in:focus { border-color:var(--brand); background:#fff; }
.fa-in::placeholder { color:var(--brand); opacity:.55; }
.fa-digits { font-size:26px; letter-spacing:.5em; text-align:center; padding-left:calc(16px + .5em); font-variant-numeric:tabular-nums; }

.fa-choose { border:0; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
.fa-choose legend { margin-bottom:8px; }
.fa-choices { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px; }
.fa-choice { min-height:96px; border-radius:18px; border:2px solid var(--bg); background:var(--bg); color:var(--ink); display:flex; flex-direction:column; align-items:flex-start;
  justify-content:space-between; gap:10px; padding:12px 14px; text-align:left; font:600 14.5px/1.25 Inter, sans-serif; cursor:pointer; }
.fa-choice.on { border-color:var(--brand); background:#fff; }
.fa-choice-ico { width:36px; height:36px; border-radius:12px; background:#fff; color:var(--brand); display:grid; place-items:center; }
.fa-choice.on .fa-choice-ico { background:var(--brand); color:#fff; }

.fa-label-fig { margin:0; display:flex; flex-direction:column; gap:10px; }
.fa-ship { border:1.5px solid var(--ink); border-radius:6px; padding:12px; background:#fff; display:flex; flex-direction:column; gap:8px; color:var(--ink); }
.fa-ship-row { display:flex; justify-content:space-between; font-size:10px; font-weight:600; letter-spacing:.06em; }
.fa-ship-line { height:1px; background:var(--ink); }
.fa-ship-to { font-size:9.5px; line-height:1.4; }
.fa-ship-tn { text-align:center; font-size:9.5px; font-weight:600; letter-spacing:.08em; }
.fa-ship-bars { height:44px; background:repeating-linear-gradient(90deg, var(--ink) 0 2px, transparent 2px 4px, var(--ink) 4px 5px, transparent 5px 8px, var(--ink) 8px 11px, transparent 11px 12px); }
.fa-ship-num { text-align:center; font-size:13px; letter-spacing:.06em; font-variant-numeric:tabular-nums; }
.fa-ship-num span { padding:1px 4px; border-radius:4px; background:var(--brand); color:#fff; font-weight:600; }
.fa-label-fig figcaption { display:flex; gap:8px; align-items:flex-start; font-size:13.5px; line-height:1.45; }
.fa-label-fig figcaption svg { flex:none; margin-top:1px; color:var(--brand); }

.fa-order-help { margin:0; display:flex; gap:12px; align-items:flex-start; padding:14px; border-radius:16px; background:var(--bg); font-size:13.5px; line-height:1.5; }
.fa-pill { flex:none; padding:6px 10px; border-radius:10px; background:#fff; font-weight:600; }

.fa-err { margin:0; font-size:14px; line-height:1.45; color:var(--err); }
.fa-btn { min-height:54px; border:0; border-radius:16px; background:var(--brand); color:#fff; font:600 16px Inter, sans-serif; cursor:pointer; }
.fa-btn:disabled { opacity:.6; cursor:wait; }
.fa-note { margin:0; padding:0 4px; font-size:12.5px; line-height:1.45; color:var(--brand); }
.fa-links { display:flex; flex-direction:column; align-items:center; gap:10px; margin-top:6px; font-size:14px; text-align:center; }
`;
