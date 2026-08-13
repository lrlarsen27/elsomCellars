# Setting up the menu spreadsheet

The menu's **content** lives in a Google Sheet. The menu's **design** lives in
this repo and in Figma. Neither one holds the other's values, which is why a
redesign never has to be reconciled against edits the winery made in the
meantime.

This document has two parts. Part 1 is for whoever builds the spreadsheet —
done once. Part 2 is the card to hand the winery.

---

## Part 1 — Building the sheet (once)

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

### 3. Create exactly two tabs

Rename `Sheet1` to **`Menu`**, then add a second tab named **`Settings`**.

Spelling and capitalisation don't matter to the code — you'll wire the tabs up
by id, not by name — but keeping them exact makes the rest of this document
match what you see.

### 4. Format two columns as plain text — before typing anything

This step cannot be undone later, so do it first.

Select **columns B and C** on the `Menu` tab, then:

> Format → Number → Plain text

Why it matters: typing `$8` into a normal cell stores it as the *number* 8 with
currency formatting, and it exports as `$8.00`. Typing `1/2` becomes a date.
Formatting the column as plain text afterwards does **not** restore the original
— the cell has to be retyped. Doing it up front costs ten seconds.

### 5. Build the `Menu` tab

Row 1 holds the headers, exactly these, in this order:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| `type` | `name` | `price` | `description` | `tags` | `add_on` | `pairing` |

Every row after that is one piece of the menu, **in the order it prints**. The
`type` column says what kind of row it is:

| `type` | What it is | Columns it uses |
|---|---|---|
| `section` | A heading like "Small Bites" | `name` only |
| `item` | A dish or drink | `name`, `price`, `description`, `tags`, `add_on`, `pairing` |
| `note` | A standalone block like the note from Chef Dom | `name` (the heading), `description` (the body) |

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

**Dietary tags** go in the `tags` column, separated by a vertical bar `|` — not
a comma, because the export format is comma-separated and a comma inside the
cell makes the file ambiguous. The only accepted values are:

`gf` · `gf+` · `v` · `v+` · `df`

Anything else is dropped when the page renders, with a warning naming the row.

### 6. Build the `Settings` tab

Two columns, three rows of content:

| A | B |
|---|---|
| `key` | `value` |
| `season` | Summer 2026 |
| `disclaimer` | *Consuming raw or undercooked meats… |
| `serviceCharge` | An 18% service charge is added… |

These are the header line and the two footer lines. Format column B as plain
text too — the disclaimer starts with an asterisk, which Sheets will otherwise
try to interpret.

### 7. Add guard rails

**Restrict the `type` column.** Select column A (below the header):

> Data → Data validation → Add rule
> Criteria: **Dropdown**, with `section`, `item`, `note`
> If the data is invalid: **Reject the input**

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

### 10. Collect the three ids

The app needs the spreadsheet id and both tab ids.

**Spreadsheet id** — from the URL, the long string between `/d/` and `/edit`:

```
https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit#gid=0
                                       └──────────── this ────────────┘
```

**Tab ids** — click the `Menu` tab and read the `gid=` at the end of the URL.
Then click the `Settings` tab and read its `gid=`. They are different numbers;
the first tab is usually `gid=0`.

Put all three in `menus/.env.local`:

```
NEXT_PUBLIC_SHEET_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz
NEXT_PUBLIC_SHEET_MENU_GID=0
NEXT_PUBLIC_SHEET_SETTINGS_GID=123456789
```

### 11. Check it before handing it over

Paste this into a browser, substituting your ids. It should download a CSV of
the `Menu` tab:

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

Your menu is this spreadsheet. Change it here, then open the menu page, check
the preview, and press **Export PDF** to get the file for the printer.

You can change anything on this sheet: item names, prices, descriptions,
whole sections. You cannot change the design — the fonts, colours, and layout
live somewhere else, and nothing you type here can affect them.

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

**4. The price column is plain text on purpose.**
Don't reformat it as currency. It is set up this way so `$14 / $48` and `$8`
both print exactly as you typed them.

### Adding an item

Insert a row underneath the section it belongs to, then fill in:

- **type** — pick `item` from the dropdown
- **name** — what it's called
- **price** — anything you like: `$8`, `$14 / $48`, or leave it empty
- **description** — the copy underneath the name
- **tags** — any of `gf`, `gf+`, `v`, `v+`, `df`, separated by `|`
- **add_on** — the bolded line, e.g. `– add grilled chicken +$6`
- **pairing** — e.g. `Pairs with 2024 Albarino`

Leave anything that doesn't apply blank.

### If something looks wrong

The menu page tells you. If a row can't be read it says so and points at the
row; if the menu is too long for the sheet it says which column runs over and
won't let you export until you shorten it — or until you deliberately choose to
export anyway.

If the page says it can't reach the sheet, check that sharing is still set to
*Anyone with the link*.
