# Account section — Team, Branding, Integrations, Settings, Help

All new files. Nothing here replaces a file you already have.

## What's in the zip

| File | What it is |
|---|---|
| `app/admin/team/page.js` | Team & permissions |
| `app/admin/branding/page.js` | Logo, colors, thank-you text, with live preview |
| `app/admin/integrations/page.js` | Status of Stripe, Sezzle, Clover, Supabase, Dub, MICR, site URL |
| `app/admin/settings/page.js` | Business profile + defaults |
| `app/admin/help/page.js` | FAQ, contact support, quick links |
| `components/account/TeamManager.js` | Invite form + roster (client) |
| `components/account/BrandingForm.js` | Branding form + preview (client) |
| `components/account/SettingsSection.js` | Reusable settings form (client) |
| `app/api/admin/team/route.js` | Add / change role / remove team members |
| `app/api/admin/settings/route.js` | Save branding, business, preferences |
| `lib/admin/account-settings.js` | Shared helpers (auth, Supabase, settings) |
| `supabase/account.sql` | Creates the two tables these pages use |

## Setup (3 steps)

1. **Run the SQL.** Supabase → SQL Editor → paste `supabase/account.sql` → Run.
2. **Add one key in Vercel** (skip if you already have it): `SUPABASE_SERVICE_ROLE_KEY`
   from Supabase → Project Settings → API → `service_role`. Redeploy after adding it.
3. **Add the links to the sidebar** with the AdminShell edit below.

Then open `/admin/team` once. The first person to open it becomes the Owner.

## AdminShell edit — put the Account links in the profile menu

This puts Team, Branding, Integrations, Settings and Help in the menu that opens
when you click your name at the bottom of the sidebar, above Log out.
Three small pastes in `components/AdminShell.js`:

### 1. Icons — paste next to the other `const Icon... = function` lines

```jsx
const IconUsers = function () { return (<Icon size={14}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0" /><path d="M16 4.5a3.5 3.5 0 010 7" /><path d="M18 14.5a6.5 6.5 0 013.5 5.5" /></Icon>); };
const IconPalette = function () { return (<Icon size={14}><path d="M12 3a9 9 0 100 18c1.1 0 1.7-.9 1.4-1.8l-.3-.9a1.6 1.6 0 011.5-2.1H17a4 4 0 004-4c0-5-4-9.2-9-9.2z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" /></Icon>); };
const IconPlug = function () { return (<Icon size={14}><path d="M9 3v5M15 3v5" /><path d="M6 8h12v3a6 6 0 01-12 0V8z" /><path d="M12 17v4" /></Icon>); };
const IconGear = function () { return (<Icon size={14}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></Icon>); };
const IconHelp = function () { return (<Icon size={14}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.7-2.5 2-2.5 3.5" /><path d="M12 17h.01" /></Icon>); };
```

### 2. Styles — find this line in `shellCss`

```js
'.eba-menu button:hover { background:var(--wash); }' +
```

and paste these three lines right under it:

```js
'.eba-menu a { display:flex; align-items:center; gap:9px; width:100%; padding:11px 14px; color:var(--taupe); font-size:13px; }' +
'.eba-menu a:hover, .eba-menu a.on { background:var(--wash); }' +
'.eba-menu-sep { border-top:1px solid var(--line); }' +
```

### 3. Menu links — find the Log out button inside `.eba-menu`

```jsx
<button role="menuitem" onClick={logout}><IconLogout />{t.logOut}</button>
```

and paste this **directly above** it:

```jsx
{[
  { key: 'team', href: '/admin/team', label: 'Team & permissions', icon: <IconUsers /> },
  { key: 'branding', href: '/admin/branding', label: 'Branding', icon: <IconPalette /> },
  { key: 'integrations', href: '/admin/integrations', label: 'Integrations', icon: <IconPlug /> },
  { key: 'settings', href: '/admin/settings', label: 'Settings', icon: <IconGear /> },
  { key: 'help', href: '/admin/help', label: 'Help', icon: <IconHelp /> },
].map(function (l) {
  return (
    <a key={l.key} role="menuitem" href={l.href} className={props.active === l.key ? 'on' : ''}>
      {l.icon}{l.label}
    </a>
  );
})}
<div className="eba-menu-sep" />
```

## Good to know

- **Access.** Every page and API uses your existing `requireChecksAdmin()`, so the
  same people who can open Checks can open these. The Team roster controls who can
  *manage the team*. It doesn't yet decide who can sign in to the admin. To make it
  do that, `requireChecksAdmin()` needs to also check `admin_team`.
- **Branding and Settings are saved, not yet applied.** They're stored in Supabase.
  Any server page can read them with
  `getSettings(["branding"])` from `@/lib/admin/account-settings`.
  Your thank-you pages, receipts and checks need to be pointed at them.
- **Integrations** only reads which variables exist in Vercel. It never shows or
  sends the keys. If a service shows "Not connected" but works, it's using a
  variable name that isn't in the list; add that name in `INTEGRATIONS`.
- **Help** sends support emails to the address in `SUPPORT_EMAIL` at the top of
  `app/admin/help/page.js`. Change it if it should go somewhere else.
- GitHub doesn't unzip uploads. Extract the zip first, then drag the folders in.
