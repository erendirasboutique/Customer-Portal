# Shared brand

Every Erendira's Boutique site gets its logo, colors and fonts from this one place.

**To change them, go to [my.erendirasboutique.com/admin/branding](https://my.erendirasboutique.com/admin/branding)** → "Your brand on every site": upload a logo, pick the colors, choose the season, press **Save for every site**. All sites update within a few minutes.

| Address | What it is | Built by |
|---|---|---|
| `/brand/brand.css` | Colors and fonts as CSS variables | `app/brand/brand.css/route.js` |
| `/brand/logo.png` | The current logo | `app/brand/logo.png/route.js` |
| `/brand/brand.json` | Everything above, plus the season | `app/brand/brand.json/route.js` |
| `/brand/fonts/` | Charman Serif, Ltt Recoleta | static files |

Used by this Customer Portal, the Shipping Portal and the tracker.

- Settings are saved in `admin_settings` under the key `site_brand` (see `lib/admin/account-settings.js`).
- Uploaded logos go to the private `studio-documents` storage bucket under `site-brand/`.
- If the database can't be read, the original logo (`public/brand/default-logo.png`) and colors are served, so the sites never lose their look.
- The other sites also keep a copy of each color as a fallback in case this site is down.
