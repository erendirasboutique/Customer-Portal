```jsx
// app/account/page.jsx
// Customer address page — opened via tokenized link:
//   https://my.erendirasboutique.com/account?t=<portal_token>
// No sign-in. Token is validated server-side by /api/account.

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const T = {
  en: {
    kicker: "Erendira's Boutique",
    title: "Your delivery details",
    intro:
      "Check that everything below is correct. Any change you save is applied to your future shipments right away.",
    name: "Name",
    email: "Email",
    phone: "Phone",
    address1: "Street address",
    address2: "Apt, suite, unit (optional)",
    city: "City",
    state: "State",
    zip: "ZIP code",
    save: "Save changes",
    saving: "Saving…",
    saved: "Saved. Your future shipments will use these details.",
    loadError:
      "This link isn't valid anymore. Reply to us and we'll send you a new one.",
    saveError: "Your changes couldn't be saved. Please try again.",
    missing: "Street address, city, state and ZIP are required.",
    langSwitch: "Español",
  },
  es: {
    kicker: "Erendira's Boutique",
    title: "Tus datos de entrega",
    intro:
      "Revisa que todo esté correcto. Cualquier cambio que guardes se aplica de inmediato a tus próximos envíos.",
    name: "Nombre",
    email: "Correo electrónico",
    phone: "Teléfono",
    address1: "Dirección",
    address2: "Apto, suite, unidad (opcional)",
    city: "Ciudad",
    state: "Estado",
    zip: "Código postal",
    save: "Guardar cambios",
    saving: "Guardando…",
    saved: "Guardado. Tus próximos envíos usarán estos datos.",
    loadError:
      "Este enlace ya no es válido. Escríbenos y te enviaremos uno nuevo.",
    saveError: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
    missing: "Dirección, ciudad, estado y código postal son obligatorios.",
    langSwitch: "English",
  },
};

function AccountInner() {
  const params = useSearchParams();
  const token = params.get("t") ?? "";

  const [lang, setLang] = useState("en");
  const t = T[lang];

  const [form, setForm] = useState(null);
  const [status, setStatus] = useState("loading");
  const [validationMsg, setValidationMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("load_error");
      return;
    }

    fetch(`/api/account?t=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setForm({
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          address1: data.address1 ?? "",
          address2: data.address2 ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          zip: data.zip ?? "",
        });
        setStatus("ready");
      })
      .catch(() => setStatus("load_error"));
  }, [token]);

  const set = (key) => (e) => {
    if (!form) return;

    setForm({
      ...form,
      [key]: e.target.value,
    });

    if (status === "saved" || status === "save_error") {
      setStatus("ready");
    }

    setValidationMsg("");
  };

  const save = async () => {
    if (!form) return;

    if (
      !form.address1.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.zip.trim()
    ) {
      setValidationMsg(t.missing);
      return;
    }

    setStatus("saving");
    setValidationMsg("");

    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          t: token,
          ...form,
        }),
      });

      if (!res.ok) {
        throw new Error();
      }

      setStatus("saved");
    } catch {
      setStatus("save_error");
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.topRow}>
          <span style={styles.kicker}>{t.kicker}</span>

          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            style={styles.langBtn}
          >
            {t.langSwitch}
          </button>
        </div>

        <h1 style={styles.title}>{t.title}</h1>
        <p style={styles.intro}>{t.intro}</p>

        {status === "loading" && <div style={styles.skeleton} />}

        {status === "load_error" && (
          <p style={styles.errorBox}>{t.loadError}</p>
        )}

        {form && status !== "load_error" && status !== "loading" && (
          <div>
            <Field label={t.name}>
              <input
                style={styles.input}
                value={form.name}
                onChange={set("name")}
                autoComplete="name"
              />
            </Field>

            <Field label={t.email}>
              <input
                type="email"
                style={styles.input}
                value={form.email}
                onChange={set("email")}
                autoComplete="email"
                inputMode="email"
              />
            </Field>

            <Field label={t.phone}>
              <input
                type="tel"
                style={styles.input}
                value={form.phone}
                onChange={set("phone")}
                autoComplete="tel"
                inputMode="tel"
              />
            </Field>

            <Field label={t.address1}>
              <input
                style={styles.input}
                value={form.address1}
                onChange={set("address1")}
                autoComplete="address-line1"
              />
            </Field>

            <Field label={t.address2}>
              <input
                style={styles.input}
                value={form.address2}
                onChange={set("address2")}
                autoComplete="address-line2"
              />
            </Field>

            <div style={styles.row}>
              <Field label={t.city} grow={2}>
                <input
                  style={styles.input}
                  value={form.city}
                  onChange={set("city")}
                  autoComplete="address-level2"
                />
              </Field>

              <Field label={t.state} grow={1}>
                <input
                  style={styles.input}
                  value={form.state}
                  onChange={set("state")}
                  autoComplete="address-level1"
                />
              </Field>

              <Field label={t.zip} grow={1}>
                <input
                  style={styles.input}
                  value={form.zip}
                  onChange={set("zip")}
                  autoComplete="postal-code"
                  inputMode="numeric"
                />
              </Field>
            </div>

            {validationMsg && (
              <p style={styles.errorText}>{validationMsg}</p>
            )}

            {status === "save_error" && (
              <p style={styles.errorText}>{t.saveError}</p>
            )}

            {status === "saved" && (
              <p style={styles.savedText}>{t.saved}</p>
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

function Field({ label, children, grow }) {
  return (
    <label style={{ ...styles.field, flex: grow ?? undefined }}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F5F3EF",
    display: "flex",
    justifyContent: "center",
    padding: "48px 16px",
    fontFamily: "'Recoleta', Georgia, serif",
    color: "#3d332a",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    border: "1px solid #e4dccf",
    borderRadius: 16,
    padding: "36px 32px 40px",
    boxShadow: "0 2px 24px rgba(128,106,82,0.08)",
    height: "fit-content",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#bda891",
  },
  langBtn: {
    background: "none",
    border: "1px solid #bda891",
    borderRadius: 999,
    padding: "4px 14px",
    fontSize: 12,
    color: "#806a52",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  title: {
    fontFamily: "'La Luxes Serif', 'Recoleta', Georgia, serif",
    fontSize: 30,
    fontWeight: 400,
    margin: "0 0 10px",
    color: "#806a52",
  },
  intro: {
    fontSize: 15,
    lineHeight: 1.55,
    margin: "0 0 28px",
    color: "#6f6354",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    letterSpacing: "0.04em",
    color: "#806a52",
  },
  input: {
    border: "1px solid #d8cdbc",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 16,
    fontFamily: "inherit",
    color: "#3d332a",
    background: "#fdfcfa",
    outlineColor: "#bda891",
    width: "100%",
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
    background: "#806a52",
    color: "#F5F3EF",
    border: "none",
    borderRadius: 999,
    padding: "14px 0",
    fontSize: 16,
    letterSpacing: "0.03em",
    fontFamily: "inherit",
  },
  savedText: {
    fontSize: 14,
    color: "#5c7a52",
    margin: "0 0 12px",
  },
  errorText: {
    fontSize: 14,
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
  },
  skeleton: {
    height: 220,
    borderRadius: 10,
    background:
      "linear-gradient(90deg, #f1ece3 25%, #f8f5ef 50%, #f1ece3 75%)",
    backgroundSize: "200% 100%",
  },
};

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountInner />
    </Suspense>
  );
}
```
