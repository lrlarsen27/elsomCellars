import {
  clean,
  type MenuSource,
  type SheetResult,
  type SheetRow,
  type SheetWarning,
} from "./sheet";
import type { TastingExperience, WineBlock, WineContent } from "./schema";

/**
 * The wine menu's half of the reader: what its columns are called, what it
 * cannot do without, and how a row becomes content. The transport in `sheet.ts`
 * is shared and names no menu; everything in here is the wine menu's own, and
 * sits beside `food-sheet.ts` rather than inside it.
 *
 * The grammar is the food tab's, positionally: row order is the menu order and
 * a wine belongs to the nearest section row above it, with nothing linking them
 * explicitly so there is no second source of order to drift. Three things
 * differ, and each is a deliberate difference rather than an omission:
 *
 * - There is no `Note` row type. A chef's-note row copied across from the food
 *   tab is rejected by name.
 * - Either price may be empty. A bottle-only reserve and a glass-only pour are
 *   both ordinary entries; a wine with neither still maps, but warns.
 * - `Experience` is the only row allowed above the first section, because it
 *   prints in a box across the top rather than in a column.
 */

/** Named in failure messages so a row number says which of the four tabs it is. */
const WINE_TAB_LABEL = "Wine Menu";

/**
 * The row types this tab accepts, in the message the editor reads when a row
 * carries something else. Kept in one place so the two failures that quote it
 * cannot drift apart.
 */
const WINE_ROW_TYPES = "Section, Item, or Experience";

/**
 * Written for people, so the sheet's own spelling carries capitals and stray
 * spaces, and the obvious synonyms are accepted. Kept here rather than in the
 * shared module: a shared table would quietly make the food menu's column names
 * valid on this tab, and this menu's on that one.
 *
 * Note the run-together spellings beside the two-word ones. They read as
 * synonyms, and they are, but they also do necessary work: papaparse calls
 * `transformHeader` twice — once on the raw header and once on what the first
 * call returned — so canonicalisation has to survive being applied to its own
 * output. Without `bottleprice` here, "Bottle price" canonicalises to
 * "bottlePrice" and then, on the second pass, to "bottleprice", and every
 * bottle price on the tab reads as empty. The food table is idempotent for the
 * same reason, via its `addon` entry.
 */
const WINE_ALIASES: Record<string, string> = {
  type: "type",
  name: "name",
  title: "name",
  "bottle price": "bottlePrice",
  bottleprice: "bottlePrice",
  bottle: "bottlePrice",
  "glass price": "glassPrice",
  glassprice: "glassPrice",
  glass: "glassPrice",
  location: "location",
  appellation: "location",
  "tasting notes": "tastingNotes",
  tastingnotes: "tastingNotes",
  "tasting note": "tastingNotes",
  notes: "tastingNotes",
};

/**
 * Every column the mapper below reads, spelled as the sheet spells it. A column
 * missing from the header row empties its values on every row at once, which is
 * why this is checked against row 1 rather than discovered as a wine list that
 * printed with no prices.
 */
const WINE_REQUIRED_COLUMNS = [
  "Type",
  "Name",
  "Bottle price",
  "Glass price",
  "Location",
  "Tasting notes",
] as const;

/**
 * The season line in the header and the two footer lines. `disclaimer` is the
 * food menu's raw-food warning and is deliberately absent: this menu's own
 * footer line is the 21+ notice, and a wine list printed without it is the
 * failure this key being required exists to prevent.
 */
const WINE_REQUIRED_SETTINGS = ["season", "serviceCharge", "wineFooter"] as const;

// ---------------------------------------------------------------- map ---

/**
 * Ids come from the spreadsheet row number rather than a random generator, so
 * the same tab always maps to the same content. That keeps fixtures stable and
 * gives the page a durable handle on "the row that went wrong".
 */
export function mapWineRows(
  menuRows: SheetRow[],
  settingsRows: SheetRow[],
): SheetResult<WineContent> {
  const warnings: SheetWarning[] = [];
  const blocks: WineBlock[] = [];
  let openSection: WineBlock | null = null;
  let experience: TastingExperience | undefined;

  const bad = (row: number, problem: string): SheetResult<WineContent> => ({
    ok: false,
    warnings,
    failure: { kind: "row", tab: WINE_TAB_LABEL, row, problem },
  });

  for (const { values, row } of menuRows) {
    const type = clean(values.type).toLowerCase();
    const name = clean(values.name);

    if (!type) {
      return bad(row, `This row has no Type. Set it to ${WINE_ROW_TYPES}.`);
    }

    if (type === "section") {
      if (!name) return bad(row, "This section has no name.");

      openSection = { kind: "section", id: `section-${row}`, title: name, wines: [] };
      blocks.push(openSection);
      continue;
    }

    if (type === "item") {
      if (!openSection) {
        return bad(
          row,
          "This wine comes before any section, so there is nothing for it to belong to. Only the Experience row may sit above the first section.",
        );
      }
      if (!name) return bad(row, "This wine has no name.");

      const bottlePrice = clean(values.bottlePrice);
      const glassPrice = clean(values.glassPrice);

      // Not a failure: one price or the other missing is ordinary, and a wine
      // with neither is more likely a half-typed row than a broken menu. It
      // prints with both columns blank, and this says so before it is printed.
      if (!bottlePrice && !glassPrice) {
        warnings.push({
          row,
          problem: `"${name}" has neither a bottle price nor a glass price, so it prints with both price columns empty.`,
        });
      }

      openSection.wines.push({
        id: `wine-${row}`,
        name,
        bottlePrice,
        glassPrice,
        location: clean(values.location),
        tastingNotes: clean(values.tastingNotes),
      });
      continue;
    }

    if (type === "experience") {
      // The design has one box above the columns. A second row has nowhere to
      // print, and silently keeping the first would hide a row the editor
      // believes they added.
      if (experience) {
        return bad(
          row,
          `${name ? `"${name}" is` : "This is"} a second Experience row. The menu has one box above its columns, so only one row can fill it.`,
        );
      }
      if (!name) return bad(row, "This tasting experience has no title.");

      experience = {
        id: `experience-${row}`,
        title: name,
        price: clean(values.bottlePrice),
        description: clean(values.tastingNotes),
      };
      continue;
    }

    if (type === "note") {
      return bad(
        row,
        `"${clean(values.type)}" is a row type on the food menu, not this one. Use ${WINE_ROW_TYPES}.`,
      );
    }

    return bad(row, `"${clean(values.type)}" is not a row type. Use ${WINE_ROW_TYPES}.`);
  }

  // A tasting experience with no wines under it is not a menu — it is one box.
  // Counting only the blocks keeps a cleared tab from printing as a lone box.
  if (blocks.length === 0) {
    return { ok: false, warnings, failure: { kind: "empty" } };
  }

  // The keys this menu cannot do without are checked before mapping starts, so
  // the fallbacks here are a floor for anything optional rather than the thing
  // that lets a required key print as an empty line.
  const settings = new Map<string, string>();
  for (const { values } of settingsRows) {
    const key = clean(values.key);
    if (key) settings.set(key, clean(values.value));
  }

  const content: WineContent = {
    season: settings.get("season") ?? "",
    blocks,
    wineFooter: settings.get("wineFooter") ?? "",
    serviceCharge: settings.get("serviceCharge") ?? "",
  };
  if (experience) content.experience = experience;

  return { ok: true, warnings, content };
}

// ------------------------------------------------------------- source ---

/**
 * Everything the shared transport needs to read this menu, gathered where the
 * mapper is — the same shape the food menu supplies from its own module, so
 * adding a menu never edits another one.
 *
 * The tab id is read by literal `process.env.NEXT_PUBLIC_*` access: Next inlines
 * those only where it can see the name in the source, so a lookup by variable
 * name would compile and then be `undefined` in the browser. An unset value
 * fails this menu alone and leaves the food menu resolving exactly as before.
 */
export const WINE_SOURCE: MenuSource<WineContent> = {
  menuId: "wine",
  tabLabel: WINE_TAB_LABEL,
  tabId: process.env.NEXT_PUBLIC_SHEET_WINE_GID,
  tabIdVariable: "NEXT_PUBLIC_SHEET_WINE_GID",
  aliases: WINE_ALIASES,
  requiredColumns: WINE_REQUIRED_COLUMNS,
  requiredSettings: WINE_REQUIRED_SETTINGS,
  map: mapWineRows,
};
