
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { giftCardHtml } from '@/lib/giftCardPdf';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new NextResponse('Missing code', { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: giftCard, error } = await supabase
    .from('gift_cards')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (error || !giftCard) {
    return new NextResponse('Gift card not found', { status: 404 });
  }

  return new NextResponse(giftCardHtml(giftCard), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
