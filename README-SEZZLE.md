# Sezzle integration (JavaScript / Next.js App Router)

Drop-in Sezzle Buy-Now-Pay-Later for your existing customer portal / admin repo.

## Files & where they go

```
lib/sezzle.js                                  Sezzle v2 API client
app/api/sezzle/create-checkout/route.js        Creates a checkout / payment link
app/api/sezzle/webhook/route.js                Receives + verifies payment webhooks
components/SezzlePaymentLinkPanel.jsx           Admin UI to generate a link
```

Extract the zip and drag these folders into the root of your repo on GitHub.
The paths above are relative to your project root, so the structure lines up
as-is. (GitHub's web upload keeps folder paths when you drag folders in — it
does **not** unzip a .zip for you, so extract first.)

## 1. Environment variables (Vercel → Project → Settings → Environment Variables)

```
SEZZLE_BASE_URL      = https://sandbox.gateway.sezzle.com/v2   # sandbox first
SEZZLE_PUBLIC_KEY    = <from Sezzle merchant dashboard>
SEZZLE_PRIVATE_KEY   = <from Sezzle merchant dashboard>
NEXT_PUBLIC_SITE_URL = https://my.erendirasboutique.com
```

Go live later by switching SEZZLE_BASE_URL to `https://gateway.sezzle.com/v2`
and swapping in your production keys. No code changes.

## 2. Path alias

The route files import `@/lib/sezzle`. If your repo doesn't already alias `@`
to the project root, either add it to `jsconfig.json`:

```json
{ "compilerOptions": { "paths": { "@/*": ["./*"] } } }
```

...or change the imports to a relative path (e.g. `../../../../lib/sezzle`).

## 3. Register the webhook (one time)

Send this once (from a protected admin route, or any authed request) so Sezzle
notifies you on payment events:

```
POST {SEZZLE_BASE_URL}/webhooks
Authorization: Bearer <token from /authentication>
{
  "url": "https://my.erendirasboutique.com/api/sezzle/webhook",
  "events": ["order.authorized", "order.captured", "order.refunded", "customer.tokenized"]
}
```

## 4. Use the admin panel

Render `<SezzlePaymentLinkPanel />` anywhere in your admin. Staff enter an
amount, hit generate, and get a copyable checkout link. Tick the box to have
Sezzle email/text it to the customer.

## Notes

- All amounts are in **cents**.
- A Sezzle checkout link is **single-use and expires** — not a permanent,
  reusable link like a Stripe Payment Link. Generate on demand per customer.
- The webhook re-fetches the order from Sezzle before trusting it. Always
  verify server-side; never mark paid off the browser redirect alone.
- Sezzle merchant fee is roughly 6% + $0.30 per transaction.
- To reconcile links back to real orders, pass a real `orderId` and store the
  returned `orderUuid` in Supabase (TODO markers are in the route file).
