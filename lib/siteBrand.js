/* ============================================================
   Erendira's Boutique — shared brand (server only)

   The logo, colors and season set on /admin/branding are served
   to every site from three addresses on this domain:
     /brand/brand.css   colors + fonts as CSS variables
     /brand/logo.png    the current logo
     /brand/brand.json  everything above, for scripts
   The Shipping Portal and the tracker load these, so a change
   saved on the Branding page shows on all of them.
   If the database can't be read, the defaults are served so the
   sites never lose their look.
   ============================================================ */

import { getSettings, SETTINGS_DEFAULTS, serviceClient } from "@/lib/admin/account-settings";

export const BRAND_BUCKET = "studio-documents"; // same private bucket as admin documents
export const DEFAULT_BRAND = SETTINGS_DEFAULTS.site_brand;

// CORS so the other sites can load the files; short cache so saves show up quickly.
export const BRAND_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=120, s-maxage=60, stale-while-revalidate=600",
};

export async function getSiteBrand() {
  try {
    const s = await getSettings(["site_brand"]);
    if (s._error) return { ...DEFAULT_BRAND };
    return { ...DEFAULT_BRAND, ...(s.site_brand || {}) };
  } catch (e) {
    return { ...DEFAULT_BRAND };
  }
}

function hex(v, fallback) {
  return /^#[0-9a-fA-F]{6}$/.test(String(v || "")) ? v : fallback;
}

export function rgb(h) {
  const n = parseInt(h.slice(1), 16);
  return ((n >> 16) & 255) + " " + ((n >> 8) & 255) + " " + (n & 255);
}

export function brandColors(brand) {
  return {
    cream: hex(brand.cream, DEFAULT_BRAND.cream),
    taupe: hex(brand.taupe, DEFAULT_BRAND.taupe),
    sand: hex(brand.sand, DEFAULT_BRAND.sand),
    ink: hex(brand.ink, DEFAULT_BRAND.ink),
  };
}

export function brandCss(brand) {
  const c = brandColors(brand);
  return `/* ==========================================================
   Erendira's Boutique — shared brand (season: ${brand.season || "everyday"})
   Generated from /admin/branding. Change it there, not here.
   ========================================================== */

@font-face {
  font-family: "Charman Serif";
  src: url("fonts/CharmanSerif-Regular.otf") format("opentype");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Ltt Recoleta";
  src: url("fonts/LttRecoleta-CondensedMedium.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

:root {
  --brand-cream: ${c.cream};
  --brand-taupe: ${c.taupe};
  --brand-sand: ${c.sand};
  --brand-white: #FFFFFF;
  --brand-ink: ${c.ink};

  --brand-cream-rgb: ${rgb(c.cream)};
  --brand-taupe-rgb: ${rgb(c.taupe)};
  --brand-sand-rgb: ${rgb(c.sand)};
  --brand-ink-rgb: ${rgb(c.ink)};

  --brand-font-heading: "Charman Serif", Georgia, serif;
  --brand-font-body: "Ltt Recoleta", Georgia, serif;

  --brand-logo: url("logo.png");
}
`;
}

// The logo's bytes and type, from wherever the Branding page points.
export async function loadLogo(brand, requestUrl) {
  const v = String(brand.logo_url || "");
  try {
    if (v.startsWith("storage:site-brand/")) {
      const { data, error } = await serviceClient().storage.from(BRAND_BUCKET).download(v.slice("storage:".length));
      if (!error && data) return { body: await data.arrayBuffer(), type: data.type || "image/png" };
    } else if (/^https:\/\//i.test(v) || (v.startsWith("/") && !v.startsWith("//") && v.split("?")[0] !== "/brand/logo.png")) {
      const res = await fetch(new URL(v, requestUrl), { cache: "no-store" });
      const type = res.headers.get("content-type") || "";
      if (res.ok && /^image\/(png|jpeg|webp|gif)/.test(type)) return { body: await res.arrayBuffer(), type: type };
    }
  } catch (e) {
    // fall through to the default logo
  }
  const res = await fetch(new URL(DEFAULT_BRAND.logo_url, requestUrl), { cache: "no-store" });
  return { body: await res.arrayBuffer(), type: "image/png" };
}
