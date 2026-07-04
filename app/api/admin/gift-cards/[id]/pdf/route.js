import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COLORS = {
  bg: rgb(0.965, 0.957, 0.945),
  card: rgb(1, 0.992, 0.976),
  primary: rgb(0.584, 0.498, 0.404),
  dark: rgb(0.33, 0.275, 0.22),
  accent: rgb(0.812, 0.741, 0.663),
  soft: rgb(0.925, 0.89, 0.85),
  muted: rgb(0.55, 0.49, 0.41),
};

function money(value) {
  return `$${Number(value || 0).toFixed(0)}`;
}

function safeText(value = '') {
  return String(value || '').replace(/[^\x20-\x7EÀ-ÿ]/g, '');
}

function centerText(page, text, y, font, size, color = COLORS.dark) {
  const w = font.widthOfTextAtSize(String(text || ''), size);
  page.drawText(String(text || ''), { x: (page.getWidth() - w) / 2, y, size, font, color });
}

async function tryFont(pdfDoc, filePath, fallback) {
  try {
    const bytes = await fs.readFile(filePath);
    return await pdfDoc.embedFont(bytes);
  } catch {
    return fallback;
  }
}

function roundRect(page, x, y, w, h, r, color, borderColor, borderWidth = 1) {
  page.drawRectangle({ x: x + r, y, width: w - r * 2, height: h, color });
  page.drawRectangle({ x, y: y + r, width: w, height: h - r * 2, color });
  page.drawCircle({ x: x + r, y: y + r, size: r, color });
  page.drawCircle({ x: x + w - r, y: y + r, size: r, color });
  page.drawCircle({ x: x + r, y: y + h - r, size: r, color });
  page.drawCircle({ x: x + w - r, y: y + h - r, size: r, color });
  if (borderColor) {
    page.drawRectangle({ x: x + r, y, width: w - r * 2, height: h, borderColor, borderWidth });
    page.drawRectangle({ x, y: y + r, width: w, height: h - r * 2, borderColor, borderWidth });
    page.drawCircle({ x: x + r, y: y + r, size: r, borderColor, borderWidth });
    page.drawCircle({ x: x + w - r, y: y + r, size: r, borderColor, borderWidth });
    page.drawCircle({ x: x + r, y: y + h - r, size: r, borderColor, borderWidth });
    page.drawCircle({ x: x + w - r, y: y + h - r, size: r, borderColor, borderWidth });
  }
}

export async function GET(_req, { params }) {
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

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([612, 792]);
    const width = page.getWidth();
    const height = page.getHeight();

    const times = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const heading = await tryFont(pdfDoc, path.join(process.cwd(), 'public/fonts/la_luxes_serif.otf'), times);
    const body = await tryFont(pdfDoc, path.join(process.cwd(), 'public/fonts/recoleta-regular.otf'), helvetica);

    const code = safeText(giftCard.code);
    const amount = money(giftCard.amount);
    const recipient = safeText(giftCard.recipient_name || giftCard.customer_name || '');
    const note = safeText(giftCard.message || giftCard.note || '');
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
    const portalUrl = giftCard.gift_card_url || `${siteUrl}/gift-card/${encodeURIComponent(giftCard.code)}`;

    page.drawRectangle({ x: 0, y: 0, width, height, color: COLORS.bg });

    try {
      const logoBytes = await fs.readFile(path.join(process.cwd(), 'public/logo2.png'));
      let logoImage;
      try { logoImage = await pdfDoc.embedPng(logoBytes); } catch { logoImage = await pdfDoc.embedJpg(logoBytes); }
      const maxW = 185, maxH = 55;
      const scale = Math.min(maxW / logoImage.width, maxH / logoImage.height);
      const logoW = logoImage.width * scale;
      const logoH = logoImage.height * scale;
      page.drawImage(logoImage, { x: (width - logoW) / 2, y: height - 82, width: logoW, height: logoH });
    } catch {
      centerText(page, "Erendira's Boutique", height - 72, helveticaBold, 18, COLORS.primary);
    }

    centerText(page, 'A Gift For You', height - 132, heading, 34, COLORS.primary);
    centerText(page, 'Redeem online or in person at Erendira’s Boutique.', height - 158, body, 12, COLORS.muted);

    const cardX = 74, cardY = 412, cardW = 464, cardH = 234;
    roundRect(page, cardX, cardY, cardW, cardH, 24, COLORS.card, COLORS.primary, 1.1);
    page.drawRectangle({ x: cardX + 22, y: cardY + 22, width: cardW - 44, height: cardH - 44, color: COLORS.card, borderColor: COLORS.accent, borderWidth: 0.65 });

    page.drawRectangle({ x: cardX + 32, y: cardY + 36, width: 170, height: cardH - 72, color: COLORS.soft });
    page.drawText("Erendira's", { x: cardX + 50, y: cardY + cardH - 70, size: 15, font: helveticaBold, color: COLORS.dark });
    page.drawText("Boutique", { x: cardX + 50, y: cardY + cardH - 90, size: 15, font: helveticaBold, color: COLORS.dark });
    page.drawText(amount, { x: cardX + 50, y: cardY + 76, size: 34, font: helveticaBold, color: COLORS.primary });
    page.drawText("E-GIFT CARD", { x: cardX + 51, y: cardY + 52, size: 8.5, font: helveticaBold, color: COLORS.muted });

    page.drawRectangle({ x: cardX + 216, y: cardY + 32, width: 22, height: cardH - 64, color: COLORS.accent });
    page.drawRectangle({ x: cardX + 208, y: cardY + 124, width: cardW - 246, height: 22, color: COLORS.accent });
    page.drawEllipse({ x: cardX + cardW - 84, y: cardY + 135, xScale: 24, yScale: 16, borderColor: COLORS.primary, borderWidth: 2 });
    page.drawEllipse({ x: cardX + cardW - 34, y: cardY + 135, xScale: 24, yScale: 16, borderColor: COLORS.primary, borderWidth: 2 });
    page.drawCircle({ x: cardX + cardW - 59, y: cardY + 135, size: 7, color: COLORS.primary });

    page.drawText('Gift', { x: cardX + 264, y: cardY + 125, size: 56, font: heading, color: COLORS.dark });
    page.drawText('Card', { x: cardX + 248, y: cardY + 76, size: 56, font: heading, color: COLORS.dark });

    if (recipient) centerText(page, `For ${recipient}`, 382, body, 13, COLORS.primary);
    if (note) centerText(page, note.length > 82 ? `${note.slice(0, 79)}...` : note, 360, body, 11, COLORS.muted);

    roundRect(page, 120, 311, 372, 46, 18, COLORS.card, COLORS.primary, 1);
    centerText(page, code, 326, body, 18, COLORS.dark);

    const qrDataUrl = await QRCode.toDataURL(portalUrl, { margin: 1, width: 220, color: { dark: '#5f4e3d', light: '#fffdf9' } });
    const qrImage = await pdfDoc.embedPng(Buffer.from(qrDataUrl.split(',')[1], 'base64'));

    roundRect(page, 241, 178, 130, 130, 14, COLORS.card, COLORS.accent, 0.8);
    page.drawImage(qrImage, { x: 253, y: 190, width: 106, height: 106 });

    centerText(page, 'How to Redeem', 145, heading, 19, COLORS.primary);

    const steps = [
      'Scan the QR code or open your private gift card page.',
      'Enter the code at checkout as a promo code.',
      'Show this gift card in person or send a screenshot through Messenger.',
    ];
    let y = 113;
    for (let i = 0; i < steps.length; i++) {
      page.drawCircle({ x: 86, y: y + 4, size: 8, color: COLORS.primary });
      centerText(page, String(i + 1), y, helveticaBold, 8, COLORS.card);
      page.drawText(steps[i], { x: 106, y, size: 11, font: body, color: COLORS.dark });
      y -= 21;
    }

    centerText(page, giftCard.never_expires === false ? 'Use before the expiration date shown by Erendira’s Boutique' : 'This gift card never expires', 34, helveticaBold, 11, COLORS.primary);

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${giftCard.code}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not generate gift card PDF.' }, { status: 500 });
  }
}
