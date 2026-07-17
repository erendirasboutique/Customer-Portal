# Live Sale module — Erendira's Boutique (JavaScript)

Adds Wednesday/Thursday live sale tracking to the customer portal admin, and puts each customer's basket into the portal they already have.

**Plain JavaScript.** JSX in `.js` files, matching `components/AdminDashboard.js`. No TypeScript, no build changes. Type hints are JSDoc in `lib/live/types.js`, so editors still autocomplete but nothing compiles.

---

## What you get

| Screen | Path | Job |
|---|---|---|
| Live sales | `/admin/live` | Start a sale, see the week at a glance |
| Catalog | `/admin/live/{id}/catalog` | Load the rack **before** the live |
| Run live | `/admin/live/{id}/claims` | Basket # + tag code, ~2 seconds a claim |
| Baskets | `/admin/live/{id}/baskets` | Match customers, finalize, copy the message |
| Customer basket | your existing `/portal/{token}` | Photos, total, Pay button, EN/ES |

---

## Install — 6 steps, all browser

### 1. Run the migration

Supabase dashboard → **SQL Editor** → paste `supabase/migrations/20260716000000_live_sales.sql` → Run.

Safe to re-run. Creates `live_sales`, `live_items`, `baskets`, `basket_items`, two views, RLS locked to service role.

> **If your billing portal and shipping portal use different Supabase projects,** run this in whichever one holds `customers` and `portal_token`. The module reads customers directly, so it has to live in the same database as them.

### 2. Drop the files in

Upload via the GitHub web UI, keeping paths:

```
supabase/migrations/20260716000000_live_sales.sql
lib/live/types.js            lib/live/messages.js
lib/live/supabase.js         lib/live/money.js
lib/live/queries.js
styles/live.css
components/live/*.js         (7 files)
app/admin/live/**            (4 pages)
app/api/live/**              (10 routes)
```

**Don't** upload `app/portal-basket-example/` — that's a reference file, see step 5.

### 3. Check the dependencies

`package.json` needs `stripe` and `@supabase/supabase-js`. This repo has both already — the billing portal wouldn't work otherwise. Nothing to install.

### 4. Environment variables

Vercel → Settings → Environment Variables. You already have the first three.

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | existing |
| `SUPABASE_SERVICE_ROLE_KEY` | existing |
| `STRIPE_SECRET_KEY` | existing |
| `NEXT_PUBLIC_PORTAL_URL` | **new** — `https://my.erendirasboutique.com` |
| `STRIPE_LIVE_WEBHOOK_SECRET` | **new**, only if you add a separate webhook (see step 6) |

### 5. Wire the customer portal

Open your existing portal page (`app/portal/[token]/page.js` or wherever it lives) and add two lines:

```jsx
import PortalBaskets from '@/components/live/PortalBaskets';
import '@/styles/live.css';

// ...then inside the page, above the address section:
<PortalBaskets token={token} />
```

That's the whole integration. See `app/portal-basket-example/EXAMPLE-portal-page.js`.

### 6. Stripe webhook

**You almost certainly already have a webhook in this repo** (the Stripe checkout and payment links live here). If so, don't register a second endpoint in Stripe. Open your existing webhook route and add this inside the `checkout.session.completed` branch:

```js
import { markBasketPaid } from '@/app/api/live/stripe-webhook/route';

const basketId = session.metadata?.basket_id;
if (basketId) await markBasketPaid(basketId);
```

Keep `app/api/live/stripe-webhook/route.js` in place either way — that's where `markBasketPaid` is exported from. It just won't receive traffic.

**If you'd rather have a separate endpoint:** Stripe → Developers → Webhooks → add `https://my.erendirasboutique.com/api/live/stripe-webhook`, event `checkout.session.completed`, and put the signing secret in `STRIPE_LIVE_WEBHOOK_SECRET`.

---

## Three things to check against your schema

This module makes exactly three assumptions about tables you already have. Each is isolated to one constant, so a mismatch is a one-line fix:

1. **Customers table is called `customers`** — if not, change `CUSTOMERS_TABLE` in `lib/live/queries.js` and `app/api/live/customers/search/route.js`.
2. **It has `id`, `name`, `email`, `phone`, `portal_token`** — if your columns differ (`first_name`/`last_name`, say), change `SELECT_COLS` and `SEARCH_COLS` in `app/api/live/customers/search/route.js`, and the `.select(...)` in `getBasketDetail` / `getBasketsForPortalToken`.
3. **`customers.id` and `orders.id` are uuid** — the foreign keys are commented out at the bottom of the migration. Run this first:

```sql
select table_name, column_name, data_type
from information_schema.columns
where table_name in ('customers','orders') and column_name = 'id';
```

If both are uuid, uncomment those two `alter table` statements and run them. If not, leave them commented — everything works without the FKs, you just lose database-level referential integrity.

### One more, if this repo uses the Pages Router

These are App Router files (`app/`, `route.js`, server components). If the customer portal is on `pages/`, tell me and I'll re-cut it — the lib layer and the SQL carry over unchanged, only the pages and routes change shape.

---

## Your week, after this

**Wednesday morning — load the rack (~20 min)**
Catalog screen. Code, description, price, quantity, photo. Or paste a whole list from a sheet. These photos become the portal photos, so this isn't extra work — it's Thursday's work moved earlier.

**Wednesday/Thursday — run the live**
Claims screen. Type `47`, Enter, `A3`, Enter. The basket number sticks, so a customer claiming five things is `A3` Enter `B1` Enter `C7` Enter. Ctrl+Z undoes the last claim. Hit **Show rack** if you'd rather click photos than type codes.

Using a barcode scanner? Most send the code then a Tab — the tag field treats Tab as Enter, so scanning just works. Type the basket number, then scan, scan, scan.

**Thursday night — send totals (~5 min for 150 baskets)**
Baskets screen. Match each basket to a customer (typeahead), then **Finalize every matched basket**. Every basket gets its total locked and a Stripe link minted. Then per basket: **Copy message** → paste into Messenger. Toggle EN/ES at the top.

**Friday — payment**
Nothing. The webhook marks baskets paid as they come in. Watch Collected climb.

**Saturday — ship**
Paid baskets are ready for your label flow.

---

## What's deliberately not here

- **Auto-sending the Messenger message.** Needs a Business Page. Right now it's Copy → paste.
- **Comment capture.** Same reason.
- **Auto-release + Friday reminders.** These want a Vercel Cron, and I'd rather you run one live with the manual version first and see what the real timing should be. `reminderMessage()` in `lib/live/messages.js` is already written for when you want it.
- **EB-XXX order creation on payment.** `baskets.order_id` is there and empty. Tell me how order rows get created today and I'll wire the webhook to mint one — that's the bridge from this module to the shipping portal.

---

## Notes

- **All money is integer cents.** Totals come from the `basket_totals` view, never from JS math.
- **Prices are snapshotted** onto `basket_items` at claim time. Editing the catalog later never silently rewrites a total a customer already saw.
- **Undo is a soft void**, not a delete. When someone disputes a total on Thursday, the history is still there.
- **Basket numbers reset every sale.** `(live_sale_id, basket_number)` is unique, not `basket_number` alone — that's what stops next Wednesday from colliding with this one.
- **`params` is awaited** (Next 15 style). On Next 14 the `await` is a harmless no-op and it still works.
- **Styles are scoped** under a `.live` wrapper class with its own CSS variables, so nothing here can leak into `AdminDashboard.js` or your existing portal styles.
