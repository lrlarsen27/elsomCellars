# Menus

Sign in with a shared passcode, edit the menu text, export a print-ready PDF.

Part of the [Elsom Cellars](../README.md) repo.

> **Status:** runs locally and exports the real design. Verified from an actual
> exported file: two 11×17 pages, all five typefaces embedded and subsetted,
> the back-page watermark embedded with its alpha mask, and column placement
> matching the artboard column by column.

## The one idea

A menu is **a locked template plus editable content**.

- The **template** is code: `src/menus/templates/`. Type, spacing, color, page size.
- The **content** is JSON: strings and tag choices. That's what the app edits.

There is no font picker or column chooser in the UI — not because they're
disabled, but because `MenuContent` in `src/lib/schema.ts` has nowhere to put
those values. Formatting can only change by editing the template in the repo.

Column placement isn't stored either. It's computed from how much content there
is, so nobody chooses it and nobody can break it.

## The editor is a form beside a preview

Editing is an ordinary web form, with a live replica of the sheet next to it.
**No PDF is rendered while editing** — the `@react-pdf/renderer` import is still
dynamic and still only runs when someone presses Export. The preview is plain
DOM nodes, so typing stays responsive.

Each section also shows which column it will print in ("Front left", or "Front
left to Front right" when it spans a break). That's cheap arithmetic over the
block list, and it's read-only feedback — placement isn't editable.

### The preview is a second renderer, and that is a real risk

This file used to say there was deliberately *no* on-screen replica, because a
second layout implementation can drift from the PDF. That reasoning was sound
and the risk didn't go away; it got bounded structurally instead of by
vigilance. `MenuPreview.tsx` contains no design values of its own:

- Every size, colour, face and gap is read from `templates/theme.ts` — the same
  object `FoodMenu.tsx` styles itself from.
- Which fragment lands in which of the four columns comes from
  `flowBlocksIntoColumns` in `templates/layout.ts`, computed once by the editor
  and passed to both.
- The header lockup is the same `ElsomLogo` as the app bar, generated from the
  same Figma path data as the PDF's logo.
- The footer legend moved to `templates/legend.ts` so both renderers read one
  list rather than two copies.

So a design change still happens in one place. **What can still differ is line
breaking inside a column**, because the browser and react-pdf wrap text with
different algorithms — a near-full column may show one more or one fewer line
than it prints. The PDF remains the artefact of record. Export before sending
anything to a printer.

One trap worth recording: the app's baseline sets `line-height: 20px` and
`letter-spacing: 0.25px` on `<body>`, and both inherit into the sheet. Left
alone they cost the column area 35pt — enough to make a column look full on
screen that prints fine. `MenuPreview` resets both to `normal`, which is what
react-pdf does. Any new element in that file inherits from the sheet root, so
this only needs solving once, but it's the kind of thing that silently comes
back if the reset is removed.

While verifying this, one measurement worth knowing: the real column area is
about **1017pt**, while `COLUMN_HEIGHT` in `layout.ts` budgets **1030**. The
difference is the footer's 14pt top margin, which the constant doesn't account
for. It's within the estimator's stated tolerance and the constant is calibrated
against the real menu, so it hasn't been changed — but it means the estimate
runs about 1% generous, and a column right at the limit is the one to check.

## The design

One tabloid sheet, 11" × 17", printed front and back. Built from the Figma file
`ciJhmsPGUj0Gge5PKpBzhe`, page "POR", nodes `22:977` (front) and `22:1065` (back).

Type is Barlow Condensed and Cormorant Garamond, gold `#8c734b` on body
`#6f6455`, two 348pt columns with a 24pt gutter.

## The web UI is Material 3, in Elsom's colors

Two design systems live in this repo and they don't touch. The printed menu is
the Figma artboard, reproduced exactly, with its tokens in
`src/menus/templates/theme.ts`. **The app around it is Material Design 3**, with
its tokens in `src/app/globals.css`. Changing one has no effect on the other,
which is the point: the sheet that goes to the printer shouldn't move because
someone restyled a button.

The M3 role names are kept verbatim — `--md-sys-color-primary`,
`--md-sys-shape-corner-medium`, and so on — so the mapping back to the spec
stays checkable. What's swapped is the palette behind them. The three key colors
are read off the menu:

| Role | Value | Where it comes from |
| --- | --- | --- |
| primary | `#816840` | The gold on every section header and price |
| secondary | `#6f6455` | The warm tone the descriptions are set in |
| error | `#7a2e2e` | The wine maroon |

Neutrals are tinted to the same hue rather than gray, so white cards sit on warm
paper the way ink sits on the printed sheet.

Two things worth knowing before you change any of it:

- **Primary is a shade darker than the artboard gold**, `#816840` against
  `#8c734b`. The artboard value measures 4.50:1 on white and 4.28:1 on the
  app's cream background — under WCAG AA for text, and primary carries button
  labels and focused field labels. The darker tone is 5.27:1 and 5.01:1. Print
  isn't governed by WCAG and still uses the exact artboard gold, and so does
  the logotype via `--elsom-gold`. Reverting is one line, at that cost.
- **There is one card treatment**, not a set: white, no outline, 16px corners,
  elevation 1. An outlined variant and an `elevated` modifier both existed
  early on and were removed, so no card can drift from any other. Everything
  that needs to sit *inside* a card — the item rows in the editor — nests one
  surface level up instead of drawing another border.
- **The maroon now does something.** It was declared as `--accent` in this file
  and used by nothing; it's the error role now, so destructive actions and
  failed saves are in a brand color rather than a generic red.

Typography is the M3 type scale set in the menu's own faces, which the PDF
already ships so the UI costs no new files. Barlow Condensed carries every role
except display; Cormorant Garamond carries display, and only display — it's
651KB and has no business at body size. Body copy is the one place the condensed
face is wrong (menu descriptions are long and get read closely), so body roles
fall through to Roboto and then the system stack.

`public/fonts/` is already outside the auth matcher in `src/middleware.ts` for
the PDF renderer's benefit, which is also why these load on the login screen.

Icons are hand-drawn on Material's 24dp grid in `src/components/Icon.tsx`,
**not** the shipped Google glyphs. Using the real symbol font would mean either a
Google Fonts request on every page — nothing else here makes one — or a fourth
font file committed for a dozen glyphs. The component names match the Material
Symbols they stand in for, so switching to the real font later is a
find-and-replace rather than a redesign.

There is no dark theme. M3 defines one and the token layer is arranged so it
could be added as a `prefers-color-scheme` block, but nothing here has been
designed or checked against it.

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
| `public/fonts/` | The embedded TTFs, with their OFL licences. |
| `public/brand/` | The back-page watermark PNG. |
| `src/app/globals.css` | The web UI's design system — Material 3 tokens and components. |
| `src/components/Icon.tsx` | The icon set, drawn on Material's 24dp grid. |
| `src/menus/templates/legend.ts` | The footer legend, shared by the PDF and the preview. |
| `src/components/Editor.tsx` | The editing page. Imports the PDF engine only on export. |
| `src/components/MenuPreview.tsx` | The on-screen sheet. No design values of its own. |
| `src/lib/schema.ts` | What's editable. Adding a field here makes it editable. |
| `src/lib/seed.ts` | Starting copy, transcribed from the artboards. |
| `src/lib/store.ts` | Persistence. Swap this one file to change hosting. |
| `src/components/MenuForm.tsx` | The editing form. |

## Still outstanding

**The wine menu** hasn't been designed — see below.

One thing to watch: the watermark PNG is 738×741, which is about 247dpi at its
215pt print size. It's a soft watercolour texture rather than type, so it should
hold up, but if a printer objects, drop in a larger export at the same path.

## The layout reproduces the artboard

Verified column by column against the Figma with the real menu content:

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

## Fonts

Barlow Condensed and Cormorant Garamond, both SIL Open Font License. The TTFs
are committed to `public/fonts/` with their licences alongside, as the OFL
requires. The exported PDF embeds all five faces, subsetted.

Two traps worth recording, because both cost time:

- **`@fontsource/*` will not work.** It ships only `woff` and `woff2`;
  react-pdf needs TTF or OTF. These files came from `@expo-google-fonts/*`,
  which ships the original Google Fonts TTFs. That package is installed,
  copied from, then uninstalled — it is never imported.
- **The font files must not sit behind auth.** The PDF renderer fetches them
  itself, so `fonts/` is excluded from the middleware matcher in
  `src/middleware.ts`. Gating them turned every font request into a 307.

`fonts.ts` has a `FONTS_INSTALLED` switch that reverts to the built-in PDF
faces, useful for ruling fonts out while debugging.

One cosmetic note: the PDF also references `/Helvetica` without embedding it.
That's react-pdf declaring its own default; no content renders in it. Adding a
page-level default family left the output byte-identical, which is how we know.

## Running commands on Windows

If PowerShell refuses with an execution-policy error, call `npm.cmd` rather
than `npm`. PowerShell resolves bare `npm` to `npm.ps1`, which is an unsigned
script; `npm.cmd` is a batch file and execution policy doesn't apply to it.
Git Bash and `cmd.exe` are unaffected too. Nothing needs to be changed
system-wide.

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
- **The preview is a replica, not the PDF.** Line breaking inside a column can
  differ. See "The preview is a second renderer" above.
- **Assets are fetched by URL at export time.** The watermark and fonts are
  loaded from `/brand/` and `/fonts/`, which works in the browser. Rendering
  the PDF server-side would need absolute URLs or filesystem paths instead.
- **Cookie auth is a gate, not a vault.** Anyone with the passcode has full
  access.

## Content notes

The seed copy is transcribed verbatim from the artboards, including several
apparent mistakes left in place on purpose — fixing menu copy is what this app
is for. See the comment at the top of `src/lib/seed.ts`.
