// app/sms/page.jsx
// my.erendirasboutique.com/sms — customers sign up for texts here.
// Design D: big headline, the form right away, four small tags. The consent
// box starts unchecked (carriers require it). Sign-ups go to sms_subscribers,
// which the shipping portal checks before sending any text.

"use client";

import { useState } from "react";
import { SMS_CONSENT_ES, SMS_PRIVACY_URL, SMS_TERMS_URL } from "@/lib/smsConsent";

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

      <header className="sms-top">
        <a href="https://erendirasboutique.com" aria-label="Erendira's Boutique">
          <img className="sms-logo" src="/brand/logo.png" alt="Erendira's Boutique" />
        </a>
        <span className="sms-kicker">Mensajes de texto</span>
      </header>

      {done ? (
        <main className="sms-main">
          <div className="sms-check" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
          </div>
          <h1 className="sms-h1">
            ¡Listo,<br />
            <span className="sms-h1-accent">te suscribiste!</span>
          </h1>
          <p className="sms-lead">Te acabamos de mandar un mensaje de bienvenida. Para dejar de recibir mensajes, responde STOP en cualquier momento.</p>
          <a className="sms-btn sms-btn--link" href="https://erendirasboutique.com">Volver a la tienda</a>
        </main>
      ) : (
        <main className="sms-main">
          <h1 className="sms-h1">
            Tus pedidos y lives,
            <br />
            <span className="sms-h1-accent">por texto.</span>
          </h1>
          <p className="sms-lead">Empacado, en camino, entregado, y un aviso cuando estemos en vivo.</p>

          <form className="sms-form" onSubmit={submit} noValidate>
            <label className="sms-field">
              <span className="sms-label">Nombre</span>
              <input className="sms-in" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
            </label>
            <label className="sms-field">
              <span className="sms-label">Celular</span>
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

          <ul className="sms-tags" aria-label="Qué vas a recibir">
            <li>📦 Pedidos</li>
            <li>🚚 Envíos</li>
            <li>🔴 Lives</li>
            <li>🏷️ Ofertas</li>
          </ul>
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

// Every heading and text color is set here on purpose: the portal's global
// h1/h2 rules are taupe, which is what hid the old banner's heading.
const css = `
.sms { --t: var(--brand-taupe, #957f67); --c: var(--brand-cream, #F5F3EF); --s: var(--brand-sand, #cfbda9); --ink: var(--brand-ink, #332b23);
  --muted: #6b5f53; --head: var(--brand-font-heading, "Charman Serif", Georgia, serif); --body: var(--brand-font-body, "Ltt Recoleta", Georgia, serif);
  min-height: 100vh; background: var(--c); color: var(--ink); font-family: var(--body); max-width: 520px; margin: 0 auto; box-sizing: border-box; }
.sms a { color: var(--t); }
.sms-top { padding: 28px 28px 0; display: flex; justify-content: space-between; align-items: center; }
.sms-logo { display: block; width: 120px; height: auto; }
.sms .sms-kicker { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--t); }
.sms-main { padding: 44px 28px 0; display: flex; flex-direction: column; gap: 14px; }
.sms .sms-h1 { margin: 0; font-family: var(--head); font-weight: 400; font-size: 44px; line-height: 1.02; letter-spacing: 0; color: var(--ink); }
.sms .sms-h1-accent { color: var(--t); font-family: var(--head); }
.sms .sms-lead { margin: 0; font-size: 16px; line-height: 1.5; color: var(--muted); }
.sms-form { padding-top: 18px; display: flex; flex-direction: column; gap: 22px; }
.sms-field { display: flex; flex-direction: column; gap: 4px; }
.sms .sms-label { font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--t); }
.sms-in { min-height: 46px; padding: 0; border: 0; border-bottom: 1.5px solid var(--s); border-radius: 0; background: transparent; font: 19px var(--body); color: var(--ink); outline: none; }
.sms-in:focus { border-bottom-color: var(--t); }
.sms-in::placeholder { color: #a99a89; }
.sms-hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
.sms-consent { display: flex; gap: 12px; align-items: flex-start; font-size: 13px; line-height: 1.5; color: var(--ink); cursor: pointer; }
.sms-consent span { color: var(--ink); }
.sms-consent input { width: 22px; height: 22px; margin: 1px 0 0; flex-shrink: 0; accent-color: var(--t); }
.sms .sms-err { margin: 0; font-size: 14px; color: #8a2b1f; }
.sms-btn { min-height: 52px; border: 0; border-radius: 99px; background: var(--t); color: #fff; font: 17px var(--body); letter-spacing: .5px; cursor: pointer; display: flex; align-items: center; justify-content: center; text-decoration: none; }
.sms a.sms-btn { color: #fff; }
.sms-btn:disabled { opacity: .6; cursor: wait; }
.sms-btn--link { margin-top: 10px; }
.sms .sms-fine { margin: 0; font-size: 12px; line-height: 1.6; color: var(--muted); text-align: center; }
.sms-tags { list-style: none; margin: 0; padding: 14px 0 8px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.sms-tags li { font-size: 13px; border: 1px solid var(--s); border-radius: 99px; padding: 6px 12px; color: var(--ink); }
.sms-check { width: 56px; height: 56px; border-radius: 99px; background: var(--t); display: flex; align-items: center; justify-content: center; }
.sms-foot { padding: 28px 24px 32px; display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); text-align: center; }
.sms-foot span { color: var(--muted); }
.sms-foot-links { display: flex; gap: 14px; }
`;
