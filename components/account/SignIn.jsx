// components/account/SignIn.jsx

"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

/* ============================================================
   Customer sign-in (my.erendirasboutique.com and /customer).
   No passwords. Three ways in:
     1) Face ID / fingerprint (passkey). Shown when this browser supports
        passkeys. Offered once after a first code sign-in.
     2) 6-digit code by email
     3) 6-digit code by text (only when NEXT_PUBLIC_SMS_SIGNIN=on, after
        a text provider such as Twilio is set up in Supabase)
   Plus: scan the package label (Android Chrome can read the barcode;
   elsewhere it opens Find my account), questions, WhatsApp.
   Background: /landing-gradient.webm (mp4 + poster as fallbacks).
   ============================================================ */

const SMS_ON = process.env.NEXT_PUBLIC_SMS_SIGNIN === "on";
const PASSKEYS_ON = process.env.NEXT_PUBLIC_PASSKEYS !== "off";
const CODE_LEN = Math.min(10, Math.max(6, Number(process.env.NEXT_PUBLIC_OTP_LENGTH || 6)));
const RESEND_SECONDS = 60;
const LANG_KEY = "ebtq_lang";
const LAST_KEY = "ebtq_last_signin"; // passkey | email | sms
const HAS_PASSKEY_KEY = "ebtq_has_passkey";
const NO_PASSKEY_KEY = "ebtq_passkey_declined";
const SHOP_URL = "https://erendirasboutique.com";
const WHATSAPP = "https://wa.me/19094017221";
const SUPPORT_EMAIL = "info@erendirasboutique.com";

const T = {
  es: {
    home: "Inicio",
    langBtn: "EN",
    langLabel: "Switch to English",
    title: "Entra a tu cuenta",
    sub: "¿Primera vez? Tu cuenta ya existe con tu primer pedido.",
    faceId: "Entrar con Face ID",
    lastUsed: "Último usado",
    scan: "Escanear etiqueta del paquete",
    findWithPackage: "Buscar con mi paquete",
    or: "o",
    idLabel: SMS_ON ? "Correo o celular" : "Correo electrónico",
    idPlaceholder: "tucorreo@ejemplo.com",
    sendCode: "Mandarme un código",
    sending: "Enviando…",
    noEmail: "¿Sin correo ni celular?",
    findAccount: "Busca tu cuenta",
    terms: "Al entrar aceptas nuestros",
    termsLink: "Términos",
    and: "y",
    privacyLink: "Aviso de privacidad",
    faqTitle: "Preguntas frecuentes",
    help: "¿Dudas? Escríbenos por WhatsApp",
    rights: "© 2026 Erendira's Boutique LLC",
    // code screen
    back: "Regresar",
    checkEmail: "Revisa tu correo",
    checkText: "Revisa tus mensajes",
    sentTo: function (d) { return "Mandamos un código de " + CODE_LEN + " dígitos a " + d; },
    codeLabel: "Código",
    codeHintEmail: "Busca un correo de Erendira’s Boutique. Si no está, revisa Promociones o Spam.",
    codeHintText: "Llega en unos segundos. Tu teléfono puede llenarlo solo.",
    enter: "Entrar",
    checking: "Revisando…",
    resendIn: function (s) { return "Reenviar en 0:" + String(s).padStart(2, "0"); },
    resend: "Reenviar código",
    resent: "Te mandamos otro código.",
    useOther: "Usar otro correo o celular",
    // offer
    doneHi: "¡Listo! Ya entraste.",
    offerTitle: "¿Entrar con Face ID la próxima vez?",
    offerBody: "Así entras con tu cara o tu huella, sin esperar ningún código. Lo guarda tu teléfono, no nosotros.",
    offerYes: "Sí, usar Face ID",
    offerNo: "Ahora no",
    offerLater: "Puedes activarlo después en Mis datos.",
    // errors
    errEmpty: SMS_ON ? "Escribe tu correo o tu celular." : "Escribe tu correo.",
    errEmail: "Revisa tu correo, parece que le falta algo.",
    errPhone: "Escribe los 10 dígitos de tu celular.",
    errNoSms: "Por ahora solo mandamos códigos por correo. Escribe tu correo.",
    errSms: "No pudimos mandar el mensaje. Intenta con tu correo.",
    errRate: "Pediste varios códigos seguidos. Espera un minuto e intenta otra vez.",
    errCode: "Ese código no es correcto o ya venció. Revisa o pide otro.",
    errCodeLen: "Escribe los " + CODE_LEN + " dígitos.",
    errPasskeyNone: "Aún no tienes Face ID activado aquí. Entra con un código y lo activas.",
    errPasskey: "No se pudo usar Face ID. Intenta otra vez o entra con un código.",
    errScan: "No pudimos leer la etiqueta. Escribe los números a mano.",
    errNet: "Revisa tu conexión e intenta otra vez.",
    faqs: [
      ["¿Por qué no hay contraseña?", "Es más seguro y no tienes que recordar nada. Te mandamos un código, o entras con Face ID si lo activaste."],
      ["No me llegó el código", "Revisa Promociones o Spam. Puedes pedir otro en 60 segundos." + (SMS_ON ? " También te lo podemos mandar por mensaje de texto." : "")],
      ["¿Qué es Face ID aquí?", "Después de entrar una vez, te preguntamos si quieres usar tu cara o tu huella. Lo guarda tu teléfono, no nosotros."],
      ["No tengo correo registrado", "Toca “Busca tu cuenta” y usa tu apellido, código postal y un número de tu paquete."],
    ],
  },
  en: {
    home: "Home",
    langBtn: "ES",
    langLabel: "Cambiar a español",
    title: "Sign in to your account",
    sub: "First time? Your account already exists from your first order.",
    faceId: "Sign in with Face ID",
    lastUsed: "Last used",
    scan: "Scan your package label",
    findWithPackage: "Find it with my package",
    or: "or",
    idLabel: SMS_ON ? "Email or cell phone" : "Email",
    idPlaceholder: "you@example.com",
    sendCode: "Send me a code",
    sending: "Sending…",
    noEmail: "No email or phone on file?",
    findAccount: "Find your account",
    terms: "By signing in you agree to our",
    termsLink: "Terms",
    and: "and",
    privacyLink: "Privacy Policy",
    faqTitle: "Questions",
    help: "Questions? Message us on WhatsApp",
    rights: "© 2026 Erendira's Boutique LLC",
    back: "Back",
    checkEmail: "Check your email",
    checkText: "Check your messages",
    sentTo: function (d) { return "We sent a " + CODE_LEN + "-digit code to " + d; },
    codeLabel: "Code",
    codeHintEmail: "Look for an email from Erendira’s Boutique. Not there? Check Promotions or Spam.",
    codeHintText: "It arrives in a few seconds. Your phone may fill it in for you.",
    enter: "Sign in",
    checking: "Checking…",
    resendIn: function (s) { return "Resend in 0:" + String(s).padStart(2, "0"); },
    resend: "Resend code",
    resent: "We sent you a new code.",
    useOther: "Use another email or phone",
    doneHi: "You’re in!",
    offerTitle: "Use Face ID next time?",
    offerBody: "Sign in with your face or fingerprint, no code needed. It’s saved on your phone, not with us.",
    offerYes: "Yes, use Face ID",
    offerNo: "Not now",
    offerLater: "You can turn it on later in My details.",
    errEmpty: SMS_ON ? "Enter your email or cell phone." : "Enter your email.",
    errEmail: "Check your email, something looks off.",
    errPhone: "Enter all 10 digits of your cell phone.",
    errNoSms: "For now we only send codes by email. Please enter your email.",
    errSms: "We couldn’t send the text. Try your email instead.",
    errRate: "You asked for several codes in a row. Wait a minute and try again.",
    errCode: "That code isn’t right or has expired. Check it or ask for a new one.",
    errCodeLen: "Enter all " + CODE_LEN + " digits.",
    errPasskeyNone: "Face ID isn’t set up here yet. Sign in with a code and turn it on.",
    errPasskey: "Face ID didn’t work. Try again or sign in with a code.",
    errScan: "We couldn’t read the label. Type the numbers instead.",
    errNet: "Check your connection and try again.",
    faqs: [
      ["Why is there no password?", "It’s safer and there’s nothing to remember. We send you a code, or you use Face ID if you turned it on."],
      ["I didn’t get the code", "Check Promotions or Spam. You can ask for a new one after 60 seconds." + (SMS_ON ? " We can also text it to you." : "")],
      ["What is Face ID here?", "After you sign in once, we ask if you want to use your face or fingerprint. It’s saved on your phone, not with us."],
      ["I don’t have an email on file", "Tap “Find your account” and use your last name, ZIP code and a number from your package."],
    ],
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function digitsOf(v) { return String(v || "").replace(/\D/g, ""); }

function read(key) { try { return localStorage.getItem(key) || ""; } catch (e) { return ""; } }
function write(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* private mode */ } }

function maskPhone(d) { return "(" + d.slice(0, 3) + ") •••-" + d.slice(-4); }

export default function SignIn() {
  const supabase = getSupabaseBrowser();
  const [lang, setLang] = useState("es");
  const [screen, setScreen] = useState("start"); // start | code | offer
  const [value, setValue] = useState("");
  const [channel, setChannel] = useState("email"); // email | sms
  const [target, setTarget] = useState(""); // the email, or +1 phone
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [note, setNote] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [canPasskey, setCanPasskey] = useState(false);
  const [canScan, setCanScan] = useState(false);
  const [last, setLast] = useState("");
  const [openFaq, setOpenFaq] = useState(-1);
  const [reduceMotion, setReduceMotion] = useState(false);
  const fileRef = useRef(null);
  const codeRef = useRef(null);
  const videoRef = useRef(null);
  const t = T[lang];

  useEffect(function () {
    const q = new URLSearchParams(window.location.search).get("lang");
    const saved = read(LANG_KEY);
    if (q === "en" || q === "es") setLang(q);
    else if (saved === "en" || saved === "es") setLang(saved);
    setLast(read(LAST_KEY));
    setCanPasskey(
      PASSKEYS_ON &&
      typeof window.PublicKeyCredential !== "undefined" &&
      typeof supabase.auth.signInWithPasskey === "function"
    );
    setCanScan(typeof window.BarcodeDetector !== "undefined");
    try { setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { /* old browser */ }
  }, [supabase]);

  // iPhones only autoplay a video that is muted as a property, not just an
  // attribute (React doesn't always set it on first paint).
  useEffect(function () {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const p = v.play && v.play();
    if (p && p.catch) p.catch(function () { /* poster stays */ });
  }, [reduceMotion]);

  useEffect(function () {
    if (resendIn <= 0) return undefined;
    const id = setTimeout(function () { setResendIn(resendIn - 1); }, 1000);
    return function () { clearTimeout(id); };
  }, [resendIn]);

  useEffect(function () {
    if (screen === "code" && codeRef.current) codeRef.current.focus();
  }, [screen]);

  function changeLang() {
    const next = lang === "es" ? "en" : "es";
    setLang(next);
    setMsg("");
    write(LANG_KEY, next);
  }

  function goToAccount() {
    window.location.assign("/customer");
  }

  async function send(event) {
    if (event) event.preventDefault();
    if (busy) return;
    setMsg("");
    setNote("");
    const raw = value.trim();
    if (!raw) return setMsg(t.errEmpty);

    let how = "email";
    let to = raw.toLowerCase();
    if (!raw.includes("@") && digitsOf(raw).length >= 7) {
      if (!SMS_ON) return setMsg(t.errNoSms);
      const d = digitsOf(raw);
      const ten = d.length === 11 && d.charAt(0) === "1" ? d.slice(1) : d;
      if (ten.length !== 10) return setMsg(t.errPhone);
      how = "sms";
      to = "+1" + ten;
    } else if (!EMAIL_RE.test(to)) {
      return setMsg(t.errEmail);
    }

    setBusy("send");
    try {
      const site = window.location.origin.replace(/\/$/, "");
      const { error } = how === "sms"
        ? await supabase.auth.signInWithOtp({ phone: to })
        : await supabase.auth.signInWithOtp({
            email: to,
            // The email shows the code ({{ .Token }}); the link still works too.
            options: { emailRedirectTo: site + "/auth/callback?next=/customer" },
          });
      if (error) {
        const m = String(error.message || "") + " " + String(error.code || "");
        if (/rate|too many|over_.*limit/i.test(m)) { setBusy(""); return setMsg(t.errRate); }
        if (how === "sms") { setBusy(""); return setMsg(t.errSms); }
        if (/network|fetch|timeout/i.test(m)) { setBusy(""); return setMsg(t.errNet); }
        // Other email errors: still show the code screen, so this form never
        // reveals whether an email has an account.
      }
      setChannel(how);
      setTarget(to);
      setCode("");
      setResendIn(RESEND_SECONDS);
      setScreen("code");
    } catch (e) {
      setMsg(t.errNet);
    }
    setBusy("");
  }

  async function resend() {
    if (resendIn > 0 || busy) return;
    setBusy("send");
    setMsg("");
    try {
      const { error } = channel === "sms"
        ? await supabase.auth.signInWithOtp({ phone: target })
        : await supabase.auth.signInWithOtp({ email: target });
      if (error && /rate|too many/i.test(String(error.message || ""))) setMsg(t.errRate);
      else { setNote(t.resent); setResendIn(RESEND_SECONDS); }
    } catch (e) {
      setMsg(t.errNet);
    }
    setBusy("");
  }

  async function verify(event, typed) {
    if (event) event.preventDefault();
    const token = digitsOf(typed != null ? typed : code);
    if (token.length !== CODE_LEN) return setMsg(t.errCodeLen);
    if (busy) return;
    setBusy("verify");
    setMsg("");
    try {
      const { error } = channel === "sms"
        ? await supabase.auth.verifyOtp({ phone: target, token: token, type: "sms" })
        : await supabase.auth.verifyOtp({ email: target, token: token, type: "email" });
      if (error) {
        setBusy("");
        return setMsg(t.errCode);
      }
      write(LAST_KEY, channel);
      if (canPasskey && !read(HAS_PASSKEY_KEY) && !read(NO_PASSKEY_KEY)) {
        setBusy("");
        setScreen("offer");
        return;
      }
      goToAccount();
    } catch (e) {
      setBusy("");
      setMsg(t.errNet);
    }
  }

  async function passkeySignIn() {
    if (busy) return;
    setBusy("passkey");
    setMsg("");
    try {
      const { error } = await supabase.auth.signInWithPasskey();
      if (error) {
        const c = String(error.code || error.message || "");
        setBusy("");
        if (/not_found|credential/i.test(c)) return setMsg(t.errPasskeyNone);
        if (/NotAllowed|cancel|abort/i.test(c)) return; // they closed the Face ID prompt
        return setMsg(t.errPasskey);
      }
      write(LAST_KEY, "passkey");
      write(HAS_PASSKEY_KEY, "1");
      goToAccount();
    } catch (e) {
      setBusy("");
      if (!/NotAllowed|abort/i.test(String((e && e.name) || ""))) setMsg(t.errPasskey);
    }
  }

  async function turnOnPasskey() {
    if (busy) return;
    setBusy("register");
    try {
      const { error } = await supabase.auth.registerPasskey();
      if (!error || /credential_exists/i.test(String(error.code || error.message || ""))) {
        write(HAS_PASSKEY_KEY, "1");
      }
    } catch (e) {
      // they closed the prompt: just go on
    }
    goToAccount();
  }

  function skipPasskey() {
    write(NO_PASSKEY_KEY, "1");
    goToAccount();
  }

  // Label scan: read the barcode, keep the tracking number's last 4 digits,
  // and open Find my account with them filled in.
  async function onScanFile(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    try {
      const detector = new window.BarcodeDetector({ formats: ["code_128", "pdf417", "data_matrix", "qr_code"] });
      const bitmap = await createImageBitmap(file);
      const found = await detector.detect(bitmap);
      const nums = (found || []).map(function (b) { return digitsOf(b.rawValue); }).filter(function (d) { return d.length >= 12; });
      if (!nums.length) return setMsg(t.errScan);
      const longest = nums.sort(function (a, b) { return b.length - a.length; })[0];
      window.location.assign("/find-account?lang=" + lang + "&last4=" + longest.slice(-4));
    } catch (e) {
      setMsg(t.errScan);
    }
  }

  const lastIsPasskey = last === "passkey";
  const lastIsCode = last === "email" || last === "sms";

  return (
    <main className="sg" lang={lang}>
      <style>{css}</style>

      <div className="sg-bg" aria-hidden="true">
        {reduceMotion ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/landing-gradient-poster.jpg" alt="" />
        ) : (
          <video ref={videoRef} autoPlay muted loop playsInline preload="auto" poster="/landing-gradient-poster.jpg">
            <source src="/landing-gradient.webm" type="video/webm" />
            <source src="/landing-gradient.mp4" type="video/mp4" />
          </video>
        )}
      </div>

      <div className="sg-wrap">
        <div className="sg-top">
          <a className="sg-home" href={SHOP_URL}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
            {t.home}
          </a>
          <button type="button" className="sg-lang" aria-label={t.langLabel} onClick={changeLang}>{t.langBtn}</button>
        </div>

        {/* ---------- start ---------- */}
        {screen === "start" && (
          <section className="sg-card" aria-labelledby="sg-title">
            <div className="sg-head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="sg-logo" src="/brand/logo.png" alt="Erendira's Boutique" />
              <h1 id="sg-title" className="sg-h1">{t.title}</h1>
              <p className="sg-sub">{t.sub}</p>
            </div>

            {canPasskey ? (
              <div className="sg-rel">
                <button type="button" className="sg-btn" onClick={passkeySignIn} disabled={busy === "passkey"}>
                  <FaceIcon /> {t.faceId}
                </button>
                {lastIsPasskey ? <span className="sg-badge">{t.lastUsed}</span> : null}
              </div>
            ) : null}

            {canScan ? (
              <>
                <button type="button" className="sg-btn" onClick={function () { if (fileRef.current) fileRef.current.click(); }}>
                  <CamIcon /> {t.scan}
                </button>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onScanFile} />
              </>
            ) : (
              <a className="sg-btn" href={"/find-account?lang=" + lang}><BoxIcon /> {t.findWithPackage}</a>
            )}

            <div className="sg-or"><span />{t.or}<span /></div>

            <form onSubmit={send} noValidate className="sg-form">
              <label htmlFor="sg-id" className="sg-label">{t.idLabel}</label>
              <input
                id="sg-id"
                className="sg-in"
                type={SMS_ON ? "text" : "email"}
                inputMode={SMS_ON ? "email" : "email"}
                autoComplete="username webauthn"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={t.idPlaceholder}
                value={value}
                onChange={function (e) { setValue(e.target.value); setMsg(""); }}
                aria-invalid={msg ? "true" : undefined}
                aria-describedby={msg ? "sg-msg" : undefined}
              />
              <div className="sg-rel">
                <button type="submit" className="sg-cta" disabled={busy === "send"}>{busy === "send" ? t.sending : t.sendCode}</button>
                {lastIsCode && !lastIsPasskey ? <span className="sg-badge">{t.lastUsed}</span> : null}
              </div>
            </form>
            {msg ? <p id="sg-msg" role="alert" className="sg-err">{msg}</p> : null}

            <p className="sg-small">{t.noEmail} <a href={"/find-account?lang=" + lang}>{t.findAccount}</a></p>
            <p className="sg-terms">
              {t.terms} <a href="/sms/terms">{t.termsLink}</a> {t.and} <a href="/sms/privacy">{t.privacyLink}</a>.
            </p>
          </section>
        )}

        {/* ---------- code ---------- */}
        {screen === "code" && (
          <section className="sg-card" aria-labelledby="sg-code-title">
            <button type="button" className="sg-back" aria-label={t.back} onClick={function () { setScreen("start"); setMsg(""); setNote(""); }}>
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <div className="sg-head sg-left">
              <h1 id="sg-code-title" className="sg-h1">{channel === "sms" ? t.checkText : t.checkEmail}</h1>
              <p className="sg-sub">{t.sentTo(channel === "sms" ? maskPhone(target.slice(-10)) : target)}</p>
            </div>
            <form onSubmit={verify} noValidate className="sg-form">
              <label htmlFor="sg-code" className="sg-label">{t.codeLabel}</label>
              <input
                id="sg-code"
                ref={codeRef}
                className="sg-in sg-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={CODE_LEN}
                placeholder={"•".repeat(CODE_LEN)}
                value={code}
                onChange={function (e) {
                  const d = digitsOf(e.target.value).slice(0, CODE_LEN);
                  setCode(d);
                  setMsg("");
                  if (d.length === CODE_LEN) verify(null, d);
                }}
                aria-invalid={msg ? "true" : undefined}
                aria-describedby="sg-code-hint"
              />
              <p id="sg-code-hint" className="sg-small sg-left">{channel === "sms" ? t.codeHintText : t.codeHintEmail}</p>
              <button type="submit" className="sg-cta" disabled={busy === "verify"}>{busy === "verify" ? t.checking : t.enter}</button>
            </form>
            {msg ? <p role="alert" className="sg-err">{msg}</p> : null}
            {note ? <p role="status" className="sg-ok">{note}</p> : null}
            <div className="sg-row">
              {resendIn > 0 ? (
                <span className="sg-muted">{t.resendIn(resendIn)}</span>
              ) : (
                <button type="button" className="sg-link" onClick={resend} disabled={busy === "send"}>{t.resend}</button>
              )}
              <button type="button" className="sg-link" onClick={function () { setScreen("start"); setMsg(""); setNote(""); }}>{t.useOther}</button>
            </div>
          </section>
        )}

        {/* ---------- offer Face ID ---------- */}
        {screen === "offer" && (
          <section className="sg-card sg-center" aria-labelledby="sg-offer-title">
            <span className="sg-offer-ico" aria-hidden="true"><FaceIcon size={48} /></span>
            <p className="sg-sub">{t.doneHi}</p>
            <h1 id="sg-offer-title" className="sg-h1">{t.offerTitle}</h1>
            <p className="sg-sub">{t.offerBody}</p>
            <button type="button" className="sg-cta" onClick={turnOnPasskey} disabled={busy === "register"}>{t.offerYes}</button>
            <button type="button" className="sg-btn" onClick={skipPasskey}>{t.offerNo}</button>
            <p className="sg-small">{t.offerLater}</p>
          </section>
        )}

        {screen === "start" && (
          <section className="sg-card sg-faq" aria-labelledby="sg-faq-title">
            <h2 id="sg-faq-title" className="sg-h2">{t.faqTitle}</h2>
            {t.faqs.map(function (f, i) {
              const open = openFaq === i;
              return (
                <div className="sg-q" key={i}>
                  <button type="button" aria-expanded={open} aria-controls={"sg-a" + i} onClick={function () { setOpenFaq(open ? -1 : i); }}>
                    <span>{f[0]}</span>
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "none" }}><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                  {open ? <p id={"sg-a" + i}>{f[1]}</p> : null}
                </div>
              );
            })}
          </section>
        )}

        <a className="sg-card sg-help" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4z" /></svg>
          <span>
            <strong>{t.help}</strong>
            <span>909.401.7221 · {SUPPORT_EMAIL}</span>
          </span>
        </a>

        <p className="sg-copy">{t.rights}</p>
      </div>
    </main>
  );
}

function FaceIcon(props) {
  const s = props.size || 24;
  return (
    <svg aria-hidden="true" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={s > 30 ? 1.3 : 1.7} strokeLinecap="round">
      <path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" />
      <path d="M9 9v1.5M15 9v1.5M12 9v4h-1M9.5 16c1.5 1 3.5 1 5 0" />
    </svg>
  );
}
function CamIcon() {
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>;
}
function BoxIcon() {
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z" /><path d="M3 7.5L12 12l9-4.5M12 12v9" /></svg>;
}

const css = `
.sg { --ink:var(--brand-ink, #5F4E3D); --text:#3f3327; --muted:#6b5a48; --brand:var(--brand-taupe, #957f67); --cream:var(--brand-cream, #F5F3EF);
  --line:rgba(149,127,103,.35); --head:var(--brand-font-heading, var(--font-heading, "Charman Serif", Georgia, serif));
  --body:var(--brand-font-body, var(--font-body, "Ltt Recoleta", Georgia, serif));
  --glass:rgba(255,255,255,.82);
  position:relative; min-height:100vh; color:var(--text); font-family:var(--body); font-synthesis:none; -webkit-font-smoothing:antialiased; background:#e9ddd0; }
.sg *, .sg *::before, .sg *::after { box-sizing:border-box; }
.sg a { color:var(--text); }
.sg button { font-family:inherit; cursor:pointer; }
.sg :focus-visible { outline:2px solid var(--brand); outline-offset:2px; }
.sg-bg { position:fixed; inset:0; z-index:0; overflow:hidden; }
.sg-bg video, .sg-bg img { width:100%; height:100%; object-fit:cover; display:block; }
.sg-wrap { position:relative; z-index:1; max-width:460px; margin:0 auto; padding:18px 16px calc(36px + env(safe-area-inset-bottom)); display:flex; flex-direction:column; gap:18px; }
.sg-top { display:flex; justify-content:space-between; align-items:center; }
.sg-home { display:inline-flex; align-items:center; gap:6px; min-height:44px; padding:0 14px 0 10px; border-radius:999px; background:rgba(255,255,255,.72); text-decoration:none; font-size:17px; }
.sg-lang { min-height:44px; min-width:52px; padding:0 14px; border-radius:999px; border:1px solid var(--line); background:rgba(255,255,255,.86); color:var(--text); font-size:15px; }
.sg-card { background:var(--glass); -webkit-backdrop-filter:blur(16px); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,.9);
  box-shadow:0 18px 44px rgba(95,78,61,.14); border-radius:32px; padding:24px 18px; display:flex; flex-direction:column; gap:14px; }
.sg-top + .sg-card { margin-top:min(14vh, 110px); }
.sg-head { display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; margin-bottom:6px; }
.sg-left { align-items:flex-start; text-align:left; }
.sg-center { align-items:center; text-align:center; }
.sg-logo { width:96px; height:auto; }
.sg-h1 { margin:0; font-family:var(--head); font-weight:400; font-size:36px; line-height:1.06; color:var(--text); }
.sg-h2 { margin:0 0 6px; font-family:var(--head); font-weight:400; font-size:24px; }
.sg-sub { margin:0; font-size:16.5px; line-height:1.45; color:var(--muted); }
.sg-rel { position:relative; }
.sg-btn { width:100%; min-height:60px; display:flex; align-items:center; justify-content:center; gap:12px; border-radius:20px; border:1px solid var(--line);
  background:#fff; color:var(--text); text-decoration:none; font-size:18px; }
.sg-badge { position:absolute; top:-11px; right:8px; background:var(--brand); color:#fff; border-radius:999px; padding:4px 12px; font-size:13.5px; pointer-events:none; }
.sg-or { display:flex; align-items:center; gap:14px; color:var(--muted); font-size:16px; margin:4px 0; }
.sg-or span { flex:1; height:1px; background:var(--line); }
.sg-form { display:flex; flex-direction:column; gap:10px; }
.sg-label { font-size:16px; color:var(--muted); }
.sg-in { width:100%; border:1px solid var(--line); border-radius:20px; padding:17px 18px; font-size:18px; background:var(--cream); color:var(--text); font-family:inherit; }
.sg-in[aria-invalid="true"] { border-color:#a8452a; }
.sg-code { font-size:28px; letter-spacing:.5em; text-align:center; padding-left:calc(18px + .5em); }
.sg-cta { width:100%; min-height:60px; border:0; border-radius:20px; background:var(--brand); color:#fff; font-size:19px; margin-top:4px; }
.sg-cta:disabled, .sg-btn:disabled { opacity:.7; }
.sg-err { margin:0; color:#a8452a; font-size:15px; line-height:1.4; }
.sg-ok { margin:0; color:var(--ink); font-size:15px; }
.sg-small { margin:0; text-align:center; font-size:15px; color:var(--muted); line-height:1.45; }
.sg-terms { margin:6px 0 0; text-align:center; font-size:14px; line-height:1.5; color:var(--muted); }
.sg-back { width:44px; height:44px; border-radius:50%; border:0; background:var(--cream); color:var(--ink); display:flex; align-items:center; justify-content:center; }
.sg-row { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
.sg-muted { color:var(--muted); font-size:15px; }
.sg-link { border:0; background:none; padding:0; min-height:44px; font-size:15px; color:var(--text); text-decoration:underline; }
.sg-offer-ico { width:92px; height:92px; border-radius:28px; background:var(--cream); color:var(--brand); display:flex; align-items:center; justify-content:center; }
.sg-faq { gap:0; padding:20px; }
.sg-q { border-top:1px solid #ece6dd; }
.sg-q button { width:100%; border:0; background:none; padding:15px 2px; min-height:52px; display:flex; align-items:center; gap:12px; text-align:left; font-size:16px; color:var(--text); }
.sg-q button span { flex:1; }
.sg-q button svg { color:var(--brand); flex:none; }
.sg-q p { margin:0 2px 16px; font-size:15px; line-height:1.45; color:var(--muted); }
.sg-help { flex-direction:row; align-items:center; gap:14px; padding:16px 18px; border-radius:22px; text-decoration:none; }
.sg-help svg { color:var(--brand); flex:none; }
.sg-help > span { display:flex; flex-direction:column; gap:2px; }
.sg-help strong { font-weight:400; font-size:16px; }
.sg-help > span > span { font-size:14px; color:var(--muted); }
.sg-copy { margin:0; align-self:center; font-size:14px; background:rgba(255,255,255,.72); padding:6px 12px; border-radius:10px; }
`;
