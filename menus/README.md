# Menus

Sign in with a shared passcode, edit the menu text, download a print-ready PDF.

Part of the [Elsom Cellars](../README.md) repo.

> **Status:** runs locally. Typecheck is clean, the dev server boots, login
> works, and the PDF renders in the browser and server-side. The column layout
> was verified against the artboard column by column. Fonts are still the
> fallback faces — see below.

## The one idea

A menu is **a locked template plus editable content**.

- The **template** is code: `src/menus/templates/`. Type, spacing, color, page size.
- The **content** is JSON: strings and tag choices. That's what the app edits.

There is no font picker or column chooser in the UI — not because they're
disabled, but because `MenuContent` in `src/lib/schema.ts` has nowhere to put
those values. Formatting can only change by editing the template in the repo.

Column placement isn't stored either. It's computed at render time from how much
content there is, so nobody chooses it and nobody can break it.

The on-screen preview is rendered by the same code as the download, so the
preview *is* the PDF. They can't drift apart.

## The design

One tabloid sheet, 11" × 17", printed front and back. Built from the Figma file
`ciJhmsPGUj0Gge5PKpBzhe`, page "POR", nodes `22:977` (front) and `22:1065` (back).

Type is Barlow Condensed and Cormorant Garamond, gold `#8c734b` on body
`#6f6455`, two 348pt columns with a 24pt gutter.

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

Open http://localhost:3000 and sign in with whatever you set `APP_PASSCODE` to.

## Where things live

| Path | What it does |
| --- | --- |
| `src/menus/templates/theme.ts` | Type, spacing, color, page size, read from Figma. |
| `src/menus/templates/FoodMenu.tsx` | The two-sided tabloid layout. |
| `src/menus/templates/layout.ts` | Decides which column each block lands in. |
| `src/menus/templates/logo.tsx` | Generated vector logo — don't hand-edit. |
| `src/menus/templates/fonts.ts` | Font registration and the fallback switch. |
| `src/menus/templates/assets/` | The Figma SVG exports the logo was generated from. |
| `src/lib/schema.ts` | What's editable. Adding a field here makes it editable. |
| `src/lib/seed.ts` | Starting copy, transcribed from the artboards. |
| `src/lib/store.ts` | Persistence. Swap this one file to change hosting. |
| `src/components/MenuForm.tsx` | The editing form. |

## Three things still outstanding

**1. Fonts aren't wired up.** The design uses Barlow Condensed and Cormorant
Garamond — both SIL Open Font License, so embedding is permitted. Until the
files are in `public/fonts/`, `fonts.ts` falls back to the built-in PDF faces,
which render but look nothing like the design. Instructions and the
`FONTS_INSTALLED` switch are at the top of that file.

**2. The back-page watermark is missing.** The large watercolour "E" (node
`22:1137`) is roughly 300 vector paths, and Figma only exports it at 1×, which
is too coarse to print. Export it as a PNG at 4× or larger, save it to
`public/brand/watermark-e.png`, and render it behind the back page columns.

**3. Nothing — the layout now reproduces the artboard.** Verified column by
column against the Figma with the real menu content:

| Column | Contents |
| --- | --- |
| front left | Appetizers, Shareables, Salads, Sandwiches (2 items) |
| front right | …Sandwiches continued (3), Plates (5), Note from Chef Dom |
| back left | Heirloom Beverages, Coffee & Tea |
| back right | Desserts (5) |

Getting there took two corrections worth knowing about, both recorded in
`layout.ts`: sections must be allowed to split across a column break (the
artboard's Sandwiches split is load-bearing — forbidding it pushed Plates onto
the back page), and a section is moved whole to the next column rather than
stranding fewer than two items in a headingless continuation.

## Adding the wine menu

It hasn't been designed yet. When it is:

1. Write the template in `src/menus/templates/`.
2. Add it to the map in `src/menus/templates/index.tsx`.
3. Add its metadata to `src/menus/registry.ts` and starting copy to `src/lib/seed.ts`.

Nothing else changes — the editor builds its form from the schema, not from a
per-menu configuration.

## Deploying

The app stores menus in `data/menus.json`. That works locally and **will not
work on serverless hosting** — those filesystems are read-only or wiped between
requests. Before deploying, rewrite `readMenu` and `writeMenu` in
`src/lib/store.ts` against a real store (Vercel KV, Supabase, Cloudflare KV).
Nothing else needs to change. Set `APP_PASSCODE` and `SESSION_SECRET` as
environment variables on the host.

If the host builds from the repo root, point it at this directory — the root
has no build of its own.

## Known limits

Chosen deliberately, worth knowing before they surprise you:

- **Column breaks are estimated, not measured.** react-pdf can't measure text
  before laying it out, so `layout.ts` estimates heights from character counts.
  It reproduces the artboard exactly on the current content, but it isn't
  exact in general; a nearly-full column may render slightly over or under.
  The preview is the truth. If breaks start landing wrong after a lot of edits,
  `DESCRIPTION_CHARS_PER_LINE` is the dial to turn.
- **One shared passcode, so no audit trail.** The app can't tell you who
  changed a price.
- **Last write wins.** Two people saving at the same moment: one silently
  overwrites the other. Fix it with a real database and a version check if the
  team grows.
- **Overflow is visible, not prevented.** Past four columns' worth of content,
  the editor warns and the PDF spills onto extra pages rather than dropping
  anything silently.
- **Cookie auth is a gate, not a vault.** Anyone with the passcode has full
  access.

## Content notes

The seed copy is transcribed verbatim from the artboards, including several
apparent mistakes left in place on purpose — fixing menu copy is what this app
is for. See the comment at the top of `src/lib/seed.ts`.
