import {
  clean,
  type MenuSource,
  type SheetResult,
  type SheetRow,
  type SheetWarning,
} from "./sheet";
import {
  DIETARY_TAGS,
  type DietaryTag,
  type MenuBlock,
  type MenuContent,
  type MenuItem,
} from "./schema";

/**
 * The food menu's half of the reader: what its columns are called, what it
 * cannot do without, and how a row becomes content. The transport in `sheet.ts`
 * is shared; everything in here is the food menu's own, and the wine menu gets
 * a module of the same shape rather than a branch inside this one.
 *
 * Row order *is* the menu order, and an item belongs to the nearest section row
 * above it. Nothing links them explicitly — that is deliberate, so there is no
 * second source of order to drift out of sync.
 */

/** Named in failure messages so a row number says which of the four tabs it is. */
const FOOD_TAB_LABEL = "Food Menu";

/**
 * Written for people, so the sheet's own spelling carries capitals and stray
 * spaces ("Add on", " Pairing"), and the obvious synonyms are accepted. Kept
 * here rather than in the shared module: a shared table would quietly make the
 * wine menu's column names valid on this tab, and this menu's on that one.
 */
const FOOD_ALIASES: Record<string, string> = {
  type: "type",
  name: "name",
  title: "name",
  price: "price",
  description: "description",
  body: "description",
  tags: "tags",
  tag: "tags",
  "allergy tag": "tags",
  "allergy tags": "tags",
  "dietary tags": "tags",
  "add on": "addOn",
  addon: "addOn",
  add_on: "addOn",
  pairing: "pairing",
};

/**
 * Every column the mapper below reads, spelled as the sheet spells it. A column
 * missing from the header row empties its values on every single row at once,
 * which is why this is checked against row 1 rather than discovered as a
 * menu that prints with all its prices gone.
 */
const FOOD_REQUIRED_COLUMNS = [
  "Type",
  "Name",
  "Price",
  "Description",
  "Allergy Tag",
  "Add on",
  "Pairing",
] as const;

/** The season line in the header and the two footer lines. All three print. */
const FOOD_REQUIRED_SETTINGS = ["season", "disclaimer", "serviceCharge"] as const;

// --------------------------------------------------------------- tags ---

const TAG_LOOKUP = new Map<string, DietaryTag>(DIETARY_TAGS.map((tag) => [tag, tag]));

/**
 * Sheet validation rejects bad input at typing time, but pasting defeats it and
 * the constraint appears nowhere in the exported CSV. So the vocabulary is
 * enforced here, where it actually matters.
 */
function readTags(raw: string, row: number, warnings: SheetWarning[]): DietaryTag[] {
  if (!raw) return [];

  const tags: DietaryTag[] = [];
  for (const piece of raw.split(/[,;|]/)) {
    const normalized = piece.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
    if (!normalized) continue;

    const tag = TAG_LOOKUP.get(normalized);
    if (tag) {
      if (!tags.includes(tag)) tags.push(tag);
    } else {
      warnings.push({
        row,
        problem: `"${piece.trim()}" is not one of the menu's dietary tags, so it was left off. Allowed: ${DIETARY_TAGS.join(", ")}.`,
      });
    }
  }
  return tags;
}

// ---------------------------------------------------------------- map ---

function blankItem(row: number): MenuItem {
  return {
    id: `item-${row}`,
    name: "",
    tags: [],
    price: "",
    description: "",
    addOn: "",
    pairing: "",
  };
}

/**
 * Ids come from the spreadsheet row number rather than a random generator, so
 * the same sheet always maps to the same content. That keeps fixtures stable
 * and gives the page a durable handle on "the row that went wrong".
 */
export function mapFoodRows(
  menuRows: SheetRow[],
  settingsRows: SheetRow[],
): SheetResult<MenuContent> {
  const warnings: SheetWarning[] = [];
  const blocks: MenuBlock[] = [];
  let openSection: Extract<MenuBlock, { kind: "section" }> | null = null;

  const bad = (row: number, problem: string): SheetResult<MenuContent> => ({
    ok: false,
    warnings,
    failure: { kind: "row", tab: FOOD_TAB_LABEL, row, problem },
  });

  for (const { values, row } of menuRows) {
    const type = clean(values.type).toLowerCase();
    const name = clean(values.name);

    if (!type) {
      return bad(row, "This row has no Type. Set it to Section, Item, or Note.");
    }

    if (type === "section") {
      if (!name) return bad(row, "This section has no name.");

      openSection = { kind: "section", id: `section-${row}`, title: name, items: [] };
      const addOn = clean(values.addOn);
      if (addOn) openSection.addOn = addOn;
      blocks.push(openSection);
      continue;
    }

    if (type === "item") {
      if (!openSection) {
        return bad(row, "This item comes before any section, so there is nothing for it to belong to.");
      }
      if (!name) return bad(row, "This item has no name.");

      openSection.items.push({
        ...blankItem(row),
        name,
        price: clean(values.price),
        description: clean(values.description),
        tags: readTags(clean(values.tags), row, warnings),
        addOn: clean(values.addOn),
        pairing: clean(values.pairing),
      });
      continue;
    }

    if (type === "note") {
      if (!name) return bad(row, "This note has no heading.");

      blocks.push({
        kind: "note",
        id: `note-${row}`,
        heading: name,
        body: clean(values.description),
      });
      openSection = null;
      continue;
    }

    return bad(row, `"${clean(values.type)}" is not a row type. Use Section, Item, or Note.`);
  }

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

  return {
    ok: true,
    warnings,
    content: {
      season: settings.get("season") ?? "",
      disclaimer: settings.get("disclaimer") ?? "",
      serviceCharge: settings.get("serviceCharge") ?? "",
      blocks,
    },
  };
}

// ------------------------------------------------------------- source ---

/**
 * Everything the shared transport needs to read this menu, gathered where the
 * mapper is. The wine menu supplies one of the same shape from its own module,
 * so adding a menu never edits this one.
 *
 * The tab id is read by literal `process.env.NEXT_PUBLIC_*` access: Next inlines
 * those only where it can see the name in the source, so a lookup by variable
 * name would compile and then be `undefined` in the browser. The food menu keeps
 * the variable name it already has in every environment file — renaming it here
 * would blank a menu that is in print.
 */
export const FOOD_SOURCE: MenuSource<MenuContent> = {
  menuId: "food",
  tabLabel: FOOD_TAB_LABEL,
  tabId: process.env.NEXT_PUBLIC_SHEET_MENU_GID,
  tabIdVariable: "NEXT_PUBLIC_SHEET_MENU_GID",
  aliases: FOOD_ALIASES,
  requiredColumns: FOOD_REQUIRED_COLUMNS,
  requiredSettings: FOOD_REQUIRED_SETTINGS,
  map: mapFoodRows,
};
