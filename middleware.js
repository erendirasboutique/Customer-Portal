// middleware.js
//
// Sends everything on live.erendirasboutique.com to the /live redirect route.
//
// This lives at the ROOT of the repo — same level as package.json and
// next.config.js. NOT inside app/.
//
// Why this instead of a next.config rewrite: middleware runs before routing, so
// it always wins. A next.config rewrite in the default `afterFiles` position only
// runs when no page matched — and "/" always matches the homepage, so it never
// fired. This has no such trap.

import { NextResponse } from 'next/server';

const LIVE_HOST = 'live.erendirasboutique.com';

export function middleware(request) {
  // Strip the port, if any — localhost testing sends host:3000.
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();

  if (host === LIVE_HOST) {
    const url = request.nextUrl.clone();
    url.pathname = '/live';
    url.search = '';
    return NextResponse.rewrite(url);
  }

  // Every other host — my.erendirasboutique.com and friends — passes through
  // untouched.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
