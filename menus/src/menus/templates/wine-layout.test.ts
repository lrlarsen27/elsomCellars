import { describe, it, expect } from "vitest";
import { theme } from "./theme";
import {
  WINE_COLUMN_HEIGHT,
  WINE_COLUMN_SLOTS,
  estimateWineBlockHeight,
  estimateWineHeight,
  flowWineBlocksIntoColumns,
} from "./wine-layout";
import type { Wine, WineBlock } from "@/lib/schema";

/**
 * Two rules these tests pin down.
 *
 * The first is the calibration. The wine text column is 230pt against the food
 * menu's 314, so the food module's 54 characters per line is badly optimistic
 * here, and a wine card has far less slack to absorb the error than a tabloid
 * food column does. The boundary is pinned from BOTH sides — the longest note
 * on the live tab that stays on one line, and the shortest that wraps — because
 * a one-sided test passes for any value at all in the wrong direction.
 *
 * The second is the placement. A wine section never splits across the column
 * break, and the price-column labels print on the first section in each column
 * and nowhere else. The strongest single check on both is that the live tab's
 * four sections land where the artboard puts them.
 *
 * Every fixture note below is a real tasting note from the live `Wine Menu`
 * tab, not a synthetic string. Synthetic wines appear only where the live tab
 * has no case — a section too tall for a whole column, a location long enough
 * to wrap.
 */

// ----------------------------------------------------------- fixtures ---

/**
 * The live tab's tasting notes, with the character counts that bracket the
 * wrap. On the artboard, everything at 38 and below sits on one line and the
 * 41 wraps to two, so the estimator's figure has to fall between them.
 */
const NOTES = {
  /** 38 characters. Vermouth. The longest live note that stays on one line. */
  longestOneLine: "Dozen + herbs, spices, roots & flowers",
  /** 41 characters. 2019 Isabella. The shortest live note that wraps to two. */
  shortestWrapping: "White pepper, huckleberry, & green pepper",
  /**
   * The Keeper. The sheet carries an authored break, and the artboard prints
   * the first line — 40 characters — without wrapping it further.
   */
  keeper: "Collaboration with Sounders goal keeper,\nStefan Frei",
};

function wine(name: string, location: string, tastingNotes: string): Wine {
  return { id: `wine-${name}`, name, bottlePrice: "$30", glassPrice: "$12", location, tastingNotes };
}

function section(title: string, wines: Wine[]): WineBlock {
  return { kind: "section", id: `section-${title}`, title, wines };
}

/** A section of `count` identical wines, each one line of location and one of notes. */
function plainSection(title: string, count: number, notes = NOTES.longestOneLine): WineBlock {
  return section(
    title,
    Array.from({ length: count }, (_, i) => wine(`${title}-${i}`, "Horse Heaven Hills", notes)),
  );
}

/**
 * The live `Wine Menu` tab, in sheet order, with every location and tasting
 * note as typed. The `Experience` row is deliberately absent: it prints in a
 * fixed box above the columns and never flows into one.
 */
const LIVE_BLOCKS: WineBlock[] = [
  section("Whites & Rosé", [
    wine("2023 Albarino", "Yakima Valley", "Green apple, citrus & tropical fruit"),
    wine("2023 Rosé", "Columbia Valley", "Apple, grape fruit, & strawberries"),
  ]),
  section("Reds", [
    wine("2022 cinsault", "Yakima Valley", "Cinnamon orange, raspberry, & vanilla"),
    wine("2022 Grenache", "Horse Heaven Hills", "Raspberry, cherry, & rose petals"),
    wine("2022 tempranillo", "Rattlesnack Hills", "Cranberry, cocao, & black cherry"),
    wine("2019 Malbec", "Horse Heaven Hills", "Raspberry, cherry & white pepper"),
    wine("2020 Malbec", "Horse Heaven Hills", "Raspberry, dark cherry & white pepper"),
    wine("2021 Syrah", "Horse Heaven Hills", "Cocao, blueberry, & earth"),
    wine("2020 Cabernet sauvignon", "Horse Heaven Hills", "Cocao, blueberry, & earth"),
  ]),
  section("Blends", [
    wine("2018 Isabella", "Red Mountain", "Marionberry, strawberry, & fennel"),
    wine("2019 Isabella", "Columbia Valley", NOTES.shortestWrapping),
    wine("The Keeper", "Columbia Valley", NOTES.keeper),
  ]),
  section("Specialty", [wine("Vermouth", "", NOTES.longestOneLine)]),
];

const titlesIn = (fragments: { title: string }[]) => fragments.map((fragment) => fragment.title);

/**
 * What a wine actually occupies when it prints, which is the artboard's height
 * with one substitution: the title row.
 *
 * The artboard draws that row as a 21pt band, but the wine name is the tallest
 * thing in it, so react-pdf lays the row out to the name's 22pt line instead —
 * pinning it to the band drops the name from the PDF altogether. The estimator
 * predicts print rather than design, so it follows the renderer and every item
 * is a point taller than the artboard measures it.
 *
 * Written as the substitution rather than as a literal so that changing any of
 * the three tokens moves these with it.
 */
const printed = (artboardHeight: number) =>
  artboardHeight - theme.wine.item.titleRowHeight + theme.wine.item.nameLineHeight;

const PRINTED_HEIGHT = printed(theme.wine.item.height);
const PRINTED_HEIGHT_WRAPPED = printed(theme.wine.item.heightWithWrappedNotes);

// -------------------------------------------------------- calibration ---

describe("estimating a wine's height", () => {
  it("gives an ordinary wine the height it prints at", () => {
    const ordinary = wine("2021 Syrah", "Horse Heaven Hills", "Cocao, blueberry, & earth");

    expect(estimateWineHeight(ordinary)).toBe(PRINTED_HEIGHT);
  });

  it("leaves the longest known one-line note on one line", () => {
    // The premise: this is the 38-character note the artboard prints unwrapped.
    expect(NOTES.longestOneLine).toHaveLength(38);

    const vermouth = wine("Vermouth", "Yakima Valley", NOTES.longestOneLine);

    expect(estimateWineHeight(vermouth)).toBe(PRINTED_HEIGHT);
  });

  it("adds exactly one line for the shortest known wrapping note", () => {
    // The premise: three characters longer than the note above, and the
    // artboard wraps it. A calibration outside (38, 41] fails one of the two.
    expect(NOTES.shortestWrapping).toHaveLength(41);

    const isabella = wine("2019 Isabella", "Columbia Valley", NOTES.shortestWrapping);

    expect(estimateWineHeight(isabella)).toBe(PRINTED_HEIGHT_WRAPPED);
    expect(estimateWineHeight(isabella)).toBe(PRINTED_HEIGHT + theme.wine.item.notesLineHeight);
  });

  it("keeps an authored line break to the two lines the artboard prints", () => {
    // The Keeper's first authored line is 40 characters and prints unwrapped,
    // so the note is two lines, not three.
    expect(NOTES.keeper.split("\n")[0]).toHaveLength(40);

    const keeper = wine("The Keeper", "Columbia Valley", NOTES.keeper);

    expect(estimateWineHeight(keeper)).toBe(PRINTED_HEIGHT_WRAPPED);
  });

  it("makes a wine whose location wraps taller than one whose location fits", () => {
    const fits = wine("2021 Syrah", "Horse Heaven Hills", NOTES.longestOneLine);
    // No live location is long enough to wrap, so this one is synthetic. The
    // premise is that it is past the boundary the notes above pinned.
    const wraps = wine(
      "2021 Syrah",
      "Horse Heaven Hills and the Rattlesnake Hills",
      NOTES.longestOneLine,
    );
    expect("Horse Heaven Hills and the Rattlesnake Hills".length).toBeGreaterThan(41);

    expect(estimateWineHeight(wraps)).toBe(
      estimateWineHeight(fits) + theme.wine.item.locationLineHeight,
    );
  });

  /**
   * The artboard has exactly two item heights, and Vermouth — the one live wine
   * with no appellation — is one of the 59s. The location row is part of the
   * item component whether or not it carries text, so an empty one still costs
   * its line rather than collapsing to a third height nothing on the sheet has.
   */
  it("still reserves the location line for a wine with no appellation", () => {
    const vermouth = wine("Vermouth", "", NOTES.longestOneLine);

    expect(estimateWineHeight(vermouth)).toBe(PRINTED_HEIGHT);
  });
});

// ------------------------------------------------------------ budgets ---

describe("estimating a section's height", () => {
  it("budgets the header, its items, and the gaps between them", () => {
    const one = plainSection("One", 1);
    const three = plainSection("Three", 3);

    expect(estimateWineBlockHeight(one)).toBe(
      theme.wine.sectionHeader.ruleOffset +
        theme.wine.sectionHeader.afterSectionHeader +
        PRINTED_HEIGHT,
    );
    // Two more items and the two gaps between the three of them — the gap is
    // between items, never trailing the last one.
    expect(estimateWineBlockHeight(three)).toBe(
      estimateWineBlockHeight(one) + 2 * PRINTED_HEIGHT + 2 * theme.wine.item.betweenItems,
    );
  });

  /**
   * KTD8. The price-column labels sit inside the section header's own 22pt
   * band, and the flow pays that band on every section whether or not the
   * labels print there. If the label-bearing header cost more, placement would
   * depend on position while position is computed from height.
   *
   * The premise below is what makes this bite: the two sections leave less
   * slack than a header band, so charging the first one extra would push the
   * second into the right column.
   */
  it("charges a section header the same wherever the section lands", () => {
    const first = plainSection("First", 2);
    const second = section("Second", [
      ...Array.from({ length: 6 }, (_, i) =>
        wine(`Wrapped-${i}`, "Horse Heaven Hills", NOTES.shortestWrapping),
      ),
      wine("Plain", "Horse Heaven Hills", NOTES.longestOneLine),
    ]);

    const total =
      estimateWineBlockHeight(first) +
      theme.wine.sectionHeader.betweenSections +
      estimateWineBlockHeight(second);

    expect(total).toBeLessThanOrEqual(WINE_COLUMN_HEIGHT);
    expect(WINE_COLUMN_HEIGHT - total).toBeLessThan(theme.wine.sectionHeader.height);

    const flow = flowWineBlocksIntoColumns([first, second]);

    expect(titlesIn(flow.columns[0])).toEqual(["First", "Second"]);
    expect(flow.columns[1]).toHaveLength(0);
    expect(flow.overflow).toBe(false);
  });
});

// ---------------------------------------------------------- placement ---

describe("flowing wine sections into two columns", () => {
  it("reports one printed side of two columns", () => {
    expect(WINE_COLUMN_SLOTS).toBe(2);
    expect(WINE_COLUMN_HEIGHT).toBe(theme.wine.column.height);

    expect(flowWineBlocksIntoColumns(LIVE_BLOCKS).columns).toHaveLength(2);
  });

  /**
   * The strongest single check on the calibration: the live tab, placed the way
   * the artboard places it. Whites & Rosé and Reds fill the left column;
   * Blends and Specialty go to the right.
   */
  it("places the live wine content the way the artboard does", () => {
    const flow = flowWineBlocksIntoColumns(LIVE_BLOCKS);

    expect(titlesIn(flow.columns[0])).toEqual(["Whites & Rosé", "Reds"]);
    expect(titlesIn(flow.columns[1])).toEqual(["Blends", "Specialty"]);
    expect(flow.overflow).toBe(false);
    expect(flow.overflowColumn).toBeNull();
  });

  it("carries every wine of every section, in sheet order", () => {
    const flow = flowWineBlocksIntoColumns(LIVE_BLOCKS);
    const placed = flow.columns.flat();

    expect(placed).toHaveLength(LIVE_BLOCKS.length);
    expect(placed.map((fragment) => fragment.wines.map((w) => w.name))).toEqual(
      LIVE_BLOCKS.map((block) => block.wines.map((w) => w.name)),
    );
  });

  it("marks exactly the first section in each column as label-bearing", () => {
    const flow = flowWineBlocksIntoColumns(LIVE_BLOCKS);

    // The premise: both columns carry more than one section, so "first in the
    // column" and "first on the sheet" are different answers.
    expect(flow.columns[0].length).toBeGreaterThan(1);
    expect(flow.columns[1].length).toBeGreaterThan(1);

    for (const column of flow.columns) {
      expect(column.map((fragment) => fragment.showsPriceLabels)).toEqual(
        column.map((_, index) => index === 0),
      );
    }
  });

  it("marks nothing in a column that holds no sections", () => {
    const flow = flowWineBlocksIntoColumns([plainSection("Only", 2)]);

    expect(flow.columns[0].map((fragment) => fragment.showsPriceLabels)).toEqual([true]);
    expect(flow.columns[1]).toEqual([]);
  });

  it("moves a section to the right column rather than splitting it", () => {
    const filler = plainSection("Filler", 11);
    const whole = plainSection("Whole", 4);

    // The premise: the second section fits a column on its own, but not what
    // the first one leaves of the left column.
    expect(estimateWineBlockHeight(whole)).toBeLessThanOrEqual(WINE_COLUMN_HEIGHT);
    expect(
      estimateWineBlockHeight(filler) +
        theme.wine.sectionHeader.betweenSections +
        estimateWineBlockHeight(whole),
    ).toBeGreaterThan(WINE_COLUMN_HEIGHT);

    const flow = flowWineBlocksIntoColumns([filler, whole]);

    expect(titlesIn(flow.columns[0])).toEqual(["Filler"]);
    expect(titlesIn(flow.columns[1])).toEqual(["Whole"]);
    // Whole, and all four of its wines, in one place.
    expect(flow.columns[1][0].wines).toHaveLength(4);
    expect(flow.columns[1][0].showsPriceLabels).toBe(true);
  });

  it("places a section taller than a whole column rather than dropping it", () => {
    const huge = plainSection("Huge", 14);

    expect(estimateWineBlockHeight(huge)).toBeGreaterThan(WINE_COLUMN_HEIGHT);

    const flow = flowWineBlocksIntoColumns([huge]);

    expect(titlesIn(flow.columns[0])).toEqual(["Huge"]);
    expect(flow.columns[0][0].wines).toHaveLength(14);
    expect(flow.overflow).toBe(true);
    expect(flow.overflowColumn).toBe("Left");
  });

  it("names the right column when content runs past both", () => {
    const sections = Array.from({ length: 3 }, (_, i) => plainSection(`S${i}`, 7));

    // The premise: two of these fill a column, so the third has nowhere to go.
    expect(2 * estimateWineBlockHeight(sections[0])).toBeGreaterThan(WINE_COLUMN_HEIGHT);

    const flow = flowWineBlocksIntoColumns(sections);

    expect(flow.overflow).toBe(true);
    expect(flow.overflowColumn).toBe("Right");
    // Still visible rather than dropped.
    expect(flow.columns.flat()).toHaveLength(3);
    expect(titlesIn(flow.columns[1])).toEqual(["S1", "S2"]);
  });

  it("names no column when everything fits", () => {
    const flow = flowWineBlocksIntoColumns([plainSection("Small", 3)]);

    expect(flow.overflow).toBe(false);
    expect(flow.overflowColumn).toBeNull();
  });

  it("returns two empty columns for no content", () => {
    const flow = flowWineBlocksIntoColumns([]);

    expect(flow.columns).toEqual([[], []]);
    expect(flow.overflow).toBe(false);
    expect(flow.overflowColumn).toBeNull();
  });
});
