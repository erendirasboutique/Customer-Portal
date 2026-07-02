# Google Admin Sign-In Fix

This version uses `@supabase/ssr` for Supabase auth cookies.

## Required setup

Vercel:
NEXT_PUBLIC_SITE_URL=https://billing.erendirasboutique.com

Supabase Auth URL Configuration:
Site URL:
https://billing.erendirasboutique.com

Redirect URLs:
https://billing.erendirasboutique.com/auth/callback
https://billing.erendirasboutique.com/**

Google Cloud OAuth:
Authorized JavaScript origin:
https://billing.erendirasboutique.com

Authorized redirect URI:
https://YOUR-SUPABASE-PROJECT.supabase.co/auth/v1/callback

Admin allowlist:
Edit `app/auth/callback/route.js` and confirm `ALLOWED_ADMINS` includes the admin email.
