// proxy.js
//
// Sends everything on live.erendirasboutique.com to the /live redirect route.
//
// This lives at the ROOT of the repo — same level as package.json and
// next.config.js. NOT inside app/.
//
// Next 16 renamed the "middleware" file convention to "proxy". Same API, same
// behavior — the file is named proxy.js and the exported function is proxy().

import { NextResponse } from 'next/server';

const LIVE_HOST = 'live.erendirasboutique.com';

export function proxy(request) {
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
