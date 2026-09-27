# Gift card balance check

A public page at **/gift-card-balance** where customers type their code and see
what's left. All new files; nothing replaces anything you have.

| File | What it is |
|---|---|
| `app/gift-card-balance/page.js` | The customer page (EN / ES) |
| `app/api/gift-card-balance/route.js` | The lookup the page calls |
| `lib/gift-card-balance.js` | Balance logic, code cleanup, anti-guessing limit |
| `supabase/gift-card-balance.sql` | One small table for the anti-guessing limit |

## Setup

1. **Run the SQL.** Supabase → SQL Editor → paste `supabase/gift-card-balance.sql` → Run.
2. **Keys.** It uses `SUPABASE_SERVICE_ROLE_KEY` (same one the Account pages use) and your
   existing `STRIPE_SECRET_KEY`. Nothing new to add if those are already in Vercel.
3. **If you have a `middleware.js`** that makes people sign in, allow these two paths through:
   `/gift-card-balance` and `/api/gift-card-balance`. Customers check balances without an account.

## Linking to it

- Straight to a card: `/gift-card-balance?code=EB-XXXX-XXXX` checks it automatically.
  Good for the gift card PDF, the gift card email, or a QR code.
- Customers can type the code with or without dashes, and in lower case.

## How the balance is worked out

- Uses your `gift_cards` table: `amount` minus `total_redeemed`.
- **Mark redeemed** in the admin shows as "Fully used" with $0.
- **Deactivate** shows as "Not active", and the balance is hidden.
- It also asks Stripe about the card's promo code. If Stripe says the code has been used up
  or turned off, the page shows that, even if the table hasn't caught up.
- If your table has an `expires_at` column, expired cards show as "Expired".

## Privacy and safety

- Only the balance, status and a masked code (`EB-••••-7K2P`) are sent to the browser.
  Names, emails, messages and Stripe IDs stay on the server.
- Each visitor gets 8 checks per 10 minutes, so nobody can sit there guessing codes.
  Change `MAX_CHECKS` / `WINDOW_MINUTES` at the top of `lib/gift-card-balance.js`.
- If your table or columns are named differently, change `TABLE` at the top of the same file.
