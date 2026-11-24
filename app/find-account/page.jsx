// app/find-account/page.jsx
// "Find my account" for customers with no email or phone on file.
// Opens in Spanish; add ?lang=en for English. See lib/findAccount.js.

"use client";

import { useEffect, useState } from "react";

const T = {
  en: {
    title: "Find your account",
    intro: "No email or phone on file? Enter these three things and we'll take you to your account.",
    lastName: "Last name",
    lastNameHint: "The last name we ship to",
    zip: "ZIP code",
    code: "Order number or tracking number",
    codeHint: "Your order number (like EB-2441) or the last 4 digits of the tracking number on one of your packages.",
    submit: "Find my account",
    finding: "Looking...",
    notFound: "We couldn't find an account with those details. Check them and try again, or contact us and we'll send you your link.",
    tooMany: "Too many tries. Please wait an hour, or contact us and we'll send you your link.",
    missing: "Please fill in all three.",
    error: "Something went wrong. Please try again in a moment.",
    privacy: "For your security we never show whose details didn't match, and we limit how many times anyone can try.",
    haveEmail: "Have an email on file?",
    signIn: "Get a sign-in link",
    contact: "Contact us",
    langShort: "ES",
    langLabel: "Ver en español",
  },
  es: {
    title: "Encuentra tu cuenta",
    intro: "¿No tienes correo ni teléfono registrado? Escribe estos tres datos y te llevamos a tu cuenta.",
    lastName: "Apellido",
    lastNameHint: "El apellido al que enviamos tus pedidos",
    zip: "Código postal",
    code: "Número de pedido o de rastreo",
    codeHint: "Tu número de pedido (como EB-2441) o los últimos 4 dígitos del número de rastreo de uno de tus paquetes.",
    submit: "Buscar mi cuenta",
    finding: "Buscando...",
    notFound: "No encontramos una cuenta con esos datos. Revísalos e intenta de nuevo, o escríbenos y te enviamos tu enlace.",
    tooMany: "Demasiados intentos. Espera una hora, o escríbenos y te enviamos tu enlace.",
    missing: "Llena los tres datos, por favor.",
    error: "Algo salió mal. Intenta de nuevo en un momento.",
    privacy: "Por tu seguridad nunca mostramos qué dato no coincidió, y limitamos cuántas veces se puede intentar.",
    haveEmail: "¿Tienes correo registrado?",
    signIn: "Recibe un enlace para entrar",
    contact: "Escríbenos",
    langShort: "EN",
    langLabel: "View in English",
  },
};

export default function FindAccountPage() {
  const [lang, setLang] = useState("es");
  const [lastName, setLastName] = useState("");
  const [zip, setZip] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const t = T[lang];

  useEffect(function () {
    const l = new URLSearchParams(window.location.search).get("lang");
    if (l === "en" || l === "es") setLang(l);
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (!lastName.trim() || !/\d{5}/.test(zip) || code.replace(/\W/g, "").length < 4) {
      setMsg("missing");
      return;
    }
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

          <label className="fa-field">
            <span className="fa-label">{t.code}</span>
            <input
              className="fa-in"
              value={code}
              onChange={function (e) { setCode(e.target.value); setMsg(""); }}
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={40}
              placeholder="EB-2441"
            />
            <span className="fa-hint">{t.codeHint}</span>
          </label>

          {msg ? <p role="alert" className="fa-err">{t[msg]}</p> : null}

          <button type="submit" className="fa-btn" disabled={busy}>{busy ? t.finding : t.submit}</button>
          <p className="fa-note">{t.privacy}</p>
        </form>

        <div className="fa-links">
          <span>{t.haveEmail} <a href="/">{t.signIn}</a></span>
          <a href="https://help.erendirasboutique.com" target="_blank" rel="noopener noreferrer">{t.contact}</a>
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
.fa-card { background:#fff; border-radius:24px; padding:20px 16px 16px; display:flex; flex-direction:column; gap:14px; }
.fa-field { display:flex; flex-direction:column; gap:6px; }
.fa-label { padding:0 4px; font-size:13px; font-weight:600; }
.fa-hint { padding:0 4px; font-size:12.5px; line-height:1.45; color:var(--brand); }
.fa-in { width:100%; min-height:54px; border:1px solid var(--sand); border-radius:14px; padding:0 16px; font:16px Inter, sans-serif; color:var(--ink); background:var(--bg); outline:none; -webkit-appearance:none; appearance:none; }
.fa-in:focus { border-color:var(--brand); background:#fff; }
.fa-in::placeholder { color:var(--brand); opacity:.6; }
.fa-err { margin:0; font-size:14px; line-height:1.45; color:var(--err); }
.fa-btn { min-height:54px; border:0; border-radius:16px; background:var(--brand); color:#fff; font:600 16px Inter, sans-serif; cursor:pointer; }
.fa-btn:disabled { opacity:.6; cursor:wait; }
.fa-note { margin:0; padding:0 4px; font-size:12.5px; line-height:1.45; color:var(--brand); }
.fa-links { display:flex; flex-direction:column; align-items:center; gap:10px; margin-top:6px; font-size:14px; text-align:center; }
`;
