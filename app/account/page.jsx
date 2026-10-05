// app/account/page.jsx

"use client";

import { useEffect, useState } from "react";
import AddressAutocomplete from "@/components/AddressAutocomplete";

/* ============================================================
   Customer link: /account?t=<token>
   - "Mi dirección": see your delivery details, edit and save them.
   - "Mis envíos":   your shipments (needs /api/account/shipments).
     If that route isn't there yet, the tab just stays hidden.
   Opens in Spanish. Add &lang=en to the link to open in English.
   ============================================================ */

const LOGO_SRC = "/EB_Logo_Fall BGBLANK.png";
const SHOP_EMAIL = "info@erendirasboutique.com";
const DEFAULT_LANG = "es";

const T = {
  en: {
    hi: function (n) { return n ? "Hi, " + n : "Hi there"; },
    title: "Your delivery details",
    intro: "Check that everything is correct.",
    editTitle: "Edit details",
    back: "Back",
    tabAddress: "My address",
    tabShips: "My shipments",
    shipTo: "SHIP TO",
    contact: "CONTACT",
    shippingAddress: "SHIPPING ADDRESS",
    edit: "Edit",
    noAddress: "No address yet",
    addAddress: "Add your address",
    addEmail: "+ Add email",
    addPhone: "+ Add phone",
    name: "Full name",
    email: "Email",
    phone: "Phone",
    phoneHint: "for delivery texts",
    address1: "Street address",
    address2: "Apt, suite, unit",
    optional: "optional",
    addressHint: "Start typing and pick your address",
    poweredBy: "Powered by Google",
    city: "City",
    state: "State",
    zip: "ZIP code",
    pick: "Choose",
    save: "Save changes",
    cancel: "Cancel",
    saving: "Saving...",
    saved: "Saved! Your next order ships here.",
    note: "Changes apply to your future shipments right away. Orders that already shipped can't be changed.",
    loadError: "This link isn't valid anymore. Reply to us and we'll send you a new one.",
    saveError: "Your changes couldn't be saved. Please try again.",
    missing: "Street address, city, state and ZIP are required.",
    invalidEmail: "Please enter a valid email address.",
    questions: "Questions?",
    latest: "Latest shipment",
    shipsTitle: "My shipments",
    shipsIntro: "All your packages from Erendira's Boutique.",
    onTheWay: "ON THE WAY",
    previous: "PREVIOUS",
    noShips: "No shipments yet. When we ship your order, you'll see it here.",
    track: "Track package",
    view: "Track",
    items: function (n) { return n === 1 ? "1 item" : n + " items"; },
    orderOf: function (d) { return "Order from " + d; },
    arrives: function (d) { return "Arrives " + d; },
    steps: ["Shipped", "On the way", "Delivered"],
    status: {
      preparing: "Preparing",
      in_transit: "On the way",
      out_for_delivery: "Out for delivery",
      delivered: "Delivered",
      returned: "Returned",
      problem: "Delivery issue",
    },
    locale: "en-US",
  },
  es: {
    hi: function (n) { return n ? "Hola, " + n : "Hola"; },
    title: "Tus datos de entrega",
    intro: "Revisa que todo esté correcto.",
    editTitle: "Editar datos",
    back: "Volver",
    tabAddress: "Mi dirección",
    tabShips: "Mis envíos",
    shipTo: "ENVIAR A",
    contact: "CONTACTO",
    shippingAddress: "DIRECCIÓN DE ENVÍO",
    edit: "Editar",
    noAddress: "Aún no hay dirección",
    addAddress: "Agregar dirección",
    addEmail: "+ Agregar correo",
    addPhone: "+ Agregar teléfono",
    name: "Nombre completo",
    email: "Correo electrónico",
    phone: "Teléfono",
    phoneHint: "para avisos de entrega",
    address1: "Calle y número",
    address2: "Apto, suite, unidad",
    optional: "opcional",
    addressHint: "Empieza a escribir y elige tu dirección",
    poweredBy: "Con tecnología de Google",
    city: "Ciudad",
    state: "Estado",
    zip: "Código postal",
    pick: "Elegir",
    save: "Guardar cambios",
    cancel: "Cancelar",
    saving: "Guardando...",
    saved: "¡Guardado! Tu próximo pedido llega aquí.",
    note: "Los cambios se aplican de inmediato a tus próximos envíos. Los pedidos ya enviados no se pueden cambiar.",
    loadError: "Este enlace ya no es válido. Escríbenos y te enviaremos uno nuevo.",
    saveError: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
    missing: "Dirección, ciudad, estado y código postal son obligatorios.",
    invalidEmail: "Ingresa un correo electrónico válido.",
    questions: "¿Preguntas?",
    latest: "Último envío",
    shipsTitle: "Mis envíos",
    shipsIntro: "Todos tus paquetes de Erendira's Boutique.",
    onTheWay: "EN CAMINO",
    previous: "ANTERIORES",
    noShips: "Aún no hay envíos. Cuando enviemos tu pedido, lo verás aquí.",
    track: "Rastrear paquete",
    view: "Rastrear",
    items: function (n) { return n === 1 ? "1 artículo" : n + " artículos"; },
    orderOf: function (d) { return "Pedido del " + d; },
    arrives: function (d) { return "Llega el " + d; },
    steps: ["Enviado", "En camino", "Entregado"],
    status: {
      preparing: "Preparando",
      in_transit: "En camino",
      out_for_delivery: "Sale hoy a entrega",
      delivered: "Entregado",
      returned: "Devuelto",
      problem: "Problema con la entrega",
    },
    locale: "es-MX",
  },
};

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS",
  "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC",
  "ND", "OH", "OK", "OR", "PA", "PR", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
};

/* Same look as the .ad-in inputs, for the Google autocomplete box. */
const INPUT_STYLE = {
  width: "100%",
  minHeight: 50,
  border: "1px solid #e6dccf",
  borderRadius: 14,
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
  const [view, setView] = useState("home"); // home | edit
  const [tab, setTab] = useState("address"); // address | ships
  const [ships, setShips] = useState(null); // null = route not available

  const t = T[lang];

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const portalToken = searchParams.get("t") || "";
    const urlLang = searchParams.get("lang");

    if (urlLang === "en" || urlLang === "es") {
      setLang(urlLang);
    } else {
      try {
        const remembered = localStorage.getItem("eb-customer-lang");
        if (remembered === "en" || remembered === "es") setLang(remembered);
      } catch (e) {}
    }

    if (searchParams.get("tab") === "envios" || searchParams.get("tab") === "shipments") {
      setTab("ships");
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
        if (!loaded.address1) setView("edit");
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
        if (!response.ok) return; // route not set up yet → hide the tab
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.shipments;
        if (Array.isArray(list)) setShips(list.map(normalizeShipment).sort(byNewest));
      } catch (error) {
        // no shipments tab
      }
    }

    loadAccount();
    loadShipments();
  }, []);

  function switchLanguage(next) {
    setLang(next);
    setValidationMsg("");
    try { localStorage.setItem("eb-customer-lang", next); } catch (e) {}
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

    if (status === "saved" || status === "save_error") {
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

    if (status === "saved" || status === "save_error") {
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

  function openEdit(section) {
    setView("edit");
    setTab("address");
    if (status === "saved") setStatus("ready");
    setTimeout(function () {
      const el = document.getElementById(section === "contact" ? "ad-contact" : "ad-shipping");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo(0, 0);
    }, 30);
  }

  function cancelEdit() {
    setForm(savedForm);
    setValidationMsg("");
    if (status === "save_error") setStatus("ready");
    if (savedForm && savedForm.address1) {
      setView("home");
      window.scrollTo(0, 0);
    }
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
      setStatus("saved");
      setView("home");
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Account save error:", error);
      setStatus("save_error");
    }
  }

  const firstName = form && form.name ? form.name.trim().split(/\s+/)[0] : "";
  const showTabs = ships !== null && view === "home";
  const active = (ships || []).filter(function (s) { return !s.done; });
  const past = (ships || []).filter(function (s) { return s.done; });
  const latest = ships && ships.length ? ships[0] : null;
  const ready = form && status !== "loading" && status !== "load_error";

  const langToggle = (
    <div className="ad-lang" role="group" aria-label="Idioma / Language">
      <button type="button" className={lang === "es" ? "on" : ""} onClick={function () { switchLanguage("es"); }}>ES</button>
      <button type="button" className={lang === "en" ? "on" : ""} onClick={function () { switchLanguage("en"); }}>EN</button>
    </div>
  );

  return (
    <main className="ad" lang={lang}>
      <style>{css}</style>

      <div className="ad-wrap">
        {/* ---------------- header ---------------- */}
        {view === "edit" && ready ? (
          <header className="ad-head ad-head-sm">
            <div className="ad-top">
              {savedForm && savedForm.address1 ? (
                <button type="button" className="ad-back" onClick={cancelEdit}>&lsaquo; {t.back}</button>
              ) : (
                <span className="ad-pill">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={encodeURI(LOGO_SRC)} alt="Erendira's Boutique" className="ad-logo" />
                </span>
              )}
              {langToggle}
            </div>
            <h1 className="ad-display ad-h1 ad-h1-sm">{savedForm && savedForm.address1 ? t.editTitle : t.title}</h1>
          </header>
        ) : (
          <header className={"ad-head" + (showTabs ? " has-tabs" : "")}>
            <div className="ad-top">
              <span className="ad-pill">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={encodeURI(LOGO_SRC)} alt="Erendira's Boutique" className="ad-logo" />
              </span>
              {langToggle}
            </div>
            {ready ? <p className="ad-hi">{t.hi(firstName)}</p> : null}
            <h1 className="ad-display ad-h1">{tab === "ships" && showTabs ? t.shipsTitle : t.title}</h1>
            <p className="ad-sub">{tab === "ships" && showTabs ? t.shipsIntro : t.intro}</p>
            {showTabs ? (
              <div className="ad-tabs" role="tablist">
                <button type="button" role="tab" aria-selected={tab === "address"} className={tab === "address" ? "on" : ""} onClick={function () { setTab("address"); }}>{t.tabAddress}</button>
                <button type="button" role="tab" aria-selected={tab === "ships"} className={tab === "ships" ? "on" : ""} onClick={function () { setTab("ships"); if (status === "saved") setStatus("ready"); }}>
                  {t.tabShips}{ships.length ? " · " + ships.length : ""}
                </button>
              </div>
            ) : null}
          </header>
        )}

        <div className={"ad-body" + (showTabs ? " under-tabs" : "")}>
          {/* ---------------- loading / error ---------------- */}
          {status === "loading" && (
            <div className="ad-card ad-pad">
              <div className="ad-skel" />
              <div className="ad-skel short" />
              <div className="ad-skel" />
            </div>
          )}

          {status === "load_error" && (
            <div className="ad-card ad-pad ad-error-card">
              <p>{t.loadError}</p>
              <p><a href={"mailto:" + SHOP_EMAIL}>{SHOP_EMAIL}</a></p>
            </div>
          )}

          {/* ---------------- summary ---------------- */}
          {ready && view === "home" && tab === "address" && (
            <div>
              {status === "saved" && (
                <p role="status" className="ad-toast">
                  <span className="ad-tick">&#10003;</span>
                  {t.saved}
                </p>
              )}

              <section className="ad-card ad-pad">
                <div className="ad-sum">
                  <span className="ad-ico"><HouseIcon /></span>
                  <div className="ad-sum-main">
                    <p className="ad-cap">{t.shipTo}</p>
                    {savedForm.name ? <p className="ad-name">{savedForm.name}</p> : null}
                    {savedForm.address1 ? (
                      <p className="ad-addr">
                        {savedForm.address1}
                        {savedForm.address2 ? ", " + savedForm.address2 : ""}
                        <br />
                        {savedForm.city}, {savedForm.state} {savedForm.zip}
                      </p>
                    ) : (
                      <p className="ad-addr">{t.noAddress}</p>
                    )}
                  </div>
                  <button type="button" className="ad-chip-btn" onClick={function () { openEdit("shipping"); }}>{t.edit}</button>
                </div>
              </section>

              <section className="ad-card ad-pad ad-gap">
                <div className="ad-row-head">
                  <p className="ad-cap" style={{ margin: 0 }}>{t.contact}</p>
                  <button type="button" className="ad-chip-btn" onClick={function () { openEdit("contact"); }}>{t.edit}</button>
                </div>
                <div className="ad-kv">
                  <span>{t.email}</span>
                  {savedForm.email ? <b>{savedForm.email}</b> : <button type="button" className="ad-add" onClick={function () { openEdit("contact"); }}>{t.addEmail}</button>}
                </div>
                <div className="ad-kv">
                  <span>{t.phone}</span>
                  {savedForm.phone ? <b>{savedForm.phone}</b> : <button type="button" className="ad-add" onClick={function () { openEdit("contact"); }}>{t.addPhone}</button>}
                </div>
              </section>

              {latest ? (
                <button type="button" className="ad-card ad-latest ad-gap" onClick={function () { setTab("ships"); window.scrollTo(0, 0); }}>
                  <span className="ad-ico"><BoxIcon /></span>
                  <span className="ad-latest-txt">
                    <small>{t.latest}</small>
                    {t.status[latest.stage]}
                    {latest.eta && !latest.done ? " · " + t.arrives(fmtDate(latest.eta, t.locale)) : ""}
                    {latest.done && latest.date ? " · " + fmtDate(latest.date, t.locale) : ""}
                  </span>
                  <span className="ad-chev">&rsaquo;</span>
                </button>
              ) : null}

              <p className="ad-note">{t.note}</p>
              <p className="ad-foot">{t.questions} <a href={"mailto:" + SHOP_EMAIL}>{SHOP_EMAIL}</a></p>
            </div>
          )}

          {/* ---------------- shipments ---------------- */}
          {ready && view === "home" && tab === "ships" && ships && (
            <div>
              {ships.length === 0 ? (
                <div className="ad-card ad-pad ad-empty">
                  <span className="ad-ico"><BoxIcon /></span>
                  <p>{t.noShips}</p>
                </div>
              ) : null}

              {active.map(function (s) {
                return (
                  <section className="ad-card ad-pad ad-active ad-gap0" key={s.id}>
                    <div className="ad-row-head">
                      <p className="ad-cap" style={{ margin: 0 }}>{t.onTheWay}</p>
                      <span className={"ad-badge" + (s.stage === "problem" ? " warn" : " solid")}>
                        {s.eta && s.stage !== "problem" ? t.arrives(fmtDate(s.eta, t.locale)) : t.status[s.stage]}
                      </span>
                    </div>
                    <p className="ad-ship-title">{s.date ? t.orderOf(fmtDate(s.date, t.locale)) : t.status[s.stage]}</p>
                    <p className="ad-ship-sub">
                      {[s.items ? t.items(s.items) : "", s.description].filter(Boolean).join(" · ")}
                    </p>
                    <Progress step={s.step} labels={t.steps} />
                    {s.trackUrl ? (
                      <a className="ad-btn ad-btn1 ad-track" href={s.trackUrl} target="_blank" rel="noopener noreferrer">{t.track} &#8599;</a>
                    ) : null}
                    {s.tracking ? <p className="ad-mono ad-center">{[s.carrier, s.tracking].filter(Boolean).join(" · ")}</p> : null}
                  </section>
                );
              })}

              {past.length ? (
                <div>
                  <p className="ad-cap ad-cap-out">{t.previous}</p>
                  <section className="ad-card ad-list">
                    {past.map(function (s) {
                      return (
                        <div className="ad-ship" key={s.id}>
                          <span className="ad-ico"><BoxIcon /></span>
                          <div className="ad-ship-main">
                            <div className="ad-ship-top">
                              <span>{s.date ? fmtDate(s.date, t.locale) : "—"}</span>
                              <span className={"ad-badge" + (s.stage === "returned" ? " warn" : "")}>{t.status[s.stage]}</span>
                            </div>
                            {(s.items || s.description) ? (
                              <p className="ad-ship-sub">{[s.items ? t.items(s.items) : "", s.description].filter(Boolean).join(" · ")}</p>
                            ) : null}
                            <div className="ad-ship-bot">
                              <span className="ad-mono">{[s.carrier, shortTracking(s.tracking)].filter(Boolean).join(" · ")}</span>
                              {s.trackUrl ? <a href={s.trackUrl} target="_blank" rel="noopener noreferrer">{t.view}</a> : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </section>
                </div>
              ) : null}

              <p className="ad-foot">{t.questions} <a href={"mailto:" + SHOP_EMAIL}>{SHOP_EMAIL}</a></p>
            </div>
          )}

          {/* ---------------- edit form ---------------- */}
          {ready && view === "edit" && (
            <div className="ad-form">
              <section className="ad-card ad-pad" id="ad-contact">
                <p className="ad-cap">{t.contact}</p>
                <Field label={t.name}>
                  <input
                    type="text"
                    className="ad-in"
                    value={form.name}
                    onChange={function changeName(event) {
                      updateField("name", event.target.value);
                    }}
                    autoComplete="name"
                  />
                </Field>

                <Field label={t.email}>
                  <input
                    type="email"
                    className="ad-in"
                    value={form.email}
                    placeholder="nombre@correo.com"
                    onChange={function changeEmail(event) {
                      updateField("email", event.target.value);
                    }}
                    autoComplete="email"
                    inputMode="email"
                  />
                </Field>

                <Field label={t.phone} hint={t.phoneHint}>
                  <input
                    type="tel"
                    className="ad-in"
                    value={form.phone}
                    placeholder="(909) 555-0123"
                    onChange={function changePhone(event) {
                      updateField("phone", event.target.value);
                    }}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </Field>
              </section>

              <section className="ad-card ad-pad ad-gap" id="ad-shipping">
                <p className="ad-cap">{t.shippingAddress}</p>
                <Field label={t.address1}>
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
                </Field>

                <Field label={t.address2} hint={t.optional}>
                  <input
                    type="text"
                    className="ad-in"
                    value={form.address2}
                    id="address2"
                    onChange={function changeAddress2(event) {
                      updateField("address2", event.target.value);
                    }}
                    autoComplete="address-line2"
                  />
                </Field>

                <div className="ad-3">
                  <Field label={t.city}>
                    <input
                      type="text"
                      className="ad-in"
                      value={form.city}
                      onChange={function changeCity(event) {
                        updateField("city", event.target.value);
                      }}
                      autoComplete="address-level2"
                    />
                  </Field>

                  <Field label={t.state}>
                    <select
                      className="ad-in ad-select"
                      value={form.state}
                      onChange={function changeState(event) {
                        updateField("state", event.target.value);
                      }}
                      autoComplete="address-level1"
                    >
                      <option value="">{t.pick}</option>
                      {form.state && US_STATES.indexOf(form.state.toUpperCase()) === -1 ? (
                        <option value={form.state}>{form.state}</option>
                      ) : null}
                      {US_STATES.map(function (s) { return <option key={s} value={s}>{s}</option>; })}
                    </select>
                  </Field>

                  <Field label={t.zip}>
                    <input
                      type="text"
                      className="ad-in"
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
              </section>

              {validationMsg && (
                <p role="alert" className="ad-err">
                  {validationMsg}
                </p>
              )}

              {status === "save_error" && (
                <p role="alert" className="ad-err">
                  {t.saveError}
                </p>
              )}

              <p className="ad-note">{t.note}</p>

              <nav className="ad-bar">
                {savedForm && savedForm.address1 ? (
                  <button type="button" className="ad-btn ad-btn2" onClick={cancelEdit}>{t.cancel}</button>
                ) : null}
                <button
                  type="button"
                  className="ad-btn ad-btn1 ad-grow"
                  onClick={save}
                  disabled={status === "saving"}
                >
                  {status === "saving" ? t.saving : t.save}
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Field(props) {
  return (
    <label className="ad-field">
      <span className="ad-label">
        {props.label}
        {props.hint ? <span className="ad-hint"> · {props.hint}</span> : null}
      </span>
      {props.children}
    </label>
  );
}

function Progress(props) {
  const pct = Math.max(0, Math.min(1, props.step / 2)) * 100;
  return (
    <div className="ad-prog">
      <div className="ad-prog-track">
        <span className="ad-prog-fill" style={{ width: pct + "%" }} />
        {[0, 1, 2].map(function (i) {
          return <i key={i} className={props.step >= i ? "on" : ""} style={{ left: i * 50 + "%" }} />;
        })}
      </div>
      <div className="ad-prog-labels">
        {props.labels.map(function (l, i) { return <span key={i} className={props.step >= i ? "on" : ""}>{l}</span>; })}
      </div>
    </div>
  );
}

function HouseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" /><path d="M3 7.5 12 12l9-4.5M12 12v9" />
    </svg>
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---------- shipments: accept whatever field names the API sends ---------- */

function pick(obj, keys) {
  for (let i = 0; i < keys.length; i++) {
    const v = obj[keys[i]];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

function stageOf(raw) {
  const s = String(raw || "").toLowerCase().replace(/[\s-]+/g, "_");
  if (/deliver(ed)?$/.test(s) && s.indexOf("out_for") === -1) return "delivered";
  if (s.indexOf("out_for_delivery") !== -1) return "out_for_delivery";
  if (/return/.test(s)) return "returned";
  if (/(exception|fail|error|lost|cancel|undeliverable)/.test(s)) return "problem";
  if (/(transit|shipped|accepted|picked|in_route|en_route)/.test(s)) return "in_transit";
  return "preparing";
}

const STEP = { preparing: 0, in_transit: 1, out_for_delivery: 1.6, delivered: 2, returned: 2, problem: 1 };

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
  const stage = stageOf(pick(s, ["status", "tracking_status", "state"]));
  const carrierRaw = pick(s, ["carrier", "provider", "carrier_name"]);
  const carrier = carrierRaw ? String(carrierRaw).toUpperCase().replace("FEDEX", "FedEx") : "";
  const tracking = pick(s, ["tracking_number", "tracking", "tracking_code"]);
  const items = Number(pick(s, ["items_count", "item_count", "items", "quantity"])) || 0;
  return {
    id: pick(s, ["id", "tracking_number"]) || "s" + i,
    stage: stage,
    step: STEP[stage],
    done: stage === "delivered" || stage === "returned",
    date: pick(s, ["shipped_at", "ship_date", "created_at", "date"]),
    eta: pick(s, ["eta", "estimated_delivery", "estimated_delivery_date"]),
    carrier: carrier,
    tracking: tracking ? String(tracking) : "",
    trackUrl: pick(s, ["tracking_url", "tracking_url_provider", "public_url"]) || trackingUrl(carrier, tracking),
    items: items,
    description: pick(s, ["description", "items_summary", "note", "order_name"]) || "",
  };
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
    weekday: undefined,
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  }).format(d);
}

function shortTracking(n) {
  if (!n) return "";
  return n.length > 12 ? n.slice(0, 4) + " … " + n.slice(-4) : n;
}

/* ---------- styles ---------- */

const css = `
.ad { --bg:#F5F3EF; --card:#fff; --wash:#FAF9F6; --brand:#957f67; --brand-dark:#7f6b55; --soft:#cfbda9;
  --line:#e6dccf; --line2:#efe8de; --ink:#5f4e3d; --muted:#7d6a56; --hint:#b9a993; --err:#a8452a;
  min-height:100vh; background:var(--bg); color:var(--ink); font-family:"Recoleta", "Fraunces", Georgia, serif;
  -webkit-font-smoothing:antialiased; padding-bottom:40px; overflow-x:hidden; }
.ad *, .ad *::before, .ad *::after { box-sizing:border-box; }
.ad a { color:var(--brand-dark); }
.ad button { font-family:inherit; cursor:pointer; }
.ad-display { font-family:"La Luxes Serif", "Cormorant Garamond", "Recoleta", Georgia, serif; font-weight:400; letter-spacing:-0.01em; }
.ad-wrap { max-width:480px; margin:0 auto; }

/* header */
.ad-head { background:var(--brand); color:var(--bg); padding:16px 18px 30px; border-radius:0 0 32px 32px; }
.ad-head.has-tabs { padding-bottom:0; }
.ad-head-sm { padding-bottom:20px; }
.ad-top { display:flex; justify-content:space-between; align-items:center; gap:12px; }
.ad-pill { display:inline-flex; background:var(--bg); border-radius:999px; padding:6px 14px; }
.ad-logo { width:88px; height:auto; display:block; }
.ad-lang { display:inline-flex; border:1px solid rgba(245,243,239,.45); border-radius:999px; overflow:hidden; }
.ad-lang button { border:0; background:transparent; color:var(--bg); padding:8px 13px; font-size:10.5px; letter-spacing:.14em; min-height:34px; }
.ad-lang button.on { background:var(--bg); color:var(--brand-dark); }
.ad-back { border:0; background:rgba(245,243,239,.16); color:var(--bg); border-radius:999px; padding:8px 14px 8px 12px; font-size:14px; min-height:36px; }
.ad-hi { margin:24px 0 4px; font-size:13px; opacity:.9; }
.ad-h1 { margin:0; font-size:36px; line-height:1.05; }
.ad-h1-sm { margin-top:16px; font-size:32px; }
.ad-sub { margin:6px 0 0; font-size:13.5px; opacity:.88; line-height:1.45; }
.ad-tabs { display:flex; gap:4px; background:var(--brand-dark); box-shadow:0 8px 20px rgba(95,78,61,.18); border-radius:16px; padding:4px; margin-top:18px; transform:translateY(24px); }
.ad-tabs button { flex:1; border:0; background:transparent; color:var(--bg); border-radius:12px; padding:12px 6px; font-size:14px; min-height:44px; }
.ad-tabs button.on { background:#fff; color:var(--ink); box-shadow:0 6px 16px rgba(95,78,61,.18); }

/* body */
.ad-body { padding:16px 14px 0; }
.ad-body.under-tabs { padding-top:42px; }
.ad-card { background:var(--card); border-radius:24px; box-shadow:0 12px 32px rgba(149,127,103,.10); border:0; width:100%; text-align:left; color:inherit; font:inherit; }
.ad-pad { padding:18px; }
.ad-gap { margin-top:12px; }
.ad-gap0 + .ad-gap0 { margin-top:12px; }
.ad-cap { margin:0 0 12px; font-size:10.5px; letter-spacing:.24em; color:var(--muted); }
.ad-cap-out { margin:20px 6px 8px; }
.ad-ico { width:46px; height:46px; border-radius:14px; background:var(--bg); color:var(--brand); display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; }
.ad-sum { display:flex; gap:14px; align-items:flex-start; }
.ad-sum-main { flex:1; min-width:0; }
.ad-sum-main .ad-cap { margin-bottom:6px; }
.ad-name { margin:0; font-size:16.5px; }
.ad-addr { margin:3px 0 0; font-size:14.5px; line-height:1.5; color:var(--muted); overflow-wrap:anywhere; }
.ad-chip-btn { border:0; background:var(--bg); color:var(--brand-dark); border-radius:999px; padding:8px 16px; font-size:13px; min-height:36px; flex-shrink:0; }
.ad-chip-btn:hover { background:#ece6dd; }
.ad-row-head { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:4px; }
.ad-kv { display:flex; justify-content:space-between; align-items:center; gap:14px; padding:11px 0; font-size:14px; border-top:1px solid var(--line2); }
.ad-row-head + .ad-kv { border-top:0; }
.ad-kv > span { color:var(--muted); flex-shrink:0; }
.ad-kv b { font-weight:400; text-align:right; min-width:0; overflow-wrap:anywhere; }
.ad-add { border:0; background:none; padding:0; color:#b98a5c; font-size:14px; }
.ad-latest { display:flex; align-items:center; gap:12px; padding:14px 16px; }
.ad-latest-txt { flex:1; font-size:14px; line-height:1.4; }
.ad-latest-txt small { display:block; color:var(--muted); font-size:12px; }
.ad-chev { color:var(--soft); font-size:22px; }
.ad-toast { display:flex; align-items:center; gap:10px; background:#fff; border:1px solid var(--line); border-radius:16px; padding:11px 14px; margin:0 0 12px; font-size:14px;
  animation:adIn .35s ease-out both; }
.ad-tick { width:26px; height:26px; border-radius:50%; background:var(--brand); color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0; }
@keyframes adIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
.ad-note { margin:16px 10px 0; font-size:12.5px; line-height:1.55; color:var(--muted); text-align:center; }
.ad-foot { margin:14px 10px 0; font-size:12.5px; color:var(--muted); text-align:center; }

/* shipments */
.ad-active { background:linear-gradient(160deg, #fff, var(--wash)); }
.ad-badge { display:inline-flex; align-items:center; border-radius:999px; padding:5px 11px; font-size:11.5px; background:var(--bg); color:var(--brand-dark); white-space:nowrap; }
.ad-badge.solid { background:var(--brand); color:#fff; }
.ad-badge.warn { background:#f6e7dc; color:var(--err); }
.ad-ship-title { margin:10px 0 2px; font-size:16px; }
.ad-ship-sub { margin:2px 0 0; font-size:13px; color:var(--muted); line-height:1.45; }
.ad-prog { margin:18px 4px 4px; }
.ad-prog-track { position:relative; height:12px; margin:0 6px; }
.ad-prog-track::before { content:""; position:absolute; left:0; right:0; top:4.5px; height:3px; background:var(--line); border-radius:3px; }
.ad-prog-fill { position:absolute; left:0; top:4.5px; height:3px; background:var(--brand); border-radius:3px; transition:width .6s ease; }
.ad-prog-track i { position:absolute; top:0; width:12px; height:12px; margin-left:-6px; border-radius:50%; background:var(--line); }
.ad-prog-track i.on { background:var(--brand); }
.ad-prog-labels { display:flex; justify-content:space-between; margin-top:8px; font-size:11.5px; color:var(--hint); }
.ad-prog-labels span.on { color:var(--muted); }
.ad-track { margin-top:14px; width:100%; text-decoration:none; }
.ad-mono { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:11.5px; color:var(--muted); letter-spacing:.02em; overflow-wrap:anywhere; }
.ad-center { text-align:center; margin:10px 0 0; }
.ad-list { padding:2px 16px; }
.ad-ship { display:flex; gap:12px; padding:14px 0; border-top:1px solid var(--line2); }
.ad-ship:first-child { border-top:0; }
.ad-ship-main { flex:1; min-width:0; }
.ad-ship-top { display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:15px; }
.ad-ship-bot { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:6px; }
.ad-ship-bot a { font-size:13px; flex-shrink:0; }
.ad-empty { display:flex; gap:14px; align-items:center; }
.ad-empty p { margin:0; font-size:14px; line-height:1.5; color:var(--muted); }

/* form */
.ad-form { padding-bottom:96px; }
.ad-field { display:flex; flex-direction:column; gap:6px; min-width:0; margin-bottom:14px; }
.ad-label { font-size:12.5px; color:var(--muted); }
.ad-hint { color:var(--hint); }
.ad-in, .ad input[type="text"], .ad input[type="email"], .ad input[type="tel"], .ad input:not([type]) {
  width:100%; min-height:50px; border:1px solid var(--line); border-radius:14px; padding:12px 14px; font-size:16px; line-height:1.3;
  font-family:inherit; color:var(--ink); background:var(--wash); outline:none; -webkit-appearance:none; appearance:none;
  transition:border-color .15s, box-shadow .15s, background .15s; }
.ad input::placeholder { color:var(--hint); }
.ad input:focus, .ad select:focus { border-color:var(--brand) !important; background:#fff !important; box-shadow:0 0 0 4px rgba(149,127,103,.16) !important; }
.ad-select { padding-right:34px; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%23957f67' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 12px center; }
.ad-3 { display:grid; grid-template-columns:1.5fr 1fr 1.15fr; gap:8px; }
.ad-3 .ad-field { margin-bottom:4px; }
.ad-err { margin:12px 6px 0; font-size:14px; line-height:1.4; color:var(--err); background:#fbf1ea; border:1px solid #f0d9c9; border-radius:14px; padding:11px 14px; }
.ad-bar { position:fixed; z-index:20; left:12px; right:12px; bottom:calc(14px + env(safe-area-inset-bottom)); max-width:456px; margin:0 auto;
  display:flex; gap:8px; background:#fff; border-radius:24px; padding:8px; box-shadow:0 10px 30px rgba(149,127,103,.22); }
.ad-btn { display:inline-flex; align-items:center; justify-content:center; min-height:50px; border:0; border-radius:18px; padding:0 18px; font-size:15px; text-decoration:none; }
.ad-grow { flex:1.6; }
.ad-bar .ad-btn2 { flex:1; }
.ad .ad-btn1 { background:var(--brand); color:#fff; }
.ad .ad-btn1:hover { background:var(--brand-dark); }
.ad .ad-btn1:disabled { opacity:.6; cursor:not-allowed; }
.ad .ad-btn2 { background:var(--bg); color:var(--brand-dark); }
.ad-error-card p { margin:0 0 8px; font-size:15px; line-height:1.5; color:var(--err); }
.ad-error-card p:last-child { margin:0; }
.ad-skel { height:46px; border-radius:14px; background:linear-gradient(90deg, #f1ebe3, #f8f4ef, #f1ebe3); background-size:200% 100%;
  animation:adSk 1.2s linear infinite; margin-bottom:12px; }
.ad-skel.short { width:60%; }
@keyframes adSk { from { background-position:200% 0; } to { background-position:-200% 0; } }

@media (min-width:560px) {
  .ad { padding-top:28px; }
  .ad-head { border-radius:32px; }
}
@media (max-width:360px) {
  .ad-3 { grid-template-columns:1fr 1fr; }
  .ad-3 .ad-field:first-child { grid-column:1 / -1; }
  .ad-h1 { font-size:32px; }
}
@media (prefers-reduced-motion: reduce) {
  .ad-toast, .ad-skel { animation:none; }
  .ad-prog-fill { transition:none; }
}
`;
