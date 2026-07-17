import { NextResponse } from 'next/server';
import { getBasketTotals } from '@/lib/live/queries';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  try {
    const { saleId } = await params;
    return NextResponse.json({ baskets: await getBasketTotals(saleId) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
