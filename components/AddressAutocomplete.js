"use client";

// Street address input with Google address suggestions (Places API New).
// Needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in Vercel. Without it, this is a normal input.

import { useEffect, useRef, useState } from "react";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

function newSessionToken() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch (e) {}
  return String(Date.now()) + "-" + Math.random().toString(36).slice(2);
}

function parsePlace(place, fallbackStreet) {
  const comps = Array.isArray(place && place.addressComponents) ? place.addressComponents : [];
  function get(type, short) {
    const c = comps.find(function (x) {
      return Array.isArray(x.types) && x.types.includes(type);
    });
    if (!c) return "";
    return (short ? c.shortText : c.longText) || c.longText || c.shortText || "";
  }
  const number = get("street_number");
  const route = get("route", true);
  const street1 = number && route ? number + " " + route : route || fallbackStreet;
  const sub = get("subpremise");
  const city =
    get("locality") ||
    get("postal_town") ||
    get("sublocality_level_1") ||
    get("sublocality") ||
    get("neighborhood") ||
    get("administrative_area_level_3");
  return {
    street1: street1,
    street2: sub ? "#" + sub : "",
    city: city,
    state: get("administrative_area_level_1", true).toUpperCase(),
    zip: get("postal_code"),
  };
}

export default function AddressAutocomplete(props) {
  const { value, onChange, onSelect, inputStyle, placeholder, poweredBy, id } = props;
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const sessionRef = useRef("");
  const reqRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(function () {
    return function () {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function lookup(text) {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = text.trim();
    if (!API_KEY || q.length < 3) {
      setItems([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async function () {
      const reqId = ++reqRef.current;
      if (!sessionRef.current) sessionRef.current = newSessionToken();
      try {
        const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Goog-Api-Key": API_KEY },
          body: JSON.stringify({
            input: q,
            sessionToken: sessionRef.current,
            includedRegionCodes: ["us"],
            includedPrimaryTypes: ["street_address", "premise", "subpremise"],
            languageCode: "en",
          }),
        });
        if (reqId !== reqRef.current) return;
        if (!res.ok) {
          setItems([]);
          setOpen(false);
          return;
        }
        const data = await res.json();
        const list = ((data && data.suggestions) || [])
          .map(function (s) {
            return s && s.placePrediction;
          })
          .filter(Boolean)
          .slice(0, 5)
          .map(function (p) {
            const sf = p.structuredFormat || {};
            return {
              placeId: p.placeId,
              main: (sf.mainText && sf.mainText.text) || (p.text && p.text.text) || "",
              secondary: ((sf.secondaryText && sf.secondaryText.text) || "").replace(/, USA$/, ""),
            };
          });
        setItems(list);
        setActive(0);
        setOpen(list.length > 0);
      } catch (e) {
        if (reqId === reqRef.current) {
          setItems([]);
          setOpen(false);
        }
      }
    }, 250);
  }

  async function pick(s) {
    setOpen(false);
    setItems([]);
    reqRef.current++;
    const token = sessionRef.current;
    sessionRef.current = "";
    try {
      const url =
        "https://places.googleapis.com/v1/places/" +
        encodeURIComponent(s.placeId) +
        (token ? "?sessionToken=" + encodeURIComponent(token) : "");
      const res = await fetch(url, {
        headers: { "X-Goog-Api-Key": API_KEY, "X-Goog-FieldMask": "addressComponents" },
      });
      if (!res.ok) throw new Error("details failed");
      const place = await res.json();
      onSelect(parsePlace(place, s.main));
    } catch (e) {
      onChange(s.main);
    }
  }

  function onKeyDown(e) {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(function (a) {
        return (a + 1) % items.length;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(function (a) {
        return (a - 1 + items.length) % items.length;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        type="text"
        style={inputStyle}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={function (e) {
          onChange(e.target.value);
          lookup(e.target.value);
        }}
        onKeyDown={onKeyDown}
        onFocus={function () {
          if (items.length) setOpen(true);
        }}
        onBlur={function () {
          setTimeout(function () {
            setOpen(false);
          }, 150);
        }}
      />
      {open && items.length > 0 && (
        <div style={dd.box}>
          {items.map(function (s, i) {
            return (
              <button
                key={s.placeId}
                type="button"
                onMouseDown={function (e) {
                  e.preventDefault();
                }}
                onClick={function (e) {
                  e.preventDefault();
                  pick(s);
                }}
                onMouseEnter={function () {
                  setActive(i);
                }}
                style={{ ...dd.item, background: i === active ? "#fcefdc" : "#ffffff" }}
              >
                <span style={dd.main}>📍 {s.main}</span>
                {s.secondary && <span style={dd.sub}>{s.secondary}</span>}
              </button>
            );
          })}
          <div style={dd.powered}>{poweredBy || "Powered by Google"}</div>
        </div>
      )}
    </div>
  );
}

const dd = {
  box: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "calc(100% + 4px)",
    zIndex: 20,
    background: "#ffffff",
    border: "1px solid #f6d3a8",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(237, 160, 51, 0.18)",
  },
  item: {
    display: "block",
    width: "100%",
    textAlign: "left",
    border: "none",
    borderBottom: "1px solid #fcefdc",
    padding: "10px 14px",
    cursor: "pointer",
    fontFamily: "inherit",
    color: "#da5e16",
  },
  main: { display: "block", fontSize: 15 },
  sub: { display: "block", fontSize: 12, paddingLeft: 22, color: "#eda033" },
  powered: { fontSize: 11, textAlign: "right", padding: "4px 12px", color: "#c9a27a" },
};
