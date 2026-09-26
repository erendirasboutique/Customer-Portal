import { NextResponse } from 'next/server';
import { isTestMode, isUnlocked, maxChargeCents, publishableKey, setupProblem } from '@/lib/stripeTerminal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Tells the Stripe terminal page whether it's unlocked, and (once unlocked)
// the publishable key it needs to draw Stripe's secure card fields.
export async function GET(req) {
  const problem = setupProblem();
  if (problem) return NextResponse.json({ error: problem }, { status: 500 });

  if (!isUnlocked(req)) return NextResponse.json({ unlocked: false });

  return NextResponse.json({
    unlocked: true,
    testMode: isTestMode(),
    publishableKey: publishableKey(),
    maxDollars: maxChargeCents() / 100,
  });
}
