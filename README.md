# Receipt share picture (Messenger, iMessage, WhatsApp, Facebook)

## 1. Upload the folder
Extract the zip, then upload the `app` folder to your repo. It adds:

- `app/receipt/[token]/opengraph-image.js`, the share picture (new file)
- `app/receipt/[token]/fonts/`, where your two fonts go

Nothing you already have gets replaced.

## 2. Add your fonts
Copy your font files into `app/receipt/[token]/fonts/` and rename them:

| Font | Name it |
|---|---|
| La Luxes Serif | `display.otf` (or `.ttf` / `.woff`) |
| Recoleta | `body.otf` (or `.ttf` / `.woff`) |

`.woff2` doesn't work for share pictures. Without the fonts the picture still works, just in a plain font.

## 3. One small change in `app/receipt/[token]/page.js`
Open `page-js-change.txt` and follow it: delete the `export const metadata = {...}` block and paste the new `generateMetadata` in its place.
This changes the text under the picture to "Recibo de pago · $48.00" and gives Messenger the full web address.

## 4. Check it
After Vercel deploys, open
`https://receipts.erendirasboutique.com/receipt/<any real token>/opengraph-image`
in your browser. You should see the picture with your fonts.

Old Messenger messages keep their old preview. To refresh a link, paste it into
https://developers.facebook.com/tools/debug/ and click **Scrape Again**.

To hide the amount, set `SHOW_AMOUNT = false` in `opengraph-image.js`.
