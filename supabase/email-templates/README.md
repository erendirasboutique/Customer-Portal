# Supabase email templates

Copies of the sign-in emails. Supabase sends these, not this app, so edit
them in the dashboard: **Authentication → Emails → Templates**.

| Template in Supabase | File | Subject |
|---|---|---|
| Magic link | `magic-link.html` | `Tu código para entrar: {{ .Token }}` |
| Confirm signup | `confirm-signup.html` | `Bienvenida a Erendira’s Boutique: {{ .Token }}` |

Paste the whole file into the template's body (HTML / source view).

- `{{ .Token }}` is the 6-digit code the sign-in page asks for.
- `{{ .ConfirmationURL }}` is the "tap here" link, for when they open the
  email on a different phone.
- Fonts: Charman Serif + Ltt Recoleta load in Apple Mail / iPhone Mail;
  Gmail and Outlook show Palatino + Avenir, like the shipping emails.
- Logo: https://ship.erendirasboutique.com/logo2.png (same as the
  shipping notifications).
- Keep the "Vence en 10 minutos" line in step with
  Authentication → Sign In / Providers → Email → Email OTP expiration (600).
