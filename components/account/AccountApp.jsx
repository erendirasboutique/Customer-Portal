// components/account/AccountApp.jsx

"use client";

import { useEffect, useState } from "react";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

/* ============================================================
   The ONE customer account. Both ways in show this same page:
     /account?t=<token>   personal link, no sign-in (mode "link")
     /customer            after magic-link sign-in  (mode "session")
   1) Welcome (link only): confirm the address, add email + phone.
      Remembered on this device for 30 days, so it isn't asked every visit.
   2) Home, in tabs: Orders · Payments · Gift cards · Me
   3) One shipment: photo, journey (carrier scans), tracking
   4) Edit details
   Link opens in Spanish (add &lang=en for English); the choice is remembered.
   Fonts: Charman Serif headings, Ltt Recoleta everything else (/brand/brand.css).
   Colors: #F5F3EF cream, #957f67 taupe, #cfbda9 sand (+ white, and
   #5F4E3D for body text so it stays readable).
   ============================================================ */

const LOGO_SRC = "/brand/logo.png";
const SHOP_EMAIL = "info@erendirasboutique.com";
const SHOP_URL = "https://facebook.erendirasboutique.com";
const CONTACT_URL = "https://help.erendirasboutique.com";
const RETURNS_URL = "https://returns.erendirasboutique.com";
const DEFAULT_LANG = "es";
const SHIPS_SHOWN = 5; // shipments shown before "See all X shipments"
const CONFIRM_DAYS = 30; // re-ask "is this your address?" after this many days
const LANG_KEY = "ebtq_lang";

const T = {
  en: {
    hi: function (n) { return n ? "Hi, " + n : "Hi"; },
    welcomeTitle: "Let’s get your next order to you",
    shippingTo: "Shipping to",
    change: "Change",
    oneMore: "One more step",
    reachTitle: "How can we reach you?",
    reachBody: "We’ll email and text you when your order ships, and right away if there’s ever a problem with your delivery.",
    mobile: "Mobile number",
    saveShip: "Save and ship here",
    yesShip: "Yes, ship here",
    skip: "Skip for now",
    needOne: "Add your email or mobile number, or tap “Skip for now.”",
    latestOnWay: function (o) { return "Order " + o + " is on the way"; },
    seeShips: function (n) { return n === 1 ? "See my shipment" : "See all " + n + " shipments"; },
    cantReach: "We can’t reach you yet",
    missingBoth: "Add your email and phone so you hear the moment an order ships, or if a delivery has a problem.",
    missingEmail: "Add your email so you hear the moment an order ships, or if a delivery has a problem.",
    missingPhone: "Add your mobile number so we can text you about your deliveries.",
    addEmail: "+ Add email",
    addPhone: "+ Add phone",
    confirmed: "Thank you! We’ll ship here.",
    saved: "Saved ✓ Your next order ships here.",
    yourOrders: "Your orders",
    heroTitle: {
      preparing: function () { return "Getting your order ready"; },
      label: function () { return "Label made"; },
      shipped: function (d) { return d ? "Shipped " + d : "Shipped"; },
      in_transit: function () { return "On the way"; },
      out: function () { return "Out for delivery"; },
      delivered: function (d) { return d ? "Delivered " + d : "Delivered"; },
      problem: function () { return "There’s a delivery issue"; },
      returned: function () { return "Returned to us"; },
    },
    arriving: "Arriving",
    steps: ["Packed", "Shipped", "On the way", "Delivered"],
    stepOf: function (i, label) { return "Step " + i + " of 4: " + label; },
    viewDetails: "View details",
    trackOn: function (c) { return "Track on " + (c || "carrier"); },
    shipments: "Shipments",
    total: function (n) { return n + " total"; },
    seeAll: function (n) { return "See all " + n + " shipments"; },
    myInfo: "My details",
    shipTo: "Ship to",
    addForUpdates: "Add to get shipping updates",
    addForTexts: "Add to get delivery texts",
    edit: "Edit",
    add: "Add",
    backToOrders: "Back to my orders",
    order: "Order",
    journey: "Journey",
    noScans: "Carrier updates will show here as your package is scanned.",
    expected: function (d) { return "Expected " + d; },
    packedBy: "Erendira’s Boutique",
    copyTracking: "Copy tracking #",
    copied: "Copied ✓",
    carrier: "Carrier",
    tracking: "Tracking #",
    goingTo: "Going to",
    shippedOn: "Shipped",
    photoCap: "Your package, the day we packed it",
    photoAlt: "Photo of your package",
    close: "Close",
    shop: "Shop",
    contact: "Contact",
    returns: "Returns",
    noAddress: "We don’t have your address yet.",
    editTitle: "Change your details",
    name: "Name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    address1: "Street address",
    address2: "Apt, suite, unit (optional)",
    addressHint: "Start typing and pick your address",
    poweredBy: "Powered by Google",
    city: "City",
    state: "State",
    zip: "ZIP",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    loadError: "This link isn’t valid anymore. Reply to us and we’ll send you a new one.",
    findAccount: "Find my account",
    saveError: "Your changes couldn’t be saved. Please try again.",
    missing: "Street address, city, state and ZIP are required.",
    invalidEmail: "Please enter a valid email address.",
    at: " at ",
    langShort: "ES",
    langLabel: "Ver en español",
    status: { preparing: "Preparing", label: "Label made", shipped: "Shipped", in_transit: "On the way", out: "Out for delivery", delivered: "Delivered", returned: "Returned", problem: "Delivery issue" },
    locale: "en-US",
    tabOrders: "Orders",
    tabPay: "Payments",
    tabGift: "Gift cards",
    tabMe: "Me",
    payTitle: "Payments & receipts",
    noPayments: "No payments yet.",
    receipt: "Receipt",
    paid: "Paid",
    refunded: "Refunded",
    purchase: "Purchase",
    giftBalance: "Gift card balance",
    giftAcross: function (n) { return n === 1 ? "On 1 card · use it at checkout or in a live sale" : "Across " + n + " cards · use them at checkout or in a live sale"; },
    noGift: "You don’t have any gift cards yet.",
    giftOf: function (r, a) { return r + " left of " + a; },
    giftNever: "Never used",
    giftUsed: function (d) { return "Last used " + d; },
    giftStatus: { active: "Active", redeemed: "Used up", disabled: "Disabled" },
    copy: "Copy",
    lockedTitle: "See full codes and receipts",
    lockedBody: function (e) { return "For your security, we’ll email a sign-in link to " + e + ". One tap and you’ll see everything."; },
    sendLink: "Email me the link",
    sending: "Sending…",
    linkSent: "Sent! Open the email on this phone and tap the link.",
    linkError: "We couldn’t send it right now. Please try again in a minute.",
    signedInAs: function (e) { return "Signed in as " + e; },
    viaLink: "Opened from your personal link",
    logOut: "Log out",
    emailLocked: "To change your email, sign in with it or message us.",
    emailLockedErr: "Your email can’t be changed from this link. Message us and we’ll update it.",
    signInEmail: "Sign in with email",
    loadingWallet: "Loading…",
  },
  es: {
    hi: function (n) { return n ? "Hola, " + n : "Hola"; },
    welcomeTitle: "Vamos a hacerte llegar tu próximo pedido",
    shippingTo: "Enviamos a",
    change: "Cambiar",
    oneMore: "Un paso más",
    reachTitle: "¿Cómo te contactamos?",
    reachBody: "Te avisamos por correo y mensaje cuando enviemos tu pedido, y de inmediato si hay algún problema con tu entrega.",
    mobile: "Número de celular",
    saveShip: "Guardar y enviar aquí",
    yesShip: "Sí, envíalo aquí",
    skip: "Omitir por ahora",
    needOne: "Agrega tu correo o celular, o toca “Omitir por ahora”.",
    latestOnWay: function (o) { return "Tu pedido " + o + " va en camino"; },
    seeShips: function (n) { return n === 1 ? "Ver mi envío" : "Ver los " + n + " envíos"; },
    cantReach: "Aún no podemos contactarte",
    missingBoth: "Agrega tu correo y teléfono para saber en cuanto se envíe tu pedido, o si hay un problema con la entrega.",
    missingEmail: "Agrega tu correo para saber en cuanto se envíe tu pedido, o si hay un problema con la entrega.",
    missingPhone: "Agrega tu celular para mandarte mensajes sobre tus entregas.",
    addEmail: "+ Agregar correo",
    addPhone: "+ Agregar teléfono",
    confirmed: "¡Gracias! Te enviaremos aquí.",
    saved: "Guardado ✓ Tu próximo pedido llega aquí.",
    yourOrders: "Tus pedidos",
    heroTitle: {
      preparing: function () { return "Estamos preparando tu pedido"; },
      label: function () { return "Etiqueta lista"; },
      shipped: function (d) { return d ? "Enviado el " + d : "Enviado"; },
      in_transit: function () { return "En camino"; },
      out: function () { return "En reparto hoy"; },
      delivered: function (d) { return d ? "Entregado el " + d : "Entregado"; },
      problem: function () { return "Hay un problema con la entrega"; },
      returned: function () { return "Nos fue devuelto"; },
    },
    arriving: "Llega",
    steps: ["Empacado", "Enviado", "En camino", "Entregado"],
    stepOf: function (i, label) { return "Paso " + i + " de 4: " + label; },
    viewDetails: "Ver detalles",
    trackOn: function (c) { return "Rastrear en " + (c || "paquetería"); },
    shipments: "Envíos",
    total: function (n) { return n + " en total"; },
    seeAll: function (n) { return "Ver los " + n + " envíos"; },
    myInfo: "Mis datos",
    shipTo: "Enviar a",
    addForUpdates: "Agrégalo para recibir avisos de envío",
    addForTexts: "Agrégalo para recibir mensajes de entrega",
    edit: "Editar",
    add: "Agregar",
    backToOrders: "Volver a mis pedidos",
    order: "Pedido",
    journey: "Recorrido",
    noScans: "Aquí verás las actualizaciones cuando la paquetería escanee tu paquete.",
    expected: function (d) { return "Esperado el " + d; },
    packedBy: "Erendira’s Boutique",
    copyTracking: "Copiar rastreo",
    copied: "Copiado ✓",
    carrier: "Paquetería",
    tracking: "Núm. de rastreo",
    goingTo: "Destino",
    shippedOn: "Enviado",
    photoCap: "Tu paquete, el día que lo empacamos",
    photoAlt: "Foto de tu paquete",
    close: "Cerrar",
    shop: "Tienda",
    contact: "Contacto",
    returns: "Devoluciones",
    noAddress: "Aún no tenemos tu dirección.",
    editTitle: "Cambiar mis datos",
    name: "Nombre",
    email: "Correo",
    phone: "Teléfono",
    address: "Dirección",
    address1: "Dirección",
    address2: "Apto, suite, unidad (opcional)",
    addressHint: "Empieza a escribir y elige tu dirección",
    poweredBy: "Con tecnología de Google",
    city: "Ciudad",
    state: "Estado",
    zip: "C.P.",
    save: "Guardar",
    cancel: "Cancelar",
    saving: "Guardando...",
    loadError: "Este enlace ya no es válido. Escríbenos y te enviaremos uno nuevo.",
    findAccount: "Buscar mi cuenta",
    saveError: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
    missing: "Dirección, ciudad, estado y código postal son obligatorios.",
    invalidEmail: "Ingresa un correo electrónico válido.",
    at: " a las ",
    langShort: "EN",
    langLabel: "View in English",
    status: { preparing: "Preparando", label: "Etiqueta lista", shipped: "Enviado", in_transit: "En camino", out: "En reparto", delivered: "Entregado", returned: "Devuelto", problem: "Problema" },
    locale: "es-MX",
    tabOrders: "Pedidos",
    tabPay: "Pagos",
    tabGift: "Tarjetas",
    tabMe: "Mis datos",
    payTitle: "Pagos y recibos",
    noPayments: "Aún no hay pagos.",
    receipt: "Recibo",
    paid: "Pagado",
    refunded: "Reembolsado",
    purchase: "Compra",
    giftBalance: "Saldo de tarjetas de regalo",
    giftAcross: function (n) { return n === 1 ? "En 1 tarjeta · úsala al pagar o en un live" : "En " + n + " tarjetas · úsalas al pagar o en un live"; },
    noGift: "Aún no tienes tarjetas de regalo.",
    giftOf: function (r, a) { return "Quedan " + r + " de " + a; },
    giftNever: "Sin usar",
    giftUsed: function (d) { return "Usada el " + d; },
    giftStatus: { active: "Activa", redeemed: "Agotada", disabled: "Desactivada" },
    copy: "Copiar",
    lockedTitle: "Ver códigos y recibos completos",
    lockedBody: function (e) { return "Por tu seguridad, te mandamos un enlace a " + e + ". Con un toque verás todo."; },
    sendLink: "Mándame el enlace",
    sending: "Enviando…",
    linkSent: "¡Listo! Abre el correo en este teléfono y toca el enlace.",
    linkError: "No se pudo enviar ahora. Inténtalo en un minuto.",
    signedInAs: function (e) { return "Sesión iniciada como " + e; },
    viaLink: "Abierto desde tu enlace personal",
    logOut: "Cerrar sesión",
    emailLocked: "Para cambiar tu correo, inicia sesión con él o escríbenos.",
    emailLockedErr: "Tu correo no se puede cambiar desde este enlace. Escríbenos y lo actualizamos.",
    signInEmail: "Iniciar sesión con correo",
    loadingWallet: "Cargando…",
  },
};

/* Same look as the inputs below, for the Google autocomplete box. */
const INPUT_STYLE = {
  width: "100%",
  border: "1px solid #cfbda9",
  borderRadius: 14,
  padding: "14px 16px",
  fontSize: 16,
  lineHeight: 1.3,
  fontFamily: "inherit",
  color: "#5F4E3D",
  background: "#F5F3EF",
  boxSizing: "border-box",
  outline: "none",
};

// Which of the 4 progress steps is current (0-based), per stage.
const STEP = { preparing: 0, label: 0, shipped: 1, in_transit: 2, out: 2, problem: 2, returned: 2, delivered: 3 };

export default function AccountApp() {
  const [token, setToken] = useState("");
  const [mode, setMode] = useState(""); // "link" | "session"
  const [accessToken, setAccessToken] = useState("");
  const [signedInEmail, setSignedInEmail] = useState("");
  const [tab, setTab] = useState("orders"); // orders | pay | gift | me
  const [wallet, setWallet] = useState(null); // { full, emailHint, payments, giftCards }
  const [linkState, setLinkState] = useState(""); // "" | sending | sent | error
  const [lang, setLang] = useState(DEFAULT_LANG);
  const [form, setForm] = useState(null);
  const [savedForm, setSavedForm] = useState(null);
  const [status, setStatus] = useState("loading");
  const [validationMsg, setValidationMsg] = useState("");
  const [screen, setScreen] = useState("ask"); // ask | list | ship | edit
  const [notice, setNotice] = useState(""); // "" | confirmed | saved
  const [ships, setShips] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [openShip, setOpenShip] = useState(""); // id of the shipment being viewed
  const [bigPhoto, setBigPhoto] = useState(""); // photo shown full screen
  const [copiedId, setCopiedId] = useState("");

  const t = T[lang];

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const portalToken = searchParams.get("t") || "";
    const urlLang = searchParams.get("lang");
    let savedLang = "";
    try { savedLang = localStorage.getItem(LANG_KEY) || ""; } catch (e) { /* private mode */ }

    if (urlLang === "en" || urlLang === "es") {
      setLang(urlLang);
    } else if (savedLang === "en" || savedLang === "es") {
      setLang(savedLang);
    } else if (!portalToken && !String(navigator.language || "").toLowerCase().startsWith("es")) {
      setLang("en"); // signed-in customers: follow the phone; links open in Spanish
    }

    setToken(portalToken);

    let cancelled = false;

    (async function start() {
      // A signed-in session (magic link) also counts on a personal link:
      // it unlocks full gift card codes and receipts when the emails match.
      let bearer = "";
      try {
        const { data } = await getSupabaseBrowser().auth.getSession();
        if (data && data.session) {
          bearer = data.session.access_token || "";
          setSignedInEmail((data.session.user && data.session.user.email) || "");
        }
      } catch (e) {
        // no session
      }
      if (cancelled) return;

      if (!portalToken && !bearer) {
        setStatus("load_error");
        return;
      }

      const how = portalToken ? "link" : "session";
      setMode(how);
      setAccessToken(bearer);
      const call = apiCall(portalToken, bearer);

      loadAccount(call, how, portalToken);
      loadShipments(call);
      loadWallet(call);
    })();

    async function loadAccount(call, how, portalToken) {
      try {
        const response = await call("/api/account");

        if (!response.ok) {
          throw new Error("Unable to load account.");
        }

        const data = await response.json();

        const loaded = {
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address1: data.address1 || "",
          address2: data.address2 || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
        };

        if (cancelled) return;
        setForm(loaded);
        setSavedForm(loaded);
        if (!loaded.address1) setScreen("edit");
        else if (how === "session") setScreen("list");
        else if (loaded.email && loaded.phone && confirmedRecently(portalToken)) setScreen("list");
        setStatus("ready");
      } catch (error) {
        console.error("Account load error:", error);
        if (!cancelled) setStatus("load_error");
      }
    }

    async function loadShipments(call) {
      try {
        const response = await call("/api/account/shipments");
        if (!response.ok) return;
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.shipments;
        if (!cancelled && Array.isArray(list)) setShips(list.map(normalizeShipment).sort(byNewest));
      } catch (error) {
        // no shipments list
      }
    }

    async function loadWallet(call) {
      try {
        const response = await call("/api/account/wallet");
        if (!response.ok) throw new Error("wallet");
        const data = await response.json();
        if (!cancelled) setWallet({
          full: Boolean(data.full),
          emailHint: data.emailHint || "",
          payments: Array.isArray(data.payments) ? data.payments : [],
          giftCards: Array.isArray(data.giftCards) ? data.giftCards : [],
        });
      } catch (error) {
        if (!cancelled) setWallet({ full: false, emailHint: "", payments: [], giftCards: [] });
      }
    }

    return function () { cancelled = true; };
  }, []);

  function changeLang() {
    const next = lang === "es" ? "en" : "es";
    setLang(next);
    setValidationMsg("");
    try { localStorage.setItem(LANG_KEY, next); } catch (e) { /* private mode */ }
  }

  // Personal link: one tap emails a sign-in link to the address on file.
  async function emailSignInLink() {
    if (!savedForm || !savedForm.email || linkState === "sending") return;
    setLinkState("sending");
    try {
      const site = window.location.origin.replace(/\/$/, "");
      const { error } = await getSupabaseBrowser().auth.signInWithOtp({
        email: savedForm.email,
        options: { emailRedirectTo: site + "/auth/callback?next=/customer" },
      });
      setLinkState(error ? "error" : "sent");
    } catch (e) {
      setLinkState("error");
    }
  }

  async function logOut() {
    try { await getSupabaseBrowser().auth.signOut(); } catch (e) { /* ignore */ }
    window.location.href = "/customer";
  }

  function go(next, focusId) {
    setScreen(next);
    setValidationMsg("");
    window.scrollTo(0, 0);
    if (focusId) {
      setTimeout(function () {
        const el = document.getElementById(focusId) || document.querySelector("#" + focusId + "-wrap input");
        if (el) el.focus();
      }, 50);
    }
  }

  function openShipment(id) {
    setOpenShip(id);
    setNotice("");
    go("ship");
  }

  function updateField(key, value) {
    setForm(function updateCurrentForm(currentForm) {
      if (!currentForm) {
        return currentForm;
      }

      return {
        ...currentForm,
        [key]: value,
      };
    });

    if (status === "save_error") {
      setStatus("ready");
    }

    setValidationMsg("");
  }

  function pickAddress(picked) {
    setForm(function applyPickedAddress(currentForm) {
      if (!currentForm) {
        return currentForm;
      }

      return {
        ...currentForm,
        address1: picked.street1,
        address2: picked.street2 || currentForm.address2,
        city: picked.city,
        state: picked.state,
        zip: picked.zip,
      };
    });

    if (status === "save_error") {
      setStatus("ready");
    }

    setValidationMsg("");

    setTimeout(function focusUnit() {
      const unitInput = document.getElementById("address2");
      if (unitInput) {
        unitInput.focus();
      }
    }, 0);
  }

  function cancelEdit() {
    setForm(savedForm);
    setStatus("ready");
    go("list");
  }

  // Sends the whole form. Returns true when saved.
  async function persist(nextForm) {
    setStatus("saving");
    setValidationMsg("");
    try {
      const headers = { "Content-Type": "application/json" };
      if (accessToken) headers.Authorization = "Bearer " + accessToken;
      const response = await fetch("/api/account", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          t: token || undefined,
          name: nextForm.name,
          email: nextForm.email,
          phone: nextForm.phone,
          address1: nextForm.address1,
          address2: nextForm.address2,
          city: nextForm.city,
          state: nextForm.state,
          zip: nextForm.zip,
        }),
      });

      if (response.status === 403) {
        setForm({ ...nextForm, email: savedForm ? savedForm.email : nextForm.email });
        setValidationMsg(t.emailLockedErr);
        setStatus("ready");
        return false;
      }

      if (!response.ok) {
        throw new Error("Unable to save account.");
      }

      setForm(nextForm);
      setSavedForm(nextForm);
      setStatus("ready");
      return true;
    } catch (error) {
      console.error("Account save error:", error);
      setStatus("save_error");
      return false;
    }
  }

  async function save() {
    if (!form || !mode || status === "saving") {
      return;
    }

    const address1 = form.address1.trim();
    const city = form.city.trim();
    const state = form.state.trim();
    const zip = form.zip.trim();
    const email = form.email.trim();

    if (!address1 || !city || !state || !zip) {
      setValidationMsg(t.missing);
      return;
    }

    if (email && !isValidEmail(email)) {
      setValidationMsg(t.invalidEmail);
      return;
    }

    if (await persist(form)) {
      setNotice("saved");
      go("list");
    }
  }

  // Welcome screen: "Save and ship here" (with the contact boxes) or "Yes, ship here".
  async function confirmHere() {
    if (!form || !mode || status === "saving") return;
    const missingContact = !savedForm.email || !savedForm.phone;
    if (!missingContact) {
      markConfirmed(token);
      setNotice("confirmed");
      go("list");
      return;
    }
    const email = form.email.trim();
    const phone = form.phone.trim();
    if (!email && !phone) {
      setValidationMsg(t.needOne);
      return;
    }
    if (email && !isValidEmail(email)) {
      setValidationMsg(t.invalidEmail);
      return;
    }
    if (await persist({ ...savedForm, email: email || savedForm.email, phone: phone || savedForm.phone })) {
      markConfirmed(token);
      setNotice("saved");
      go("list");
    }
  }

  function skipContact() {
    markConfirmed(token);
    setForm(savedForm);
    setNotice("confirmed");
    go("list");
  }

  const firstName = savedForm && savedForm.name ? savedForm.name.trim().split(/\s+/)[0] : "";
  const ready = form && status !== "loading" && status !== "load_error";
  const hasAddress = savedForm && savedForm.address1;
  const shownShips = showAll ? ships : ships.slice(0, SHIPS_SHOWN);
  const latest = ships[0] || null;
  const viewing = ships.find(function (s) { return s.id === openShip; }) || null;
  const noEmail = savedForm && !savedForm.email;
  const noPhone = savedForm && !savedForm.phone;
  // The email on file can't be changed here (see /api/account POST).
  const emailLocked = savedForm && savedForm.email;

  const addressLines = hasAddress ? (
    <>
      {savedForm.address1}
      {savedForm.address2 ? ", " + savedForm.address2 : ""}
      <br />
      {savedForm.city}, {savedForm.state} {savedForm.zip}
    </>
  ) : null;

  function copyFor(s) {
    return function () {
      copyText(s.tracking);
      setCopiedId(s.id);
      setTimeout(function () { setCopiedId(""); }, 1800);
    };
  }

  return (
    <main className="ac">
      <style>{css}</style>

      <div className={"ac-wrap" + (screen === "ship" && viewing ? " ac-wrap-bar" : "") + (ready && screen === "list" ? " ac-wrap-tabs" : "")}>
        <div className="ac-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={encodeURI(LOGO_SRC)} alt="Erendira's Boutique" className="ac-logo" />
          <button
            type="button"
            className="ac-lang"
            aria-label={t.langLabel}
            onClick={changeLang}
          >
            {t.langShort}
          </button>
        </div>

        {status === "loading" && (
          <div>
            <div className="ac-skel short" />
            <div className="ac-skel tall" />
            <div className="ac-skel" />
          </div>
        )}

        {status === "load_error" && (
          <div className="ac-card ac-pad">
            <p className="ac-err" style={{ margin: 0 }}>
              {t.loadError}
              <br />
              <a href={"mailto:" + SHOP_EMAIL}>{SHOP_EMAIL}</a>
            </p>
            <a className="ac-btn" style={{ marginTop: 14 }} href={"/find-account?lang=" + lang}>{t.findAccount}</a>
            <a className="ac-btn ac-btn-ghost" style={{ marginTop: 10 }} href="/customer">{t.signInEmail}</a>
          </div>
        )}

        {/* ---------- 1) welcome: confirm address + contact ---------- */}
        {ready && screen === "ask" && (
          <div className="ac-flow">
            <div className="ac-head">
              <p className="ac-hi">{t.hi(firstName)}</p>
              <h1 className="ac-h1">{t.welcomeTitle}</h1>
            </div>

            <section className="ac-addr" aria-label={t.shippingTo}>
              <span className="ac-addr-ico" aria-hidden="true"><HomeIcon color="#FFFFFF" /></span>
              <div className="ac-addr-main">
                <span className="ac-addr-k">{t.shippingTo}</span>
                <address>
                  {savedForm.name ? <>{savedForm.name}<br /></> : null}
                  {addressLines}
                </address>
              </div>
              <button type="button" className="ac-addr-btn" onClick={function () { setNotice(""); go("edit", "ac-first"); }}>
                {t.change}
              </button>
            </section>

            {noEmail || noPhone ? (
              <section className="ac-card ac-reach" aria-labelledby="ac-reach-title">
                <div className="ac-reach-head">
                  <span className="ac-tag">{t.oneMore}</span>
                  <h2 id="ac-reach-title" className="ac-h2">{t.reachTitle}</h2>
                  <p>{t.reachBody}</p>
                </div>
                {noEmail ? (
                  <div className="ac-field">
                    <label htmlFor="ac-w-email" className="ac-label-strong">{t.email}</label>
                    <div className="ac-box">
                      <MailIcon />
                      <input
                        id="ac-w-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={function (e) { updateField("email", e.target.value); }}
                      />
                    </div>
                  </div>
                ) : null}
                {noPhone ? (
                  <div className="ac-field">
                    <label htmlFor="ac-w-phone" className="ac-label-strong">{t.mobile}</label>
                    <div className="ac-box">
                      <PhoneIcon />
                      <input
                        id="ac-w-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="(555) 555-5555"
                        value={form.phone}
                        onChange={function (e) { updateField("phone", e.target.value); }}
                      />
                    </div>
                  </div>
                ) : null}
                {validationMsg && <p role="alert" className="ac-err">{validationMsg}</p>}
                {status === "save_error" && <p role="alert" className="ac-err">{t.saveError}</p>}
                <button type="button" className="ac-btn" onClick={confirmHere} disabled={status === "saving"}>
                  {status === "saving" ? t.saving : t.saveShip}
                </button>
                <button type="button" className="ac-skip" onClick={skipContact}>{t.skip}</button>
              </section>
            ) : (
              <button type="button" className="ac-btn" onClick={confirmHere}>{t.yesShip}</button>
            )}

            {latest ? (
              <button type="button" className="ac-teaser" onClick={function () { setNotice(""); go("list"); }}>
                <span className="ac-teaser-ico" aria-hidden="true"><BoxIcon color="#FFFFFF" /></span>
                <span className="ac-teaser-main">
                  <strong>
                    {latest.orderNumber && (latest.stage === "in_transit" || latest.stage === "out")
                      ? t.latestOnWay(latest.orderNumber)
                      : (latest.orderNumber ? t.order + " " + latest.orderNumber + " · " : "") + t.status[latest.stage]}
                  </strong>
                  <span>{t.seeShips(ships.length)}</span>
                </span>
                <Chevron />
              </button>
            ) : null}
          </div>
        )}

        {/* ---------- 2) home, in tabs ---------- */}
        {ready && screen === "list" && (
          <div className="ac-flow">
            <div className="ac-head">
              <p className="ac-hi">{t.hi(firstName)}</p>
              <h1 className="ac-h1">{tab === "pay" ? t.payTitle : tab === "gift" ? t.tabGift : tab === "me" ? t.myInfo : t.yourOrders}</h1>
              <p className="ac-via">
                {mode === "session" || (signedInEmail && wallet && wallet.full)
                  ? t.signedInAs(signedInEmail || (savedForm && savedForm.email) || "")
                  : t.viaLink}
              </p>
            </div>

            <nav className="ac-tabs" aria-label={t.myInfo}>
              {TABS.map(function (k) {
                const on = tab === k;
                return (
                  <button
                    type="button"
                    key={k}
                    className={"ac-tab" + (on ? " on" : "")}
                    aria-current={on ? "page" : undefined}
                    onClick={function () { setTab(k); setNotice(""); window.scrollTo(0, 0); }}
                  >
                    <TabIcon name={k} />
                    <span>{t[TAB_LABEL[k]]}</span>
                  </button>
                );
              })}
            </nav>

            {notice ? (
              <p role="status" className="ac-ok">{notice === "saved" ? t.saved : t.confirmed}</p>
            ) : null}

            {tab === "orders" && (noEmail || noPhone) ? (
              <section className="ac-card ac-nudge" aria-labelledby="ac-nudge-title">
                <div className="ac-nudge-head">
                  <span className="ac-nudge-ico" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"><path d="M12 8v5M12 16.5h.01" /><circle cx="12" cy="12" r="9" /></svg>
                  </span>
                  <div>
                    <h2 id="ac-nudge-title" className="ac-h3">{t.cantReach}</h2>
                    <p>{noEmail && noPhone ? t.missingBoth : noEmail ? t.missingEmail : t.missingPhone}</p>
                  </div>
                </div>
                <div className={noEmail && noPhone ? "ac-2" : ""}>
                  {noEmail ? <button type="button" className="ac-btn ac-btn-sm" onClick={function () { go("edit", "ac-email"); }}>{t.addEmail}</button> : null}
                  {noPhone ? <button type="button" className="ac-btn ac-btn-sm" onClick={function () { go("edit", "ac-phone"); }}>{t.addPhone}</button> : null}
                </div>
              </section>
            ) : null}

            {tab === "orders" && latest ? <Hero s={latest} t={t} onOpen={function () { openShipment(latest.id); }} /> : null}

            {tab === "orders" && ships.length > 0 ? (
              <section className="ac-sec" aria-labelledby="ac-ships-title">
                <div className="ac-sec-head">
                  <h2 id="ac-ships-title" className="ac-h2">{t.shipments}</h2>
                  <span>{t.total(ships.length)}</span>
                </div>
                {shownShips.map(function (s) {
                  return (
                    <button type="button" key={s.id} className="ac-ship" onClick={function () { openShipment(s.id); }}>
                      {s.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.photo} alt="" className="ac-thumb" loading="lazy" />
                      ) : (
                        <span className="ac-thumb ac-thumb-empty" aria-hidden="true"><BoxIcon color="#957f67" /></span>
                      )}
                      <span className="ac-ship-main">
                        <strong>{s.orderNumber ? t.order + " " + s.orderNumber : t.status[s.stage]}</strong>
                        <span>
                          {[s.date ? fmtDate(s.date, t.locale) : null, s.lastLocation || null].filter(Boolean).join(" · ") || "—"}
                        </span>
                      </span>
                      <StageChip stage={s.stage} t={t} />
                    </button>
                  );
                })}
                {ships.length > SHIPS_SHOWN && !showAll ? (
                  <button type="button" className="ac-more" onClick={function () { setShowAll(true); }}>
                    {t.seeAll(ships.length)}
                  </button>
                ) : null}
              </section>
            ) : null}

            {/* ----- payments ----- */}
            {tab === "pay" && (
              <section className="ac-sec" aria-label={t.payTitle}>
                {!wallet ? <div className="ac-skel" /> : null}
                {wallet && !wallet.payments.length ? <p className="ac-empty">{t.noPayments}</p> : null}
                {wallet && wallet.payments.length ? (
                  <div className="ac-card ac-list">
                    {wallet.payments.map(function (p) {
                      return (
                        <div className="ac-row" key={p.id}>
                          <span className="ac-row-main">
                            <strong>{money(p.amount, p.currency, t.locale)} · {p.description || t.purchase}</strong>
                            <span>{[p.createdAt ? fmtDate(p.createdAt, t.locale) : null, cardText(p)].filter(Boolean).join(" · ")}</span>
                          </span>
                          {p.refunded ? <span className="ac-chip problem"><i />{t.refunded}</span> : null}
                          {p.receiptUrl ? (
                            <a className="ac-row-btn" href={p.receiptUrl} target="_blank" rel="noopener noreferrer">{t.receipt}</a>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                {wallet && !wallet.full && wallet.payments.length ? <Unlock t={t} wallet={wallet} state={linkState} onSend={emailSignInLink} /> : null}
              </section>
            )}

            {/* ----- gift cards ----- */}
            {tab === "gift" && (
              <section className="ac-sec" aria-label={t.tabGift}>
                {!wallet ? <div className="ac-skel tall" /> : null}
                {wallet && !wallet.giftCards.length ? <p className="ac-empty">{t.noGift}</p> : null}
                {wallet && wallet.giftCards.length ? (
                  <>
                    <div className="ac-balance">
                      <span>{t.giftBalance}</span>
                      <strong>{money(giftTotal(wallet.giftCards), "usd", t.locale)}</strong>
                      <span>{t.giftAcross(wallet.giftCards.length)}</span>
                    </div>
                    <div className="ac-card ac-list">
                      {wallet.giftCards.map(function (c) {
                        return (
                          <div className="ac-row" key={c.id}>
                            <span className="ac-row-main">
                              <strong className="ac-mono">{c.code}</strong>
                              <span>
                                {t.giftOf(money(c.remaining, "usd", t.locale), money(c.amount, "usd", t.locale))}
                                {" · "}
                                {c.lastUsedAt ? t.giftUsed(fmtDate(c.lastUsedAt, t.locale)) : t.giftNever}
                              </span>
                            </span>
                            {wallet.full && c.status === "active" ? (
                              <button type="button" className="ac-row-btn" onClick={function () { copyText(c.code); setCopiedId(c.id); setTimeout(function () { setCopiedId(""); }, 1800); }}>
                                {copiedId === c.id ? t.copied : t.copy}
                              </button>
                            ) : (
                              <span className="ac-chip">{t.giftStatus[c.status] || c.status}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {!wallet.full ? <Unlock t={t} wallet={wallet} state={linkState} onSend={emailSignInLink} /> : null}
                  </>
                ) : null}
              </section>
            )}

            {/* ----- my details ----- */}
            {tab === "me" && (
            <section className="ac-sec" aria-labelledby="ac-details-title">
              <h2 id="ac-details-title" className="ac-h2 ac-sec-pad">{t.myInfo}</h2>
              <div className="ac-card ac-details">
                <button type="button" className="ac-det" onClick={function () { go("edit", "ac-first"); }}>
                  <span className="ac-det-ico" aria-hidden="true"><HomeIcon color="#957f67" /></span>
                  <span className="ac-det-main">
                    <span className="ac-det-k">{t.shipTo}</span>
                    <span>{hasAddress ? <>{savedForm.name ? savedForm.name + " · " : ""}{addressLines}</> : <span className="ac-det-add">{t.add}</span>}</span>
                  </span>
                  <span className="ac-det-act">{t.edit}</span>
                </button>
                <button type="button" className="ac-det" onClick={function () { go("edit", "ac-email"); }}>
                  <span className="ac-det-ico" aria-hidden="true"><MailIcon /></span>
                  <span className="ac-det-main">
                    <span className="ac-det-k">{t.email}</span>
                    {savedForm.email ? <span>{savedForm.email}</span> : <span className="ac-det-add">{t.addForUpdates}</span>}
                  </span>
                  {savedForm.email ? <span className="ac-det-act">{t.edit}</span> : <span className="ac-plus" aria-hidden="true">+</span>}
                </button>
                <button type="button" className="ac-det" onClick={function () { go("edit", "ac-phone"); }}>
                  <span className="ac-det-ico" aria-hidden="true"><PhoneIcon /></span>
                  <span className="ac-det-main">
                    <span className="ac-det-k">{t.phone}</span>
                    {savedForm.phone ? <span>{savedForm.phone}</span> : <span className="ac-det-add">{t.addForTexts}</span>}
                  </span>
                  {savedForm.phone ? <span className="ac-det-act">{t.edit}</span> : <span className="ac-plus" aria-hidden="true">+</span>}
                </button>
              </div>
              {signedInEmail ? (
                <button type="button" className="ac-btn ac-btn-ghost" onClick={logOut}>{t.logOut}</button>
              ) : null}
            </section>
            )}
          </div>
        )}

        {/* ---------- 3) one shipment (back to the list if it's gone) ---------- */}
        {ready && screen === "ship" && !viewing && (
          <button type="button" className="ac-btn ac-btn-ghost" onClick={function () { go("list"); }}>{t.backToOrders}</button>
        )}
        {ready && screen === "ship" && viewing && (
          <div className="ac-flow">
            <div className="ac-bar-top">
              <button type="button" className="ac-back" aria-label={t.backToOrders} onClick={function () { go("list"); }}>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <span>{viewing.orderNumber ? t.order + " " + viewing.orderNumber : ""}</span>
              <span style={{ width: 44 }} aria-hidden="true" />
            </div>

            <div className="ac-head">
              <StageChip stage={viewing.stage} t={t} />
              <h1 className="ac-h1">{heroTitle(viewing, t)}</h1>
              <p className="ac-hi">
                {[viewing.date ? t.shippedOn + " " + fmtDate(viewing.date, t.locale) : null, serviceText(viewing)].filter(Boolean).join(" · ")}
              </p>
            </div>

            {viewing.photo ? (
              <figure className="ac-photo">
                <button type="button" onClick={function () { setBigPhoto(viewing.photo); }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={viewing.photo} alt={t.photoAlt} loading="lazy" />
                </button>
                <figcaption>{t.photoCap}</figcaption>
              </figure>
            ) : null}

            <section className="ac-card ac-journey" aria-labelledby="ac-journey-title">
              <h2 id="ac-journey-title" className="ac-h2">{t.journey}</h2>
              <ol>
                {journey(viewing, t).map(function (e, i) {
                  return (
                    <li key={i} className={"ac-ev " + e.kind}>
                      <span className="ac-ev-rail" aria-hidden="true"><i /><b /></span>
                      <span className="ac-ev-main">
                        <span className="ac-ev-title">{e.title}</span>
                        {e.sub ? <span className="ac-ev-sub">{e.sub}</span> : null}
                      </span>
                    </li>
                  );
                })}
              </ol>
              {!viewing.events.length && viewing.stage !== "delivered" ? <p className="ac-note">{t.noScans}</p> : null}
            </section>

            <section className="ac-card" aria-label={t.tracking}>
              <dl className="ac-dl">
                {viewing.carrier ? <Detail k={t.carrier} v={serviceText(viewing)} /> : null}
                {viewing.tracking ? <Detail k={t.tracking} v={<span className="ac-mono">{viewing.tracking}</span>} /> : null}
                {viewing.shipTo ? <Detail k={t.goingTo} v={viewing.shipTo} /> : null}
                {viewing.date ? <Detail k={t.shippedOn} v={fmtDateTime(viewing.date, t)} /> : null}
              </dl>
            </section>

            {viewing.tracking || viewing.trackUrl ? (
              <div className="ac-sticky">
                {viewing.tracking ? (
                  <button type="button" className="ac-btn ac-btn-ghost" onClick={copyFor(viewing)}>
                    {copiedId === viewing.id ? t.copied : t.copyTracking}
                  </button>
                ) : null}
                {viewing.trackUrl ? (
                  <a className="ac-btn ac-btn-link" href={viewing.trackUrl} target="_blank" rel="noopener noreferrer">
                    {t.trackOn(viewing.carrier)}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        {/* ---------- 4) edit ---------- */}
        {ready && screen === "edit" && (
          <div className="ac-flow">
            <div className="ac-head">
              {!hasAddress ? <p className="ac-hi">{t.hi(firstName)}</p> : null}
              <h1 className="ac-h1">{hasAddress ? t.editTitle : t.noAddress}</h1>
            </div>

            <div className="ac-card ac-pad">
              <Field label={t.name}>
                <input
                  id="ac-name"
                  type="text"
                  className="ac-in"
                  value={form.name}
                  onChange={function changeName(event) {
                    updateField("name", event.target.value);
                  }}
                  autoComplete="name"
                />
              </Field>

              <Field label={t.address1}>
                <div id="ac-first-wrap">
                  <AddressAutocomplete
                    inputStyle={INPUT_STYLE}
                    value={form.address1}
                    placeholder={t.addressHint}
                    poweredBy={t.poweredBy}
                    onChange={function changeAddress1(value) {
                      updateField("address1", value);
                    }}
                    onSelect={pickAddress}
                  />
                </div>
              </Field>

              <Field label={t.address2}>
                <input
                  type="text"
                  className="ac-in"
                  value={form.address2}
                  id="address2"
                  onChange={function changeAddress2(event) {
                    updateField("address2", event.target.value);
                  }}
                  autoComplete="address-line2"
                />
              </Field>

              <div className="ac-3">
                <Field label={t.city}>
                  <input
                    type="text"
                    className="ac-in"
                    value={form.city}
                    onChange={function changeCity(event) {
                      updateField("city", event.target.value);
                    }}
                    autoComplete="address-level2"
                  />
                </Field>

                <Field label={t.state}>
                  <input
                    type="text"
                    className="ac-in"
                    value={form.state}
                    onChange={function changeState(event) {
                      updateField("state", event.target.value.toUpperCase());
                    }}
                    autoComplete="address-level1"
                    maxLength={40}
                  />
                </Field>

                <Field label={t.zip}>
                  <input
                    type="text"
                    className="ac-in"
                    value={form.zip}
                    onChange={function changeZip(event) {
                      updateField("zip", event.target.value);
                    }}
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={20}
                  />
                </Field>
              </div>

              <Field label={t.email}>
                <input
                  id="ac-email"
                  type="email"
                  className="ac-in"
                  value={form.email}
                  readOnly={Boolean(emailLocked)}
                  aria-describedby={emailLocked ? "ac-email-note" : undefined}
                  onChange={function changeEmail(event) {
                    updateField("email", event.target.value);
                  }}
                  autoComplete="email"
                  inputMode="email"
                />
                {emailLocked ? <span id="ac-email-note" className="ac-note-sm">{t.emailLocked}</span> : null}
              </Field>

              <Field label={t.phone}>
                <input
                  id="ac-phone"
                  type="tel"
                  className="ac-in"
                  value={form.phone}
                  onChange={function changePhone(event) {
                    updateField("phone", event.target.value);
                  }}
                  autoComplete="tel"
                  inputMode="tel"
                />
              </Field>

              {validationMsg && <p role="alert" className="ac-err">{validationMsg}</p>}
              {status === "save_error" && <p role="alert" className="ac-err">{t.saveError}</p>}
            </div>

            <div className="ac-stack">
              <button type="button" className="ac-btn" onClick={save} disabled={status === "saving"}>
                {status === "saving" ? t.saving : t.save}
              </button>
              {hasAddress ? (
                <button type="button" className="ac-btn ac-btn-ghost" onClick={cancelEdit}>{t.cancel}</button>
              ) : null}
            </div>
          </div>
        )}

        {bigPhoto ? (
          <div className="ac-lightbox" role="dialog" aria-modal="true" onClick={function () { setBigPhoto(""); }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bigPhoto} alt={t.photoAlt} />
            <button type="button" className="ac-lightbox-x" onClick={function () { setBigPhoto(""); }}>{t.close} ✕</button>
          </div>
        ) : null}

        {status !== "loading" ? (
          <footer className="ac-foot">
            <nav aria-label="Erendira's Boutique" className="ac-foot-nav">
              <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" className="ac-foot-btn ac-foot-main">
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 016 0v2" /></svg>
                {t.shop}
              </a>
              <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="ac-foot-btn">
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#957f67" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4z" /></svg>
                {t.contact}
              </a>
              <a href={RETURNS_URL} target="_blank" rel="noopener noreferrer" className="ac-foot-btn">
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#957f67" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 010 12h-3" /></svg>
                {t.returns}
              </a>
            </nav>
            <div className="ac-foot-small">
              <a href={"mailto:" + SHOP_EMAIL}>{SHOP_EMAIL}</a>
              <span>© {new Date().getFullYear()} Erendira&rsquo;s Boutique</span>
            </div>
          </footer>
        ) : null}
      </div>
    </main>
  );
}

/* ---------- pieces ---------- */

const TABS = ["orders", "pay", "gift", "me"];
const TAB_LABEL = { orders: "tabOrders", pay: "tabPay", gift: "tabGift", me: "tabMe" };

function TabIcon(props) {
  const common = { "aria-hidden": "true", width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (props.name === "pay") return <svg {...common}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h4" /></svg>;
  if (props.name === "gift") return <svg {...common}><rect x="3.5" y="9" width="17" height="11" rx="1.5" /><path d="M3 9h18M12 9v11M12 9c-1.5-3-5-3.5-5-1s3.5 1 5 1zM12 9c1.5-3 5-3.5 5-1s-3.5 1-5 1z" /></svg>;
  if (props.name === "me") return <svg {...common}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1-3.6 3.8-5.5 7-5.5s6 1.9 7 5.5" /></svg>;
  return <svg {...common}><path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z" /><path d="M3 7.5L12 12l9-4.5M12 12v9" /></svg>;
}

// Personal link only: full codes + receipts need a one-tap sign-in.
function Unlock(props) {
  const t = props.t;
  const state = props.state;
  if (!props.wallet.emailHint) return null;
  return (
    <section className="ac-card ac-unlock" aria-labelledby="ac-unlock-title">
      <h2 id="ac-unlock-title" className="ac-h3">{t.lockedTitle}</h2>
      <p>{t.lockedBody(props.wallet.emailHint)}</p>
      {state === "sent" ? (
        <p role="status" className="ac-ok">{t.linkSent}</p>
      ) : (
        <button type="button" className="ac-btn ac-btn-sm" onClick={props.onSend} disabled={state === "sending"}>
          {state === "sending" ? t.sending : t.sendLink}
        </button>
      )}
      {state === "error" ? <p role="alert" className="ac-err">{t.linkError}</p> : null}
    </section>
  );
}

// fetch() for this account: the personal link token and/or the sign-in session.
function apiCall(portalToken, bearer) {
  return function (path) {
    const url = portalToken ? path + "?t=" + encodeURIComponent(portalToken) : path;
    const headers = bearer ? { Authorization: "Bearer " + bearer } : {};
    return fetch(url, { method: "GET", cache: "no-store", headers: headers });
  };
}

// "Is this your address?" is remembered per link, on this device.
function confirmKey(token) {
  return "ebtq_confirmed_" + String(token || "").slice(0, 36);
}
function confirmedRecently(token) {
  if (!token) return true;
  try {
    const at = Number(localStorage.getItem(confirmKey(token)) || 0);
    return at > 0 && Date.now() - at < CONFIRM_DAYS * 86400000;
  } catch (e) {
    return false;
  }
}
function markConfirmed(token) {
  if (!token) return;
  try { localStorage.setItem(confirmKey(token), String(Date.now())); } catch (e) { /* private mode */ }
}

function money(amount, currency, locale) {
  try {
    return new Intl.NumberFormat(locale || "en-US", { style: "currency", currency: String(currency || "usd").toUpperCase() }).format(Number(amount || 0));
  } catch (e) {
    return "$" + Number(amount || 0).toFixed(2);
  }
}

function cardText(p) {
  if (!p.brand && !p.last4) return null;
  return [p.brand ? prettyCarrier(p.brand) : null, p.last4 ? "•••• " + p.last4 : null].filter(Boolean).join(" ");
}

function giftTotal(cards) {
  return cards.reduce(function (sum, c) {
    return c.status === "active" ? sum + Number(c.remaining || 0) : sum;
  }, 0);
}

function Hero(props) {
  const s = props.s;
  const t = props.t;
  const step = STEP[s.stage] != null ? STEP[s.stage] : 1;
  const showEta = s.eta && s.stage !== "delivered";
  return (
    <section className="ac-hero" aria-label={t.status[s.stage]}>
      <div className="ac-hero-top">
        <span>{s.orderNumber ? t.order + " " + s.orderNumber : ""}</span>
        <span className="ac-hero-chip"><i />{t.status[s.stage]}</span>
      </div>
      <div>
        {showEta ? <p className="ac-hero-k">{t.arriving}</p> : null}
        <p className="ac-hero-big">{showEta ? fmtDate(s.eta, t.locale) : heroTitle(s, t)}</p>
      </div>
      <Progress step={step} t={t} />
      {s.lastEvent ? (
        <div className="ac-hero-scan">
          <span className="ac-hero-scan-ico" aria-hidden="true"><PinIcon /></span>
          <span>
            <strong>{s.lastEvent}</strong>
            <span>{[s.lastLocation, s.lastEventAt ? fmtDateTime(s.lastEventAt, t) : null].filter(Boolean).join(" · ")}</span>
          </span>
        </div>
      ) : null}
      <div className={s.trackUrl ? "ac-2" : ""}>
        <button type="button" className="ac-hero-btn" style={{ width: "100%" }} onClick={props.onOpen}>{t.viewDetails}</button>
        {s.trackUrl ? (
          <a className="ac-hero-btn ac-hero-btn-alt" href={s.trackUrl} target="_blank" rel="noopener noreferrer">{t.trackOn(s.carrier)}</a>
        ) : null}
      </div>
    </section>
  );
}

function Progress(props) {
  const t = props.t;
  const step = props.step;
  return (
    <div className="ac-prog" role="img" aria-label={t.stepOf(step + 1, t.steps[step])}>
      <div className="ac-prog-line">
        {t.steps.map(function (label, i) {
          return (
            <span key={i} className={"ac-prog-seg" + (i === 0 ? " first" : "")}>
              {i > 0 ? <b className={i <= step ? "on" : ""} /> : null}
              <i className={i < step ? "done" : i === step ? "now" : ""} />
            </span>
          );
        })}
      </div>
      <div className="ac-prog-labels" aria-hidden="true">
        {t.steps.map(function (label, i) {
          return <span key={i} className={i === step ? "now" : ""}>{label}</span>;
        })}
      </div>
    </div>
  );
}

function StageChip(props) {
  return <span className={"ac-chip " + props.stage}><i />{props.t.status[props.stage]}</span>;
}

function Field(props) {
  return (
    <label className="ac-field">
      <span className="ac-label">{props.label}</span>
      {props.children}
    </label>
  );
}

function Detail(props) {
  return (
    <div className="ac-dl-row">
      <dt>{props.k}</dt>
      <dd>{props.v}</dd>
    </div>
  );
}

function Chevron() {
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#957f67" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>;
}
function HomeIcon(props) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={props.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5L12 4l9 6.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z" /></svg>;
}
function BoxIcon(props) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={props.color} strokeWidth="1.6" strokeLinejoin="round"><path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z" /><path d="M3 7.5L12 12l9-4.5M12 12v9" /></svg>;
}
function MailIcon() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#957f67" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>;
}
function PhoneIcon() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#957f67" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></svg>;
}
function PinIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>;
}

function heroTitle(s, t) {
  const fn = t.heroTitle[s.stage] || t.heroTitle.shipped;
  if (s.stage === "delivered") return fn(s.deliveredAt ? fmtDate(s.deliveredAt, t.locale) : "");
  if (s.stage === "shipped") return fn(s.date ? fmtDate(s.date, t.locale) : "");
  return fn();
}

function serviceText(s) {
  if (!s.carrier) return null;
  return s.carrier + (s.mailClass ? " " + s.mailClass : "");
}

// Newest first: what's next (if not delivered), carrier scans, then Shipped and Packed.
function journey(s, t) {
  const out = [];
  if (s.stage !== "delivered" && s.stage !== "returned") {
    out.push({ kind: "next", title: t.status.delivered, sub: s.eta ? t.expected(fmtDate(s.eta, t.locale)) : "" });
  }
  s.events.forEach(function (e, i) {
    out.push({
      kind: i === 0 ? "now" : "past",
      title: e.message,
      sub: [e.location, e.at ? fmtDateTime(e.at, t) : null].filter(Boolean).join(" · "),
    });
  });
  if (!s.events.length && s.deliveredAt) {
    out.push({ kind: "now", title: t.status.delivered, sub: fmtDateTime(s.deliveredAt, t) });
  }
  if (s.date) {
    out.push({ kind: out.some(function (e) { return e.kind === "now"; }) ? "past" : "now", title: t.shippedOn, sub: [fmtDate(s.date, t.locale), serviceText(s)].filter(Boolean).join(" · ") });
  }
  if (s.packedAt) {
    out.push({ kind: "past", title: t.steps[0], sub: fmtDateTime(s.packedAt, t) + " · " + t.packedBy });
  }
  if (out.length) out[out.length - 1].kind += " last";
  return out;
}

function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return;
    }
  } catch (e) {
    // fall through to the old way
  }
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  try { document.execCommand("copy"); } catch (e) { /* ignore */ }
  document.body.removeChild(el);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---------- shipments ---------- */

function pick(obj, keys) {
  for (let i = 0; i < keys.length; i++) {
    const v = obj[keys[i]];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

function stageOf(raw) {
  const s = String(raw || "").toLowerCase().replace(/[\s-]+/g, "_");
  if (!s) return "shipped";
  if (s.indexOf("out_for_delivery") !== -1) return "out";
  // Label printed, carrier hasn't scanned it yet ("pre_transit", "label created", "awaits item").
  if (/(pre_?transit|label|lbl|awaits_item|unknown)/.test(s)) return "label";
  if (/deliver/.test(s)) return "delivered";
  if (/return/.test(s)) return "returned";
  if (/(exception|fail|lost|undeliverable)/.test(s)) return "problem";
  if (/(transit|accepted|picked|en_route|in_route)/.test(s)) return "in_transit";
  if (/(pending|unfulfilled|processing|awaiting|not_shipped)/.test(s)) return "preparing";
  return "shipped";
}

function trackingUrl(carrier, num) {
  if (!num) return null;
  const c = String(carrier || "").toLowerCase();
  const n = encodeURIComponent(num);
  if (c.indexOf("ups") !== -1) return "https://www.ups.com/track?tracknum=" + n;
  if (c.indexOf("fedex") !== -1) return "https://www.fedex.com/fedextrack/?trknbr=" + n;
  if (c.indexOf("dhl") !== -1) return "https://www.dhl.com/us-en/home/tracking.html?tracking-id=" + n;
  return "https://tools.usps.com/go/TrackConfirmAction?tLabels=" + n;
}

function normalizeShipment(s, i) {
  const carrier = pick(s, ["carrier", "provider", "carrier_name"]);
  const tracking = pick(s, ["tracking_number", "tracking", "tracking_code"]);
  const deliveredAt = pick(s, ["delivered_at"]);
  return {
    id: String(pick(s, ["id", "tracking_number"]) || "s" + i),
    stage: deliveredAt ? "delivered" : stageOf(pick(s, ["status", "tracking_status", "state"])),
    date: pick(s, ["shipped_at", "ship_date", "created_at", "date"]),
    trackUrl: pick(s, ["tracking_url", "tracking_url_provider", "public_url"]) || trackingUrl(carrier, tracking),
    orderNumber: pick(s, ["order_number"]),
    photo: pick(s, ["package_photo_url", "photo_url"]),
    packedAt: pick(s, ["packed_at"]),
    deliveredAt: deliveredAt,
    eta: pick(s, ["eta"]),
    carrier: carrier ? String(carrier).toUpperCase() === carrier ? carrier : prettyCarrier(carrier) : null,
    mailClass: pick(s, ["mail_class"]) ? prettyWords(pick(s, ["mail_class"])) : null,
    tracking: tracking,
    shipTo: pick(s, ["ship_to"]),
    lastEvent: pick(s, ["last_event"]),
    lastLocation: pick(s, ["last_location"]),
    lastEventAt: pick(s, ["last_event_at"]),
    events: Array.isArray(s.events) ? s.events : [],
  };
}

// "usps" -> "USPS", "fedex" -> "FedEx", others title-cased.
function prettyCarrier(c) {
  const k = String(c).toLowerCase();
  if (k === "usps" || k === "ups" || k === "dhl") return k.toUpperCase();
  if (k === "fedex") return "FedEx";
  return prettyWords(c);
}

// "GroundAdvantage" / "ground_advantage" -> "Ground Advantage"
function prettyWords(v) {
  return String(v)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b([a-z])/g, function (m) { return m.toUpperCase(); });
}

// "Nov 5, 2026 at 3:42 PM" / "5 nov 2026 a las 15:42"
function fmtDateTime(iso, t) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return fmtDate(iso, t.locale);
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  const time = new Intl.DateTimeFormat(t.locale, {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  return fmtDate(iso, t.locale) + t.at + time;
}

function byNewest(a, b) {
  return new Date(b.date || 0) - new Date(a.date || 0);
}

function fmtDate(iso, locale) {
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(iso)) ? iso + "T12:00:00" : iso);
  if (isNaN(d)) return String(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat(locale, {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  }).format(d);
}

/* ---------- styles ---------- */

const css = `
.ac { --bg:var(--brand-cream, #F5F3EF); --brand:var(--brand-taupe, #957f67); --sand:var(--brand-sand, #cfbda9); --line:rgba(var(--brand-sand-rgb, 207 189 169) / .55); --ink:var(--brand-ink, #5F4E3D); --err:#a8452a;
  --head:var(--brand-font-heading, var(--font-heading, "Charman Serif", Georgia, serif));
  --body:var(--brand-font-body, var(--font-body, "Ltt Recoleta", Georgia, serif));
  min-height:100vh; background:var(--bg); color:var(--ink); font-family:var(--body); -webkit-font-smoothing:antialiased;
  /* The brand fonts come in one weight each: never let the browser fake a bold. */
  font-synthesis:none; letter-spacing:.005em;
  padding:16px 16px 40px; box-sizing:border-box; }
.ac *, .ac *::before, .ac *::after { box-sizing:border-box; }
.ac a { color:var(--ink); }
.ac button { font-family:inherit; cursor:pointer; color:inherit; }
.ac-wrap { max-width:440px; margin:0 auto; }
.ac-wrap-bar { padding-bottom:96px; }
.ac-top { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:22px; }
.ac-logo { width:118px; height:auto; display:block; }
.ac-lang { min-width:44px; min-height:44px; padding:0 14px; border:0; border-radius:999px; background:#fff; color:var(--ink); font-size:13px; font-weight:600; }
.ac-flow { display:flex; flex-direction:column; gap:22px; }
.ac-head { display:flex; flex-direction:column; gap:8px; padding:0 4px; align-items:flex-start; }
.ac-hi { margin:0; font-size:14px; color:var(--brand); }
.ac-h1 { margin:0; font-family:var(--head); font-weight:400; font-size:34px; line-height:1.06; letter-spacing:-.01em; color:var(--ink); }
.ac-h2 { margin:0; font-family:var(--head); font-weight:400; font-size:22px; line-height:1.15; color:var(--ink); }
.ac-h3 { margin:0; font-family:var(--head); font-weight:400; font-size:19px; line-height:1.15; color:var(--ink); }
.ac-card { background:#fff; border-radius:22px; }
.ac-pad { padding:18px 16px 8px; }
.ac-ok { margin:0; padding:12px 16px; border-radius:16px; background:#fff; font-size:14.5px; color:var(--ink); }
.ac-err { margin:0; font-size:14px; line-height:1.45; color:var(--err); }

/* buttons */
.ac-btn { display:flex; align-items:center; justify-content:center; min-height:54px; width:100%; border:0; border-radius:16px; background:var(--brand); color:#fff !important;
  font-size:16px; font-weight:600; padding:0 18px; text-decoration:none; }
.ac-btn:disabled { opacity:.6; cursor:not-allowed; }
.ac-btn-sm { min-height:48px; font-size:14.5px; border-radius:14px; }
.ac-btn-ghost { background:#fff; color:var(--ink) !important; border:1px solid var(--sand); font-weight:500; }
.ac-btn-link { background:var(--brand); }
.ac-skip { align-self:center; min-height:44px; border:0; background:none; font-size:13.5px; color:var(--brand) !important; text-decoration:underline; text-underline-offset:3px; }
.ac-stack { display:grid; gap:10px; }
.ac-2 { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; }

/* welcome */
.ac-addr { display:flex; gap:14px; align-items:flex-start; padding:20px; border-radius:28px; background:var(--brand); color:#fff; }
.ac-addr-ico { flex:none; width:40px; height:40px; border-radius:14px; background:rgba(255,255,255,.14); display:grid; place-items:center; }
.ac-addr-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:4px; }
.ac-addr-k { font-size:13px; color:var(--bg); }
.ac-addr address { font-style:normal; font-size:17px; line-height:1.45; overflow-wrap:anywhere; }
.ac-addr-btn { flex:none; min-height:40px; padding:0 14px; border:0; border-radius:999px; background:#fff; color:var(--brand) !important; font-size:13px; font-weight:600; }
.ac-reach { border:2px solid var(--brand); padding:20px 16px 12px; display:flex; flex-direction:column; gap:14px; }
.ac-reach-head { padding:0 4px; display:flex; flex-direction:column; gap:8px; align-items:flex-start; }
.ac-reach-head .ac-h2 { font-size:24px; }
.ac-reach-head p { margin:0; font-size:14px; line-height:1.5; }
.ac-tag { padding:5px 10px; border-radius:999px; background:var(--brand); color:#fff; font-size:12px; font-weight:600; }
.ac-label-strong { padding:0 4px; font-size:13px; font-weight:600; }
.ac-box { display:flex; align-items:center; gap:12px; min-height:56px; padding:0 16px; border-radius:16px; background:var(--bg); }
.ac-box:focus-within { box-shadow:0 0 0 2px var(--brand); background:#fff; }
.ac-box input { flex:1; min-width:0; border:0; background:transparent; outline:none; font-size:16px; font-family:inherit; color:var(--ink); }
.ac-box input::placeholder { color:var(--brand); opacity:.8; }
.ac-teaser { display:flex; align-items:center; gap:12px; width:100%; padding:14px 16px; border:0; border-radius:20px; background:#fff; text-align:left; }
.ac-teaser-ico { flex:none; width:40px; height:40px; border-radius:14px; background:var(--brand); display:grid; place-items:center; }
.ac-teaser-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.ac-teaser-main strong { font-size:15px; font-weight:600; }
.ac-teaser-main span { font-size:13px; color:var(--brand); }

/* home */
.ac-nudge { border:2px solid var(--brand); padding:16px; display:flex; flex-direction:column; gap:12px; }
.ac-nudge-head { display:flex; gap:12px; align-items:flex-start; }
.ac-nudge-head p { margin:3px 0 0; font-size:13.5px; line-height:1.45; }
.ac-nudge-ico { flex:none; width:36px; height:36px; border-radius:12px; background:var(--brand); display:grid; place-items:center; }
.ac-hero { border-radius:28px; background:var(--brand); color:#fff; padding:22px 20px 20px; display:flex; flex-direction:column; gap:18px; }
.ac-hero-top { display:flex; justify-content:space-between; align-items:center; gap:10px; font-size:13px; color:var(--bg); }
.ac-hero-chip { display:inline-flex; align-items:center; gap:6px; padding:5px 10px; border-radius:999px; background:rgba(255,255,255,.16); color:#fff; font-size:12px; font-weight:500; }
.ac-hero-chip i { width:6px; height:6px; border-radius:50%; background:#fff; }
.ac-hero-k { margin:0 0 4px; font-size:13px; color:var(--bg); }
.ac-hero-big { margin:0; font-family:var(--head); font-size:38px; line-height:1.02; }
.ac-hero-scan { display:flex; gap:12px; align-items:center; padding:14px; border-radius:18px; background:rgba(255,255,255,.12); }
.ac-hero-scan-ico { flex:none; width:36px; height:36px; border-radius:12px; background:rgba(255,255,255,.14); display:grid; place-items:center; }
.ac-hero-scan > span:last-child { display:flex; flex-direction:column; gap:2px; font-size:14px; min-width:0; }
.ac-hero-scan strong { font-weight:600; }
.ac-hero-scan > span:last-child span { font-size:12.5px; color:var(--bg); }
.ac-hero-btn { display:flex; align-items:center; justify-content:center; min-height:50px; border:0; border-radius:16px; background:#fff; color:var(--brand) !important;
  font-size:15px; font-weight:600; text-decoration:none; text-align:center; padding:0 10px; }
.ac-hero-btn-alt { background:rgba(255,255,255,.14); color:#fff !important; font-weight:500; }
.ac-prog-line { display:flex; align-items:center; }
.ac-prog-seg { display:flex; align-items:center; flex:1; }
.ac-prog-seg.first { flex:none; }
.ac-prog-seg b { flex:1; height:3px; background:var(--sand); }
.ac-prog-seg b.on { background:#fff; }
.ac-prog-seg i { flex:none; width:12px; height:12px; border-radius:50%; background:var(--sand); }
.ac-prog-seg i.done { background:#fff; }
.ac-prog-seg i.now { width:18px; height:18px; background:var(--brand); border:3px solid #fff; }
.ac-prog-labels { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); margin-top:8px; font-size:11.5px; color:var(--bg); }
.ac-prog-labels span:nth-child(2), .ac-prog-labels span:nth-child(3) { text-align:center; }
.ac-prog-labels span:last-child { text-align:right; }
.ac-prog-labels .now { color:#fff; font-weight:600; }
.ac-sec { display:flex; flex-direction:column; gap:10px; }
.ac-sec-head { display:flex; justify-content:space-between; align-items:baseline; padding:0 4px; }
.ac-sec-head span { font-size:13px; color:var(--brand); }
.ac-sec-pad { padding:0 4px; }
.ac-ship { display:flex; align-items:center; gap:14px; width:100%; padding:14px; border:0; border-radius:20px; background:#fff; text-align:left; }
.ac-thumb { flex:none; width:52px; height:52px; border-radius:16px; object-fit:cover; background:var(--bg); }
.ac-thumb-empty { display:grid; place-items:center; }
.ac-ship-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:4px; }
.ac-ship-main strong { font-size:15px; font-weight:600; }
.ac-ship-main span { font-size:13px; color:var(--brand); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ac-more { min-height:48px; border:0; border-radius:16px; background:#fff; font-size:14.5px; font-weight:500; }
.ac-chip { flex:none; display:inline-flex; align-items:center; gap:6px; padding:5px 10px; border-radius:999px; font-size:12px; font-weight:500; white-space:nowrap;
  background:var(--bg); color:var(--brand); }
.ac-chip i { width:6px; height:6px; border-radius:50%; background:var(--sand); }
.ac-chip.in_transit, .ac-chip.out, .ac-chip.problem, .ac-chip.returned { background:var(--brand); color:#fff; }
.ac-chip.in_transit i, .ac-chip.out i, .ac-chip.problem i, .ac-chip.returned i { background:#fff; }
.ac-chip.delivered { background:var(--bg); color:var(--ink); }
.ac-chip.delivered i { background:var(--brand); }
.ac-details { overflow:hidden; }
.ac-det { display:flex; align-items:center; gap:14px; width:100%; min-height:64px; padding:12px 16px; border:0; background:none; text-align:left; font-size:15px; }
.ac-det + .ac-det { border-top:1px solid var(--line); }
.ac-det-ico { flex:none; width:36px; height:36px; border-radius:12px; background:var(--bg); display:grid; place-items:center; }
.ac-det-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; line-height:1.4; overflow-wrap:anywhere; }
.ac-det-k { font-size:12.5px; color:var(--brand); }
.ac-det-add { color:var(--brand); font-weight:500; }
.ac-det-act { font-size:14px; font-weight:500; }
.ac-plus { flex:none; width:28px; height:28px; border-radius:50%; background:var(--bg); display:grid; place-items:center; color:var(--brand); font-size:18px; line-height:1; }

/* one shipment */
.ac-bar-top { display:flex; align-items:center; justify-content:space-between; font-size:14px; font-weight:600; }
.ac-back { width:44px; height:44px; border:0; border-radius:50%; background:#fff; display:grid; place-items:center; }
.ac-photo { margin:0; position:relative; }
.ac-photo button { display:block; width:100%; padding:0; border:0; background:none; }
.ac-photo img { display:block; width:100%; max-height:380px; object-fit:cover; border-radius:28px; background:var(--sand); }
.ac-photo figcaption { position:absolute; left:12px; bottom:12px; padding:7px 12px; border-radius:999px; background:rgba(255,255,255,.92); font-size:12px; font-weight:500; }
.ac-journey { padding:20px 18px 8px; }
.ac-journey ol { list-style:none; margin:16px 0 0; padding:0; }
.ac-ev { display:grid; grid-template-columns:24px minmax(0, 1fr); gap:12px; }
.ac-ev-rail { display:flex; flex-direction:column; align-items:center; }
.ac-ev-rail i { margin-top:3px; width:14px; height:14px; border-radius:50%; background:var(--sand); border:3px solid var(--sand); }
.ac-ev-rail b { flex:1; width:2px; margin:3px 0; background:var(--sand); }
.ac-ev.next .ac-ev-rail i { background:#fff; }
.ac-ev.now .ac-ev-rail i { background:#fff; border-color:var(--brand); }
.ac-ev.last .ac-ev-rail b { background:transparent; }
.ac-ev-main { display:flex; flex-direction:column; gap:3px; padding-bottom:18px; }
.ac-ev-title { font-size:15px; }
.ac-ev.now .ac-ev-title { font-weight:600; }
.ac-ev.next .ac-ev-title { color:var(--brand); }
.ac-ev-sub { font-size:12.5px; color:var(--brand); }
.ac-note { margin:0 0 12px; font-size:13px; line-height:1.45; color:var(--brand); }
.ac-dl { margin:0; }
.ac-dl-row { display:flex; justify-content:space-between; gap:16px; padding:14px 16px; font-size:14.5px; line-height:1.4; }
.ac-dl-row + .ac-dl-row { border-top:1px solid var(--line); }
.ac-dl-row dt { color:var(--brand); flex-shrink:0; }
.ac-dl-row dd { margin:0; text-align:right; min-width:0; overflow-wrap:anywhere; font-weight:500; }
.ac-mono { font-size:13px; letter-spacing:.02em; }
.ac-sticky { position:fixed; left:0; right:0; bottom:0; z-index:20; display:grid; grid-template-columns:repeat(auto-fit, minmax(0, 1fr)); gap:8px;
  padding:14px max(16px, calc(50% - 220px)) calc(14px + env(safe-area-inset-bottom)); background:rgba(245,243,239,.96); border-top:1px solid var(--sand); }
.ac-sticky .ac-btn { min-height:52px; font-size:15px; }

/* edit */
.ac-field { display:flex; flex-direction:column; gap:6px; min-width:0; margin-bottom:12px; }
.ac-reach .ac-field { margin-bottom:0; }
.ac-label { font-size:13px; color:var(--brand); }
.ac-in { width:100%; border:1px solid var(--sand); border-radius:14px; padding:14px 16px; font-size:16px; line-height:1.3; font-family:inherit;
  color:var(--ink); background:var(--bg); outline:none; -webkit-appearance:none; appearance:none; }
.ac .ac-in:focus { border-color:var(--brand) !important; background:#fff !important; }
.ac-3 { display:grid; grid-template-columns:1.6fr 0.8fr 1fr; gap:8px; }

/* footer */
.ac-foot { margin-top:32px; padding-top:22px; border-top:1px solid var(--sand); display:flex; flex-direction:column; gap:16px; }
.ac-foot-nav { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; }
.ac-foot-btn { min-height:76px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; border-radius:18px; background:#fff;
  text-decoration:none; font-size:14px; font-weight:600; }
.ac-foot-main { background:var(--brand); color:#fff !important; }
.ac-foot-small { display:flex; flex-direction:column; align-items:center; gap:6px; font-size:13px; color:var(--brand); }
.ac-foot-small a { font-weight:500; }

.ac-lightbox { position:fixed; inset:0; z-index:50; background:rgba(30,24,18,.88); display:flex; align-items:center; justify-content:center; padding:16px; }
.ac-lightbox img { max-width:100%; max-height:85vh; border-radius:12px; object-fit:contain; }
.ac-lightbox-x { position:absolute; top:16px; right:16px; border:0; border-radius:999px; background:#fff; color:var(--ink); padding:8px 14px; font-size:14px; }
.ac-skel { height:56px; border-radius:16px; background:#ece6dd; margin-bottom:12px; }
.ac-skel.short { width:55%; height:34px; }
.ac-skel.tall { height:120px; }

/* tabs: a bar at the bottom of the phone, a row under the title on wider screens */
.ac-via { margin:0; font-size:13px; color:var(--brand); }
.ac-wrap-tabs { padding-bottom:96px; }
.ac-tabs { position:fixed; left:12px; right:12px; bottom:calc(12px + env(safe-area-inset-bottom)); z-index:15; max-width:440px; margin:0 auto;
  display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:4px; padding:6px; border-radius:24px; background:#fff; box-shadow:0 8px 28px rgba(63,51,39,.16); }
.ac-tab { min-height:56px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; border:0; border-radius:18px;
  background:transparent; color:var(--ink) !important; font-size:12.5px; }
.ac-tab.on { background:var(--brand); color:#fff !important; }
@media (min-width: 720px) {
  .ac-wrap { max-width:560px; }
  .ac-wrap-tabs { padding-bottom:0; }
  .ac-tabs { position:static; max-width:none; box-shadow:none; }
  .ac-tab { flex-direction:row; gap:8px; min-height:48px; font-size:14px; }
}

/* payments + gift cards */
.ac-list { overflow:hidden; }
.ac-row { display:flex; align-items:center; gap:12px; padding:14px 16px; }
.ac-row + .ac-row { border-top:1px solid var(--line); }
.ac-row-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
.ac-row-main strong { font-size:15px; font-weight:400; overflow-wrap:anywhere; }
.ac-row-main span { font-size:13px; color:var(--brand); }
.ac-row-btn { flex:none; min-height:44px; display:inline-flex; align-items:center; padding:0 14px; border:1px solid var(--sand); border-radius:14px;
  background:#fff; font-size:14px; text-decoration:none; }
.ac-balance { display:flex; flex-direction:column; gap:6px; padding:22px 20px; border-radius:28px; background:var(--ink); color:#fff; }
.ac-balance span { font-size:13.5px; color:var(--bg); }
.ac-balance strong { font-family:var(--head); font-weight:400; font-size:44px; line-height:1; }
.ac-empty { margin:0; padding:18px 16px; border-radius:20px; background:#fff; font-size:15px; }
.ac-unlock { padding:18px 16px; display:flex; flex-direction:column; gap:10px; }
.ac-unlock p { margin:0; font-size:14px; line-height:1.45; }
.ac-note-sm { font-size:12.5px; color:var(--brand); }
.ac-in[readonly] { opacity:.75; }
`;
