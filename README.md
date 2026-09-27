# Gift card shop · Live schedule · Admin Studio app

Three features. Everything is a **new file**, except `components/AdminShell.js`,
which is your current one with the new links added. Replace it with this one.

## What's in the zip

**Online gift card shop**
| File | What it is |
|---|---|
| `app/buy-gift-card/page.js` | Public shop: **/buy-gift-card** |
| `app/buy-gift-card/thank-you/page.js` | After payment: shows the card, code and PDF |
| `app/admin/gift-card-sales/page.js` | Admin: every online sale, with Retry / Resend |
| `app/api/gift-card-shop/checkout/route.js` | Starts Stripe Checkout |
| `app/api/gift-card-shop/webhook/route.js` | Stripe tells us the payment went through |
| `app/api/cron/gift-card-deliveries/route.js` | Daily: emails cards scheduled for today |
| `app/api/admin/gift-card-sales/route.js` | Retry / Resend buttons |
| `components/shop/*` | The page layouts |
| `lib/shop/gift-card-shop.js` | Making the card, emails, safety checks |
| `lib/shop/service.js` | Supabase, Stripe, email helpers |

**Live schedule**
| File | What it is |
|---|---|
| `app/live-schedule/page.js` | Public page: **/live-schedule** |
| `app/admin/live-schedule/page.js` | Admin: add, edit, hide, repeat weekly |
| `app/api/admin/live-schedule/route.js` | Saves lives |
| `components/live/*` | The page layouts |

**Admin Studio app (home screen)**
| File | What it is |
|---|---|
| `app/studio.webmanifest/route.js` | Tells phones the app's name, icon and colors |
| `public/studio-sw.js` | Shows a friendly "offline" screen when there's no internet |
| `public/studio-icons/*` | App icons (swap in your own anytime, same file names) |
| `components/AdminShell.js` | **Replaces yours**: new nav links + app setup |

`supabase/shop-and-live.sql` creates the two new tables.

---

## Setup

### 1. Run the SQL
Supabase → SQL Editor → paste `supabase/shop-and-live.sql` → Run.

### 2. Stripe webhook (so cards get made even if the buyer closes the tab)
Stripe → Developers → Webhooks → **Add endpoint**
- URL: `https://YOUR-SITE/api/gift-card-shop/webhook`
- Event: `checkout.session.completed`

Copy its **Signing secret** (`whsec_...`) into Vercel as `STRIPE_GIFT_CARD_WEBHOOK_SECRET`.
Do this in **test mode first**, then again in live mode (they have different secrets).

### 3. Vercel environment variables
| Variable | Needed? | What it's for |
|---|---|---|
| `STRIPE_SECRET_KEY` | already have | Payments |
| `SUPABASE_SERVICE_ROLE_KEY` | already have (from Account pages) | Database |
| `NEXT_PUBLIC_SITE_URL` | already have | Links in emails and PDFs |
| `STRIPE_GIFT_CARD_WEBHOOK_SECRET` | **new, required** | Step 2 |
| `RESEND_API_KEY` | optional | Emails the cards (resend.com, free tier is plenty) |
| `GIFT_CARD_FROM_EMAIL` | optional, with Resend | e.g. `Erendira's Boutique <giftcards@erendirasboutique.com>` (domain must be verified in Resend) |
| `GIFT_CARD_REPLY_TO` | optional | Where customer replies go |
| `GIFT_CARD_ALERT_EMAIL` | optional | Emails you if a paid card fails to be created |
| `CRON_SECRET` | optional, for scheduled delivery | Any long random text |

**Without Resend** the shop still works: the buyer sees the card, code and PDF on
the thank-you page and passes it along themselves. The "send it on a date" option
only appears once email is set up.

Redeploy after adding variables.

### 4. Scheduled delivery (only if you set up Resend)
Add this to your `vercel.json` (create the file at the project root if you don't have one;
if you do, add the `crons` part to it):
```json
{
  "crons": [
    { "path": "/api/cron/gift-card-deliveries", "schedule": "5 15 * * *" }
  ]
}
```
That runs every day at 8:05am Pacific.

### 5. If you have a `middleware.js` that makes people sign in
Let these through without signing in:
`/buy-gift-card`, `/live-schedule`, `/api/gift-card-shop`, `/studio.webmanifest`,
`/studio-sw.js`, `/studio-icons`, and `/gift-card-balance`.
Keep `/api/cron/...` open too (it checks `CRON_SECRET` itself).

### 6. Replace `components/AdminShell.js`
Two new sidebar links (Gift card sales, Live schedule) and the home-screen app setup.
Nothing else changed.

---

## Test it (Stripe test mode)
1. Open `/buy-gift-card`, pick $25, pay with card `4242 4242 4242 4242`, any future date, any CVC.
2. The thank-you page shows the code and PDF.
3. The card appears on **Gift cards** and the sale on **Gift card sales**.
4. Use the code on one of your payment links: it takes $25 off.

## Put the admin on your phone
Open your admin on your phone and sign in, then:
- **iPhone (Safari):** Share button → **Add to Home Screen**.
- **Android (Chrome):** ⋮ menu → **Install app** (or Add to Home screen).

It opens full screen with the EB Studio icon, like a regular app.

---

## Good to know
- **One card per payment, always.** The webhook and the thank-you page can both run at
  once; only one makes the card. If something fails after payment, the order shows
  **Needs retry** on Gift card sales. Press Retry and it double-checks with Stripe first.
- **Online cards work like your admin ones:** a Stripe promo code, one use, worth the
  full amount. They show on your Gift cards page and work with Mark redeemed,
  Deactivate and the balance page.
- **The PDF link must stay public.** Customers open `/api/admin/gift-cards/[id]/pdf`.
  If you add a sign-in check to that route later, customers can't download their card.
- **Your dashboard ledger** may also record these payments if your main Stripe webhook
  logs every checkout. That's expected; they're real sales.
- **Amounts:** $25–$200 buttons, or any whole dollar from $10 to $500. Change `SHOP`
  at the top of `lib/shop/gift-card-shop.js`.
- **Live times** are typed in your phone or computer's time zone. Customers see them
  in their own time zone.
- GitHub doesn't unzip uploads. Extract first, then drag the folders in.
