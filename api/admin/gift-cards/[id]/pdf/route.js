import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/* ============================================================
   Erendira's Boutique — gift card PDF
   Renders on demand, so design changes hit every card at once.

   FONTS: drop the .otf/.ttf files in public/fonts/ and list the
   filenames in FONT_FILES below. Names are tried in order and the
   first one found wins; if none load, it falls back to Times and
   Helvetica so the route never breaks.

   NOTE: fonts are embedded WITHOUT subsetting. pdf-lib's subsetter
   scrambles glyph mapping on many .otf (CFF) fonts, which is what
   produced the "%&'(!)*" garbage text.

   Requires "@pdf-lib/fontkit" in package.json.
   ============================================================ */

const FONT_FILES = {
  display: ['LaLuxesSerif.otf', 'la-luxes-serif.otf', 'LaLuxes-Serif.otf', 'LaLuxesSerif.ttf', 'LaLuxesSerif-Regular.otf'],
  body: ['recoleta-regular.otf', 'Recoleta-Regular.otf', 'Recoleta.otf', 'Recoleta-Regular.ttf', 'Recoleta.ttf'],
  bodyItalic: ['Recoleta-RegularItalic.otf', 'Recoleta-Italic.otf', 'Recoleta-Italic.ttf'],
};

const COLORS = {
  bg: rgb(0.961, 0.953, 0.937),      // #F5F3EF cream
  taupe: rgb(0.502, 0.416, 0.322),   // #806a52
  sand: rgb(0.741, 0.659, 0.569),    // #bda891
  ink: rgb(0.239, 0.204, 0.157),     // #3d3428
  cream: rgb(0.961, 0.953, 0.937),   // card text
  white: rgb(1, 1, 1),
};

// Blend two colors so overlapping shapes don't show darker/lighter seams
// (semi-transparent overlapping shapes stack their opacity).
function mix(a, b, t) {
  return rgb(
    a.red + (b.red - a.red) * t,
    a.green + (b.green - a.green) * t,
    a.blue + (b.blue - a.blue) * t
  );
}

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 54;
const CONTENT_W = PAGE_W - MARGIN * 2;

/* ---------------- Copy ---------------- */
const T = {
  en: {
    giftCard: 'GIFT CARD',
    brand: "Erendira's Boutique",
    neverExpires: 'NEVER EXPIRES',
    forWord: 'For',
    redeemTitle: 'How to redeem',
    redeemBody:
      'Send a screenshot of the card above through Messenger, bring it with you in person, or enter the code at checkout when promotion codes are allowed.',
    scanBody: 'Scan the square to open this gift card online.',
    footerNever: 'This gift card never expires.',
    footerExpires: "Use before the expiration date shown by Erendira's Boutique.",
  },
  es: {
    giftCard: 'TARJETA DE REGALO',
    brand: "Erendira's Boutique",
    neverExpires: 'NUNCA VENCE',
    forWord: 'Para',
    redeemTitle: 'C\u00f3mo canjearla',
    redeemBody:
      'Manda una captura de la tarjeta de arriba por Messenger, tr\u00e1ela contigo en persona, o escribe el c\u00f3digo al pagar cuando se permitan c\u00f3digos promocionales.',
    scanBody: 'Escanea el cuadro para abrir tu tarjeta en l\u00ednea.',
    footerNever: 'Esta tarjeta de regalo nunca vence.',
    footerExpires: "\u00dasala antes de la fecha de vencimiento que indique Erendira's Boutique.",
  },
};

/* ---------------- Text helpers ---------------- */

// Strips control characters and emoji — the fonts can't encode them
// and pdf-lib throws rather than skipping.
function clean(value) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2190}-\u{21FF}]/gu, '')
    .replace(/[\u00A0\u2000-\u200A\u202F]/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}

// pdf-lib has no letter-spacing, so tracked caps are drawn one glyph at a time.
function drawTracked(page, text, y, font, size, color, opacity, tracking, centerX) {
  const chars = clean(text).split('');
  if (!chars.length) return;
  const widths = chars.map((c) => font.widthOfTextAtSize(c, size));
  const gap = (c) => (c === ' ' ? tracking * 2.5 : tracking);
  let total = 0;
  chars.forEach((c, i) => {
    total += widths[i];
    if (i < chars.length - 1) total += gap(c);
  });
  let x = (centerX == null ? PAGE_W / 2 : centerX) - total / 2;
  chars.forEach((c, i) => {
    if (c !== ' ') page.drawText(c, { x, y, size, font, color, opacity: opacity == null ? 1 : opacity });
    x += widths[i] + gap(c);
  });
}

function wrap(text, font, size, maxWidth) {
  const words = clean(text).split(' ').filter(Boolean);
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
  return lines;
}

function drawCenter(page, text, y, font, size, color, opacity, centerX) {
  const value = clean(text);
  if (!value) return;
  const cx = centerX == null ? PAGE_W / 2 : centerX;
  const w = font.widthOfTextAtSize(value, size);
  page.drawText(value, {
    x: cx - w / 2,
    y,
    size,
    font,
    color: color || COLORS.ink,
    opacity: opacity == null ? 1 : opacity,
  });
}

function drawParagraph(page, text, x, y, font, size, color, maxWidth, leading, centerX) {
  let cursor = y;
  for (const line of wrap(text, font, size, maxWidth)) {
    if (centerX != null) drawCenter(page, line, cursor, font, size, color, 1, centerX);
    else page.drawText(line, { x, y: cursor, size, font, color });
    cursor -= leading;
  }
  return cursor;
}

// Rounded pill, solid color (no opacity) so the rect/circle overlaps don't show.
function drawPill(page, x, y, w, h, color) {
  const r = h / 2;
  page.drawRectangle({ x: x + r, y, width: w - h, height: h, color });
  page.drawCircle({ x: x + r, y: y + r, size: r, color });
  page.drawCircle({ x: x + w - r, y: y + r, size: r, color });
}

// Four-petal flower mark. Solid pre-blended color so petals don't stack.
function drawFlower(page, cx, cy, scale, color) {
  const long = 9 * scale;
  const short = 4.5 * scale;
  const off = 8 * scale;
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
      // subset: false — subsetting garbles many OTF fonts
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

    const { data: giftCard, error } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !giftCard) {
      return NextResponse.json({ error: error?.message || 'Gift card not found.' }, { status: 404 });
    }

    const requested = new URL(req.url).searchParams.get('lang');
    const lang = requested === 'es' || (!requested && giftCard.language === 'es') ? 'es' : 'en';
    const t = T[lang];

    const pdfDoc = await PDFDocument.create();

    let fontkit = null;
    try {
      fontkit = (await import('@pdf-lib/fontkit')).default;
    } catch {
      // package not installed — fall through to the standard fonts
    }
    if (fontkit) pdfDoc.registerFontkit(fontkit);

    const fallbackSerif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fallbackItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const sans = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const customDisplay = fontkit ? await loadFont(pdfDoc, FONT_FILES.display) : null;
    const customBody = fontkit ? await loadFont(pdfDoc, FONT_FILES.body) : null;
    const customItalic = fontkit ? await loadFont(pdfDoc, FONT_FILES.bodyItalic) : null;

    const display = customDisplay || fallbackSerif;
    const body = customBody || fallbackSerif;
    const bodyItalic = customItalic || customBody || fallbackItalic;

    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: COLORS.bg });

    let y = PAGE_H - MARGIN;

    /* ---- logo ---- */
    let logoDrawn = false;
    try {
      const logoBytes = await fs.readFile(path.join(process.cwd(), 'public', 'logo.png'));
      const logo = await pdfDoc.embedPng(logoBytes);
      const w = 108;
      const h = (logo.height / logo.width) * w;
      page.drawImage(logo, { x: (PAGE_W - w) / 2, y: y - h, width: w, height: h });
      y -= h + 30;
      logoDrawn = true;
    } catch {
      // no logo file — the card carries the brand name anyway
    }
    if (!logoDrawn) {
      drawCenter(page, t.brand, y - 20, display, 22, COLORS.taupe);
      y -= 48;
    }

    /* ---- the card ---- */
    const cardW = CONTENT_W;
    const cardH = 300;
    const cardX = MARGIN;
    const cardY = y - cardH;

    page.drawRectangle({ x: cardX + 5, y: cardY - 6, width: cardW, height: cardH, color: COLORS.ink, opacity: 0.16 });
    page.drawRectangle({ x: cardX, y: cardY, width: cardW, height: cardH, color: COLORS.taupe });
    page.drawRectangle({
      x: cardX + 14, y: cardY + 14, width: cardW - 28, height: cardH - 28,
      borderColor: COLORS.cream, borderWidth: 1, borderOpacity: 0.45,
      borderDashArray: [4, 5],
    });
    drawFlower(page, cardX + 62, cardY + cardH - 60, 2.1, mix(COLORS.taupe, COLORS.cream, 0.16));
    drawFlower(page, cardX + cardW - 58, cardY + 56, 1.5, mix(COLORS.taupe, COLORS.cream, 0.14));

    drawCenter(page, t.brand, cardY + cardH - 56, display, 19, COLORS.cream);
    drawTracked(page, t.giftCard, cardY + cardH - 76, sans, 7, COLORS.cream, 0.7, 2.2);

    drawCenter(page, money(giftCard.amount), cardY + 132, display, 68, COLORS.cream);

    const code = clean(giftCard.code);
    const codeSize = 15;
    const codeW = sans.widthOfTextAtSize(code, codeSize) + 52;
    drawPill(page, (PAGE_W - codeW) / 2, cardY + 66, codeW, 34, mix(COLORS.taupe, COLORS.cream, 0.95));
    drawCenter(page, code, cardY + 77, sans, codeSize, COLORS.taupe);

    if (giftCard.never_expires) {
      drawTracked(page, t.neverExpires, cardY + 38, sans, 6.5, COLORS.cream, 0.55, 2);
    }

    y = cardY - 40;

    /* ---- the note ---- */
    const recipient = clean(giftCard.customer_name);
    const message = clean(giftCard.message);

    if (recipient) {
      drawCenter(page, t.forWord + ' ' + recipient, y, display, 20, COLORS.taupe);
      y -= message ? 26 : 20;
    }
    if (message) {
      y = drawParagraph(page, '\u201c' + message + '\u201d', 0, y, bodyItalic, 12.5, COLORS.ink, 380, 18, PAGE_W / 2);
      y -= 6;
    }
    if (!recipient && !message) y += 12;

    /* ---- divider ---- */
    y -= 12;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 1,
      color: COLORS.sand,
      opacity: 0.8,
      dashArray: [3, 5],
    });
    y -= 34;

    /* ---- redeem block: QR left, copy right ---- */
    const qrTarget = giftCard.gift_card_url || code;
    const qrDataUrl = await QRCode.toDataURL(qrTarget, {
      margin: 1,
      width: 300,
      color: { dark: '#3d3428', light: '#F5F3EF' },
    });
    const qrImage = await pdfDoc.embedPng(Buffer.from(qrDataUrl.split(',')[1], 'base64'));
    const qrSize = 104;
    const qrY = y - qrSize;
    page.drawImage(qrImage, { x: MARGIN, y: qrY, width: qrSize, height: qrSize });

    const copyX = MARGIN + qrSize + 26;
    const copyW = PAGE_W - MARGIN - copyX;
    let copyY = y - 14;

    page.drawText(clean(t.redeemTitle), { x: copyX, y: copyY, size: 16, font: display, color: COLORS.taupe });
    copyY -= 22;
    copyY = drawParagraph(page, t.redeemBody, copyX, copyY, body, 11, COLORS.ink, copyW, 16);
    if (giftCard.gift_card_url) {
      copyY -= 4;
      drawParagraph(page, t.scanBody, copyX, copyY, body, 11, COLORS.taupe, copyW, 16);
    }

    /* ---- footer ---- */
    drawCenter(
      page,
      giftCard.never_expires ? t.footerNever : t.footerExpires,
      MARGIN - 12,
      bodyItalic,
      10.5,
      COLORS.sand
    );

    const pdfBytes = await pdfDoc.save();

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
