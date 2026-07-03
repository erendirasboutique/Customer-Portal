import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req) {
  const { id, admin_notes } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing payment id.' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('payments')
    .update({ admin_notes: admin_notes || '' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
