import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) return new NextResponse('Missing code', { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: giftCard, error } = await supabase
    .from('gift_cards')
    .select('id')
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (error || !giftCard) return new NextResponse('Gift card not found', { status: 404 });

  return NextResponse.redirect(new URL(`/api/admin/gift-cards/${giftCard.id}/pdf`, url.origin));
}
