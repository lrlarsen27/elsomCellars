import Papa from "papaparse";

/**
 * Reads a menu's content from a Google Sheet.
 *
 * This module is the shared half and it names no menu. Fetching, CSV parsing,
 * the structural checks and the failure taxonomy live here; the header
 * vocabulary and the row grammar belong to each menu and live beside its
 * mapper (`food-sheet.ts`, and a wine equivalent later). Keeping the alias
 * table out of here matters: shared aliases would make one menu's column names
 * silently valid on the other menu's tab.
 *
 * Every menu is two tabs and two requests: its own tab, plus the `Settings` tab
 * the whole spreadsheet shares. The export endpoint returns one tab per call.
 *
 * Nothing here throws past the caller. Every failure is described, and a
 * failure that came from a row names both the tab and the spreadsheet's own row
 * number, so the person fixing it can go straight there. With two menus the
 * spreadsheet has four tabs, and a bare row number no longer says where to go.
 */

export type SheetFailure =
  /** The tab could not be read at all — network, permissions, or wrong id. */
  | { kind: "unreachable"; detail: string }
  /** Read fine, but there is no menu in it. A cleared tab must not print blank. */
  | { kind: "empty" }
  /** One row could not be interpreted. `row` is the spreadsheet's own row number. */
  | { kind: "row"; tab: string; row: number; problem: string }
  /** A settings key this menu prints is not in the Settings tab. No row to name. */
  | { kind: "setting"; tab: string; key: string; problem: string }
  /**
   * This menu has nothing to read from — the build carried no tab id for it.
   * Its own kind rather than `unreachable`, because retrying cannot change a
   * value that was baked in at build time.
   */
  | { kind: "unconfigured"; menu: string; detail: string };

/** Non-blocking: the menu still renders, but something was dropped. */
export type SheetWarning = { row: number; problem: string };

/**
 * Parameterised by content type: the transport is the same for every menu, but
 * what a mapper produces is that menu's own shape.
 */
export type SheetResult<C> =
  | { ok: true; content: C; warnings: SheetWarning[] }
  | { ok: false; failure: SheetFailure; warnings: SheetWarning[] };

/** One spreadsheet row, keyed by canonical column name. */
export type SheetRow = { values: Record<string, string>; row: number };

/**
 * Everything the transport needs to read one menu: where its rows are, what its
 * columns are called, what it cannot do without, and how a row becomes content.
 */
export type MenuSource<C> = {
  /** Named when this menu is unconfigured. */
  menuId: string;
  /** How the tab is described in failure messages, e.g. "Food Menu". */
  tabLabel: string;
  /**
   * The tab's `gid`. Undefined when the build carried none — which fails this
   * menu only, and leaves every other menu resolvable.
   */
  tabId: string | undefined;
  /** The variable that carries it, named in the message so the fix is obvious. */
  tabIdVariable: string;
  /** This menu's header vocabulary: canonicalised spelling to column name. */
  aliases: Readonly<Record<string, string>>;
  /**
   * Columns the mapper reads, spelled as the editor writes them. Checked
   * against the header row before any content row, so a missing one is
   * reported against row 1 rather than silently emptying every value below it.
   */
  requiredColumns: readonly string[];
  /** Settings keys this menu prints. An absent one blocks rather than printing blank. */
  requiredSettings: readonly string[];
  map: (menuRows: SheetRow[], settingsRows: SheetRow[]) => SheetResult<C>;
};

export type SheetConfig<C> = {
  sheetId: string;
  menuGid: string;
  settingsGid: string;
  source: MenuSource<C>;
};

export type SheetConfigResult<C> =
  | { ok: true; config: SheetConfig<C> }
  | { ok: false; failure: SheetFailure };

/** Injectable so tests never touch the network. */
export type Fetcher = (url: string) => Promise<Response>;

/** Shared by every menu — one settings tab for the whole spreadsheet. */
export const SETTINGS_TAB_LABEL = "Settings";

export const SETTINGS_ALIASES: Record<string, string> = { key: "key", value: "value" };

// --------------------------------------------------------------- urls ---

export function exportUrl(sheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/**
 * The same tab as a person opens it, rather than as the app reads it.
 *
 * The gid is written twice on purpose: Sheets selects the tab from the `?gid=`
 * query, and older links carry it in the `#gid=` fragment. Both are honoured,
 * and sending both means the link lands on this menu's own tab rather than on
 * whichever tab the spreadsheet happens to open with.
 */
export function tabUrl(sheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit?gid=${gid}#gid=${gid}`;
}

// ------------------------------------------------------------ columns ---

/**
 * The sheet's headers are written for people, so they carry capitals and stray
 * spaces ("Add on", " Pairing"). Canonicalise before matching, and let each
 * menu supply the synonyms it accepts rather than making the editor match a
 * machine's spelling.
 */
export function canonicalHeader(header: string, aliases: Readonly<Record<string, string>>): string {
  const cleaned = header.trim().toLowerCase().replace(/\s+/g, " ");
  return aliases[cleaned] ?? cleaned;
}

/**
 * Sheets treats a leading `+` or `-` as the start of a formula, so add-on cells
 * like `+ Grilled Chicken $6` get typed wrapped in quotes to escape that. The
 * quotes are a workaround, not content — strip a matched pair.
 */
export function clean(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

// -------------------------------------------------------------- parse ---

export type ParsedTab = { headers: string[]; rows: SheetRow[] };

/**
 * Empty lines are kept during parsing and filtered afterwards, so a row number
 * in an error message matches the row number in the spreadsheet. Skipping them
 * inside the parser would shift every later row and send people to the wrong
 * place.
 *
 * The header row comes back alongside the rows, because the checks that read it
 * have to run before any content row is looked at.
 */
export function parseTab(csv: string, aliases: Readonly<Record<string, string>>): ParsedTab {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    delimiter: ",",
    skipEmptyLines: false,
    dynamicTyping: false,
    transformHeader: (header) => canonicalHeader(header, aliases),
  });

  return {
    headers: (parsed.meta.fields ?? []).filter((field) => field !== ""),
    rows: parsed.data
      .map((values, index) => ({ values, row: index + 2 })) // +1 for zero-index, +1 for the header row
      .filter(({ values }) => Object.values(values).some((v) => (v ?? "").trim() !== "")),
  };
}

// ---------------------------------------------------------- structure ---

function columnPhrase(missing: string[]): string {
  const quoted = missing.map((value) => `"${value}"`);
  if (quoted.length === 1) return `${quoted[0]} column`;
  return `${quoted.slice(0, -1).join(", ")} and ${quoted[quoted.length - 1]} columns`;
}

/** Compared after canonicalisation, so capitals, stray spaces and synonyms all match. */
function missingColumns<C>(headers: string[], source: MenuSource<C>): string[] {
  const present = new Set(headers);
  return source.requiredColumns.filter(
    (label) => !present.has(canonicalHeader(label, source.aliases)),
  );
}

/**
 * A key present with a blank value counts as missing: the thing being closed
 * here is a footer line that prints empty, and a blank cell prints exactly the
 * same empty line as an absent row.
 */
function missingSettings<C>(rows: SheetRow[], source: MenuSource<C>): string[] {
  const present = new Set<string>();
  for (const { values } of rows) {
    const key = clean(values.key);
    if (key && clean(values.value)) present.add(key);
  }
  return source.requiredSettings.filter((key) => !present.has(key));
}

function checkStructure<C>(
  menuTab: ParsedTab,
  settingsTab: ParsedTab,
  source: MenuSource<C>,
): SheetFailure | null {
  // A tab with nothing in it at all is "empty", and the mapper says so with a
  // better message than a list of every column it wanted.
  if (menuTab.headers.length > 0 || menuTab.rows.length > 0) {
    const missing = missingColumns(menuTab.headers, source);
    if (missing.length > 0) {
      return {
        kind: "row",
        tab: source.tabLabel,
        row: 1,
        problem: `The header row has no ${columnPhrase(missing)}. Add ${missing.length === 1 ? "it" : "them"} to row 1 of the ${source.tabLabel} tab, or check the spelling.`,
      };
    }
  }

  const [key] = missingSettings(settingsTab.rows, source);
  if (key) {
    return {
      kind: "setting",
      tab: SETTINGS_TAB_LABEL,
      key,
      problem: `The ${SETTINGS_TAB_LABEL} tab has no value for "${key}". This menu prints it, so it can't be left out.`,
    };
  }

  return null;
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

export async function loadMenuContent<C>(
  config: SheetConfig<C>,
  fetcher: Fetcher = (url) => fetch(url, { cache: "no-store" }),
): Promise<SheetResult<C>> {
  const { source } = config;

  const [menu, settings] = await Promise.all([
    readTab(exportUrl(config.sheetId, config.menuGid), fetcher),
    readTab(exportUrl(config.sheetId, config.settingsGid), fetcher),
  ]);

  if (!("csv" in menu)) return { ok: false, failure: menu, warnings: [] };
  if (!("csv" in settings)) return { ok: false, failure: settings, warnings: [] };

  const menuTab = parseTab(menu.csv, source.aliases);
  const settingsTab = parseTab(settings.csv, SETTINGS_ALIASES);

  const structural = checkStructure(menuTab, settingsTab, source);
  if (structural) return { ok: false, failure: structural, warnings: [] };

  return source.map(menuTab.rows, settingsTab.rows);
}

/**
 * Reads the ids the page was built with, for one menu.
 *
 * The spreadsheet id and the settings tab are shared, so they are read here;
 * the menu's own tab arrives on its source. That split is the point: an unset
 * wine tab fails the wine page and leaves the food page resolving exactly as
 * before.
 *
 * Both variables are read by literal property access. Next only inlines
 * `process.env.NEXT_PUBLIC_*` where it can see the name in the source, so a
 * table looked up by variable name would be `undefined` in the browser.
 */
export function sheetConfigFromEnv<C>(source: MenuSource<C>): SheetConfigResult<C> {
  const sheetId = process.env.NEXT_PUBLIC_SHEET_ID;
  const settingsGid = process.env.NEXT_PUBLIC_SHEET_SETTINGS_GID;

  if (!sheetId || !settingsGid) {
    return {
      ok: false,
      failure: {
        kind: "unconfigured",
        menu: source.menuId,
        detail:
          "This site was built without a spreadsheet to read. Set NEXT_PUBLIC_SHEET_ID and NEXT_PUBLIC_SHEET_SETTINGS_GID, then build again. See menus/README.md.",
      },
    };
  }

  if (!source.tabId) {
    return {
      ok: false,
      failure: {
        kind: "unconfigured",
        menu: source.menuId,
        detail: `The ${source.menuId} menu has no tab to read. Set ${source.tabIdVariable} to the gid of its tab, then build again.`,
      },
    };
  }

  return { ok: true, config: { sheetId, menuGid: source.tabId, settingsGid, source } };
}
