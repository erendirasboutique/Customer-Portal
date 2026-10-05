# Bills & supplies · Document vault · Giveaway wheel

All **new files**. Nothing in this zip replaces a file you already have,
including `AdminShell.js`. The sidebar links are a small paste-in (below), so your
Clover and Stripe terminal links stay put.

| Page | Address |
|---|---|
| Bills & supplies | `/admin/reminders` |
| Document vault | `/admin/documents` |
| Giveaway wheel | `/admin/giveaway` |

## Setup

### 1. Run the SQL
Supabase → SQL Editor → paste `supabase/studio-tools.sql` → Run.
It creates the tables **and** a private storage bucket called `studio-documents` for your files.

### 2. Keys
Uses `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL`, which you already have.

### 3. Add the three sidebar links to `components/AdminShell.js`

**a) Labels.** In the `en:` block add:
```js
    reminders: 'Bills & supplies',
    documents: 'Documents',
    giveaway: 'Giveaway wheel',
```
In the `es:` block add:
```js
    reminders: 'Pagos y suministros',
    documents: 'Documentos',
    giveaway: 'Ruleta de regalos',
```

**b) Icons.** Paste next to the other `const Icon... = function` lines:
```jsx
const IconBell = function () { return (<Icon><path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15L6 16z" /><path d="M10 20a2 2 0 004 0" /></Icon>); };
const IconFolder = function () { return (<Icon><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><path d="M3 10h18" /></Icon>); };
const IconWheel = function () { return (<Icon><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" /><path d="M12 3v7M12 14v7M3 12h7M14 12h7M5.6 5.6l5 5M13.4 13.4l5 5M18.4 5.6l-5 5M10.6 13.4l-5 5" /></Icon>); };
```

**c) Links.** In the `nav` array, add these where you want them (after Checks works well):
```jsx
    { key: 'reminders', href: '/admin/reminders', label: t.reminders, icon: <IconBell /> },
    { key: 'documents', href: '/admin/documents', label: t.documents, icon: <IconFolder /> },
    { key: 'giveaway', href: '/admin/giveaway', label: t.giveaway, icon: <IconWheel /> },
```

### 4. Daily reminder email (optional)
One email each morning listing overdue/upcoming bills, supplies running low, and
documents about to expire. Nothing is sent on days with nothing to do.

Vercel variables:
| Variable | What it is |
|---|---|
| `RESEND_API_KEY` | Same one as the gift card shop, if you set that up |
| `STUDIO_FROM_EMAIL` | e.g. `Admin Studio <studio@erendirasboutique.com>`. Can skip if `GIFT_CARD_FROM_EMAIL` is set |
| `STUDIO_REMINDER_EMAIL` | Who gets it. Several emails separated by commas is fine |
| `CRON_SECRET` | Any long random text (same one as before if you have it) |

Add to the `crons` list in `vercel.json` (keep any entries you already have):
```json
{ "path": "/api/cron/studio-reminders", "schedule": "0 15 * * *" }
```
That's 8am Pacific. If `/api/cron` is blocked by a sign-in `middleware.js`, let it through.
It checks `CRON_SECRET` itself.

## How each one works

**Bills & supplies**
- Three kinds: **Supply** (poly mailers, tape, labels...), **Bill** (rent, utilities...), **Other** (anything to remember).
- Categories are free-typed. Pick a suggestion or type a new one, and it's remembered.
- Supplies have an **on-hand count** with − / + buttons (or tap the number and type it), and a **reorder at** number.
  At or below it, the item shows **Running low** and jumps to the top.
- Bills and reminders can **repeat** weekly, every 2 weeks, monthly, every 3 months, yearly, or every N days.
  **Mark paid** / **Reordered** / **Done** logs it in History and moves the date to the next one.
- Save a **reorder link** (Amazon, Uline...) or **pay link** for one-tap ordering or paying.
- Bills have a **Write check** button that goes to your New check page.
- First visit shows a list of common items to add in one click.

**Document vault**
- Drag a file in, or on your phone tap to take a photo. PDFs, photos, Word and Excel, up to 25 MB.
- Files go straight to a **private** Supabase bucket. Open/Download only works when signed in to the admin,
  and the link it uses expires after 2 minutes, so a forwarded link doesn't work.
- Add an expiration date and when to be reminded (7–90 days before). The page and the daily email flag it.

**Giveaway wheel**
- Type names one at a time or paste a whole list. The list is kept if the page refreshes.
- **One spot per person** (default) ignores duplicates. Turn it off for "one entry per purchase"; then
  adding a name twice gives them two slices.
- The winner is picked with the browser's secure random generator *before* the wheel moves,
  so it's fair, and the wheel always lands on the winner (tested 40 spins in a row).
- Every winner is saved. If someone already won in the last 30 days, you get a heads-up.
- **Doesn't count · spin again** removes that result from history (e.g. they weren't eligible).
- **Copy announcement** copies a ready-to-paste "Congratulations..." message.
- **Full screen** shows only the wheel. Share your screen on the live so everyone watches it spin.

GitHub doesn't unzip uploads. Extract first, then drag the folders in.
