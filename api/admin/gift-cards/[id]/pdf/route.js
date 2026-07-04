import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COLORS = {
  bg: rgb(0.965, 0.957, 0.945),
  primary: rgb(0.584, 0.498, 0.404),
  accent: rgb(0.812, 0.741, 0.663),
  text: rgb(0.25, 0.22, 0.19),
  white: rgb(1, 0.992, 0.976),
};

function drawCenteredText(page, text, y, font, size, color = COLORS.text) {
  const width = page.getWidth();
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
}

function money(value) {
  return `$${Number(value || 0).toFixed(0)}`;
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
    const sans = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const sansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawRectangle({ x: 0, y: 0, width, height, color: COLORS.bg });

    // Top logo pill
    page.drawRectangle({ x: 46, y: height - 96, width: width - 92, height: 58, color: COLORS.white, borderColor: COLORS.primary, borderWidth: 1, borderOpacity: 0.65 });

    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const logoBytes = await fs.readFile(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const logoDims = logoImage.scale(0.13);
      page.drawImage(logoImage, { x: (width - logoDims.width) / 2, y: height - 86, width: logoDims.width, height: logoDims.height });
    } catch {
      drawCenteredText(page, "Erendira's Boutique", height - 74, sansBold, 18, COLORS.primary);
    }

    drawCenteredText(page, "Here's your e-gift card!", height - 142, serif, 24, COLORS.text);

    // Gift card illustration
    const cardX = 140;
    const cardY = height - 355;
    const cardW = 332;
    const cardH = 188;
    page.drawRectangle({ x: cardX, y: cardY, width: cardW, height: cardH, color: COLORS.white, borderColor: COLORS.accent, borderWidth: 0.8 });
    page.drawText("Erendira's Boutique", { x: cardX + 28, y: cardY + cardH - 35, size: 14, font: sansBold, color: COLORS.text });
    page.drawText(money(giftCard.amount), { x: cardX + 28, y: cardY + cardH - 76, size: 26, font: sansBold, color: COLORS.text });
    page.drawRectangle({ x: cardX + 100, y: cardY + cardH - 72, width: 142, height: 20, color: COLORS.accent });
    page.drawRectangle({ x: cardX + cardW - 58, y: cardY, width: 22, height: cardH, color: COLORS.accent });
    page.drawText('Gift', { x: cardX + 118, y: cardY + 78, size: 50, font: serif, color: COLORS.text });
    page.drawText('Card', { x: cardX + 104, y: cardY + 35, size: 50, font: serif, color: COLORS.text });

    // Code pill
    page.drawRectangle({ x: 110, y: height - 420, width: width - 220, height: 46, color: COLORS.white, borderColor: COLORS.primary, borderWidth: 1 });
    drawCenteredText(page, giftCard.code, height - 405, sans, 20, COLORS.text);

    // QR code
    const qrPayload = `${giftCard.code}\nRedeem at checkout or send a screenshot to Erendira's Boutique.`;
    const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 180 });
    const qrBase64 = qrDataUrl.split(',')[1];
    const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'));
    page.drawImage(qrImage, { x: (width - 142) / 2, y: height - 590, width: 142, height: 142 });

    drawCenteredText(page, 'How to Redeem Your Gift Card', height - 642, serifBold, 15, COLORS.text);

    const instructions = [
      'To redeem your gift card, simply send a',
      'screenshot or photo of this gift card through',
      'Messenger, bring it with you in person, or use',
      'the code at checkout when promotion codes are allowed.',
    ];

    let y = height - 680;
    for (const line of instructions) {
      drawCenteredText(page, line, y, serif, 15, COLORS.text);
      y -= 19;
    }

    drawCenteredText(page, giftCard.never_expires ? 'This gift card never expires' : 'Use before expiration date shown by Erendira\'s Boutique', 44, serifBold, 14, COLORS.text);

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
