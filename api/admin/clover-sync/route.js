import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function baseUrl() {
  return process.env.CLOVER_ENV === 'sandbox'
    ? 'https://sandbox.dev.clover.com'
    : 'https://api.clover.com';
}

export async function POST() {
  try {
    const token = process.env.CLOVER_API_TOKEN;
    const merchantId = process.env.CLOVER_MERCHANT_ID;

    if (!token || !merchantId) {
      return NextResponse.json({ error: 'Missing CLOVER_API_TOKEN or CLOVER_MERCHANT_ID.' }, { status: 500 });
    }

    const url = `${baseUrl()}/v3/merchants/${merchantId}/payments?expand=cardTransaction,tender,order&limit=100`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'Could not fetch Clover payments.', details: data }, { status: response.status });
    }

    const rows = (data.elements || []).map((payment) => ({
      payment_source: 'clover',
      clover_payment_id: payment.id,
      clover_order_id: payment.order?.id || null,
      clover_merchant_id: merchantId,
      clover_tender: payment.tender?.label || payment.tender?.id || null,
      customer_name: payment.order?.title || 'Clover Customer',
      customer_email: '',
      customer_phone: '',
      amount_total: Number(payment.amount || 0) / 100,
      currency: 'usd',
      payment_status: payment.result === 'SUCCESS' ? 'paid' : (payment.result || 'unknown'),
      refund_status: 'none',
      payment_method: payment.cardTransaction?.cardType || payment.tender?.label || 'clover',
      payment_method_last4: payment.cardTransaction?.last4 || null,
      description: 'Clover payment',
      raw: payment,
      created_at: payment.createdTime ? new Date(payment.createdTime).toISOString() : new Date().toISOString(),
    }));

    if (rows.length) {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from('payments').upsert(rows, { onConflict: 'clover_payment_id' });
      if (error) return NextResponse.json({ error: 'Clover fetched, but Supabase did not save.', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, imported: rows.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
