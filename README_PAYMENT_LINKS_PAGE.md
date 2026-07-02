# Payment Links Page Update

This version adds a separate admin page:

- `/admin` = billing dashboard
- `/admin/payment-links` = create Stripe payment links

## Files changed/added

- `app/admin/payment-links/page.js`
- `app/api/admin/create-payment-link/route.js`
- `components/AdminDashboard.js`
- `app/globals.css`

## Required Vercel env var

- `STRIPE_SECRET_KEY`

Generated links will appear in the billing portal after the customer pays and the existing Stripe webhook receives `checkout.session.completed`.
