import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message || 'Could not load payment links.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, paymentLinks: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not load payment links.' }, { status: 500 });
  }
}
