/* ============================================================
   Admin Studio service worker (registered with scope /admin/).
   Always goes to the network, so you never see stale payments or
   an old page. It only steps in when the phone is offline, to show
   a friendly "you're offline" screen instead of the browser error.
   ============================================================ */

const OFFLINE_HTML = '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<meta name="theme-color" content="#fdfcf7"><title>Offline · EB Studio</title>' +
  '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fdfcf7;' +
  'color:#da5e16;font-family:Recoleta,Georgia,serif;text-align:center;padding:24px}' +
  '.c{max-width:340px;background:#fff;border-radius:28px;padding:32px 24px;box-shadow:0 14px 40px rgba(218,94,22,.08)}' +
  'h1{margin:0 0 10px;font-weight:400;font-size:30px}p{margin:0 0 20px;font-size:14px;line-height:1.5}' +
  'button{border:0;border-radius:999px;background:#eda033;color:#fff;padding:13px 22px;font:inherit;font-size:14px}</style></head>' +
  '<body><div class="c"><h1>You’re offline</h1><p>Admin Studio needs internet to load your payments and orders. ' +
  'Check your connection and try again.</p><button onclick="location.reload()">Try again</button></div></body></html>';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET' || req.mode !== 'navigate') return;
  event.respondWith(
    fetch(req).catch(function () {
      return new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    })
  );
});
