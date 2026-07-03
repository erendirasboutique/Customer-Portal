V10 Gift Cards Fixed

Fixes Stripe error: Received unknown parameter: coupon.
Gift cards now create a Stripe Coupon and Promotion Code only.
Payment Links accept the code because allow_promotion_codes is enabled.

Adds:
- /admin/gift-cards admin page
- /gift-card/[code] public unique gift-card portal
- /api/gift-card/pdf?code=... printable PDF-style page
- Supabase gift_cards table

Run supabase/gift_cards_update.sql in Supabase SQL Editor.
