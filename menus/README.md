# Menus

The winery edits the menu in a spreadsheet; this reads it, shows how it will
print, and exports a print-ready PDF.

Part of the [Elsom Cellars](../README.md) repo.

> **Status:** the food menu works end to end. Verified from the served static
> build against the live spreadsheet: two 11×17 pages, all five typefaces
> embedded and subsetted, the back-page watermark with its alpha mask, and
> column placement matching the artboard column by column.
>
> Not done yet: the wine menu (designed and written, no template — see
> [Adding the wine menu](#adding-the-wine-menu)), and deployment.

## The one idea

A menu is **a locked template plus editable content**.

- The **template** is code: `src/menus/templates/`. Type, spacing, color, page size.
- The **content** is a Google Sheet: strings and tag choices, edited by the winery.

Neither holds the other's values. That is what makes a seasonal redesign safe —
the design changes here, the content stays where it is, and nothing has to be
reconciled by hand.

There is no font picker or column chooser anywhere, and no spreadsheet column
that could become one, because `MenuContent` in `src/lib/schema.ts` has nowhere
to put such a value. Formatting can only change by editing the template.

Column placement isn't stored either. It's computed from how much content there
is, so nobody chooses it and nobody can break it.

## The page is a preview and an export button

There is nothing to edit here. `src/components/Editor.tsx` reads the
spreadsheet in the browser, draws a replica of the sheet, and exports the PDF
when asked. **No PDF is rendered until Export** — the `@react-pdf/renderer`
import is dynamic and lives inside the click handler, which is also the only
import shape that resolves under this Next version.

The states it can be in, all reachable by changing the spreadsheet:

| State | What the page does |
| --- | --- |
| Loading | Spinner and "Reading the spreadsheet…". Every load crosses a network and a redirect, so this is the state seen most often. |
| Unreachable | Says so, offers a retry. Usually means sharing was changed. |
| Empty | Says the sheet has no menu in it, rather than printing two blank sides. |
| Bad row | Names the spreadsheet row and what is wrong with it. |
| Tag warning | Renders the menu, lists the affected rows, says export is unaffected. |

### The preview is a second renderer, and that is a real risk

Two renderers draw the same sheet: `FoodMenu.tsx` for the PDF and
`MenuPreview.tsx` for the screen. They agree today, but **they agree by
coincidence, not by construction** — both write out the same design values
independently rather than reading them from `theme.ts`. The season label's size
and its `5.88` letter-spacing are hardcoded in both files, and the theme's own
`tracking.seasonLabel` holds `3`, which neither reads.

Edit one and not the other and the preview starts lying, with nobody positioned
to catch it. Consolidating those values into the theme so both renderers read
one source is outstanding work.

What they do share already: the column flow from `flowBlocksIntoColumns` in
`templates/layout.ts`, computed once and passed to both; the footer legend in
`templates/legend.ts`; and the header lockup, generated from the same Figma path
data.

**What cannot be fixed by sharing values is line breaking inside a column**,
because the browser and react-pdf wrap text with different algorithms — a
near-full column may show one more or one fewer line than it prints. The PDF is
the artefact of record. Export before sending anything to a printer.

One trap worth recording: the app's baseline sets `line-height: 20px` and
`letter-spacing: 0.25px` on `<body>`, and both inherit into the sheet. Left
alone they cost the column area 35pt — enough to make a column look full on
screen that prints fine. `MenuPreview` resets both to `normal`, which is what
react-pdf does. Any new element in that file inherits from the sheet root, so
this only needs solving once, but it silently comes back if the reset is removed.

While verifying this, one measurement worth knowing: the real column area is
about **1017pt**, while `COLUMN_HEIGHT` in `layout.ts` budgets **1030**. The
difference is the footer's 14pt top margin, which the constant doesn't account
for. It's within the estimator's stated tolerance and the constant is calibrated
against the real menu, so it hasn't been changed — but it means the estimate
runs about 1% generous, and a column right at the limit is the one to check.

## The design

One tabloid sheet, 11" × 17", printed front and back. Built from the Figma file
`ciJhmsPGUj0Gge5PKpBzhe`, page "POR", nodes `22:977` (front) and `22:1065`
(back). The wine menu is `29:5658`.

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
  labels. The darker tone is 5.27:1 and 5.01:1. Print isn't governed by WCAG and
  still uses the exact artboard gold, and so does the logotype via
  `--elsom-gold`. Reverting is one line, at that cost.
- **There is one card treatment**, not a set: white, no outline, 16px corners,
  elevation 1. An outlined variant and an `elevated` modifier both existed early
  on and were removed, so no card can drift from any other.

Typography is the M3 type scale set in the menu's own faces, which the PDF
already ships so the UI costs no new files. Barlow Condensed carries every role
except display; Cormorant Garamond carries display, and only display — it's
651KB and has no business at body size. Body copy is the one place the condensed
face is wrong (menu descriptions are long and get read closely), so body roles
fall through to Roboto and then the system stack.

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

Copy `.env.local.example` to `.env.local`. It holds the spreadsheet's id and the
id of each tab the app reads:

- `NEXT_PUBLIC_SHEET_ID` — from the sheet's URL, between `/d/` and `/edit`.
- `NEXT_PUBLIC_SHEET_MENU_GID` — the `gid=` of the food menu tab.
- `NEXT_PUBLIC_SHEET_SETTINGS_GID` — the `gid=` of the settings tab.

All three are **public by construction**: they ship inside the page's
JavaScript, and the spreadsheet is readable by anyone with the link. Keep menu
content only in that spreadsheet. Full setup instructions, including the sheet's
column contract and the card to hand the winery, are in
[`docs/sheet-setup.md`](docs/sheet-setup.md).

```bash
npm run dev     # http://localhost:3000
npm test        # the sheet parser
npm run build   # static export into out/
```

## Where things live

| Path | What it does |
| --- | --- |
| `src/lib/sheet.ts` | Reads the spreadsheet and maps it to menu content. |
| `src/lib/schema.ts` | The content model. Adding a field here makes it editable. |
| `src/lib/seed.ts` | The original artboard copy. Kept as the reference the sheet was filled from. |
| `src/menus/templates/theme.ts` | Type, spacing, color, page size, read from Figma. |
| `src/menus/templates/FoodMenu.tsx` | The two-sided tabloid layout. |
| `src/menus/templates/layout.ts` | Decides which column each block lands in. |
| `src/menus/templates/logo.tsx` | Generated vector logo — don't hand-edit. |
| `src/menus/templates/fonts.ts` | Font registration and the fallback switch. |
| `src/menus/templates/legend.ts` | The footer legend, shared by the PDF and the preview. |
| `src/menus/templates/assets/` | The Figma SVG exports the logo was generated from. |
| `src/components/Editor.tsx` | The page. Imports the PDF engine only on export. |
| `src/components/MenuPreview.tsx` | The on-screen sheet. |
| `src/app/globals.css` | The web UI's design system — Material 3 tokens and components. |
| `src/components/Icon.tsx` | The icon set, drawn on Material's 24dp grid. |
| `public/fonts/` | The embedded TTFs, with their OFL licences. |
| `public/brand/` | The back-page watermark PNG. |

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
- **The font files are fetched by URL at export time**, by the PDF renderer
  itself, from `/fonts/`. Anything that intercepts those paths breaks the export
  — an earlier auth gate turned every font request into a 307. It also means the
  site must be served from a domain root, or those root-absolute paths resolve
  to nothing. See [Deploying](#deploying).

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

The wine menu is designed (`29:5658`) and its content is written, on its own tab
in the spreadsheet. What's missing is the code.

It is **not** a variation on the food menu. Its content shape differs — two
prices rather than one, an AVA location, and tasting notes instead of a
description — so it needs its own content model alongside `MenuItem`, not extra
optional fields on it.

1. Extend `src/lib/schema.ts` with the wine content shape.
2. Teach `src/lib/sheet.ts` to map the wine tab's columns.
3. Write the template in `src/menus/templates/` and register it in
   `templates/index.tsx`.
4. Add its metadata to `src/menus/registry.ts` and its tab id to
   `.env.local.example`.

## Deploying

`npm run build` writes a complete static site to `out/`. There is no server:
every route is a file, and the menu content is fetched from the spreadsheet in
the browser.

**Serve it from a domain root.** The typefaces and the watermark are registered
at root-absolute paths (`/fonts/…`, `/brand/…`) inside JavaScript string
literals and CSS, which Next does not rewrite. Under a subpath — a GitHub Pages
project site, for example — those resolve to nothing, the PDF renderer throws on
the failed font fetch, and the export button dies with no useful message.
Netlify, Vercel, a user-level GitHub Pages site, or any host with a custom
domain all serve from a root.

`trailingSlash` is on, so each route is a directory index rather than a bare
`.html` file. That removes any dependence on how the host handles extensionless
requests.

Set the three `NEXT_PUBLIC_SHEET_*` variables on the host at build time. If the
host builds from the repo root, point it at this directory — the root has no
build of its own.

## Known limits

Chosen deliberately, worth knowing before they surprise you:

- **Anyone with the link can read the spreadsheet, and its id is in the page.**
  There is no sign-in. The menu is public information, but the spreadsheet must
  therefore hold nothing else.
- **Column breaks are estimated, not measured.** react-pdf can't measure text
  before laying it out, so `layout.ts` estimates heights from character counts.
  It reproduces the artboard exactly on the current content, but it isn't exact
  in general. If breaks start landing wrong after a lot of edits,
  `DESCRIPTION_CHARS_PER_LINE` is the dial to turn.
- **Row order is the only thing controlling column placement**, and a
  `Data → Sort` in the spreadsheet rewrites it permanently for everyone. The
  instruction card covers this; recovery is undo or version history.
- **Overflow is visible, not prevented.** Past four columns' worth of content,
  the page warns and the PDF spills onto extra pages rather than dropping
  anything silently.
- **The preview is a replica, not the PDF.** Line breaking inside a column can
  differ. See "The preview is a second renderer" above.
- **Section-level add-ons are read but not printed.** The spreadsheet carries
  them on five sections and the design has a place for them; the template does
  not implement it yet.
- **The dietary tag vocabulary is fixed at five values.** A sixth means changing
  both `schema.ts` and the printed footer legend.

## Content notes

The copy in `src/lib/seed.ts` is transcribed verbatim from the artboards,
including several apparent mistakes left in place on purpose. It is no longer
what the app renders — the spreadsheet is — but it remains the reference the
sheet was filled from. See the comment at the top of that file.
