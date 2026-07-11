import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COLORS = {
  bg: rgb(0.961, 0.953, 0.937),      // #F5F3EF page background
  primary: rgb(0.502, 0.416, 0.322),  // #806a52 taupe
  deep: rgb(0.29, 0.24, 0.19),        // shadow brown
  text: rgb(0.2, 0.169, 0.137),       // #332b23 ink
  cream: rgb(0.949, 0.929, 0.894),    // #f2ede4 card text
  white: rgb(1, 1, 1),
};

function drawCenteredText(page, text, y, font, size, color, opacity) {
  const width = page.getWidth();
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (width - textWidth) / 2,
    y: y,
    size: size,
    font: font,
    color: color || COLORS.text,
    opacity: opacity == null ? 1 : opacity,
  });
}

function drawCardCentered(page, text, cardX, cardW, y, font, size, color, opacity) {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: cardX + (cardW - textWidth) / 2,
    y: y,
    size: size,
    font: font,
    color: color,
    opacity: opacity == null ? 1 : opacity,
  });
}

// Four-petal flower mark built from ellipses (matches the portal card art).
function drawFlower(page, cx, cy, scale, color, opacity) {
  const petalLong = 9 * scale;
  const petalShort = 4.5 * scale;
  const offset = 8 * scale;
  page.drawEllipse({ x: cx, y: cy + offset, xScale: petalShort, yScale: petalLong, color: color, opacity: opacity });
  page.drawEllipse({ x: cx, y: cy - offset, xScale: petalShort, yScale: petalLong, color: color, opacity: opacity });
  page.drawEllipse({ x: cx + offset, y: cy, xScale: petalLong, yScale: petalShort, color: color, opacity: opacity });
  page.drawEllipse({ x: cx - offset, y: cy, xScale: petalLong, yScale: petalShort, color: color, opacity: opacity });
  page.drawEllipse({ x: cx, y: cy, xScale: 3.5 * scale, yScale: 3.5 * scale, color: color, opacity: opacity });
}

function money(value) {
  const n = Number(value || 0);
  return n % 1 === 0 ? '$' + n.toFixed(0) : '$' + n.toFixed(2);
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
    const page = pdfDoc.addPage([612, 792]);
    const width = page.getWidth();
    const height = page.getHeight();

    const serif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const serifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const serifItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const sans = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const sansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawRectangle({ x: 0, y: 0, width: width, height: height, color: COLORS.bg });

    // Top logo pill
    page.drawRectangle({
      x: 46, y: height - 96, width: width - 92, height: 58,
      color: COLORS.white, borderColor: COLORS.primary, borderWidth: 1, borderOpacity: 0.65,
    });

    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const logoBytes = await fs.readFile(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const logoDims = logoImage.scale(0.13);
      page.drawImage(logoImage, {
        x: (width - logoDims.width) / 2,
        y: height - 86,
        width: logoDims.width,
        height: logoDims.height,
      });
    } catch {
      drawCenteredText(page, "Erendira's Boutique", height - 74, sansBold, 18, COLORS.primary);
    }

    drawCenteredText(page, "Here's your e-gift card!", height - 142, serif, 24, COLORS.text);

    // ---- Gift card art (matches the portal card) ----
    const cardW = 340;
    const cardH = 212;
    const cardX = (width - cardW) / 2;
    const cardY = height - 380;

    // soft drop shadow
    page.drawRectangle({
      x: cardX + 5, y: cardY - 7, width: cardW, height: cardH,
      color: COLORS.deep, opacity: 0.22,
    });
    // taupe card
    page.drawRectangle({ x: cardX, y: cardY, width: cardW, height: cardH, color: COLORS.primary });
    // dashed cream inner frame
    page.drawRectangle({
      x: cardX + 12, y: cardY + 12, width: cardW - 24, height: cardH - 24,
      borderColor: COLORS.cream, borderWidth: 1, borderOpacity: 0.6,
      borderDashArray: [4, 4],
    });
    // corner flowers
    drawFlower(page, cardX + 42, cardY + cardH - 42, 1, COLORS.cream, 0.3);
    drawFlower(page, cardX + cardW - 42, cardY + 42, 1, COLORS.cream, 0.3);
    // card text
    drawCardCentered(page, "Erendira's Boutique", cardX, cardW, cardY + cardH - 62, serif, 17, COLORS.cream);
    drawCardCentered(page, 'G I F T   C A R D', cardX, cardW, cardY + cardH - 80, sans, 8, COLORS.cream, 0.8);
    drawCardCentered(page, money(giftCard.amount), cardX, cardW, cardY + 76, serifBold, 48, COLORS.cream);
    drawCardCentered(page, 'N E V E R   E X P I R E S', cardX, cardW, cardY + 34, sans, 7, COLORS.cream, 0.6);

    // Code pill
    page.drawRectangle({
      x: 110, y: height - 448, width: width - 220, height: 46,
      color: COLORS.white, borderColor: COLORS.primary, borderWidth: 1,
    });
    drawCenteredText(page, giftCard.code, height - 433, sans, 20, COLORS.text);

    // QR code
    const qrPayload = giftCard.code + '\n' + "Redeem at checkout or send a screenshot to Erendira's Boutique.";
    const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 180 });
    const qrBase64 = qrDataUrl.split(',')[1];
    const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'));
    page.drawImage(qrImage, { x: (width - 142) / 2, y: height - 612, width: 142, height: 142 });

    drawCenteredText(page, 'How to Redeem Your Gift Card', height - 660, serifBold, 15, COLORS.text);

    const instructions = [
      'To redeem your gift card, simply send a',
      'screenshot or photo of this gift card through',
      'Messenger, bring it with you in person, or use',
      'the code at checkout when promotion codes are allowed.',
    ];

    let y = height - 696;
    for (const line of instructions) {
      drawCenteredText(page, line, y, serif, 14, COLORS.text);
      y -= 18;
    }

    drawCenteredText(
      page,
      giftCard.never_expires
        ? 'This gift card never expires'
        : "Use before expiration date shown by Erendira's Boutique",
      36,
      serifItalic,
      13,
      COLORS.primary
    );

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="' + giftCard.code + '.pdf"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not generate gift card PDF.' }, { status: 500 });
  }
}
