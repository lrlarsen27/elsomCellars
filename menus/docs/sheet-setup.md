# Setting up the menu spreadsheet

The menu's **content** lives in a Google Sheet. The menu's **design** lives in
this repo and in Figma. Neither one holds the other's values, which is why a
redesign never has to be reconciled against edits the winery made in the
meantime.

This document has two parts. Part 1 records the contract the spreadsheet
follows and the setup that only needs doing once. Part 2 is the card to hand the
winery.

**The sheet already exists** — *Elsom Cellars - Master Menu*, with tabs for the
food menu, the wine menu, and settings. Part 1 is written as build steps because
it doubles as the recipe for the next one; where it describes something already
done, treat it as a spec to check against rather than work to redo.

---

## Part 1 — The sheet's contract

### 1. Create it in the winery's Google account, not yours

Sign in as the winery (or have them create it and share it with you as an
editor). If the file lives in your Drive, then adding a staff member, restoring
access, or handing the whole thing over later all route back through you — the
round trip this project exists to remove.

Name it something obvious: **Elsom Cellars — Menu Content**.

### 2. Put nothing else in it

This spreadsheet becomes readable by anyone who has the link, and its id ships
inside the page's JavaScript. Treat it as public.

No supplier costs. No staff notes. No phone numbers. No scratch tabs. If the
winery needs a working document, it is a different file.

### 3. One tab per menu, plus a settings tab

The sheet has three: **Food Menu**, **Wine Menu**, and **Settings**. Each menu
gets its own tab. Every menu tab shares the same row grammar — a `Type` column
saying what each row is, and row order deciding what prints where — but the
columns differ per menu, because a wine carries two prices and an appellation
where a dish carries dietary tags and a pairing.

Tab names don't matter to the code — tabs are wired up by id, not by name — so
renaming one is safe. Deleting and recreating one is not: that changes its id.

### 4. Format the name and price columns as plain text — before typing anything

This step cannot be undone later, so do it first.

Select the name and price columns on **every** menu tab — **B and C** on the
food tab, **B, C and D** on the wine tab, which carries two prices — then:

> Format → Number → Plain text

Why it matters: typing `$8` into a normal cell stores it as the *number* 8 with
currency formatting, and it exports as `$8.00`. Typing `1/2` becomes a date.
Formatting the column as plain text afterwards does **not** restore the original
— the cell has to be retyped. Doing it up front costs ten seconds.

### 5. Build the `Food Menu` tab

Row 1 holds the headers. The food menu tab uses these:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| `Type` | `Name` | `Price` | `Description` | `Allergy Tag` | `Add on` | `Pairing` |

Capitalisation and stray spaces are fine — the loader trims and case-folds
header names, and accepts the obvious synonyms (`Tags` for `Allergy Tag`,
`add_on` for `Add on`). Write them for people.

Every row after that is one piece of the menu, **in the order it prints**. The
`Type` column says what kind of row it is, and is also case-insensitive:

| `Type` | What it is | Columns it uses |
|---|---|---|
| `Section` | A heading like "Shareables" | `Name`, and optionally `Add on` for an add-on that applies to the whole section |
| `Item` | A dish or drink | `Name`, `Price`, `Description`, `Allergy Tag`, `Add on`, `Pairing` |
| `Note` | A standalone block like the note from Chef Dom | `Name` (the heading), `Description` (the body) |

**An item belongs to the nearest `section` row above it.** There is no column
linking them — position is the relationship. That is deliberate: it means
nobody has to keep two things in sync, and moving a row moves the item.

A few rows of a real menu look like this:

| type | name | price | description | tags | add_on | pairing |
|---|---|---|---|---|---|---|
| section | Small Bites | | | | | |
| item | Elsom white cheddar popcorn | $6 | Truffle salt, chive | v | | |
| item | Maple rosemary mixed nuts | $8 | House spiced, warm | v+\|gf | | |
| section | Plates | | | | | |
| item | Summer squash toast | $14 | Whipped ricotta, mint, chili oil | v | – add prosciutto +$5 | Pairs with 2024 Albarino |
| note | A note from Chef Dom | | Everything is made in house… | | | |

Leave a cell empty when it doesn't apply. Empty is fine everywhere except
`type` and `name`.

**Dietary tags** go in the `Allergy Tag` column. Separate several with a comma,
a semicolon, or a vertical bar — all three work, and a comma is safe because the
whole cell is quoted in the export. Case doesn't matter. The accepted values are:

`gf` · `gf+` · `v` · `v+` · `df`

Anything else is dropped when the page renders, with a warning naming the row.
The sheet currently has one: `Nut free` on the Elsom brownie sundae. Adding a
sixth tag means changing both the code and the printed footer legend, so it is a
design decision rather than a spreadsheet one.

### 5b. Build the `Wine Menu` tab

Same grammar, different columns. Row 1 holds these:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| `Type` | `Name` | `Bottle price` | `Glass price` | `Location` | `Tasting notes` |

| `Type` | What it is | Columns it uses |
|---|---|---|
| `Section` | A heading like "Whites & Rosé" | `Name` |
| `Item` | One wine | `Name`, `Bottle price`, `Glass price`, `Location`, `Tasting notes` |
| `Experience` | The bordered box above the columns | `Name` (its title), `Bottle price` (its price), `Tasting notes` (its copy) |

Three differences from the food tab worth knowing:

- **There is no `Note` type.** Copying a chef's-note row across from the food
  tab is rejected by name rather than printed.
- **Either price may be empty.** A bottle-only reserve and a glass-only pour are
  both ordinary entries; each price prints in its own column and the other stays
  blank.
- **`Experience` is the only row that may appear before the first section.** It
  prints in the box across the top, not in a column, so its position in the sheet
  is the one place row order does not decide where something lands. An `Item`
  before the first section is still an error.

`Location` is the appellation — "Yakima Valley", "Horse Heaven Hills". It prints
on its own line between the wine's name and its tasting notes.

### 6. Build the `Settings` tab

Two columns, one row per key:

| A | B | Read by |
|---|---|---|
| `key` | `value` | |
| `season` | Summer 2026 | both menus |
| `disclaimer` | *Consuming raw or undercooked meats… | food |
| `serviceCharge` | An 18% service charge is added… | both menus |
| `wineFooter` | 21+ Alcohol served to guest 21 and over… | wine |

These are the header line and the footer lines. The food menu's footer is the
disclaimer plus the service charge; the wine menu's is the 21+ notice plus the
same service charge. Format column B as plain text too — the disclaimer starts
with an asterisk, which Sheets will otherwise try to interpret.

**Renaming a key blanks the menu that reads it.** `season`, `serviceCharge` and
`wineFooter` are required: if one is missing the page says so and refuses to
export, rather than printing a menu with a line silently absent.

### 7. Add guard rails

**Restrict the `type` column.** Select column A (below the header):

> Data → Data validation → Add rule
> Criteria: **Dropdown**, with `section`, `item`, `note` on the food tab, and
> `section`, `item`, `experience` on the wine tab
> If the data is invalid: **Reject the input**

Each menu tab gets its own value list. Sharing one list across both would offer
`note` on the wine tab, where it is not a row type.

Choose *Reject*, not *Show a warning*. Note that pasting into a cell can carry
the source cell's rules over and defeat this — the page re-checks everything
anyway, so this is a convenience for the editor rather than a guarantee.

**Colour the rows by type.** Select the sheet:

> Format → Conditional formatting
> Custom formula: `=$A1="section"` → a strong fill
> Custom formula: `=$A1="note"` → a lighter fill

This is worth doing. It makes the sheet *look* like the menu, which means a
scrambled row order is visible at a glance instead of silent.

**Freeze row 1** (View → Freeze → 1 row) so the headers stay put.

### 8. Fill it with the current menu

Copy the existing content across from `menus/src/lib/seed.ts`, which is the
menu transcribed from the Figma artboards. Keep the order exactly as it appears
there — order is what determines which column each section prints in.

### 9. Share it

> Share → General access → **Anyone with the link** → **Viewer**

**Viewer, not Editor.** There is no sign-in on the menu page and the
spreadsheet's id is visible in the page's source, so link-level editing would
let anyone who opens the page rewrite the printed menu. Grant editing
individually, by email, to the winery staff who need it.

### 10. Collect the ids

The app needs the spreadsheet id, the settings tab id, and one tab id per menu.

**Spreadsheet id** — from the URL, the long string between `/d/` and `/edit`:

```
https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit#gid=0
                                       └──────────── this ────────────┘
```

**Tab ids** — click each tab in turn and read the `gid=` at the end of the URL.
Every tab has its own; the first one is usually `gid=0`.

Put them in `menus/.env.local`. Each menu reads its own tab from its own
variable, so leaving one unset fails only that menu's page. For the current
sheet they are:

```
NEXT_PUBLIC_SHEET_ID=1iWT7zhnVM6vsD3lBXNxeVbOTtbBuiDCVh-N_7jo6dHY
NEXT_PUBLIC_SHEET_SETTINGS_GID=1853508676
NEXT_PUBLIC_SHEET_MENU_GID=0
NEXT_PUBLIC_SHEET_WINE_GID=641246868
```

### 11. Check it before handing it over

Paste this into a browser, substituting your ids. It should download a CSV of
the tab whose gid you used — do it once per menu tab:

```
https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/export?format=csv&gid=<MENU_GID>
```

Open the file and confirm three things: prices read `$8` and not `$8.00`; a
multi-line description survived as one row; and the row order matches the sheet.

Then make a small edit in the sheet, reload the menu page, and confirm the
change appears. This endpoint reads live with no caching, so it should be
immediate — but confirm it once rather than assuming.

---

## Part 2 — The card for the winery

*Print this, or paste it into the sheet as a note on the first cell.*

### Editing the menu

Your menus are this spreadsheet. Change one here, then open its menu page, check
the preview, and press **Export PDF** to get the file for the printer.

**There is one tab per menu.** The food menu and the wine menu are separate
tabs with separate pages, and editing one has no effect on the other. If a
change doesn't show up, check you were on the tab for the menu you opened.

You can change anything on these tabs: names, prices, descriptions, whole
sections. You cannot change the design — the fonts, colours, and layout live
somewhere else, and nothing you type here can affect them.

### Four things to know

**1. Never use Data → Sort.**
Row order is what decides where each section prints on the sheet. Sorting
permanently rearranges it for everyone, and the printed menu changes with it.
If you want to look at things in a different order, use **Data → Create a
filter view** instead — that only changes your own view.

If you sort by accident: press **Ctrl+Z** straight away, or use
**File → Version history** to go back.

**2. Hiding a row does not remove it.**
A hidden or filtered-out row still prints. To take an item off the menu,
delete its row.

**3. Anyone with the link can read this sheet.**
Keep it to menu content only. No costs, no supplier details, no staff notes.

**4. The price columns are plain text on purpose.**
Don't reformat them as currency. They are set up this way so `$14 / $48` and
`$8` both print exactly as you typed them. Reformatting afterwards does not
undo the damage — the cell has to be retyped.

### Adding an item

Insert a row underneath the section it belongs to, then fill in:

- **type** — pick `item` from the dropdown
- **name** — what it's called
- **price** — anything you like: `$8`, `$14 / $48`, or leave it empty
- **description** — the copy underneath the name
- **Allergy Tag** — any of `gf`, `gf+`, `v`, `v+`, `df`, separated by commas
- **add_on** — the bolded line, e.g. `– add grilled chicken +$6`
- **pairing** — e.g. `Pairs with 2024 Albarino`

Leave anything that doesn't apply blank.

### Adding a wine

On the wine tab, insert a row underneath the section it belongs to, then fill in:

- **Type** — pick `item` from the dropdown
- **Name** — the wine, e.g. `2023 Albarino`
- **Bottle price** — e.g. `$30`, or leave it empty if it isn't sold by the bottle
- **Glass price** — e.g. `$12`, or leave it empty if it isn't poured by the glass
- **Location** — the appellation, e.g. `Yakima Valley`
- **Tasting notes** — the line underneath, e.g. `Green apple, citrus & tropical fruit`

A wine can have one price or two. Whichever you fill in prints in its own
column, and the other stays blank.

To change the tasting flight at the top of the wine menu, edit the row whose
**Type** is `experience` — its title, its price, and its copy are all on that
one row.

### If something looks wrong

The menu page tells you. If a row can't be read it says so and points at the
row; if the menu is too long for the sheet it says which column runs over and
won't let you export until you shorten it — or until you deliberately choose to
export anyway.

If the page says it can't reach the sheet, check that sharing is still set to
*Anyone with the link*.
