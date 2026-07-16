# Replace These Two Files

Upload these files to the same paths in your billing portal:

1. `components/checks/CheckPrintSheet.js`
2. `components/checks/checks.module.css`

They replace the existing versions.

## What changed

- Corrected payee and label overlap
- Added Erendira Moreno and the full boutique address
- Added printable floral artwork using inline SVG and CSS
- Added a subtle boutique border and cream background
- Improved date, amount, memo, signature, and amount-in-words alignment
- Redesigned both payment stubs
- Kept the MICR line clear of decorative elements
- No generated image file is used

## After uploading

Redeploy Vercel and open the check print page again.

Use these print settings:

- Letter
- Portrait
- Scale 100%
- Margins None
- Headers and footers Off
- Background graphics On

The floral design prints only when browser background graphics are enabled.

Do not print a real negotiable check until your bank confirms the MICR format.
