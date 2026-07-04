V13 Gift Card Redesign

Includes:
- Redesigned PDF gift card using /api/admin/gift-cards/[id]/pdf
- Keeps public/logo2.png
- Adds pdf-lib, @pdf-lib/fontkit, and qrcode to package.json
- Uses custom fonts from public/fonts if you add them
- Fixed route re-export format for Next.js
- Supabase migration in supabase/gift_cards_update.sql

Add your font files to public/fonts:
- la_luxes_serif.otf
- recoleta-regular.otf
