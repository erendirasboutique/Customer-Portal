# Sezzle sidebar button + page

Adds a **Sezzle** item to the admin sidebar (directly under **Payment links**)
and the page it opens, styled with your existing Admin Studio shell.

## Files

```
components/AdminShell.js                     ← replaces yours (adds the Sezzle nav item + label + icon)
app/admin/sezzle/page.jsx                    ← NEW page the button opens
app/api/admin/create-sezzle-link/route.js    ← NEW API route the page calls
```

`AdminShell.js` is your exact file with only three additions:
- `sezzle: 'Sezzle'` added to the `T.en` and `T.es` label dictionaries
- a new `IconSezzle` icon
- one line in the `nav` array, placed right after `payment-links`

Everything else (all the CSS, layout, profile menu, shipping links) is untouched.

## Env vars (Vercel), then redeploy

```
SEZZLE_PUBLIC_KEY=sz_pub_xxxxxxxx
SEZZLE_PRIVATE_KEY=sz_prv_xxxxxxxx
SEZZLE_BASE=https://gateway.sezzle.com          # production (default). Sandbox: https://sandbox.gateway.sezzle.com
SEZZLE_PORTAL_URL=https://your-app.vercel.app   # optional
```

## Notes

- The new page passes `active="sezzle"` so the sidebar item highlights when open.
- The page uses your `eba-*` classes, so it matches the Studio look automatically.
- If you'd rather the button open something else (external URL, different page),
  change the `href` on the `sezzle` line in the `nav` array of `AdminShell.js`.
