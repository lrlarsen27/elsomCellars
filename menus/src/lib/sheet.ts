import Papa from "papaparse";
import {
  DIETARY_TAGS,
  type DietaryTag,
  type MenuBlock,
  type MenuContent,
  type MenuItem,
} from "./schema";

/**
 * Reads menu content from a Google Sheet.
 *
 * Two tabs, two requests: the export endpoint returns one tab per call. The
 * `Menu` tab is an ordered list of rows whose `Type` column says what each row
 * is; the `Settings` tab is key/value pairs for the header and footer strings.
 *
 * Row order *is* the menu order, and an item belongs to the nearest section row
 * above it. Nothing links them explicitly — that is deliberate, so there is no
 * second source of order to drift out of sync.
 *
 * Nothing here throws past the caller. Every failure is described, and every
 * described failure names the spreadsheet row it came from so the person
 * fixing it can go straight there.
 */

export type SheetFailure =
  /** The tab could not be read at all — network, permissions, or wrong id. */
  | { kind: "unreachable"; detail: string }
  /** Read fine, but there is no menu in it. A cleared tab must not print blank. */
  | { kind: "empty" }
  /** One row could not be interpreted. `row` is the spreadsheet's own row number. */
  | { kind: "row"; row: number; problem: string };

/** Non-blocking: the menu still renders, but something was dropped. */
export type SheetWarning = { row: number; problem: string };

export type SheetResult =
  | { ok: true; content: MenuContent; warnings: SheetWarning[] }
  | { ok: false; failure: SheetFailure; warnings: SheetWarning[] };

export type SheetConfig = {
  sheetId: string;
  menuGid: string;
  settingsGid: string;
};

/** Injectable so tests never touch the network. */
export type Fetcher = (url: string) => Promise<Response>;

// --------------------------------------------------------------- urls ---

export function exportUrl(sheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

// ------------------------------------------------------------ columns ---

/**
 * The sheet's headers are written for people, so they carry capitals and stray
 * spaces ("Add on", " Pairing"). Canonicalise before matching, and accept the
 * obvious synonyms rather than making the editor match a machine's spelling.
 */
const COLUMN_ALIASES: Record<string, string> = {
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
  key: "key",
  value: "value",
};

function canonicalHeader(header: string): string {
  const cleaned = header.trim().toLowerCase().replace(/\s+/g, " ");
  return COLUMN_ALIASES[cleaned] ?? cleaned;
}

/**
 * Sheets treats a leading `+` or `-` as the start of a formula, so add-on cells
 * like `+ Grilled Chicken $6` get typed wrapped in quotes to escape that. The
 * quotes are a workaround, not content — strip a matched pair.
 */
function clean(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

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

// -------------------------------------------------------------- parse ---

type Row = { values: Record<string, string>; row: number };

/**
 * Empty lines are kept during parsing and filtered afterwards, so a row number
 * in an error message matches the row number in the spreadsheet. Skipping them
 * inside the parser would shift every later row and send people to the wrong
 * place.
 */
function parseRows(csv: string): Row[] {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    delimiter: ",",
    skipEmptyLines: false,
    dynamicTyping: false,
    transformHeader: canonicalHeader,
  });

  return parsed.data
    .map((values, index) => ({ values, row: index + 2 })) // +1 for zero-index, +1 for the header row
    .filter(({ values }) => Object.values(values).some((v) => (v ?? "").trim() !== ""));
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
export function mapRows(menuRows: Row[], settingsRows: Row[]): SheetResult {
  const warnings: SheetWarning[] = [];
  const blocks: MenuBlock[] = [];
  let openSection: Extract<MenuBlock, { kind: "section" }> | null = null;

  for (const { values, row } of menuRows) {
    const type = clean(values.type).toLowerCase();
    const name = clean(values.name);

    if (!type) {
      return {
        ok: false,
        warnings,
        failure: { kind: "row", row, problem: "This row has no Type. Set it to Section, Item, or Note." },
      };
    }

    if (type === "section") {
      if (!name) {
        return {
          ok: false,
          warnings,
          failure: { kind: "row", row, problem: "This section has no name." },
        };
      }
      openSection = { kind: "section", id: `section-${row}`, title: name, items: [] };
      const addOn = clean(values.addOn);
      if (addOn) openSection.addOn = addOn;
      blocks.push(openSection);
      continue;
    }

    if (type === "item") {
      if (!openSection) {
        return {
          ok: false,
          warnings,
          failure: {
            kind: "row",
            row,
            problem: "This item comes before any section, so there is nothing for it to belong to.",
          },
        };
      }
      if (!name) {
        return {
          ok: false,
          warnings,
          failure: { kind: "row", row, problem: "This item has no name." },
        };
      }
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
      if (!name) {
        return {
          ok: false,
          warnings,
          failure: { kind: "row", row, problem: "This note has no heading." },
        };
      }
      blocks.push({
        kind: "note",
        id: `note-${row}`,
        heading: name,
        body: clean(values.description),
      });
      openSection = null;
      continue;
    }

    return {
      ok: false,
      warnings,
      failure: {
        kind: "row",
        row,
        problem: `"${clean(values.type)}" is not a row type. Use Section, Item, or Note.`,
      },
    };
  }

  if (blocks.length === 0) {
    return { ok: false, warnings, failure: { kind: "empty" } };
  }

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

// --------------------------------------------------------------- load ---

/**
 * A sheet whose sharing was revoked answers 200 with an HTML sign-in page, not
 * an error. Parsing that would produce a wall of blank-type rows and send the
 * reader hunting for a bad row that does not exist — so the content type is
 * checked before anything else.
 */
async function readTab(url: string, fetcher: Fetcher): Promise<{ csv: string } | SheetFailure> {
  let response: Response;
  try {
    response = await fetcher(url);
  } catch (error) {
    return { kind: "unreachable", detail: error instanceof Error ? error.message : String(error) };
  }

  if (!response.ok) {
    return { kind: "unreachable", detail: `The spreadsheet responded ${response.status}.` };
  }

  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("csv")) {
    return {
      kind: "unreachable",
      detail: "The spreadsheet did not return menu data. Check that it is still shared with anyone who has the link.",
    };
  }

  return { csv: await response.text() };
}

export async function loadMenuContent(
  config: SheetConfig,
  fetcher: Fetcher = (url) => fetch(url, { cache: "no-store" }),
): Promise<SheetResult> {
  const [menu, settings] = await Promise.all([
    readTab(exportUrl(config.sheetId, config.menuGid), fetcher),
    readTab(exportUrl(config.sheetId, config.settingsGid), fetcher),
  ]);

  if (!("csv" in menu)) return { ok: false, failure: menu, warnings: [] };
  if (!("csv" in settings)) return { ok: false, failure: settings, warnings: [] };

  return mapRows(parseRows(menu.csv), parseRows(settings.csv));
}

/** Reads the ids the page was built with. */
export function sheetConfigFromEnv(): SheetConfig | null {
  const sheetId = process.env.NEXT_PUBLIC_SHEET_ID;
  const menuGid = process.env.NEXT_PUBLIC_SHEET_MENU_GID;
  const settingsGid = process.env.NEXT_PUBLIC_SHEET_SETTINGS_GID;
  if (!sheetId || !menuGid || !settingsGid) return null;
  return { sheetId, menuGid, settingsGid };
}

export const __testing = { parseRows, clean, canonicalHeader };
