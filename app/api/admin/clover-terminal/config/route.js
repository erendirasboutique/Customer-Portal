import { NextResponse } from 'next/server';
import { cloverUrls, isSandbox, isUnlocked, missingEnv, maxChargeCents } from '@/lib/cloverTerminal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Tells the terminal page whether it's unlocked, and (only once unlocked)
// the public Clover settings it needs to draw the secure card fields.
export async function GET(req) {
  const missing = missingEnv();
  if (missing.length) {
    return NextResponse.json({ error: 'Missing in Vercel settings: ' + missing.join(', ') }, { status: 500 });
  }

  if (!isUnlocked(req)) {
    return NextResponse.json({ unlocked: false });
  }

  return NextResponse.json({
    unlocked: true,
    sandbox: isSandbox(),
    sdkUrl: cloverUrls().sdk,
    publicKey: process.env.CLOVER_ECOMM_PUBLIC_KEY,
    merchantId: process.env.CLOVER_MERCHANT_ID,
    maxDollars: maxChargeCents() / 100,
  });
}
