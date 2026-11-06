// app/account/page.jsx

"use client";

import { useEffect, useState } from "react";
import AddressAutocomplete from "@/components/AddressAutocomplete";

/* ============================================================
   Customer link: /account?t=<token>
   1) "¿Te enviamos tus pedidos aquí?"  →  Sí / No, cambiar
   2) "Mis datos" + "Mis envíos" lists (tap a row to change it)
   Opens in Spanish. Add &lang=en to the link to open in English.
   ============================================================ */

const LOGO_SRC = "/EB_Logo_Fall BGBLANK.png";
const SHOP_EMAIL = "info@erendirasboutique.com";
const DEFAULT_LANG = "es";
const SHIPS_SHOWN = 5; // shipments shown before "Ver los X envíos"

const T = {
  en: {
    hi: function (n) { return n ? "Hi, " + n + "!" : "Hi!"; },
    hello: function (n) { return n ? "Hi, " + n : "Hi"; },
    ask: "Should we ship your orders here?",
    yes: "Yes, that's right",
    no: "No, change address",
    seeShips: function (n) { return "See my shipments (" + n + ")"; },
    missingBoth: "Add your email and phone so we can let you know when your order ships.",
    missingEmail: "Add your email so we can let you know when your order ships.",
    missingPhone: "Add your phone number so we can text you about your delivery.",
    addBoth: "Add email and phone",
    addEmail: "Add email",
    addPhone: "Add phone",
    confirmed: "Thank you! We'll ship here.",
    saved: "Saved ✓ Your next order ships here.",
    myInfo: "My details",
    tapToChange: "tap to change",
    myShips: "My shipments",
    seeAll: function (n) { return "See all " + n + " shipments"; },
    add: "Add",
    noAddress: "We don't have your address yet.",
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
    loadError: "This link isn't valid anymore. Reply to us and we'll send you a new one.",
    saveError: "Your changes couldn't be saved. Please try again.",
    missing: "Street address, city, state and ZIP are required.",
    invalidEmail: "Please enter a valid email address.",
    track: "Track",
    trackPackage: "Track package",
    order: "Order",
    packed: "Packed",
    shipped: "Shipped",
    delivered: "Delivered",
    eta: "Arriving",
    carrier: "Carrier",
    tracking: "Tracking #",
    shipTo: "Shipped to",
    copy: "Copy",
    copied: "Copied ✓",
    photoCap: "Your package, the day we packed it",
    photoAlt: "Photo of your package",
    close: "Close",
    at: " at ",
    questions: "Questions?",
    langSwitch: "Español",
    status: { shipped: "Shipped", in_transit: "On the way", delivered: "Delivered", returned: "Returned", preparing: "Preparing", problem: "Delivery issue" },
    locale: "en-US",
  },
  es: {
    hi: function (n) { return n ? "¡Hola, " + n + "!" : "¡Hola!"; },
    hello: function (n) { return n ? "Hola, " + n : "Hola"; },
    ask: "¿Te enviamos tus pedidos aquí?",
    yes: "Sí, está bien",
    no: "No, cambiar dirección",
    seeShips: function (n) { return "Ver mis envíos (" + n + ")"; },
    missingBoth: "Agrega tu correo y teléfono para avisarte cuando enviemos tu pedido.",
    missingEmail: "Agrega tu correo para avisarte cuando enviemos tu pedido.",
    missingPhone: "Agrega tu teléfono para mandarte avisos de tu entrega.",
    addBoth: "Agregar correo y teléfono",
    addEmail: "Agregar correo",
    addPhone: "Agregar teléfono",
    confirmed: "¡Gracias! Te enviaremos aquí.",
    saved: "Guardado ✓ Tu próximo pedido llega aquí.",
    myInfo: "Mis datos",
    tapToChange: "toca para cambiar",
    myShips: "Mis envíos",
    seeAll: function (n) { return "Ver los " + n + " envíos"; },
    add: "Agregar",
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
    saveError: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
    missing: "Dirección, ciudad, estado y código postal son obligatorios.",
    invalidEmail: "Ingresa un correo electrónico válido.",
    track: "Rastrear",
    trackPackage: "Rastrear paquete",
    order: "Pedido",
    packed: "Empacado",
    shipped: "Enviado",
    delivered: "Entregado",
    eta: "Llega",
    carrier: "Paquetería",
    tracking: "Núm. de rastreo",
    shipTo: "Enviado a",
    copy: "Copiar",
    copied: "Copiado ✓",
    photoCap: "Tu paquete, el día que lo empacamos",
    photoAlt: "Foto de tu paquete",
    close: "Cerrar",
    at: " a las ",
    questions: "¿Preguntas?",
    langSwitch: "English",
    status: { shipped: "Enviado", in_transit: "En camino", delivered: "Entregado", returned: "Devuelto", preparing: "Preparando", problem: "Problema" },
    locale: "es-MX",
  },
};

/* Same look as the inputs below, for the Google autocomplete box. */
const INPUT_STYLE = {
  width: "100%",
  border: "1px solid #e6dccf",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 16,
  lineHeight: 1.3,
  fontFamily: "inherit",
  color: "#5f4e3d",
  background: "#FAF9F6",
  boxSizing: "border-box",
  outline: "none",
};

export default function AccountPage() {
  const [token, setToken] = useState("");
  const [lang, setLang] = useState(DEFAULT_LANG);
  const [form, setForm] = useState(null);
  const [savedForm, setSavedForm] = useState(null);
  const [status, setStatus] = useState("loading");
  const [validationMsg, setValidationMsg] = useState("");
  const [screen, setScreen] = useState("ask"); // ask | list | edit
  const [notice, setNotice] = useState(""); // "" | confirmed | saved
  const [ships, setShips] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [openShip, setOpenShip] = useState(""); // id of the expanded shipment
  const [bigPhoto, setBigPhoto] = useState(""); // photo shown full screen
  const [copiedId, setCopiedId] = useState("");

  const t = T[lang];

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const portalToken = searchParams.get("t") || "";
    const urlLang = searchParams.get("lang");

    if (urlLang === "en" || urlLang === "es") {
      setLang(urlLang);
    }

    setToken(portalToken);

    if (!portalToken) {
      setStatus("load_error");
      return;
    }

    async function loadAccount() {
      try {
        const response = await fetch(
          "/api/account?t=" + encodeURIComponent(portalToken),
          {
            method: "GET",
            cache: "no-store",
          }
        );

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

        setForm(loaded);
        setSavedForm(loaded);
        if (!loaded.address1) setScreen("edit");
        setStatus("ready");
      } catch (error) {
        console.error("Account load error:", error);
        setStatus("load_error");
      }
    }

    async function loadShipments() {
      try {
        const response = await fetch(
          "/api/account/shipments?t=" + encodeURIComponent(portalToken),
          { method: "GET", cache: "no-store" }
        );
        if (!response.ok) return;
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.shipments;
        if (Array.isArray(list)) setShips(list.map(normalizeShipment).sort(byNewest));
      } catch (error) {
        // no shipments list
      }
    }

    loadAccount();
    loadShipments();
  }, []);

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

  async function save() {
    if (!form || !token || status === "saving") {
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

    setStatus("saving");
    setValidationMsg("");

    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          t: token,
          name: form.name,
          email: form.email,
          phone: form.phone,
          address1: form.address1,
          address2: form.address2,
          city: form.city,
          state: form.state,
          zip: form.zip,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save account.");
      }

      setSavedForm(form);
      setStatus("ready");
      setNotice("saved");
      go("list");
    } catch (error) {
      console.error("Account save error:", error);
      setStatus("save_error");
    }
  }

  const firstName = savedForm && savedForm.name ? savedForm.name.trim().split(/\s+/)[0] : "";
  const ready = form && status !== "loading" && status !== "load_error";
  const hasAddress = savedForm && savedForm.address1;
  const shownShips = showAll ? ships : ships.slice(0, SHIPS_SHOWN);

  const addressLines = hasAddress ? (
    <>
      {savedForm.address1}
      {savedForm.address2 ? ", " + savedForm.address2 : ""}
      <br />
      {savedForm.city}, {savedForm.state} {savedForm.zip}
    </>
  ) : null;

  return (
    <main className="ac">
      <style>{css}</style>

      <div className="ac-wrap">
        <div className="ac-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={encodeURI(LOGO_SRC)} alt="Erendira's Boutique" className="ac-logo" />
          <button
            type="button"
            className="ac-lang"
            onClick={function () { setLang(lang === "es" ? "en" : "es"); setValidationMsg(""); }}
          >
            {t.langSwitch}
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
          <div className="ac-panel ac-pad">
            <p className="ac-err" style={{ margin: 0 }}>
              {t.loadError}
              <br />
              <a href={"mailto:" + SHOP_EMAIL}>{SHOP_EMAIL}</a>
            </p>
          </div>
        )}

        {/* ---------- 1) the question ---------- */}
        {ready && screen === "ask" && (
          <div>
            <p className="ac-hi">{t.hi(firstName)}</p>
            <div className="ac-display ac-ask">{t.ask}</div>

            <div className="ac-panel ac-address">
              {savedForm.name ? <div>{savedForm.name}</div> : null}
              {addressLines}
            </div>

            {!savedForm.email || !savedForm.phone ? (
              <div className="ac-missing">
                <p>{!savedForm.email && !savedForm.phone ? t.missingBoth : !savedForm.email ? t.missingEmail : t.missingPhone}</p>
                <button
                  type="button"
                  className="ac-missing-btn"
                  onClick={function () { setNotice(""); go("edit", !savedForm.email ? "ac-email" : "ac-phone"); }}
                >
                  + {!savedForm.email && !savedForm.phone ? t.addBoth : !savedForm.email ? t.addEmail : t.addPhone}
                </button>
              </div>
            ) : null}

            <div className="ac-stack">
              <button type="button" className="ac-btn" onClick={function () { setNotice("confirmed"); go("list"); }}>
                {t.yes}
              </button>
              <button type="button" className="ac-btn ac-btn-ghost" onClick={function () { setNotice(""); go("edit", "ac-first"); }}>
                {t.no}
              </button>
            </div>

            {ships.length > 0 ? (
              <p className="ac-center">
                <button type="button" className="ac-link" onClick={function () { setNotice(""); go("list"); }}>
                  {t.seeShips(ships.length)}
                </button>
              </p>
            ) : null}
          </div>
        )}

        {/* ---------- 2) my details + my shipments ---------- */}
        {ready && screen === "list" && (
          <div>
            <div className="ac-display ac-hello">{t.hello(firstName)}</div>

            {notice ? (
              <p role="status" className="ac-ok">{notice === "saved" ? t.saved : t.confirmed}</p>
            ) : null}

            <p className="ac-cap">{t.myInfo} · {t.tapToChange}</p>
            <div className="ac-panel ac-list">
              <button type="button" className="ac-row" onClick={function () { go("edit", "ac-name"); }}>
                <span className="ac-k">{t.name}</span>
                <span className="ac-v">{savedForm.name || <span className="ac-add">{t.add}</span>} <i>&rsaquo;</i></span>
              </button>
              <button type="button" className="ac-row" onClick={function () { go("edit", "ac-first"); }}>
                <span className="ac-k">{t.address}</span>
                <span className="ac-v">{hasAddress ? addressLines : <span className="ac-add">{t.add}</span>} <i>&rsaquo;</i></span>
              </button>
              <button type="button" className="ac-row" onClick={function () { go("edit", "ac-email"); }}>
                <span className="ac-k">{t.email}</span>
                <span className="ac-v">{savedForm.email || <span className="ac-add">{t.add}</span>} <i>&rsaquo;</i></span>
              </button>
              <button type="button" className="ac-row" onClick={function () { go("edit", "ac-phone"); }}>
                <span className="ac-k">{t.phone}</span>
                <span className="ac-v">{savedForm.phone || <span className="ac-add">{t.add}</span>} <i>&rsaquo;</i></span>
              </button>
            </div>

            {ships.length > 0 ? (
              <div>
                <p className="ac-cap ac-cap-gap">{t.myShips}</p>
                <div className="ac-panel ac-list">
                  {shownShips.map(function (s) {
                    const open = openShip === s.id;
                    return (
                      <div className="ac-ship" key={s.id}>
                        <button
                          type="button"
                          className="ac-row ac-ship-row"
                          aria-expanded={open}
                          onClick={function () { setOpenShip(open ? "" : s.id); }}
                        >
                          {s.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.photo} alt="" className="ac-thumb" loading="lazy" />
                          ) : (
                            <span className="ac-thumb ac-thumb-empty" aria-hidden="true">📦</span>
                          )}
                          <span className="ac-ship-main">
                            <span>{s.date ? fmtDate(s.date, t.locale) : "—"} · {t.status[s.stage]}</span>
                            {s.orderNumber ? <span className="ac-ship-sub">{t.order} {s.orderNumber}</span> : null}
                          </span>
                          <i className={open ? "ac-chev open" : "ac-chev"}>&rsaquo;</i>
                        </button>

                        {open ? (
                          <div className="ac-ship-detail">
                            {s.photo ? (
                              <figure className="ac-photo">
                                <button type="button" onClick={function () { setBigPhoto(s.photo); }}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={s.photo} alt={t.photoAlt} loading="lazy" />
                                </button>
                                <figcaption>{t.photoCap}</figcaption>
                              </figure>
                            ) : null}

                            <dl className="ac-dl">
                              {s.orderNumber ? <Detail k={t.order} v={s.orderNumber} /> : null}
                              {s.packedAt ? <Detail k={t.packed} v={fmtDateTime(s.packedAt, t)} /> : null}
                              {s.date ? <Detail k={t.shipped} v={fmtDateTime(s.date, t)} /> : null}
                              {s.deliveredAt ? (
                                <Detail k={t.delivered} v={fmtDateTime(s.deliveredAt, t)} />
                              ) : s.eta && s.stage !== "delivered" ? (
                                <Detail k={t.eta} v={fmtDate(s.eta, t.locale)} />
                              ) : null}
                              {s.carrier ? <Detail k={t.carrier} v={s.carrier + (s.mailClass ? " · " + s.mailClass : "")} /> : null}
                              {s.tracking ? (
                                <Detail
                                  k={t.tracking}
                                  v={
                                    <span className="ac-trk">
                                      <span className="ac-mono">{s.tracking}</span>
                                      <button
                                        type="button"
                                        className="ac-copy"
                                        onClick={function () {
                                          copyText(s.tracking);
                                          setCopiedId(s.id);
                                          setTimeout(function () { setCopiedId(""); }, 1800);
                                        }}
                                      >
                                        {copiedId === s.id ? t.copied : t.copy}
                                      </button>
                                    </span>
                                  }
                                />
                              ) : null}
                              {s.shipTo ? <Detail k={t.shipTo} v={s.shipTo} /> : null}
                            </dl>

                            {s.trackUrl ? (
                              <a className="ac-btn ac-btn-ghost ac-track" href={s.trackUrl} target="_blank" rel="noopener noreferrer">
                                {t.trackPackage}
                              </a>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  {ships.length > SHIPS_SHOWN && !showAll ? (
                    <button type="button" className="ac-row" onClick={function () { setShowAll(true); }}>
                      <span className="ac-k">{t.seeAll(ships.length)}</span>
                      <span className="ac-v"><i>&rsaquo;</i></span>
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ---------- 3) edit ---------- */}
        {ready && screen === "edit" && (
          <div>
            <div className="ac-display ac-hello">{hasAddress ? t.editTitle : t.hi(firstName)}</div>
            {!hasAddress ? <p className="ac-hi">{t.noAddress}</p> : null}

            <div className="ac-panel ac-pad">
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
                  onChange={function changeEmail(event) {
                    updateField("email", event.target.value);
                  }}
                  autoComplete="email"
                  inputMode="email"
                />
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

        <p className="ac-foot">
          {t.questions} <a href={"mailto:" + SHOP_EMAIL}>{SHOP_EMAIL}</a>
        </p>
      </div>
    </main>
  );
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
  if (s.indexOf("out_for_delivery") !== -1) return "in_transit";
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
    carrier: carrier ? String(carrier).toUpperCase() === carrier ? carrier : prettyWords(carrier) : null,
    mailClass: pick(s, ["mail_class"]) ? prettyWords(pick(s, ["mail_class"])) : null,
    tracking: tracking,
    shipTo: pick(s, ["ship_to"]),
  };
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
.ac { --bg:#F5F3EF; --brand:#957f67; --brand-dark:#7f6b55; --line:#e6dccf; --line2:#efe8de; --ink:#5f4e3d; --muted:#7d6a56; --add:#b98a5c; --err:#a8452a;
  min-height:100vh; background:var(--bg); color:var(--ink); font-family:"Recoleta", Georgia, serif; -webkit-font-smoothing:antialiased;
  padding:20px 16px 40px; box-sizing:border-box; }
.ac *, .ac *::before, .ac *::after { box-sizing:border-box; }
.ac a { color:var(--brand-dark); }
.ac button { font-family:inherit; cursor:pointer; }
.ac-wrap { max-width:440px; margin:0 auto; }
.ac-top { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:28px; }
.ac-logo { width:112px; height:auto; display:block; }
.ac-lang { border:1px solid var(--line); background:#fff; color:var(--brand-dark); border-radius:999px; padding:7px 14px; font-size:13px; }
.ac-display { font-family:"La Luxes Serif", "Recoleta", Georgia, serif; color:var(--brand); font-weight:400; }
.ac-hi { margin:0 0 4px; font-size:15px; color:var(--muted); }
.ac-ask { font-size:34px; line-height:1.1; margin:0 0 22px; }
.ac-hello { font-size:30px; line-height:1.15; margin:0 0 16px; }
.ac-panel { background:#fff; border-radius:20px; box-shadow:0 10px 30px rgba(149,127,103,.10); }
.ac-pad { padding:18px 16px 8px; }
.ac-address { padding:22px 20px; font-size:18px; line-height:1.6; overflow-wrap:anywhere; }
.ac-missing { margin-top:12px; padding:14px 16px; border-radius:16px; background:#fbf3ea; border:1px solid #f0e0cc; }
.ac-missing p { margin:0 0 10px; font-size:14.5px; line-height:1.45; color:var(--ink); }
.ac-missing-btn { border:0; background:#fff; color:var(--brand-dark); border-radius:999px; padding:10px 16px; font-size:14.5px; min-height:42px;
  box-shadow:0 2px 8px rgba(149,127,103,.12); }
.ac-stack { display:grid; gap:10px; margin-top:18px; }
.ac-btn { min-height:52px; border:0; border-radius:999px; background:var(--brand); color:#fff; font-size:16px; padding:0 20px; }
.ac-btn:disabled { opacity:.6; cursor:not-allowed; }
.ac-btn-ghost { background:#fff; color:var(--brand-dark); border:1px solid var(--line); }
.ac-center { text-align:center; margin:26px 0 0; }
.ac-link { border:0; background:none; padding:6px; color:var(--brand-dark); font-size:15px; text-decoration:underline; text-underline-offset:3px; }
.ac-ok { margin:0 0 16px; padding:12px 14px; border-radius:14px; background:#fff; border:1px solid var(--line); font-size:14.5px; color:var(--brand-dark); }
.ac-cap { margin:0 6px 8px; font-size:13px; color:var(--muted); }
.ac-cap-gap { margin-top:24px; }
.ac-list { padding:0 16px; }
.ac-row { display:flex; justify-content:space-between; align-items:center; gap:14px; width:100%; padding:14px 0; border:0; border-top:1px solid var(--line2);
  background:none; text-align:left; color:var(--ink); font-size:15px; line-height:1.45; }
.ac-row:first-child { border-top:0; }
.ac-row-static a { font-size:14px; flex-shrink:0; }
.ac-k { color:var(--muted); flex-shrink:0; }
.ac-v { text-align:right; min-width:0; overflow-wrap:anywhere; }
.ac-v i { font-style:normal; color:#cfbda9; margin-left:4px; }
.ac-add { color:var(--add); }
.ac-field { display:flex; flex-direction:column; gap:5px; min-width:0; margin-bottom:12px; }
.ac-label { font-size:13px; color:var(--muted); }
.ac-in { width:100%; border:1px solid var(--line); border-radius:12px; padding:12px 14px; font-size:16px; line-height:1.3; font-family:inherit;
  color:var(--ink); background:#FAF9F6; outline:none; -webkit-appearance:none; appearance:none; }
.ac input:focus { border-color:var(--brand) !important; background:#fff !important; }
.ac-3 { display:grid; grid-template-columns:1.6fr 0.8fr 1fr; gap:8px; }
.ac-err { margin:4px 0 12px; font-size:14px; line-height:1.45; color:var(--err); }
.ac-foot { margin:28px 0 0; text-align:center; font-size:13px; color:var(--muted); }
.ac-ship { border-top:1px solid var(--line2); }
.ac-ship:first-child { border-top:0; }
.ac-ship + .ac-row { border-top:1px solid var(--line2); }
.ac-ship-row { border-top:0 !important; justify-content:flex-start; }
.ac-thumb { width:44px; height:44px; border-radius:10px; object-fit:cover; flex-shrink:0; background:#f3eee7; }
.ac-thumb-empty { display:flex; align-items:center; justify-content:center; font-size:20px; }
.ac-ship-main { display:flex; flex-direction:column; min-width:0; flex:1; }
.ac-ship-sub { font-size:13px; color:var(--muted); }
.ac-chev { font-style:normal; color:#cfbda9; font-size:20px; transition:transform .15s; }
.ac-chev.open { transform:rotate(90deg); }
.ac-ship-detail { padding:2px 0 16px; }
.ac-photo { margin:0 0 14px; }
.ac-photo button { display:block; width:100%; padding:0; border:0; background:none; }
.ac-photo img { display:block; width:100%; max-height:360px; object-fit:cover; border-radius:14px; background:#f3eee7; }
.ac-photo figcaption { margin-top:6px; font-size:12.5px; color:var(--muted); text-align:center; }
.ac-dl { margin:0; }
.ac-dl-row { display:flex; justify-content:space-between; gap:14px; padding:7px 0; font-size:14.5px; line-height:1.4; }
.ac-dl-row dt { color:var(--muted); flex-shrink:0; }
.ac-dl-row dd { margin:0; text-align:right; min-width:0; overflow-wrap:anywhere; }
.ac-trk { display:inline-flex; flex-wrap:wrap; justify-content:flex-end; align-items:center; gap:6px; }
.ac-mono { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:13px; letter-spacing:.02em; }
.ac-copy { border:1px solid var(--line); background:#FAF9F6; color:var(--brand-dark); border-radius:999px; padding:4px 10px; font-size:12.5px; }
.ac-track { display:flex; align-items:center; justify-content:center; margin-top:12px; text-decoration:none; }
.ac-lightbox { position:fixed; inset:0; z-index:50; background:rgba(30,24,18,.88); display:flex; align-items:center; justify-content:center; padding:16px; }
.ac-lightbox img { max-width:100%; max-height:85vh; border-radius:12px; object-fit:contain; }
.ac-lightbox-x { position:absolute; top:16px; right:16px; border:0; border-radius:999px; background:#fff; color:var(--ink); padding:8px 14px; font-size:14px; }
.ac-skel { height:56px; border-radius:16px; background:#ece6dd; margin-bottom:12px; }
.ac-skel.short { width:55%; height:34px; }
.ac-skel.tall { height:120px; }
`;
