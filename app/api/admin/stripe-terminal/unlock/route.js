import { NextResponse } from 'next/server';
import { makeSessionCookie, passcodeMatches, COOKIE_NAME } from '@/lib/stripeTerminal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function wait(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

// POST { passcode } -> unlocks the Stripe terminal on this device for 12 hours.
export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch (e) { /* empty */ }

  if (!passcodeMatches(body.passcode)) {
    await wait(1500); // slows down guessing
    return NextResponse.json({ error: 'Wrong passcode.' }, { status: 401 });
  }

  const cookie = makeSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}

// DELETE -> locks the Stripe terminal on this device.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return res;
}
