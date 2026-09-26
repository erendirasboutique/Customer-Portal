import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function GET() {
  const db = supabaseAdmin();
  if (!db) return Response.json({ links: [] });
  const { data, error } = await db
    .from('sezzle_links')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return Response.json({ error: error.message, links: [] }, { status: 500 });
  return Response.json({ links: data || [] });
}
