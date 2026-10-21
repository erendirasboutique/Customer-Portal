import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/* ============================================================
   Erendira's Boutique — gift card PDF ("Keepsake" layout)
   Renders on demand, so design changes hit every card at once.

   Layout, top to bottom: flower mark + brand, the personal note
   ("For ___" and the message), the card itself (brand, amount,
   code — a screenshot of just the card is a complete gift card),
   then how to redeem with the QR code.

   Colors are only the brand palette: taupe, sand, cream.

   FONTS: drop the .otf/.ttf files in public/fonts/ and list the
   filenames in FONT_FILES. First one found wins; if none load it
   falls back to Times / Helvetica so the route never breaks.
   Fonts are embedded WITHOUT subsetting — pdf-lib's subsetter
   garbles many .otf fonts.

   Requires "@pdf-lib/fontkit" in package.json.
   ============================================================ */

const FONT_FILES = {
  display: ['LaLuxesSerif.otf', 'la-luxes-serif.otf', 'LaLuxes-Serif.otf', 'LaLuxesSerif.ttf', 'LaLuxesSerif-Regular.otf'],
  body: ['recoleta-regular.otf', 'Recoleta-Regular.otf', 'Recoleta.otf', 'Recoleta-Regular.ttf', 'Recoleta.ttf'],
  bodyItalic: ['Recoleta-RegularItalic.otf', 'Recoleta-Italic.otf', 'Recoleta-Italic.ttf'],
};

const HEX = {
  taupe: '#806a52',
  sand: '#bda891',
  cream: '#F5F3EF',
};

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

// Blend two colors (used for the faint flower on the card, so it's
// a solid tint instead of stacked transparent shapes).
function mix(a, b, t) {
  return rgb(a.red + (b.red - a.red) * t, a.green + (b.green - a.green) * t, a.blue + (b.blue - a.blue) * t);
}

const C = {
  taupe: hexToRgb(HEX.taupe),
  sand: hexToRgb(HEX.sand),
  cream: hexToRgb(HEX.cream),
};

const PAGE_W = 612;
const PAGE_H = 792;
const CX = PAGE_W / 2;

/* ---------------- Copy ---------------- */
const T = {
  en: {
    giftCard: 'GIFT CARD',
    brand: "Erendira's Boutique",
    brandCaps: "ERENDIRA'S BOUTIQUE",
    neverExpires: 'NEVER EXPIRES',
    forWord: 'For',
    redeemTitle: 'How to redeem',
    redeemBody:
      'Screenshot the card and send it through Messenger, show it in person, or enter the code at checkout where promo codes apply.',
    scanBody: 'Scan the square to open it online.',
    footerNever: 'This gift card never expires.',
    footerExpires: "Use before the expiration date shown by Erendira's Boutique.",
  },
  es: {
    giftCard: 'TARJETA DE REGALO',
    brand: "Erendira's Boutique",
    brandCaps: "ERENDIRA'S BOUTIQUE",
    neverExpires: 'NUNCA VENCE',
    forWord: 'Para',
    redeemTitle: 'Cómo canjearla',
    redeemBody:
      'Manda una captura de la tarjeta por Messenger, muéstrala en persona, o escribe el código al pagar donde se permitan códigos promocionales.',
    scanBody: 'Escanea el cuadro para abrirla en línea.',
    footerNever: 'Esta tarjeta de regalo nunca vence.',
    footerExpires: "Úsala antes de la fecha de vencimiento que indique Erendira's Boutique.",
  },
};

/* ---------------- Text helpers ---------------- */

// Strips control characters and emoji — the fonts can't encode them
// and pdf-lib throws rather than skipping.
function clean(value) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2190}-\u{21FF}]/gu, '')
    .replace(/[  -  ]/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}

// Drops any character the font can't encode, so a stray symbol in a
// customer's message can never crash the route.
function encodable(font, text) {
  let out = '';
  for (const ch of text) {
    try {
      font.encodeText(ch);
      out += ch;
    } catch {
      // skip
    }
  }
  return out;
}

function width(font, text, size) {
  return font.widthOfTextAtSize(encodable(font, text), size);
}

function draw(page, text, x, y, font, size, color) {
  const value = encodable(font, clean(text));
  if (value) page.drawText(value, { x, y, size, font, color });
}

function drawCenter(page, text, y, font, size, color, centerX) {
  const value = encodable(font, clean(text));
  if (!value) return;
  const w = font.widthOfTextAtSize(value, size);
  page.drawText(value, { x: (centerX == null ? CX : centerX) - w / 2, y, size, font, color });
}

function drawRight(page, text, rightX, y, font, size, color) {
  const value = encodable(font, clean(text));
  if (!value) return;
  page.drawText(value, { x: rightX - font.widthOfTextAtSize(value, size), y, size, font, color });
}

// pdf-lib has no letter-spacing, so tracked caps are drawn glyph by glyph.
// align: 'center' (x = center), 'left' (x = start), 'right' (x = end).
function drawTracked(page, text, x, y, font, size, color, tracking, align) {
  const chars = encodable(font, clean(text)).split('');
  if (!chars.length) return;
  const gap = (c) => (c === ' ' ? tracking * 2.5 : tracking);
  const widths = chars.map((c) => font.widthOfTextAtSize(c, size));
  let total = 0;
  chars.forEach((c, i) => {
    total += widths[i] + (i < chars.length - 1 ? gap(c) : 0);
  });
  let cursor = align === 'left' ? x : align === 'right' ? x - total : x - total / 2;
  chars.forEach((c, i) => {
    if (c !== ' ') page.drawText(c, { x: cursor, y, size, font, color });
    cursor += widths[i] + gap(c);
  });
}

function wrap(text, font, size, maxWidth, maxLines) {
  const words = encodable(font, clean(text)).split(' ').filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  if (maxLines && lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\s*\S*$/, '') + '…';
    return kept;
  }
  return lines;
}

/* ---------------- Shapes ---------------- */

// Rounded rectangle via an SVG path. pdf-lib draws SVG paths with y
// pointing DOWN from the (x, y) you pass, so (x, top) is the corner.
function roundedRect(page, x, top, w, h, r, opts) {
  const d =
    `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} ` +
    `H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
  page.drawSvgPath(d, { x, y: top, ...opts });
}

// Four-petal flower mark.
function drawFlower(page, cx, cy, scale, color) {
  const long = 9 * scale;
  const short = 4.5 * scale;
  const off = 9 * scale;
  page.drawEllipse({ x: cx, y: cy + off, xScale: short, yScale: long, color });
  page.drawEllipse({ x: cx, y: cy - off, xScale: short, yScale: long, color });
  page.drawEllipse({ x: cx + off, y: cy, xScale: long, yScale: short, color });
  page.drawEllipse({ x: cx - off, y: cy, xScale: long, yScale: short, color });
}

function money(value) {
  const n = Number(value || 0);
  return n % 1 === 0 ? '$' + n.toFixed(0) : '$' + n.toFixed(2);
}

/* ---------------- Font loading ---------------- */
async function loadFont(pdfDoc, candidates) {
  for (const name of candidates) {
    let bytes;
    try {
      bytes = await fs.readFile(path.join(process.cwd(), 'public', 'fonts', name));
    } catch {
      continue;
    }
    try {
      return await pdfDoc.embedFont(bytes, { subset: false });
    } catch {
      continue;
    }
  }
  return null;
}

/* ============================================================ */
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data: giftCard, error } = await supabase.from('gift_cards').select('*').eq('id', id).single();

    if (error || !giftCard) {
      return NextResponse.json({ error: error?.message || 'Gift card not found.' }, { status: 404 });
    }

    const requested = new URL(req.url).searchParams.get('lang');
    const lang = requested === 'es' || (!requested && giftCard.language === 'es') ? 'es' : 'en';
    const t = T[lang];

    const pdfBytes = await renderGiftCard(giftCard, t);
    const code = clean(giftCard.code) || 'gift-card';

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="' + code + '.pdf"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not generate gift card PDF.' }, { status: 500 });
  }
}

async function renderGiftCard(giftCard, t) {
  const pdfDoc = await PDFDocument.create();

  let fontkit = null;
  try {
    fontkit = (await import('@pdf-lib/fontkit')).default;
  } catch {
    // not installed — standard fonts only
  }
  if (fontkit) pdfDoc.registerFontkit(fontkit);

  const fbSerif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fbItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const customDisplay = fontkit ? await loadFont(pdfDoc, FONT_FILES.display) : null;
  const customBody = fontkit ? await loadFont(pdfDoc, FONT_FILES.body) : null;
  const customItalic = fontkit ? await loadFont(pdfDoc, FONT_FILES.bodyItalic) : null;

  const display = customDisplay || fbSerif;
  const body = customBody || fbSerif;
  const italic = customItalic || customBody || fbItalic;

  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

  /* ---- page + frame ---- */
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: C.cream });
  roundedRect(page, 30, PAGE_H - 30, PAGE_W - 60, PAGE_H - 60, 5, { borderColor: C.sand, borderWidth: 1.2 });

  let y = PAGE_H - 30 - 58;

  /* ---- mark + brand ---- */
  drawFlower(page, CX, y, 1.05, C.taupe);
  y -= 38;
  drawTracked(page, t.brandCaps, CX, y, sansBold, 9, C.taupe, 3.6, 'center');
  y -= 64;

  /* ---- the note ---- */
  const recipient = clean(giftCard.customer_name);
  const message = clean(giftCard.message);

  if (recipient) {
    drawCenter(page, t.forWord + ' ' + recipient, y, italic, 46, C.taupe);
    y -= message ? 40 : 24;
  }
  if (message) {
    const lines = wrap('“' + message + '”', body, 16.5, 370, 4);
    for (const line of lines) {
      drawCenter(page, line, y, body, 16.5, C.taupe);
      y -= 25;
    }
    y -= 4;
  }
  if (!recipient && !message) y += 40;

  /* ---- the card ---- */
  const cardW = 420;
  const cardH = 226;
  const cardX = CX - cardW / 2;
  const cardTop = y - 14;
  const cardY = cardTop - cardH; // bottom edge
  const pad = 28;
  const left = cardX + pad;
  const right = cardX + cardW - pad;

  roundedRect(page, cardX, cardTop, cardW, cardH, 14, { color: C.taupe });
  drawFlower(page, cardX + cardW - 38, cardY + 52, 2.3, mix(C.taupe, C.cream, 0.1));

  // top row
  draw(page, t.brand, left, cardTop - pad - 14, display, 17, C.cream);
  drawTracked(page, t.giftCard, right, cardTop - pad - 12, sansBold, 9.5, C.cream, 3, 'right');

  // amount
  draw(page, money(giftCard.amount), left - 3, cardY + 78, display, 84, C.cream);

  // bottom row: code chip + expiry
  const code = clean(giftCard.code);
  const codeSize = 13.5;
  const chipH = 30;
  const chipW = width(sansBold, code, codeSize) + 28;
  roundedRect(page, left, cardY + pad + chipH, chipW, chipH, 6, { color: C.cream });
  draw(page, code, left + 14, cardY + pad + 10.5, sansBold, codeSize, C.taupe);

  if (giftCard.never_expires) {
    drawTracked(page, t.neverExpires, right, cardY + pad + 11, sansBold, 9.5, C.cream, 2.2, 'right');
  }

  /* ---- redeem (pinned to the bottom) ---- */
  const footerY = 30 + 24;
  const qrSize = 74;
  const qrY = footerY + 32;
  const dividerY = qrY + qrSize + 22;
  const innerL = 30 + 48;
  const innerR = PAGE_W - 30 - 48;

  page.drawLine({
    start: { x: innerL, y: dividerY },
    end: { x: innerR, y: dividerY },
    thickness: 1,
    color: C.sand,
    dashArray: [3, 4],
  });

  const qrTarget = giftCard.gift_card_url || code;
  const qrDataUrl = await QRCode.toDataURL(qrTarget, {
    margin: 0,
    width: 300,
    color: { dark: HEX.taupe, light: HEX.cream },
  });
  const qrImage = await pdfDoc.embedPng(Buffer.from(qrDataUrl.split(',')[1], 'base64'));
  page.drawImage(qrImage, { x: innerL, y: qrY, width: qrSize, height: qrSize });

  const copyX = innerL + qrSize + 22;
  const copyW = innerR - copyX;
  let copyY = qrY + qrSize - 14;
  draw(page, t.redeemTitle, copyX, copyY, display, 16.5, C.taupe);
  copyY -= 20;
  const redeem = t.redeemBody + (giftCard.gift_card_url ? ' ' + t.scanBody : '');
  for (const line of wrap(redeem, body, 11.5, copyW, 4)) {
    draw(page, line, copyX, copyY, body, 11.5, C.taupe);
    copyY -= 16;
  }

  /* ---- footer ---- */
  drawCenter(page, giftCard.never_expires ? t.footerNever : t.footerExpires, footerY, italic, 11, C.taupe);

  return pdfDoc.save();
}
