/* ============================================================
   Share picture for /receipt/<token>
   This is the image Messenger, iMessage, WhatsApp, Facebook, etc.
   show when you send a receipt link. Next.js picks this file up
   automatically. Size: 1200 × 630.

   FONTS — uses your brand fonts:
     La Luxes Serif → the amount and "Tu recibo"
     Recoleta       → everything else
   Put a copy of each font file in the "fonts" folder next to this
   file, named exactly:
     app/receipt/[token]/fonts/display.otf   (La Luxes Serif)
     app/receipt/[token]/fonts/body.otf      (Recoleta)
   .otf, .ttf or .woff all work (rename the ending to match).
   .woff2 does NOT work for share pictures.
   If those aren't there, it also looks in /public/fonts/ for the
   common file names below. Without any font file it still works,
   just in a plain font.
   ============================================================ */

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getReceiptByToken } from "@/lib/receipts";

export const runtime = "nodejs";
export const alt = "Erendira's Boutique — Recibo de pago";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SITE_URL = "https://receipts.erendirasboutique.com";
const LOGO_FILE = "EB_Logo_Fall BGBLANK.png"; // in /public
const SHOW_AMOUNT = true; // false = same picture for every receipt, no amount

// Places to look, in order. Written out in full so Vercel includes them.
const DISPLAY_FONT_PATHS = [
  join(process.cwd(), "app/receipt/[token]/fonts/display.otf"),
  join(process.cwd(), "app/receipt/[token]/fonts/display.ttf"),
  join(process.cwd(), "app/receipt/[token]/fonts/display.woff"),
  join(process.cwd(), "src/app/receipt/[token]/fonts/display.otf"),
  join(process.cwd(), "src/app/receipt/[token]/fonts/display.ttf"),
  join(process.cwd(), "public/fonts/LaLuxesSerif.otf"),
  join(process.cwd(), "public/fonts/LaLuxesSerif.ttf"),
  join(process.cwd(), "public/fonts/LaLuxesSerif.woff"),
  join(process.cwd(), "public/fonts/LaLuxesSerif-Regular.otf"),
  join(process.cwd(), "public/fonts/La Luxes Serif.otf"),
  join(process.cwd(), "public/fonts/La Luxes Serif.ttf"),
  join(process.cwd(), "public/fonts/la-luxes-serif.otf"),
  join(process.cwd(), "public/fonts/la-luxes-serif.ttf"),
];

const BODY_FONT_PATHS = [
  join(process.cwd(), "app/receipt/[token]/fonts/body.otf"),
  join(process.cwd(), "app/receipt/[token]/fonts/body.ttf"),
  join(process.cwd(), "app/receipt/[token]/fonts/body.woff"),
  join(process.cwd(), "src/app/receipt/[token]/fonts/body.otf"),
  join(process.cwd(), "src/app/receipt/[token]/fonts/body.ttf"),
  join(process.cwd(), "public/fonts/Recoleta-Regular.otf"),
  join(process.cwd(), "public/fonts/Recoleta-Regular.ttf"),
  join(process.cwd(), "public/fonts/Recoleta-Regular.woff"),
  join(process.cwd(), "public/fonts/Recoleta.otf"),
  join(process.cwd(), "public/fonts/Recoleta.ttf"),
  join(process.cwd(), "public/fonts/Recoleta.woff"),
  join(process.cwd(), "public/fonts/recoleta-regular.otf"),
  join(process.cwd(), "public/fonts/recoleta.otf"),
];

const C = {
  bg: "#F5F3EF",
  card: "#FFFFFF",
  brand: "#957f67",
  dark: "#7f6b55",
  muted: "#7d6a56",
  line: "#e6dccf",
};

function money(n, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency || "usd").toUpperCase(),
  }).format(Number(n || 0));
}

// Share pictures can use .otf / .ttf / .woff, but not .woff2.
function usable(buf) {
  if (!buf || buf.length < 4) return false;
  return buf.toString("latin1", 0, 4) !== "wOF2";
}

async function firstFile(paths) {
  for (const p of paths) {
    try {
      const buf = await readFile(p);
      if (usable(buf)) return buf;
    } catch (e) {}
  }
  return null;
}

// Fonts and logo only need loading once per server start.
let cache = null;

async function loadAssets() {
  if (cache) return cache;

  const display = await firstFile(DISPLAY_FONT_PATHS);
  const body = await firstFile(BODY_FONT_PATHS);

  let logo = null;
  try {
    const buf = await readFile(join(process.cwd(), "public", LOGO_FILE));
    logo = "data:image/png;base64," + buf.toString("base64");
  } catch (e) {
    try {
      const res = await fetch(SITE_URL + "/" + encodeURI(LOGO_FILE));
      if (res.ok) logo = "data:image/png;base64," + Buffer.from(await res.arrayBuffer()).toString("base64");
    } catch (e2) {}
  }

  if (!display) console.warn("[receipt share image] La Luxes Serif font file not found — using a plain font.");
  if (!body) console.warn("[receipt share image] Recoleta font file not found — using a plain font.");

  cache = { display, body, logo };
  return cache;
}

export default async function Image({ params }) {
  const { token } = await params;

  let r = null;
  try {
    r = await getReceiptByToken(token);
  } catch (e) {}

  const { display, body, logo } = await loadAssets();

  const fonts = [];
  if (body) fonts.push({ name: "Recoleta", data: body, weight: 400, style: "normal" });
  if (display) fonts.push({ name: "La Luxes Serif", data: display, weight: 400, style: "normal" });

  const bodyFont = body ? "Recoleta" : undefined;
  const displayFont = display ? "La Luxes Serif" : bodyFont;

  const refunded = r && r.status === "refunded";
  const amountText = r ? money(r.amount, r.currency) : "";
  const showAmount = SHOW_AMOUNT && r;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: C.bg,
          padding: "60px 70px",
          gap: 60,
          fontFamily: bodyFont,
        }}
      >
        {/* logo card */}
        <div
          style={{
            width: 500,
            height: 510,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: C.card,
            borderRadius: 40,
            boxShadow: "0 18px 50px rgba(149,127,103,0.18)",
            flexShrink: 0,
          }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            <img src={logo} width={400} height={220} style={{ objectFit: "contain" }} />
          ) : (
            <div style={{ display: "flex", fontSize: 58, color: C.dark, fontFamily: displayFont }}>
              Erendira&apos;s Boutique
            </div>
          )}
        </div>

        {/* text */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 5, color: C.muted }}>
            RECIBO DE PAGO
          </div>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: C.muted, marginTop: 6 }}>
            PAYMENT RECEIPT
          </div>

          {showAmount ? (
            <div
              style={{
                display: "flex",
                fontFamily: displayFont,
                fontSize: amountText.length > 9 ? 104 : 132,
                lineHeight: 1,
                color: C.brand,
                marginTop: 30,
                textDecoration: refunded ? "line-through" : "none",
              }}
            >
              {amountText}
            </div>
          ) : (
            <div style={{ display: "flex", fontFamily: displayFont, fontSize: 104, lineHeight: 1.05, color: C.brand, marginTop: 30 }}>
              Tu recibo
            </div>
          )}

          <div style={{ display: "flex", marginTop: 34 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: refunded ? C.card : C.brand,
                color: refunded ? C.dark : "#ffffff",
                border: "2px solid " + (refunded ? C.line : C.brand),
                borderRadius: 999,
                padding: "14px 30px",
                fontSize: 30,
              }}
            >
              {refunded ? "Reembolsado · Refunded" : r ? "Pagado · Paid" : "Erendira's Boutique"}
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 24, color: C.muted, marginTop: 44 }}>
            Toca para ver tu recibo · Tap to view
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );
}
