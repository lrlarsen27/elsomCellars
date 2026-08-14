import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  exportUrl,
  loadMenuContent,
  parseTab,
  SETTINGS_ALIASES,
  type SheetResult,
} from "./sheet";
import { FOOD_SOURCE, mapFoodRows } from "./food-sheet";
import type { MenuContent } from "./schema";
import { csvResponse, stubFetcher, useSheetEnv } from "./sheet-test-support";

const FOOD_ALIASES = FOOD_SOURCE.aliases;

const parseRows = (csv: string) => parseTab(csv, FOOD_ALIASES).rows;
const parseSettingsRows = (csv: string) => parseTab(csv, SETTINGS_ALIASES).rows;

/**
 * Fixtures use CRLF and the sheet's real header spelling — capitals, the
 * "Allergy Tag" column name, and the stray leading space on " Pairing" — so
 * the tests fail if the parser stops tolerating what the sheet actually sends.
 */
const HEADERS = "Type,Name,Price,Description,Allergy Tag,Add on, Pairing";

function menuCsv(...rows: string[]): string {
  return [HEADERS, ...rows].join("\r\n");
}

const SETTINGS_CSV = [
  "key,value",
  "season,Summer 2026",
  'disclaimer,"*Consuming raw or undercooked meats, poultry, seafood, shellfish, or eggs may increase your risk of foodborne illness"',
  "serviceCharge,An 18% service charge is added to all dine-in checks.",
].join("\r\n");

function ok(result: SheetResult<MenuContent>) {
  if (!result.ok) throw new Error(`expected success, got ${JSON.stringify(result.failure)}`);
  return result;
}

function failed(result: SheetResult<MenuContent>) {
  if (result.ok) throw new Error("expected failure, got success");
  return result;
}

function map(menu: string, settings = SETTINGS_CSV): SheetResult<MenuContent> {
  return mapFoodRows(parseRows(menu), parseSettingsRows(settings));
}


/** The food menu's real source spec, so the tests read it the way the page does. */
const CONFIG = {
  sheetId: "sheet-1",
  menuGid: "0",
  settingsGid: "99",
  source: FOOD_SOURCE,
};

// ------------------------------------------------------------- shape ---

describe("mapping the sheet", () => {
  it("keeps blocks in sheet order", () => {
    const result = ok(
      map(
        menuCsv(
          "Section,Appetizers,,,,,",
          "Item,Blue Cheese Stuffed Dates,$8,Dates,GF,,",
          "Section,Salads,,,,,",
          "Item,Peach panzanella,$16,Peaches,,,",
          "Note,A note from Chef Dom,,Everything is made in house,,,",
        ),
      ),
    );

    expect(result.content.blocks.map((b) => b.kind)).toEqual(["section", "section", "note"]);
    expect(result.content.blocks[0]).toMatchObject({ title: "Appetizers" });
    expect(result.content.blocks[2]).toMatchObject({
      kind: "note",
      heading: "A note from Chef Dom",
      body: "Everything is made in house",
    });
  });

  it("attaches an item to the nearest section above it", () => {
    const result = ok(
      map(
        menuCsv(
          "Section,Appetizers,,,,,",
          "Item,Dates,$8,,,,",
          "Section,Salads,,,,,",
          "Item,Panzanella,$16,,,,",
          "Item,Strawberry & goat cheese,$16,,,,",
        ),
      ),
    );

    const [appetizers, salads] = result.content.blocks;
    expect(appetizers.kind === "section" && appetizers.items.map((i) => i.name)).toEqual(["Dates"]);
    expect(salads.kind === "section" && salads.items.map((i) => i.name)).toEqual([
      "Panzanella",
      "Strawberry & goat cheese",
    ]);
  });

  it("reports an item that appears before any section, naming its row", () => {
    const result = failed(map(menuCsv("Item,Orphan,$8,,,,", "Section,Appetizers,,,,,")));

    expect(result.failure).toMatchObject({ kind: "row", row: 2 });
    expect(result.failure.kind === "row" && result.failure.problem).toContain("before any section");
  });

  it("carries a section-level add-on", () => {
    const result = ok(
      map(menuCsv('Section,Salads,,,,"""+ Grilled Chicken $6""",', "Item,Panzanella,$16,,,,")),
    );

    const section = result.content.blocks[0];
    expect(section.kind === "section" && section.addOn).toBe("+ Grilled Chicken $6");
  });
});

// ------------------------------------------------------------ parsing ---

describe("parsing what the sheet actually sends", () => {
  it("keeps a newline inside a description", () => {
    const result = ok(
      map(
        menuCsv(
          "Section,Shareables,,,,,",
          'Item,Popcorn,$7,"Organic corn kettle-popped in\ncoconut oil, tossed with cheddar",GF,,',
        ),
      ),
    );

    const section = result.content.blocks[0];
    const description = section.kind === "section" ? section.items[0].description : "";
    expect(description).toContain("\n");
    expect(description).toBe("Organic corn kettle-popped in\ncoconut oil, tossed with cheddar");
  });

  it("does not shift columns when a name contains a comma", () => {
    const result = ok(
      map(menuCsv("Section,Plates,,,,,", '"Item","Cheese, bread & jam","$22","Shared",GF,,')),
    );

    const section = result.content.blocks[0];
    expect(section.kind === "section" && section.items[0]).toMatchObject({
      name: "Cheese, bread & jam",
      price: "$22",
      description: "Shared",
    });
  });

  it("leaves free-text prices exactly as typed", () => {
    const result = ok(
      map(
        menuCsv(
          "Section,Wine,,,,,",
          "Item,Albarino,$14 / $48,,,,",
          "Item,Popcorn,$8.00,,,,",
          "Item,Bread,,,,,",
        ),
      ),
    );

    const section = result.content.blocks[0];
    const prices = section.kind === "section" ? section.items.map((i) => i.price) : [];
    expect(prices).toEqual(["$14 / $48", "$8.00", ""]);
  });

  it("strips the quotes Sheets forces onto a leading + or -", () => {
    const result = ok(
      map(
        menuCsv(
          "Section,Desserts,,,,,",
          'Item,Torta,$10,Almond cake,GF,"""- add a scoop of ice cream +$3""",',
        ),
      ),
    );

    const section = result.content.blocks[0];
    expect(section.kind === "section" && section.items[0].addOn).toBe(
      "- add a scoop of ice cream +$3",
    );
  });

  it("does not leave a carriage return on the last field of a CRLF row", () => {
    const result = ok(
      map(menuCsv("Section,Plates,,,,,", "Item,Toast,$14,Ricotta,GF,,Pairs with 2024 Albarino")),
    );

    const section = result.content.blocks[0];
    expect(section.kind === "section" && section.items[0].pairing).toBe("Pairs with 2024 Albarino");
  });

  it("maps a row whose trailing empty columns were omitted", () => {
    const result = ok(map(menuCsv("Section,Plates", "Item,Toast,$14")));

    const section = result.content.blocks[0];
    expect(section.kind === "section" && section.items[0]).toMatchObject({
      name: "Toast",
      price: "$14",
      pairing: "",
    });
  });
});

// --------------------------------------------------------------- tags ---

describe("dietary tags", () => {
  it("reads several tags from one cell", () => {
    const result = ok(
      map(menuCsv("Section,Desserts,,,,,", 'Item,Sundae,$11,Ice cream,"GF, DF",,')),
    );

    const section = result.content.blocks[0];
    expect(section.kind === "section" && section.items[0].tags).toEqual(["gf", "df"]);
  });

  it("drops a tag outside the vocabulary and warns, naming the row", () => {
    const result = ok(
      map(menuCsv("Section,Desserts,,,,,", 'Item,Brownie,$14,Hot brownie,"GF, DF, V, Nut free",,')),
    );

    const section = result.content.blocks[0];
    expect(section.kind === "section" && section.items[0].tags).toEqual(["gf", "df", "v"]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({ row: 3 });
    expect(result.warnings[0].problem).toContain("Nut free");
  });
});

// ------------------------------------------------------------ failures ---

describe("failures", () => {
  it("reports a row with no type, naming its row", () => {
    const result = failed(map(menuCsv("Section,Plates,,,,,", ",Mystery,$8,,,,")));
    expect(result.failure).toMatchObject({ kind: "row", row: 3 });
  });

  it("reports an unrecognised type", () => {
    const result = failed(map(menuCsv("Heading,Plates,,,,,")));
    expect(result.failure.kind === "row" && result.failure.problem).toContain("Heading");
  });

  it("reports an empty menu rather than returning zero blocks", () => {
    const result = failed(map(menuCsv()));
    expect(result.failure).toEqual({ kind: "empty" });
  });

  it("treats a missing settings key as an empty string", () => {
    const result = ok(map(menuCsv("Section,Plates,,,,,", "Item,Toast,$14,,,,"), "key,value\r\nseason,Fall 2026"));

    expect(result.content.season).toBe("Fall 2026");
    expect(result.content.disclaimer).toBe("");
    expect(result.content.serviceCharge).toBe("");
  });
});

// ------------------------------------------------------------ loading ---

describe("loading", () => {
  it("builds the export URL for a tab", () => {
    expect(exportUrl("abc", "42")).toBe(
      "https://docs.google.com/spreadsheets/d/abc/export?format=csv&gid=42",
    );
  });

  it("returns unreachable when the fetch rejects", async () => {
    const result = failed(
      await loadMenuContent(CONFIG, stubFetcher({ "0": new Error("offline"), "99": new Error("offline") })),
    );
    expect(result.failure.kind).toBe("unreachable");
  });

  it("returns unreachable on a non-200 response", async () => {
    const result = failed(
      await loadMenuContent(
        CONFIG,
        stubFetcher({
          "0": new Response("nope", { status: 404, headers: { "content-type": "text/csv" } }),
          "99": csvResponse(SETTINGS_CSV),
        }),
      ),
    );
    expect(result.failure).toMatchObject({ kind: "unreachable" });
    expect(result.failure.kind === "unreachable" && result.failure.detail).toContain("404");
  });

  it("returns unreachable when a 200 carries HTML instead of CSV", async () => {
    const result = failed(
      await loadMenuContent(
        CONFIG,
        stubFetcher({
          "0": new Response("<html>Sign in</html>", {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          }),
          "99": csvResponse(SETTINGS_CSV),
        }),
      ),
    );
    expect(result.failure).toMatchObject({ kind: "unreachable" });
    expect(result.failure.kind === "unreachable" && result.failure.detail).toContain("shared");
  });

  it("fails when settings is unreachable even though the menu loaded", async () => {
    const result = failed(
      await loadMenuContent(
        CONFIG,
        stubFetcher({
          "0": csvResponse(menuCsv("Section,Plates,,,,,", "Item,Toast,$14,,,,")),
          "99": new Response("", { status: 500, headers: { "content-type": "text/csv" } }),
        }),
      ),
    );
    expect(result.failure.kind).toBe("unreachable");
  });

  it("returns the empty failure for a header row with no data", async () => {
    const result = failed(
      await loadMenuContent(
        CONFIG,
        stubFetcher({ "0": csvResponse(menuCsv()), "99": csvResponse(SETTINGS_CSV) }),
      ),
    );
    expect(result.failure).toEqual({ kind: "empty" });
  });
});

// ----------------------------------------------------------- structure ---

/**
 * Two failures that degrade every row at once while reporting nothing: a column
 * the mapper reads that row 1 does not carry, and a settings key the menu
 * prints that the Settings tab does not hold. Both are checked before any
 * content row is read, so the message points at the header or the key rather
 * than at a dish.
 */
describe("the tab's structure", () => {
  it("reports a column the mapper reads that the header row does not carry", async () => {
    const csv = [
      "Type,Name,Price,Description,Allergy Tag, Pairing",
      "Section,Plates,,,,",
      "Item,Toast,$14,Ricotta,GF,Pairs with 2024 Albarino",
    ].join("\r\n");

    const result = failed(
      await loadMenuContent(
        CONFIG,
        stubFetcher({ "0": csvResponse(csv), "99": csvResponse(SETTINGS_CSV) }),
      ),
    );

    expect(result.failure).toMatchObject({ kind: "row", row: 1 });
    expect(result.failure.kind === "row" && result.failure.problem).toContain("Add on");
  });

  it("reports a required settings key the Settings tab does not carry", async () => {
    const settings = ["key,value", "season,Summer 2026", "disclaimer,*Consuming raw"].join("\r\n");

    const result = failed(
      await loadMenuContent(
        CONFIG,
        stubFetcher({
          "0": csvResponse(menuCsv("Section,Plates,,,,,", "Item,Toast,$14,,,,")),
          "99": csvResponse(settings),
        }),
      ),
    );

    expect(result.failure).toMatchObject({
      kind: "setting",
      tab: "Settings",
      key: "serviceCharge",
    });
  });

  it("reports a required settings key that is present with a blank value", async () => {
    // The row exists, so a key check alone would pass it — and the menu would
    // print the empty line the check exists to stop. Same failure shape as the
    // absent-key case above, deliberately: to a reader the two are one problem.
    const settings = [
      "key,value",
      "season,Summer 2026",
      "disclaimer,*Consuming raw",
      "serviceCharge, ",
    ].join("\r\n");

    const result = failed(
      await loadMenuContent(
        CONFIG,
        stubFetcher({
          "0": csvResponse(menuCsv("Section,Plates,,,,,", "Item,Toast,$14,,,,")),
          "99": csvResponse(settings),
        }),
      ),
    );

    expect(result.failure).toMatchObject({
      kind: "setting",
      tab: "Settings",
      key: "serviceCharge",
    });
  });

  it("accepts a header row written for people, with capitals, stray spaces and synonyms", async () => {
    const csv = [
      " TYPE ,name,  Price ,DESCRIPTION,Tags, add_on ,Pairing",
      "Section,Plates,,,,,",
      "Item,Toast,$14,Ricotta,GF,,",
    ].join("\r\n");

    const result = ok(
      await loadMenuContent(
        CONFIG,
        stubFetcher({ "0": csvResponse(csv), "99": csvResponse(SETTINGS_CSV) }),
      ),
    );

    const section = result.content.blocks[0];
    expect(section.kind === "section" && section.items[0]).toMatchObject({
      name: "Toast",
      price: "$14",
    });
  });

  it("leaves a settings key this menu does not require as an empty string", async () => {
    const result = ok(
      await loadMenuContent(
        { ...CONFIG, source: { ...CONFIG.source, requiredSettings: ["season"] } },
        stubFetcher({
          "0": csvResponse(menuCsv("Section,Plates,,,,,", "Item,Toast,$14,,,,")),
          "99": csvResponse("key,value\r\nseason,Fall 2026"),
        }),
      ),
    );

    expect(result.content.season).toBe("Fall 2026");
    expect(result.content.disclaimer).toBe("");
    expect(result.content.serviceCharge).toBe("");
  });

  it("names the tab a bad row came from, not only its number", async () => {
    const result = failed(
      await loadMenuContent(
        CONFIG,
        stubFetcher({
          "0": csvResponse(menuCsv("Item,Orphan,$8,,,,")),
          "99": csvResponse(SETTINGS_CSV),
        }),
      ),
    );

    expect(result.failure).toMatchObject({ kind: "row", tab: "Food Menu", row: 2 });
  });
});

// ------------------------------------------------------------- config ---

/**
 * Resolution is per menu, and the point of these is what does *not* happen: an
 * unset tab id fails the menu it belongs to and leaves every other menu
 * resolving. The bundle reads its variable when the module loads, so each of
 * these re-imports it against the environment the test just set.
 */
describe("resolving a menu's tabs", () => {
  const env = useSheetEnv({
    NEXT_PUBLIC_SHEET_ID: "sheet-1",
    NEXT_PUBLIC_SHEET_SETTINGS_GID: "99",
    NEXT_PUBLIC_SHEET_MENU_GID: "0",
    // The wine id is left out on purpose: a menu nobody has wired up yet is
    // the case this seam exists for.
  });

  beforeEach(env.apply);
  afterEach(() => {
    env.restore();
    vi.resetModules();
  });

  /** A menu reads its tab id when its module loads, so each test re-imports
   *  against the environment it just set. */
  async function reload() {
    vi.resetModules();
    const [sheet, kinds] = await Promise.all([import("./sheet"), import("@/menus/kinds")]);
    return { ...sheet, ...kinds };
  }

  it("resolves the food menu while no other menu's tab id is set", async () => {
    const { menuKindFor, sheetConfigFromEnv } = await reload();

    const kind = menuKindFor("food");
    expect(kind).toBeDefined();

    const resolved = sheetConfigFromEnv(kind!.source);
    expect(resolved.ok).toBe(true);
    expect(resolved.ok && resolved.config).toMatchObject({
      sheetId: "sheet-1",
      menuGid: "0",
      settingsGid: "99",
    });
  });

  it("has no bundle for a menu the site cannot read, rather than answering with the food menu's", async () => {
    const { menuKindFor } = await reload();

    // Wine is a registered bundle now, so the unreadable case is an id nobody
    // has built. It must not resolve to the food menu's reader.
    expect(menuKindFor("dessert")).toBeUndefined();

    // The two ids that make `menuEntry`'s `hasOwnProperty` guard the reason
    // this passes rather than an incidental detail: every object inherits both,
    // so a plain `table[menuId]` lookup would hand the route a function here
    // and the shell would try to place a menu made of `Object.prototype`.
    expect(menuKindFor("constructor")).toBeUndefined();
    expect(menuKindFor("toString")).toBeUndefined();

    expect(menuKindFor("food")).toBeDefined();
  });

  it("describes the menu whose tab id is unset, naming it and its variable", async () => {
    delete process.env.NEXT_PUBLIC_SHEET_MENU_GID;
    const { menuKindFor, sheetConfigFromEnv } = await reload();

    const resolved = sheetConfigFromEnv(menuKindFor("food")!.source);

    expect(resolved.ok).toBe(false);
    expect(!resolved.ok && resolved.failure).toMatchObject({ kind: "unconfigured", menu: "food" });
    expect(
      !resolved.ok && resolved.failure.kind === "unconfigured" && resolved.failure.detail,
    ).toContain("NEXT_PUBLIC_SHEET_MENU_GID");
  });

  it("calls a build with no spreadsheet unconfigured rather than unreachable", async () => {
    delete process.env.NEXT_PUBLIC_SHEET_ID;
    const { menuKindFor, sheetConfigFromEnv } = await reload();

    const resolved = sheetConfigFromEnv(menuKindFor("food")!.source);

    // Not `unreachable`: that branch offers a retry, and retrying cannot change
    // a value that was baked in at build time.
    expect(!resolved.ok && resolved.failure.kind).toBe("unconfigured");
  });
});

// --------------------------------------------------------- determinism ---

describe("ids", () => {
  it("maps the same fixture to the same ids every time", () => {
    const csv = menuCsv("Section,Plates,,,,,", "Item,Toast,$14,,,,", "Note,Chef,,Body,,,");

    const first = ok(map(csv));
    const second = ok(map(csv));

    const ids = (result: ReturnType<typeof ok>) =>
      result.content.blocks.flatMap((b) =>
        b.kind === "section" ? [b.id, ...b.items.map((i) => i.id)] : [b.id],
      );

    expect(ids(first)).toEqual(ids(second));
    expect(ids(first)).toEqual(["section-2", "item-3", "note-4"]);
  });
});
