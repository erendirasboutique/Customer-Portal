# Shared brand

All of Erendira's Boutique's sites load their logo, colors and fonts from one place:

| File | Live address |
|---|---|
| `public/brand/brand.css` | https://my.erendirasboutique.com/brand/brand.css |
| `public/brand/logo.png` | https://my.erendirasboutique.com/brand/logo.png |
| `public/brand/brand.json` | https://my.erendirasboutique.com/brand/brand.json |
| `public/brand/fonts/` | Charman Serif (headings), Ltt Recoleta (body) |

Used by: this Customer Portal, the Shipping Portal, and the tracker.

## Change the logo
Replace `public/brand/logo.png` with the new file (same name, PNG with a transparent background, about 900px wide). Update `"season"` in `brand.json` if it's a seasonal logo. Merge, and every site shows it within about 5 minutes.

## Change a color
Edit the values in `public/brand/brand.css`. If you change one of the four colors, also update its `-rgb` line (the same color as three numbers) and `brand.json`.

The other sites keep a copy of each color as a fallback, so if this site is ever down they still look right (minus the logo).
