// app/sms/page.jsx
// my.erendirasboutique.com/sms — customers sign up for texts here.
// Banner + benefits + a preview of the texts, then the form. The consent box
// starts unchecked (carriers require it). Sign-ups go to sms_subscribers,
// which the shipping portal checks before sending any text.

"use client";

import { useState } from "react";
import { SMS_CONSENT_ES, SMS_PRIVACY_URL, SMS_TERMS_URL } from "@/lib/smsConsent";

const ICONS = {
  box: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
  truck: <><path d="M1 4h14v11H1z" /><path d="M15 8h4l3 3v4h-7" /><circle cx="5.5" cy="17.5" r="2" /><circle cx="18" cy="17.5" r="2" /></>,
  live: <><circle cx="12" cy="12" r="3" /><path d="M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7" /></>,
  tag: <><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
};

function Icon({ name }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

const BENEFITS = [
  ["box", "Tu pedido, empacado", "Te avisamos en cuanto lo empacamos."],
  ["truck", "En camino y entregado", "Con tu número de rastreo, sin buscar nada."],
  ["live", "Cuando estemos en vivo", "Un aviso antes de cada live."],
  ["tag", "Ofertas y piezas nuevas", "Entérate antes que nadie."],
];

const PREVIEW = [
  ["Sáb 2:14 PM", "Erendira's Boutique: ¡Hola Chula! Tu pedido va en camino 🚚 Rastréalo aquí: track.erendirasboutique.com/…"],
  ["Mar 4:30 PM", "Erendira's Boutique: ¡Hola Chula! Estamos EN VIVO ahora con piezas nuevas 🛍️ ¡Te esperamos!"],
];

export default function SmsSignupPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // hidden field; bots fill it in
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!consent) return setError("Marca la casilla para aceptar los mensajes de texto.");
    setBusy(true);
    try {
      const res = await fetch("/api/sms-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, consent, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Algo salió mal. Intenta de nuevo.");
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sms">
      <style>{css}</style>

      {done ? (
        <main className="sms-done">
          <img className="sms-logo-plain" src="/brand/logo.png" alt="Erendira's Boutique" />
          <div className="sms-card sms-card--center">
            <div className="sms-check" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
            </div>
            <h1 className="sms-h1">¡Listo, te suscribiste!</h1>
            <p className="sms-p">Te acabamos de mandar un mensaje de bienvenida. Para dejar de recibir mensajes, responde STOP en cualquier momento.</p>
            <a className="sms-link" href="https://erendirasboutique.com">Volver a la tienda</a>
          </div>
        </main>
      ) : (
        <main>
          <header className="sms-band">
            <div className="sms-logo-chip">
              <img src="/brand/logo.png" alt="Erendira's Boutique" />
            </div>
            <h1 className="sms-band-h1">Nunca te pierdas un live</h1>
            <p className="sms-band-p">Tus pedidos y lives, directo a tu celular</p>
          </header>

          <section className="sms-benefits" aria-label="Qué vas a recibir">
            {BENEFITS.map(([icon, title, sub]) => (
              <div key={title} className="sms-benefit">
                <span className="sms-benefit-icon"><Icon name={icon} /></span>
                <span className="sms-benefit-text">
                  <span className="sms-benefit-title">{title}</span>
                  <span className="sms-benefit-sub">{sub}</span>
                </span>
              </div>
            ))}
          </section>

          <section className="sms-preview-wrap" aria-label="Ejemplo de mensajes">
            <p className="sms-eyebrow">Así se ven tus mensajes</p>
            <div className="sms-preview">
              <div className="sms-preview-head">
                <span className="sms-avatar" aria-hidden="true">EB</span>
                <span>Erendira&rsquo;s Boutique</span>
              </div>
              {PREVIEW.map(([when, text]) => (
                <div key={when} className="sms-msg">
                  <span className="sms-when">{when}</span>
                  <p className="sms-bubble">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <form className="sms-card sms-form" onSubmit={submit} noValidate>
            <label className="sms-field">
              <span className="sms-label">Nombre</span>
              <input className="sms-in" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
            </label>
            <label className="sms-field">
              <span className="sms-label">Número de celular</span>
              <input
                className="sms-in"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(000) 000-0000"
              />
            </label>
            <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="sms-hp" />

            <label className="sms-consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>{SMS_CONSENT_ES}</span>
            </label>

            {error ? <p role="alert" className="sms-err">{error}</p> : null}

            <button type="submit" className="sms-btn" disabled={busy}>{busy ? "Guardando…" : "Suscribirme"}</button>

            <p className="sms-fine">
              Al suscribirte aceptas nuestros <a href={SMS_TERMS_URL}>Términos de SMS</a> y nuestra{" "}
              <a href={SMS_PRIVACY_URL}>Política de privacidad de SMS</a>.
            </p>
          </form>
        </main>
      )}

      <footer className="sms-foot">
        <div className="sms-foot-links">
          <a href={SMS_TERMS_URL}>Términos SMS</a>
          <a href={SMS_PRIVACY_URL}>Privacidad SMS</a>
          <a href="https://erendirasboutique.com">Tienda</a>
        </div>
        <span>Erendira&rsquo;s Boutique · hello@erendirasboutique.com</span>
      </footer>
    </div>
  );
}

const css = `
.sms { --t: var(--brand-taupe, #957f67); --c: var(--brand-cream, #F5F3EF); --s: var(--brand-sand, #cfbda9); --ink: var(--brand-ink, #332b23);
  --muted: #6b5f53; --line: #EAE4DC; --head: var(--brand-font-heading, "Charman Serif", Georgia, serif); --body: var(--brand-font-body, "Ltt Recoleta", Georgia, serif);
  min-height: 100vh; background: var(--c); color: var(--ink); font-family: var(--body); max-width: 520px; margin: 0 auto; }
.sms a { color: var(--t); }
.sms-band { background: var(--t); color: #fff; padding: 32px 24px 40px; display: flex; flex-direction: column; align-items: center; gap: 18px; text-align: center; border-radius: 0 0 32px 32px; }
.sms-logo-chip { background: #fff; border-radius: 16px; padding: 10px 16px; }
.sms-logo-chip img { display: block; width: 140px; height: auto; }
.sms-band-h1 { margin: 0; font-family: var(--head); font-weight: 400; font-size: 34px; line-height: 1.1; }
.sms-band-p { margin: 0; font-size: 16px; line-height: 1.5; }
.sms-benefits { padding: 28px 24px 8px; display: flex; flex-direction: column; gap: 16px; }
.sms-benefit { display: flex; gap: 14px; align-items: flex-start; }
.sms-benefit-icon { width: 40px; height: 40px; border-radius: 12px; background: #fff; color: var(--t); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sms-benefit-text { display: flex; flex-direction: column; gap: 2px; }
.sms-benefit-title { font-size: 16px; }
.sms-benefit-sub { font-size: 13px; line-height: 1.4; color: var(--muted); }
.sms-preview-wrap { padding: 24px 24px 0; display: flex; flex-direction: column; gap: 10px; }
.sms-eyebrow { margin: 0; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--t); text-align: center; }
.sms-preview { background: #fff; border: 1px solid var(--line); border-radius: 28px; padding: 18px 16px; display: flex; flex-direction: column; gap: 12px; }
.sms-preview-head { display: flex; align-items: center; gap: 10px; padding-bottom: 10px; border-bottom: 1px solid var(--line); font-size: 14px; }
.sms-avatar { width: 34px; height: 34px; border-radius: 99px; background: var(--t); color: #fff; display: flex; align-items: center; justify-content: center; font-family: var(--head); font-size: 14px; }
.sms-msg { display: flex; flex-direction: column; gap: 4px; }
.sms-when { font: 11px -apple-system, system-ui, sans-serif; color: var(--muted); align-self: center; }
.sms-bubble { margin: 0; align-self: flex-start; max-width: 85%; background: var(--line); border-radius: 18px 18px 18px 4px; padding: 10px 14px; font: 14px/1.4 -apple-system, system-ui, sans-serif; color: var(--ink); }
.sms-card { background: #fff; border: 1px solid var(--line); border-radius: 24px; padding: 24px; }
.sms-form { margin: 24px; display: flex; flex-direction: column; gap: 18px; }
.sms-field { display: flex; flex-direction: column; gap: 6px; }
.sms-label { font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--t); }
.sms-in { min-height: 48px; padding: 0 16px; border: 1px solid var(--s); border-radius: 14px; font: 16px var(--body); color: var(--ink); background: #fff; outline: none; }
.sms-in:focus { border-color: var(--t); }
.sms-hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
.sms-consent { display: flex; gap: 12px; align-items: flex-start; font-size: 13px; line-height: 1.5; cursor: pointer; }
.sms-consent input { width: 22px; height: 22px; margin: 1px 0 0; flex-shrink: 0; accent-color: var(--t); }
.sms-err { margin: 0; font-size: 14px; color: #8a2b1f; }
.sms-btn { min-height: 52px; border: 0; border-radius: 99px; background: var(--t); color: #fff; font: 17px var(--body); letter-spacing: .5px; cursor: pointer; }
.sms-btn:disabled { opacity: .6; cursor: wait; }
.sms-fine { margin: 0; font-size: 12px; line-height: 1.6; color: var(--muted); text-align: center; }
.sms-done { padding: 40px 24px; display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center; }
.sms-logo-plain { width: 160px; height: auto; }
.sms-card--center { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 32px 24px; width: 100%; box-sizing: border-box; }
.sms-check { width: 56px; height: 56px; border-radius: 99px; background: var(--t); display: flex; align-items: center; justify-content: center; }
.sms-h1 { margin: 0; font-family: var(--head); font-weight: 400; font-size: 30px; color: var(--t); }
.sms-p { margin: 0; font-size: 16px; line-height: 1.5; color: var(--muted); }
.sms-link { margin-top: 6px; font-size: 15px; }
.sms-foot { padding: 8px 24px 32px; display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); text-align: center; }
.sms-foot-links { display: flex; gap: 14px; }
`;
