# V7 Payment Links Update

Adds:
- Removed customer name, customer email, customer phone fields
- Removed quantity
- Removed placeholder text from title/description
- Customer chooses what to pay
- Saved generated links
- Created/updated timestamps
- Paid/pending/archived status
- Basic analytics cards
- Copy/Open/Edit/Archive actions
- Stripe webhook updates `payment_links` when a payment link is paid

Run `supabase/payment_links_update.sql` or the full `supabase/schema.sql` in Supabase before testing.
