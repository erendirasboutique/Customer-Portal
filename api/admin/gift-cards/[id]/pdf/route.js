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
  bg: rgb(0.965, 0.957, 0.945),      // #f6f4f1
  primary: rgb(0.584, 0.498, 0.404), // #957f67
  accent: rgb(0.812, 0.741, 0.663),  // #cfbda9
  text: rgb(0.31, 0.26, 0.21),
  muted: rgb(0.55, 0.49, 0.41),
  white: rgb(1, 0.992, 0.976),
};

function money(value) {
  return `$${Number(value || 0).toFixed(0)}`;
}

function drawCenteredText(page, text, y, font, size, color = COLORS.text) {
  const width = page.getWidth();
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(String(text || ''), {
    x: (width - textWidth) / 2,
    y,
    size,
    font,
    color,
  });
}

function safeText(value = '') {
  return String(value || '').replace(/[^\x20-\x7EÀ-ÿ]/g, '');
}

async function tryEmbedFont(pdfDoc, fontPath, fallbackFont) {
  try {
    const fontBytes = await fs.readFile(fontPath);
    return await pdfDoc.embedFont(fontBytes);
  } catch {
    return fallbackFont;
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
      return NextResponse.json(
        { error: error?.message || 'Gift card not found.' },
        { status: 404 }
      );
    }

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([612, 792]);
    const width = page.getWidth();
    const height = page.getHeight();

    const fallbackSerif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fallbackSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const fallbackSans = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fallbackSansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const headingFont = await tryEmbedFont(
      pdfDoc,
      path.join(process.cwd(), 'public', 'fonts', 'la_luxes_serif.otf'),
      fallbackSerif
    );

    const bodyFont = await tryEmbedFont(
      pdfDoc,
      path.join(process.cwd(), 'public', 'fonts', 'recoleta-regular.otf'),
      fallbackSans
    );

    const bodyBold = fallbackSansBold;
    const headingBold = fallbackSerifBold;

    const amount = money(giftCard.amount);
    const code = safeText(giftCard.code);
    const recipientName = safeText(
      giftCard.recipient_name || giftCard.customer_name || giftCard.customerName || ''
    );
    const note = safeText(giftCard.note || giftCard.message || '');

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
    const portalUrl =
      giftCard.gift_card_url ||
      `${siteUrl}/gift-card/${encodeURIComponent(giftCard.code)}`;

    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: COLORS.bg,
    });

    page.drawRectangle({
      x: 42,
      y: height - 94,
      width: width - 84,
      height: 60,
      color: COLORS.white,
      borderColor: COLORS.primary,
      borderWidth: 1,
      borderOpacity: 0.8,
    });

    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo2.png');
      const logoBytes = await fs.readFile(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const maxLogoW = 190;
      const maxLogoH = 42;
      const scale = Math.min(maxLogoW / logoImage.width, maxLogoH / logoImage.height);
      const logoW = logoImage.width * scale;
      const logoH = logoImage.height * scale;

      page.drawImage(logoImage, {
        x: (width - logoW) / 2,
        y: height - 84,
        width: logoW,
        height: logoH,
      });
    } catch {
      drawCenteredText(page, "Erendira's Boutique", height - 74, bodyBold, 18, COLORS.primary);
    }

    drawCenteredText(page, "Here’s your e-gift card", height - 140, headingFont, 28, COLORS.primary);

    if (recipientName) {
      drawCenteredText(page, `For ${recipientName}`, height - 166, bodyFont, 13, COLORS.muted);
    }

    if (note) {
      drawCenteredText(page, note.slice(0, 70), height - 188, bodyFont, 12, COLORS.muted);
    }

    const cardX = 106;
    const cardY = height - 392;
    const cardW = 400;
    const cardH = 230;

    page.drawRectangle({
      x: cardX,
      y: cardY,
      width: cardW,
      height: cardH,
      color: COLORS.white,
      borderColor: COLORS.primary,
      borderWidth: 1.4,
    });

    page.drawRectangle({
      x: cardX + 14,
      y: cardY + 14,
      width: cardW - 28,
      height: cardH - 28,
      borderColor: COLORS.accent,
      borderWidth: 0.8,
    });

    page.drawRectangle({
      x: cardX + cardW - 112,
      y: cardY,
      width: 36,
      height: cardH,
      color: COLORS.accent,
    });

    page.drawRectangle({
      x: cardX + cardW - 190,
      y: cardY + cardH - 96,
      width: 190,
      height: 36,
      color: COLORS.accent,
    });

    page.drawEllipse({
      x: cardX + cardW - 112,
      y: cardY + cardH - 100,
      xScale: 30,
      yScale: 20,
      borderColor: COLORS.primary,
      borderWidth: 3,
    });

    page.drawEllipse({
      x: cardX + cardW - 42,
      y: cardY + cardH - 100,
      xScale: 30,
      yScale: 20,
      borderColor: COLORS.primary,
      borderWidth: 3,
    });

    page.drawText("Erendira's Boutique", {
      x: cardX + 34,
      y: cardY + cardH - 42,
      size: 14,
      font: bodyBold,
      color: COLORS.text,
    });

    page.drawText(amount, {
      x: cardX + 34,
      y: cardY + cardH - 84,
      size: 30,
      font: bodyBold,
      color: COLORS.primary,
    });

    page.drawText('Gift', {
      x: cardX + 142,
      y: cardY + 94,
      size: 56,
      font: headingFont,
      color: COLORS.text,
    });

    page.drawText('Card', {
      x: cardX + 130,
      y: cardY + 48,
      size: 56,
      font: headingFont,
      color: COLORS.text,
    });

    page.drawRectangle({
      x: 96,
      y: height - 452,
      width: width - 192,
      height: 48,
      color: COLORS.white,
      borderColor: COLORS.primary,
      borderWidth: 1.1,
    });

    drawCenteredText(page, code, height - 434, bodyFont, 20, COLORS.text);

    const qrPayload = portalUrl || `${code}\nRedeem at checkout or show this gift card.`;

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 220,
      color: {
        dark: '#5f4e3d',
        light: '#fffdf9',
      },
    });

    const qrBase64 = qrDataUrl.split(',')[1];
    const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'));

    page.drawRectangle({
      x: (width - 158) / 2,
      y: height - 624,
      width: 158,
      height: 158,
      color: COLORS.white,
      borderColor: COLORS.accent,
      borderWidth: 1,
    });

    page.drawImage(qrImage, {
      x: (width - 142) / 2,
      y: height - 616,
      width: 142,
      height: 142,
    });

    drawCenteredText(page, 'How to Redeem', height - 662, headingFont, 19, COLORS.primary);

    const instructions = [
      'Scan the QR code or open your private gift card page.',
      'Enter this code at checkout as a promo code.',
      'You may also show this gift card in person or send a screenshot through Messenger.',
    ];

    let y = height - 696;
    for (let i = 0; i < instructions.length; i++) {
      page.drawText(`${i + 1}.`, {
        x: 104,
        y,
        size: 12,
        font: bodyBold,
        color: COLORS.primary,
      });

      page.drawText(instructions[i], {
        x: 128,
        y,
        size: 12,
        font: bodyFont,
        color: COLORS.text,
      });

      y -= 21;
    }

    drawCenteredText(
      page,
      giftCard.never_expires === false
        ? 'Use before the expiration date shown by Erendira’s Boutique'
        : 'This gift card never expires',
      46,
      bodyBold,
      13,
      COLORS.primary
    );

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${giftCard.code}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Could not generate gift card PDF.' },
      { status: 500 }
    );
  }
}
