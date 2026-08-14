import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadMenuContent, parseTab, SETTINGS_ALIASES, type SheetResult } from "./sheet";
import { mapWineRows, WINE_SOURCE } from "./wine-sheet";
import { WINE_FEATURE_CHARS_PER_LINE } from "@/menus/templates/wine-layout";
import type { WineContent } from "./schema";
import { csvResponse, stubFetcher, useSheetEnv } from "./sheet-test-support";

/**
 * The primary fixture is the live `Wine Menu` tab's own CSV export, byte for
 * byte: CRLF between records, the quoted commas inside tasting notes, the
 * embedded newline in The Keeper's note, and the `Experience` row sitting above
 * the first section. Synthetic rows are used only for the cases the live tab
 * does not contain — a second experience row, a `note` row copied across from
 * the food tab, a wine with no price at all.
 */
const HEADERS = "Type,Name,Bottle price,Glass price,Location,Tasting notes";

function wineCsv(...rows: string[]): string {
  return [HEADERS, ...rows].join("\r\n");
}

/**
 * Row numbers are the spreadsheet's own, so they are worth keeping straight:
 * the header is row 1, the experience row is row 2, and The Keeper — whose note
 * carries a newline inside its quotes — is row 17 without shifting the Specialty
 * section below it.
 */
const LIVE_CSV = wineCsv(
  "Experience,Tasting Experience,$20,,,Four 1.5 oz our from our current selection. Ask your server what is available today",
  "Section,Whites & Rosé,,,,",
  'Item,2023 Albarino,$30,$12,Yakima Valley,"Green apple, citrus & tropical fruit"',
  'Item,2023 Rosé,$28,$12,Columbia Valley,"Apple, grape fruit, & strawberries"',
  "Section,Reds,,,,",
  'Item,2022 cinsault,$20,$16,Yakima Valley,"Cinnamon orange, raspberry, & vanilla"',
  'Item,2022 Grenache,$28,,Horse Heaven Hills,"Raspberry, cherry, & rose petals"',
  'Item,2022 tempranillo,$30,,Rattlesnack Hills,"Cranberry, cocao, & black cherry"',
  'Item,2019 Malbec,$45,,Horse Heaven Hills,"Raspberry, cherry & white pepper"',
  'Item,2020 Malbec,$45,$16,Horse Heaven Hills,"Raspberry, dark cherry & white pepper"',
  'Item,2021 Syrah,$55,,Horse Heaven Hills,"Cocao, blueberry, & earth"',
  'Item,2020 Cabernet sauvignon,$65,$20,Horse Heaven Hills,"Cocao, blueberry, & earth"',
  "Section,Blends,,,,",
  'Item,2018 Isabella,$55,,Red Mountain,"Marionberry, strawberry, & fennel"',
  'Item,2019 Isabella,$48,$16,Columbia Valley,"White pepper, huckleberry, & green pepper"',
  'Item,The Keeper,$45,,Columbia Valley,"Collaboration with Sounders goal keeper,\nStefan Frei"',
  "Section,Specialty,,,,",
  'Item,Vermouth,$30,$12,,"Dozen + herbs, spices, roots & flowers"',
);

const SETTINGS_CSV = [
  "key,value",
  "season,Summer 2026",
  "serviceCharge,An 18% service charge is added to all dine-in checks and retained by Elsom Cellars to support our service staff team.",
  "wineFooter,21+ Alcohol served to guest 21 and over. Please enjoy reponsibly.",
  'disclaimer,"*Consuming raw or undercooked meats, poultry, seafood, shellfish, or eggs may increase your risk of foodborne illness"',
].join("\r\n");

const parseRows = (csv: string) => parseTab(csv, WINE_SOURCE.aliases).rows;
const parseSettingsRows = (csv: string) => parseTab(csv, SETTINGS_ALIASES).rows;

function ok(result: SheetResult<WineContent>) {
  if (!result.ok) throw new Error(`expected success, got ${JSON.stringify(result.failure)}`);
  return result;
}

function failed(result: SheetResult<WineContent>) {
  if (result.ok) throw new Error("expected failure, got success");
  return result;
}

function map(menu: string, settings = SETTINGS_CSV): SheetResult<WineContent> {
  return mapWineRows(parseRows(menu), parseSettingsRows(settings));
}


const CONFIG = { sheetId: "sheet-1", menuGid: "7", settingsGid: "99", source: WINE_SOURCE };

// -------------------------------------------------------------- shape ---

describe("mapping the wine tab", () => {
  it("keeps sections in sheet order", () => {
    const result = ok(map(LIVE_CSV));

    expect(result.content.blocks.map((block) => block.title)).toEqual([
      "Whites & Rosé",
      "Reds",
      "Blends",
      "Specialty",
    ]);
    expect(result.content.blocks.every((block) => block.kind === "section")).toBe(true);
  });

  it("attaches a wine to the nearest section above it", () => {
    const result = ok(map(LIVE_CSV));
    const [whites, reds, blends, specialty] = result.content.blocks;

    expect(whites.wines.map((wine) => wine.name)).toEqual(["2023 Albarino", "2023 Rosé"]);
    expect(reds.wines).toHaveLength(7);
    expect(blends.wines.map((wine) => wine.name)).toEqual([
      "2018 Isabella",
      "2019 Isabella",
      "The Keeper",
    ]);
    expect(specialty.wines.map((wine) => wine.name)).toEqual(["Vermouth"]);
  });

  it("carries every column of a wine", () => {
    const result = ok(map(LIVE_CSV));

    expect(result.content.blocks[0].wines[0]).toMatchObject({
      name: "2023 Albarino",
      bottlePrice: "$30",
      glassPrice: "$12",
      location: "Yakima Valley",
      tastingNotes: "Green apple, citrus & tropical fruit",
    });
  });

  it("reports a wine that appears before any section, naming its row", () => {
    const result = failed(
      map(wineCsv("Item,Orphan,$30,,Yakima Valley,Notes", "Section,Reds,,,,")),
    );

    expect(result.failure).toMatchObject({ kind: "row", tab: "Wine Menu", row: 2 });
    expect(result.failure.kind === "row" && result.failure.problem).toContain("before any section");
  });
});

// ------------------------------------------------------------- prices ---

/**
 * A bottle-only reserve and a glass-only pour are both ordinary entries. A wine
 * with neither is not — it still maps, because a missing price is not worth
 * blanking a menu over, but it warns so nobody prints it by accident.
 */
describe("the two prices", () => {
  it("maps a wine with only a bottle price, leaving the glass price empty", () => {
    const result = ok(map(LIVE_CSV));
    const grenache = result.content.blocks[1].wines[1];

    expect(grenache).toMatchObject({
      name: "2022 Grenache",
      bottlePrice: "$28",
      glassPrice: "",
    });
    expect(result.warnings).toEqual([]);
  });

  it("maps a wine with only a glass price, leaving the bottle price empty", () => {
    const result = ok(
      map(wineCsv("Section,Reds,,,,", "Item,2022 Grenache,,$16,Horse Heaven Hills,Raspberry")),
    );

    expect(result.content.blocks[0].wines[0]).toMatchObject({
      bottlePrice: "",
      glassPrice: "$16",
    });
    expect(result.warnings).toEqual([]);
  });

  it("maps a wine with neither price and warns, naming its row", () => {
    const result = ok(
      map(wineCsv("Section,Reds,,,,", "Item,2021 Syrah,,,Red Mountain,Cocao & earth")),
    );

    expect(result.content.blocks[0].wines[0]).toMatchObject({
      name: "2021 Syrah",
      bottlePrice: "",
      glassPrice: "",
    });
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({ row: 3 });
    expect(result.warnings[0].problem).toContain("2021 Syrah");
  });

  it("leaves free-text prices exactly as typed", () => {
    const result = ok(map(LIVE_CSV));
    const prices = result.content.blocks[1].wines.map((wine) => wine.bottlePrice);

    expect(prices).toEqual(["$20", "$28", "$30", "$45", "$45", "$55", "$65"]);
  });
});

// ------------------------------------------------------------ parsing ---

describe("parsing what the wine tab actually sends", () => {
  it("keeps a newline inside a tasting note", () => {
    const result = ok(map(LIVE_CSV));
    const keeper = result.content.blocks[2].wines[2];

    expect(keeper.name).toBe("The Keeper");
    expect(keeper.tastingNotes).toContain("\n");
    expect(keeper.tastingNotes).toBe("Collaboration with Sounders goal keeper,\nStefan Frei");
  });

  it("does not shift later columns when a name contains a comma", () => {
    const result = ok(
      map(
        wineCsv(
          "Section,Blends,,,,",
          '"Item","2021 Syrah, Reserve","$55","$18","Red Mountain","Cocao, blueberry, & earth"',
        ),
      ),
    );

    expect(result.content.blocks[0].wines[0]).toMatchObject({
      name: "2021 Syrah, Reserve",
      bottlePrice: "$55",
      glassPrice: "$18",
      location: "Red Mountain",
      tastingNotes: "Cocao, blueberry, & earth",
    });
  });

  it("does not leave a carriage return on the last field of a CRLF row", () => {
    const result = ok(map(LIVE_CSV));

    expect(result.content.blocks[1].wines[0].tastingNotes).toBe(
      "Cinnamon orange, raspberry, & vanilla",
    );
  });

  it("maps a wine with no location", () => {
    const result = ok(map(LIVE_CSV));

    expect(result.content.blocks[3].wines[0]).toMatchObject({
      name: "Vermouth",
      location: "",
    });
  });

  it("maps a row whose trailing empty columns were omitted", () => {
    const result = ok(map(wineCsv("Section,Reds", "Item,2021 Syrah,$55")));

    expect(result.content.blocks[0].wines[0]).toMatchObject({
      name: "2021 Syrah",
      bottlePrice: "$55",
      glassPrice: "",
      location: "",
      tastingNotes: "",
    });
  });
});

// --------------------------------------------------- tasting experience ---

/**
 * The one row that does not flow into a column: it prints in a box across the
 * top, so it is held beside the ordered block list rather than in it, and it is
 * the only row type allowed above the first section.
 */
describe("the tasting experience row", () => {
  it("maps to its own block carrying a title, a price and its copy", () => {
    const result = ok(map(LIVE_CSV));

    expect(result.content.experience).toMatchObject({
      title: "Tasting Experience",
      price: "$20",
      description:
        "Four 1.5 oz our from our current selection. Ask your server what is available today",
    });
  });

  it("is accepted above the first section, and stays out of the block list", () => {
    const result = ok(map(LIVE_CSV));

    expect(result.content.experience).toBeDefined();
    expect(result.content.blocks.map((block) => block.title)).not.toContain("Tasting Experience");
  });

  /**
   * The box the description prints in is a fixed 76pt frame in both renderers,
   * and its copy is an ordinary spreadsheet cell the winery can lengthen at any
   * time. Nothing flows around it and the column budget never sees it, so an
   * over-long description prints straight over the border while the fit gate
   * still reports the sheet as fitting. Warning, not failing: the precedent is
   * the priceless wine above — it still prints, and this says so first.
   */
  it("maps the live experience row without warning about its length", () => {
    const result = ok(map(LIVE_CSV));

    // The premise: the live copy is 83 characters, inside the box's budget.
    expect(result.content.experience!.description).toHaveLength(83);
    expect(result.warnings).toEqual([]);
  });

  it("warns when the description is longer than the one line its box holds, naming its row", () => {
    const long = "A".repeat(WINE_FEATURE_CHARS_PER_LINE + 1);
    const result = ok(
      map(
        wineCsv(
          `Experience,Tasting Experience,$20,,,${long}`,
          "Section,Reds,,,,",
          "Item,2021 Syrah,$55,,Red Mountain,Cocao",
        ),
      ),
    );

    expect(result.content.experience!.description).toBe(long);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({ row: 2 });
    expect(result.warnings[0].problem).toContain("Tasting Experience");
  });

  it("stays quiet at exactly the length the box holds", () => {
    // The other side of the boundary: a one-sided test would pass for any
    // budget at all in the lenient direction.
    const exact = "A".repeat(WINE_FEATURE_CHARS_PER_LINE);
    const result = ok(
      map(
        wineCsv(
          `Experience,Tasting Experience,$20,,,${exact}`,
          "Section,Reds,,,,",
          "Item,2021 Syrah,$55,,Red Mountain,Cocao",
        ),
      ),
    );

    expect(result.warnings).toEqual([]);
  });

  it("reports a second experience row, naming its row", () => {
    const result = failed(
      map(
        wineCsv(
          "Experience,Tasting Experience,$20,,,Four pours",
          "Section,Reds,,,,",
          "Item,2021 Syrah,$55,,Red Mountain,Cocao",
          "Experience,Second Experience,$25,,,Four more pours",
        ),
      ),
    );

    expect(result.failure).toMatchObject({ kind: "row", tab: "Wine Menu", row: 5 });
    expect(result.failure.kind === "row" && result.failure.problem).toContain("Second Experience");
  });

  it("maps a tab with no experience row, carrying no such block", () => {
    const result = ok(
      map(wineCsv("Section,Reds,,,,", "Item,2021 Syrah,$55,$18,Red Mountain,Cocao & earth")),
    );

    expect(result.content.experience).toBeUndefined();
    expect(result.content.blocks).toHaveLength(1);
  });
});

// ----------------------------------------------------------- failures ---

describe("failures", () => {
  it("reports a note row by naming the wine tab's own row types", () => {
    const result = failed(
      map(wineCsv("Section,Reds,,,,", "Note,A note from Chef Dom,,,,Everything is made in house")),
    );

    expect(result.failure).toMatchObject({ kind: "row", tab: "Wine Menu", row: 3 });
    const problem = result.failure.kind === "row" ? result.failure.problem : "";
    expect(problem).toContain("Section");
    expect(problem).toContain("Item");
    expect(problem).toContain("Experience");
  });

  it("reports a row with no type, naming its row", () => {
    const result = failed(map(wineCsv("Section,Reds,,,,", ",Mystery,$30,,,")));

    expect(result.failure).toMatchObject({ kind: "row", tab: "Wine Menu", row: 3 });
    expect(result.failure.kind === "row" && result.failure.problem).toContain("Type");
  });

  it("reports an unrecognised type", () => {
    const result = failed(map(wineCsv("Heading,Reds,,,,")));

    expect(result.failure.kind === "row" && result.failure.problem).toContain("Heading");
  });

  it("reports a section with no name", () => {
    const result = failed(map(wineCsv("Section,,,,,")));

    expect(result.failure).toMatchObject({ kind: "row", row: 2 });
  });

  it("reports a wine with no name", () => {
    const result = failed(map(wineCsv("Section,Reds,,,,", "Item,,$55,,Red Mountain,Cocao")));

    expect(result.failure).toMatchObject({ kind: "row", row: 3 });
  });

  it("reports an empty tab rather than returning zero blocks", () => {
    const result = failed(map(wineCsv()));

    expect(result.failure).toEqual({ kind: "empty" });
  });

  it("reports an experience row with no wines as empty rather than printing a lone box", () => {
    const result = failed(map(wineCsv("Experience,Tasting Experience,$20,,,Four pours")));

    expect(result.failure).toEqual({ kind: "empty" });
  });
});

// ----------------------------------------------------------- settings ---

describe("settings", () => {
  it("reads the season and both footer lines", () => {
    const result = ok(map(LIVE_CSV));

    expect(result.content.season).toBe("Summer 2026");
    expect(result.content.wineFooter).toBe(
      "21+ Alcohol served to guest 21 and over. Please enjoy reponsibly.",
    );
    expect(result.content.serviceCharge).toContain("18% service charge");
  });

  it("does not read the food menu's disclaimer", () => {
    const result = ok(map(LIVE_CSV));

    expect(result.content).not.toHaveProperty("disclaimer");
  });
});

// ---------------------------------------------------------- structure ---

describe("the wine tab's structure", () => {
  it("reports a column the mapper reads that the header row does not carry", async () => {
    const csv = [
      "Type,Name,Bottle price,Glass price,Location",
      "Section,Reds,,,",
      "Item,2021 Syrah,$55,,Red Mountain",
    ].join("\r\n");

    const result = failed(
      await loadMenuContent(
        CONFIG,
        stubFetcher({ "7": csvResponse(csv), "99": csvResponse(SETTINGS_CSV) }),
      ),
    );

    expect(result.failure).toMatchObject({ kind: "row", tab: "Wine Menu", row: 1 });
    expect(result.failure.kind === "row" && result.failure.problem).toContain("Tasting notes");
  });

  it("reports the 21+ notice missing from the Settings tab", async () => {
    const settings = [
      "key,value",
      "season,Summer 2026",
      "serviceCharge,An 18% service charge is added to all dine-in checks.",
    ].join("\r\n");

    const result = failed(
      await loadMenuContent(
        CONFIG,
        stubFetcher({ "7": csvResponse(LIVE_CSV), "99": csvResponse(settings) }),
      ),
    );

    expect(result.failure).toMatchObject({ kind: "setting", tab: "Settings", key: "wineFooter" });
  });

  it("does not require the food menu's disclaimer", async () => {
    const settings = [
      "key,value",
      "season,Summer 2026",
      "serviceCharge,An 18% service charge is added to all dine-in checks.",
      "wineFooter,21+ Alcohol served to guest 21 and over.",
    ].join("\r\n");

    const result = ok(
      await loadMenuContent(
        CONFIG,
        stubFetcher({ "7": csvResponse(LIVE_CSV), "99": csvResponse(settings) }),
      ),
    );

    expect(result.content.blocks).toHaveLength(4);
  });

  it("accepts a header row written for people, with capitals and stray spaces", async () => {
    const csv = [
      " TYPE ,Name,  Bottle Price ,glass price,LOCATION, Tasting Notes ",
      "Section,Reds,,,,",
      "Item,2021 Syrah,$55,$18,Red Mountain,Cocao & earth",
    ].join("\r\n");

    const result = ok(
      await loadMenuContent(
        CONFIG,
        stubFetcher({ "7": csvResponse(csv), "99": csvResponse(SETTINGS_CSV) }),
      ),
    );

    expect(result.content.blocks[0].wines[0]).toMatchObject({
      name: "2021 Syrah",
      bottlePrice: "$55",
      glassPrice: "$18",
    });
  });

  /**
   * KTD3: each menu's vocabulary lives beside its own mapper, so the food tab's
   * headers are not silently valid here. If the two alias tables were shared,
   * this would map with every price and note blank.
   */
  it("does not accept the food tab's columns", async () => {
    const csv = [
      "Type,Name,Price,Description,Allergy Tag,Add on, Pairing",
      "Section,Reds,,,,,",
      "Item,2021 Syrah,$55,Cocao & earth,,,",
    ].join("\r\n");

    const result = failed(
      await loadMenuContent(
        CONFIG,
        stubFetcher({ "7": csvResponse(csv), "99": csvResponse(SETTINGS_CSV) }),
      ),
    );

    expect(result.failure).toMatchObject({ kind: "row", tab: "Wine Menu", row: 1 });
    const problem = result.failure.kind === "row" ? result.failure.problem : "";
    expect(problem).toContain("Bottle price");
    expect(problem).toContain("Glass price");
  });

  it("returns the empty failure for a header row with no data rows", async () => {
    const result = failed(
      await loadMenuContent(
        CONFIG,
        stubFetcher({ "7": csvResponse(wineCsv()), "99": csvResponse(SETTINGS_CSV) }),
      ),
    );

    expect(result.failure).toEqual({ kind: "empty" });
  });
});

// -------------------------------------------------------- determinism ---

describe("ids", () => {
  it("maps the same fixture to the same ids every time", () => {
    const ids = (result: ReturnType<typeof ok>) => [
      result.content.experience?.id ?? "",
      ...result.content.blocks.flatMap((block) => [
        block.id,
        ...block.wines.map((wine) => wine.id),
      ]),
    ];

    const first = ok(map(LIVE_CSV));
    const second = ok(map(LIVE_CSV));

    expect(ids(first)).toEqual(ids(second));
    // Taken from the spreadsheet's own row numbers, so a bad row keeps a
    // durable position even though the mapper never saw it.
    expect(ids(first).slice(0, 5)).toEqual([
      "experience-2",
      "section-3",
      "wine-4",
      "wine-5",
      "section-6",
    ]);
    expect(ids(first)).toContain("wine-17"); // The Keeper, below a note carrying a newline
    expect(ids(first)).toContain("section-18");
  });
});

// ------------------------------------------------------------- bundle ---

/**
 * The wine menu resolves on its own. The point of these is what does *not*
 * happen: an unset wine tab id fails the wine menu and leaves the food menu
 * resolving exactly as before.
 */
describe("resolving the wine menu's tabs", () => {
  const env = useSheetEnv({
    NEXT_PUBLIC_SHEET_ID: "sheet-1",
    NEXT_PUBLIC_SHEET_SETTINGS_GID: "99",
    NEXT_PUBLIC_SHEET_MENU_GID: "0",
    NEXT_PUBLIC_SHEET_WINE_GID: "7",
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

  it("has a bundle for the wine menu that reads the wine tab", async () => {
    const { menuKindFor } = await reload();

    const kind = menuKindFor("wine");
    expect(kind).toBeDefined();
    expect(kind!.source.menuId).toBe("wine");
    expect(kind!.source.tabLabel).toBe("Wine Menu");
  });

  it("resolves the wine menu's config from its own variable", async () => {
    const { menuKindFor, sheetConfigFromEnv } = await reload();

    const resolved = sheetConfigFromEnv(menuKindFor("wine")!.source);

    expect(resolved.ok).toBe(true);
    expect(resolved.ok && resolved.config).toMatchObject({
      sheetId: "sheet-1",
      menuGid: "7",
      settingsGid: "99",
    });
  });

  it("describes an unset wine tab id, naming the menu and its variable", async () => {
    delete process.env.NEXT_PUBLIC_SHEET_WINE_GID;
    const { menuKindFor, sheetConfigFromEnv } = await reload();

    const resolved = sheetConfigFromEnv(menuKindFor("wine")!.source);

    expect(resolved.ok).toBe(false);
    expect(!resolved.ok && resolved.failure).toMatchObject({ kind: "unconfigured", menu: "wine" });
    expect(
      !resolved.ok && resolved.failure.kind === "unconfigured" && resolved.failure.detail,
    ).toContain("NEXT_PUBLIC_SHEET_WINE_GID");
  });

  it("leaves the food menu resolving while the wine tab id is unset", async () => {
    delete process.env.NEXT_PUBLIC_SHEET_WINE_GID;
    const { menuKindFor, sheetConfigFromEnv } = await reload();

    const resolved = sheetConfigFromEnv(menuKindFor("food")!.source);

    expect(resolved.ok).toBe(true);
    expect(resolved.ok && resolved.config.menuGid).toBe("0");
  });
});
