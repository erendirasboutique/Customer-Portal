# Check Writing Add-On — New Files Only

This ZIP contains only the files needed to add check writing to the existing JavaScript billing portal. It does not contain or replace the portal's existing Stripe, customer, authentication, or dashboard files.

## 1. Upload the folders

Copy these new folders/files into the root of the billing portal repository:

- `app/admin/checks`
- `app/api/checks`
- `components/checks`
- `lib/checks`
- `supabase/check-writing.sql`

The project must already have:

- `next`
- `react`
- `react-dom`
- `@supabase/ssr`
- Supabase authentication configured
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Run the database SQL

Open Supabase → SQL Editor and run:

`supabase/check-writing.sql`

Before running it, change:

```sql
'YOUR BANK NAME'
```

Also change `1000` to the check number immediately before your first desired number. For example, use `1000` if the first portal check should be `1001`.

Never reset this value after checks have been issued.

## 3. Add Vercel environment variables

Copy the values from `.env.checks.example` into:

Vercel → Project → Settings → Environment Variables

Then redeploy.

`CHECKS_ADMIN_EMAILS` can contain multiple emails separated by commas.

Example:

```text
owner@example.com,manager@example.com
```

Do not prefix routing or account variables with `NEXT_PUBLIC_`.

## 4. Add the Checks link to the current admin navigation

Add a link pointing to:

```text
/admin/checks
```

Example:

```jsx
<Link href="/admin/checks">Checks</Link>
```

This is the only existing file you must manually edit because your current navigation file was intentionally not included.

## 5. MICR font and toner

The ZIP does not include a MICR font. Font files cannot be redistributed without a proper license.

After purchasing/licensing an E-13B MICR font, place it at:

```text
public/fonts/micr.ttf
```

Then confirm all of the following with your bank:

- Correct routing number
- Correct account number
- Correct MICR symbol placement
- Correct check-number placement
- Whether MICR toner is required
- Whether your account supports self-printed blank check stock
- Whether Positive Pay is available

The included MICR line is intentionally a layout placeholder. Do not set `CHECK_MICR_READY=true` until your bank has approved a test check or specification.

## 6. Printing

Use:

- Letter paper
- Portrait orientation
- Scale: 100%
- Margins: None
- Browser headers/footers: Off
- Do not use “Fit to page”

First print on plain paper. Hold it behind the DocuGard sheet against a light to verify alignment.

The current print layout assumes:

- Top check: 3.5 inches
- Middle stub: 3.5 inches
- Bottom stub: 4 inches

Small printer-specific adjustments can be made in:

`components/checks/checks.module.css`

Look for `.businessBlock`, `.checkDate`, `.payee`, `.numericAmount`, `.amountWords`, `.memo`, `.signatureLine`, and `.micrLine`.

## 7. Current workflow

1. Create a draft.
2. Approve it.
3. Open the print page.
4. Print and sign it by hand.
5. Mark it mailed.
6. Mark it cleared when it clears the bank.
7. Void mistakes instead of deleting them.

Check numbers are assigned atomically in PostgreSQL, so two open browser tabs cannot issue the same number.

## Important limitation

This add-on is operational software, but a check is not bank-ready merely because it prints correctly. Your bank must confirm the MICR line and whether your account accepts checks printed on blank stock. Keep the manual signature workflow until you have stronger approval controls.
