# Menu Editor

Sign in with a shared passcode, edit the text of two menus, download a print-ready PDF.

## The one idea

A menu is **a locked template plus editable content**.

- The **template** is code: `src/menus/templates/`. Type, spacing, color, page size.
- The **content** is JSON: strings only. That's what the app edits.

There is no font picker or alignment toggle in the UI — not because they're
disabled, but because `MenuContent` in `src/lib/schema.ts` has nowhere to put
those values. Formatting can only change by editing the template in the repo.

The on-screen preview is rendered by the same code as the download, so the
preview *is* the PDF. They can't drift apart.

## Setup

Requires Node 18.17 or newer.

```bash
npm install
```

Copy `.env.local.example` to `.env.local` and fill in both values:

- `APP_PASSCODE` — what everyone types on the login screen.
- `SESSION_SECRET` — signs the login cookie. Any long random string:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Then:

```bash
npm run dev
```

Open http://localhost:3000.

## Where things live

| Path | What it does |
| --- | --- |
| `src/menus/templates/theme.ts` | Type, spacing, color, page size. **Placeholder values.** |
| `src/menus/templates/FoodMenu.tsx` | Food menu layout. **Placeholder.** |
| `src/menus/templates/DrinksMenu.tsx` | Drinks menu layout. **Placeholder.** |
| `src/menus/registry.ts` | The list of menus and their labels. |
| `src/lib/schema.ts` | What's editable. Adding a field here makes it editable. |
| `src/lib/store.ts` | Persistence. Swap this one file to change hosting. |
| `src/lib/auth.ts` | Passcode check and signed cookie. |
| `src/components/MenuForm.tsx` | The editing form. |

## Swapping in the real design

1. Get the real specs — page size in points (72pt = 1 inch), fonts, sizes,
   weights, spacing, colors.
2. Put them in `theme.ts`.
3. Rework the two template components to match the layout.
4. For real fonts: drop `.ttf` files in `public/fonts/` and register them —
   see the comment at the top of `theme.ts`. You need font files licensed for
   embedding; the built-in Helvetica/Times need no files and always work.

Only these files change. The editor, auth, storage, and export don't care what
the menus look like.

## Deploying

The app stores menus in `data/menus.json`. That works locally and **will not
work on serverless hosting** — those filesystems are read-only or wiped between
requests. Before deploying, rewrite `readMenu` and `writeMenu` in
`src/lib/store.ts` against a real store (Vercel KV, Supabase, Cloudflare KV).
Nothing else needs to change. Set `APP_PASSCODE` and `SESSION_SECRET` as
environment variables on the host.

## Known limits

Chosen deliberately, worth knowing before they surprise you:

- **One shared passcode, so no audit trail.** The app can't tell you who
  changed a price. Real accounts would mean a user database.
- **Last write wins.** Two people saving at the same moment: one silently
  overwrites the other. Fine for one kitchen; fix it with a real database and
  a version check if the team grows.
- **Content can overflow the page.** Add enough items and they run past the
  bottom of the fixed-size card. The preview shows this happening, but nothing
  stops you from saving it.
- **Cookie auth is a gate, not a vault.** Anyone with the passcode has full
  access, and the passcode is only as good as how it's shared.
