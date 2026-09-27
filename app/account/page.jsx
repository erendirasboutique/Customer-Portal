// app/account/page.jsx

"use client";

import { useEffect, useState } from "react";
import AddressAutocomplete from "@/components/AddressAutocomplete";

const T = {
  en: {
    title: "Your Delivery Details",
    intro:
      "Check that everything below is correct. Any change you save is applied to your future shipments right away.",
    name: "Name",
    email: "Email",
    phone: "Phone",
    address1: "Street address",
    address2: "Apt, suite, unit (optional)",
    addressHint: "Start typing and pick your address",
    poweredBy: "Powered by Google",
    city: "City",
    state: "State",
    zip: "ZIP code",
    save: "Save changes",
    saving: "Saving...",
    saved: "Saved. Your future shipments will use these details.",
    loadError:
      "This link isn't valid anymore. Reply to us and we'll send you a new one.",
    saveError: "Your changes couldn't be saved. Please try again.",
    missing: "Street address, city, state and ZIP are required.",
    invalidEmail: "Please enter a valid email address.",
    langSwitch: "Español",
  },
  es: {
    title: "Tus datos de entrega",
    intro:
      "Revisa que todo esté correcto. Cualquier cambio que guardes se aplica de inmediato a tus próximos envíos.",
    name: "Nombre",
    email: "Correo electrónico",
    phone: "Teléfono",
    address1: "Dirección",
    address2: "Apto, suite, unidad (opcional)",
    addressHint: "Empieza a escribir y elige tu dirección",
    poweredBy: "Con tecnología de Google",
    city: "Ciudad",
    state: "Estado",
    zip: "Código postal",
    save: "Guardar cambios",
    saving: "Guardando...",
    saved: "Guardado! Tus próximos envíos usarán estos datos.",
    loadError:
      "Este enlace ya no es válido. Escríbenos y te enviaremos uno nuevo.",
    saveError: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
    missing: "Dirección, ciudad, estado y código postal son obligatorios.",
    invalidEmail: "Ingresa un correo electrónico válido.",
    langSwitch: "English",
  },
};

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

export default function AccountPage() {
  const [token, setToken] = useState("");
  const [lang, setLang] = useState("en");
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState("loading");
  const [validationMsg, setValidationMsg] = useState("");

  const t = T[lang];

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const portalToken = searchParams.get("t") || "";

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

        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address1: data.address1 || "",
          address2: data.address2 || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
        });

        setStatus("ready");
      } catch (error) {
        console.error("Account load error:", error);
        setStatus("load_error");
      }
    }

    loadAccount();
  }, []);

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

      setStatus("saved");
    } catch (error) {
      console.error("Account save error:", error);
      setStatus("save_error");
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <img
            src="/EB_Logo_Fall BGBLANK.png"
            alt="Erendira's Boutique"
            style={styles.logo}
          />
        </div>

        <div style={styles.topRow}>
          <span style={styles.kicker}>Erendira&apos;s Boutique</span>

          <button
            type="button"
            onClick={function switchLanguage() {
              setLang(lang === "en" ? "es" : "en");
              setValidationMsg("");
            }}
            style={styles.langBtn}
          >
            {t.langSwitch}
          </button>
        </div>

        <h1 style={styles.title}>{t.title}</h1>

        <p style={styles.intro}>{t.intro}</p>

        {status === "loading" && (
          <div>
            <div style={styles.skeletonLine} />
            <div style={styles.skeletonLine} />
            <div style={styles.skeletonLine} />
            <div style={styles.skeletonLine} />
          </div>
        )}

        {status === "load_error" && (
          <p style={styles.errorBox}>{t.loadError}</p>
        )}

        {form && status !== "loading" && status !== "load_error" && (
          <div>
            <Field label={t.name}>
              <input
                type="text"
                style={styles.input}
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
                style={styles.input}
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
                type="tel"
                style={styles.input}
                value={form.phone}
                onChange={function changePhone(event) {
                  updateField("phone", event.target.value);
                }}
                autoComplete="tel"
                inputMode="tel"
              />
            </Field>

            <Field label={t.address1}>
              <AddressAutocomplete
                inputStyle={styles.input}
                value={form.address1}
                placeholder={t.addressHint}
                poweredBy={t.poweredBy}
                onChange={function changeAddress1(value) {
                  updateField("address1", value);
                }}
                onSelect={pickAddress}
              />
            </Field>

            <Field label={t.address2}>
              <input
                type="text"
                style={styles.input}
                value={form.address2}
                id="address2"
                onChange={function changeAddress2(event) {
                  updateField("address2", event.target.value);
                }}
                autoComplete="address-line2"
              />
            </Field>

            <div style={styles.row}>
              <Field label={t.city} grow={2}>
                <input
                  type="text"
                  style={styles.input}
                  value={form.city}
                  onChange={function changeCity(event) {
                    updateField("city", event.target.value);
                  }}
                  autoComplete="address-level2"
                />
              </Field>

              <Field label={t.state} grow={1}>
                <input
                  type="text"
                  style={styles.input}
                  value={form.state}
                  onChange={function changeState(event) {
                    updateField("state", event.target.value);
                  }}
                  autoComplete="address-level1"
                  maxLength={40}
                />
              </Field>

              <Field label={t.zip} grow={1}>
                <input
                  type="text"
                  style={styles.input}
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

            {validationMsg && (
              <p role="alert" style={styles.errorText}>
                {validationMsg}
              </p>
            )}

            {status === "save_error" && (
              <p role="alert" style={styles.errorText}>
                {t.saveError}
              </p>
            )}

            {status === "saved" && (
              <p role="status" style={styles.savedText}>
                {t.saved}
              </p>
            )}

            <button
              type="button"
              onClick={save}
              disabled={status === "saving"}
              style={{
                ...styles.saveBtn,
                opacity: status === "saving" ? 0.6 : 1,
                cursor: status === "saving" ? "not-allowed" : "pointer",
              }}
            >
              {status === "saving" ? t.saving : t.save}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function Field(props) {
  return (
    <label
      style={{
        ...styles.field,
        flex: props.grow || undefined,
      }}
    >
      <span style={styles.label}>{props.label}</span>
      {props.children}
    </label>
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#fdfcf7",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "48px 16px",
    fontFamily: "'Recoleta', Georgia, serif",
    color: "#da5e16",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: 520,
    background: "#ffffff",
    border: "1px solid #f6d3a8",
    borderRadius: 16,
    padding: "32px 32px 40px",
    boxShadow: "0 2px 24px rgba(237, 160, 51, 0.12)",
    boxSizing: "border-box",
  },

  logoWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
  },

  logo: {
    display: "block",
    width: "auto",
    height: "auto",
    maxWidth: "230px",
    maxHeight: "90px",
    objectFit: "contain",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },

  kicker: {
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#eda033",
  },

  langBtn: {
    flexShrink: 0,
    background: "none",
    border: "1px solid #eda033",
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 12,
    color: "#da5e16",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  title: {
    fontFamily: "'La Luxes Serif', 'Recoleta', Georgia, serif",
    fontSize: 30,
    lineHeight: 1.15,
    fontWeight: 400,
    margin: "0 0 10px",
    color: "#da5e16",
  },

  intro: {
    fontSize: 15,
    lineHeight: 1.55,
    margin: "0 0 28px",
    color: "#da5e16",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    letterSpacing: "0.04em",
    color: "#da5e16",
  },

  input: {
    width: "100%",
    border: "1px solid #f6d3a8",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 16,
    lineHeight: 1.3,
    fontFamily: "inherit",
    color: "#da5e16",
    background: "#fffdf8",
    outlineColor: "#eda033",
    boxSizing: "border-box",
  },

  row: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },

  saveBtn: {
    width: "100%",
    marginTop: 8,
    background: "#eda033",
    color: "#fdfcf7",
    border: "none",
    borderRadius: 999,
    padding: "14px 20px",
    fontSize: 16,
    letterSpacing: "0.03em",
    fontFamily: "inherit",
  },

  savedText: {
    fontSize: 14,
    lineHeight: 1.4,
    color: "#5c7a52",
    margin: "0 0 12px",
  },

  errorText: {
    fontSize: 14,
    lineHeight: 1.4,
    color: "#a05252",
    margin: "0 0 12px",
  },

  errorBox: {
    fontSize: 15,
    lineHeight: 1.5,
    color: "#a05252",
    background: "#faf3f0",
    border: "1px solid #e8d5cc",
    borderRadius: 10,
    padding: "14px 16px",
    margin: 0,
  },

  skeletonLine: {
    height: 46,
    borderRadius: 10,
    background: "#fcefdc",
    marginBottom: 18,
  },
};
