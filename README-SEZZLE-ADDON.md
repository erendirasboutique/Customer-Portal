# Sezzle add-on for your Stripe payment-links repo

Adds a **Stripe / Sezzle** toggle to your existing payment-links page. It
defaults to Stripe and behaves exactly as before; click **Sezzle** and the
same form generates a Sezzle checkout link instead. Nothing about your Stripe
flow, DB, or saved-links list changes.

## Files — nothing here overwrites an existing file

Unzipping this at your repo root is safe: neither file overlaps what you already
have.

```
app/admin/payment-links/page.sezzle.jsx     ← NEW filename — your existing page.jsx is untouched
app/api/admin/create-sezzle-link/route.js   ← NEW route (Sezzle equivalent of create-payment-link)
```

- `page.sezzle.jsx` is the full merged page. Diff it against your current
  `page.jsx`, and when you're happy, either rename it to `page.jsx` (replacing
  yours) or copy the `// SEZZLE ADD-ON` marked lines into your file. Every change
  is tagged with that comment.
- `create-sezzle-link/` is a brand-new route folder, so it just adds alongside
  your existing `create-payment-link` and `update-payment-link` routes.

## Environment variables (add in Vercel, then redeploy)

```
SEZZLE_PUBLIC_KEY=sz_pub_xxxxxxxx
SEZZLE_PRIVATE_KEY=sz_prv_xxxxxxxx
SEZZLE_BASE=https://gateway.sezzle.com          # production (default). Sandbox: https://sandbox.gateway.sezzle.com
SEZZLE_PORTAL_URL=https://your-app.vercel.app   # optional fallback redirect
```

Your existing Stripe env vars stay as they are.

## How it works

- The toggle sets `processor` state (`'stripe'` default | `'sezzle'`).
- On submit, Stripe posts to your existing `/api/admin/create-payment-link`
  (unchanged); Sezzle posts to the new `/api/admin/create-sezzle-link`, which
  authenticates to Sezzle and creates a `POST /v2/session`, returning `{ url }`.
- The generated link shows in the same preview panel with Copy / Open.
- Because the new route lives under `/api/admin/`, it's covered by whatever
  admin auth already protects that path.

## Notes / differences (Stripe vs Sezzle)

- **Fixed amount only.** Sezzle has no "customer chooses amount", so that panel
  is hidden in Sezzle mode.
- **Checkout collection.** Sezzle collects name, phone, and billing on its own
  checkout, so those checkboxes are disabled in Sezzle mode; "Collect shipping
  address" maps to Sezzle's `requires_shipping_info`.
- **Saved Links tab.** That list reads from your Stripe DB
  (`/api/admin/payment-links`), so Sezzle links aren't listed there yet. If you
  want Sezzle links saved too, add a `processor` column to your table and INSERT
  from `create-sezzle-link/route.js` after a successful create (say the word and
  I'll wire it to your exact DB layer).
- **Editing** applies to Stripe links only (Sezzle links can't be edited after
  creation); the builder switches back to Stripe mode when you click Edit.
