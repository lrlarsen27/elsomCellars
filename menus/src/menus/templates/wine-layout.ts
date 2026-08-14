import { theme } from "./theme";
import type { Wine, WineBlock } from "@/lib/schema";

/**
 * Decides what goes in each wine column.
 *
 * A sibling of `layout.ts` rather than an extension of it. The wine menu is ONE
 * printed side, so there are exactly two column slots and no way to add a third:
 *
 *   0 = left   1 = right
 *
 * Content fills them in order, and nothing here is stored — which column a
 * section prints in is computed from how much content there is, so nobody
 * chooses it and nobody can break it.
 *
 * --- Why this is not the food module with different numbers ---
 *
 * Every calibrated figure disagrees. The wine text column is 230pt against the
 * food menu's 314, so its characters-per-line is re-measured from the wine
 * artboard's own wraps rather than inherited. The budget is 806pt against 1030,
 * because the tasting-experience box and the bottom lockup are already taken
 * out of it. And a wine section is never split across the column break, where a
 * food section is. Widening `layout.ts` to hold both would put every one of
 * those behind a flag in a module the printed food menu runs.
 *
 * --- Why a wine section is never split ---
 *
 * The food menu allows it because its artboard depends on it: Sandwiches spans
 * the front-page break, and keeping sections whole strands 700pt of the front
 * page. The wine artboard has no split. A headingless continuation at the top
 * of the right column would also arrive without the GLASS and BOTTLE labels,
 * which print on the first section in a column — so the reader would meet a
 * price column with nothing naming it. A section too tall for a whole column is
 * still placed, where it visibly runs over; a silent drop would be worse.
 *
 * --- The honest caveat ---
 *
 * react-pdf can't measure text before laying it out, so heights here are
 * ESTIMATED from character counts. Good enough to pick sensible breaks, not
 * exact. A column that lands within a few percent of full may render slightly
 * over or under. The preview shows the truth — trust it over this file.
 */

/** Column slots available on the wine menu's one printed side. */
export const WINE_COLUMN_SLOTS = 2;

/**
 * Usable vertical space in a wine column, in points. The artboard's columns run
 * from 177 to 983 content-relative — below the tasting-experience box and above
 * the bottom lockup — so this is already net of both.
 *
 * This is the budget for a sheet that HAS a tasting experience, and it is only
 * the default. With no `Experience` row both renderers start the columns right
 * under the header divider instead, which is 107pt more room, so the caller
 * passes that band in — see `flowWineBlocksIntoColumns`. Budgeting 806 either
 * way broke columns early and reported an overrun that was not on the paper,
 * which pushes staff toward the fit gate's override for nothing.
 */
export const WINE_COLUMN_HEIGHT = theme.wine.column.height;

/**
 * How many characters fit on one line at 14pt Cormorant Garamond in the wine
 * item's 230pt text column. The food module's 54 is measured against a 314pt
 * column and is badly optimistic here; inheriting it would under-estimate every
 * wrapping note by a whole line.
 *
 * The artboard's own wraps bracket this exactly, from both sides:
 *
 *   - "Dozen + herbs, spices, roots & flowers" (38) prints on one line, and so
 *     do "Cinnamon orange, raspberry, & vanilla" and "Raspberry, dark cherry &
 *     white pepper" (37 each) — the item is 59pt tall.
 *   - "Collaboration with Sounders goal keeper," (40) is the widest line the
 *     artboard actually prints in this column, and it prints unwrapped.
 *   - "White pepper, huckleberry, & green pepper" (41) wraps to two lines — the
 *     item is 76pt.
 *
 * So 40 is the only figure that keeps every live note at the height the
 * artboard gives it: 39 would wrap The Keeper's first line into a third line it
 * does not have, and 41 would flatten 2019 Isabella onto one line it does not
 * fit. Retune if the text column width or the 14pt body size changes.
 *
 * The location line takes the same figure: it is the same face at the same size
 * in the same 230pt column.
 */
const WINE_CHARS_PER_LINE = 40;

/**
 * How many characters of a wine NAME fit on one line. The name is a different
 * face at a different size from the tasting notes — 16pt Barlow Condensed
 * Medium, uppercased, with 1pt tracking — so it takes its own figure. The 40
 * above is 14pt Cormorant and does not apply here.
 *
 * MEASURED against the same TTF the PDF embeds, set at those metrics in the
 * item's 230pt text column: 30 characters fit on one line, 31 wrap.
 *
 * Nothing live reaches it — the longest name on the tab is "2020 Cabernet
 * sauvignon" at 23 — but "2020 Cabernet Sauvignon Reserve" is exactly 31, so
 * the wrap is one vintage away rather than hypothetical. The name sits in
 * `itemBody`, which is the 230pt column, so it genuinely wraps; charging it a
 * flat line height ran the estimate LOW, which is the dangerous direction. Low
 * means the gate says the sheet fits and the printed menu runs over.
 */
const WINE_NAME_CHARS_PER_LINE = 30;

/**
 * Roughly how many characters of the tasting-experience box's description fit
 * on one line. `wine-sheet.ts` warns on this figure, because the box is a fixed
 * 76pt frame in both renderers while its copy comes from an editable
 * spreadsheet row: a longer description does not push anything down, it
 * overflows the border, and no budget on the sheet accounts for it.
 *
 * DERIVED rather than measured, and approximate. The body is 16pt Cormorant
 * Garamond Regular across the box's inner width — 716 less its 16pt padding on
 * both sides, so 684 — and the only calibrated point for that face is the 40
 * characters a 14pt line holds in a 230pt column. Characters scale with the
 * width and inversely with the size:
 *
 *   684 * (40 / 230) * (14 / 16) = 104.08…, so 104.
 *
 * The live description is 83 characters and stays quiet. Measure the box the
 * way the 40 was measured if this ever needs to be tight.
 */
export const WINE_FEATURE_CHARS_PER_LINE = Math.floor(
  (theme.wine.feature.width - 2 * theme.wine.feature.padding) *
    (WINE_CHARS_PER_LINE / theme.wine.item.textWidth) *
    (theme.wine.item.notesSize / theme.wine.feature.bodySize),
);

/**
 * A wine section header is always this tall, and always costs this much.
 *
 * KTD8. The GLASS and BOTTLE labels sit inside the header's own 22pt band,
 * beside the section name, and they print only on the first section in each
 * column. Budgeting that band on every header — whether or not the labels print
 * there — is what keeps placement a pure function of content. Charge it only
 * where the labels print and a header's height depends on its position while
 * its position is computed from heights, which is a loop the food menu does not
 * have: its add-on line is a property of the block wherever the block lands.
 *
 * There is no wine equivalent of the food menu's taller add-on header.
 */
const WINE_SECTION_HEADER_HEIGHT =
  theme.wine.sectionHeader.ruleOffset + theme.wine.sectionHeader.afterSectionHeader;

/**
 * What lands in a column. There is no `section-continued` counterpart to the
 * food module's: a wine section is placed whole or not at all.
 *
 * And so no `blockId` beside `id`. The food module needs one because a
 * continuation fragment carries the id of the block it came from, which is what
 * `placementByBlock` groups on; here a section is one fragment and the two
 * would always be the same string.
 */
export type WineColumnFragment = {
  kind: "section";
  id: string;
  title: string;
  wines: Wine[];
  /**
   * True on the first section in its column, and nowhere else. The GLASS and
   * BOTTLE labels print above this fragment's header.
   *
   * The flow answers this rather than each renderer working it out, so the PDF
   * and the DOM cannot disagree about where the labels go.
   */
  showsPriceLabels: boolean;
};

/** Human-readable name for each column slot, in order. */
export const WINE_SLOT_LABELS = ["Left", "Right"] as const;

export type WineSlotLabel = (typeof WINE_SLOT_LABELS)[number];

/** Counts wrapped lines, honouring any explicit newlines in the text. */
function countLines(text: string, charsPerLine: number): number {
  if (!text) return 0;

  return text
    .split("\n")
    .reduce(
      (total, paragraph) => total + Math.max(1, Math.ceil(paragraph.length / charsPerLine)),
      0,
    );
}

/**
 * Content height only — no trailing margin.
 *
 * Gaps are added *between* elements by the caller rather than baked into each
 * one. That distinction is load-bearing: a margin below the last item in a
 * column occupies no visible space, and counting it ran the food estimate about
 * 6% high — enough to push content off a page it fits.
 *
 * A wine with no appellation costs no location line. The component reports a
 * uniform height in Figma, which reads as though the row were always reserved,
 * but the artboard renders Vermouth — the one live wine without one — with its
 * tasting note directly under its name. An empty row held its space here and
 * printed as a gap nothing filled.
 *
 * The title row is charged at the name's line height, not at the 22pt band the
 * artboard draws it in. The two differ by a point, and the point is real: the
 * name is the tallest thing in that row, so react-pdf lays the row out to the
 * line rather than to the frame — pinning the row to the artboard's height
 * drops the name from the PDF altogether. This file predicts what prints, so it
 * follows the renderer; `theme.wine.item` keeps both measurements.
 *
 * The name is charged per line, on its own calibration. It sits in the same
 * 230pt column as everything else in the item, so a long enough name wraps like
 * any other run — and a wrapping name charged as one line is an estimate that
 * runs low, which is the one direction the fit gate cannot recover from.
 */
export function estimateWineHeight(wine: Wine): number {
  const lines = (text: string) => Math.max(1, countLines(text, WINE_CHARS_PER_LINE));
  const nameLines = Math.max(1, countLines(wine.name, WINE_NAME_CHARS_PER_LINE));

  const location = wine.location
    ? theme.wine.item.innerGap + lines(wine.location) * theme.wine.item.locationLineHeight
    : 0;

  return (
    nameLines * theme.wine.item.nameLineHeight +
    location +
    theme.wine.item.innerGap +
    lines(wine.tastingNotes) * theme.wine.item.notesLineHeight
  );
}

/** Total height of a whole section, including the gaps between its wines. */
export function estimateWineBlockHeight(block: WineBlock): number {
  const wines = block.wines.reduce((total, wine) => total + estimateWineHeight(wine), 0);
  const gaps = Math.max(0, block.wines.length - 1) * theme.wine.item.betweenItems;

  return WINE_SECTION_HEADER_HEIGHT + wines + gaps;
}

export type WineFlowResult = {
  /** Always length WINE_COLUMN_SLOTS. Empty arrays for unused columns. */
  columns: WineColumnFragment[][];
  /**
   * True when content ran past the last column, or when a single section is
   * taller than a whole column. Overflowing content is still placed, where it
   * visibly runs off the page — a silent drop would be worse.
   */
  overflow: boolean;
  /**
   * Which column ran over, named for a reader. Usually the right one, but not
   * always: a section taller than an empty column overflows wherever it happens
   * to be, which can be the left. Null when nothing overflowed.
   */
  overflowColumn: WineSlotLabel | null;
};

/**
 * `columnHeight` is how tall the renderers will actually draw the columns, and
 * it is not a constant: with no tasting-experience box to sit under, both
 * renderers start the columns at the header divider and run to the same 983,
 * which is 107pt more than the artboard's 806. The caller knows whether the box
 * prints — `menus/kinds.ts` derives the taller band from the same theme
 * expression the renderers use — so it passes the figure in rather than this
 * module guessing. The default is the with-a-box case the artboard measures.
 */
export function flowWineBlocksIntoColumns(
  blocks: WineBlock[],
  columnHeight: number = WINE_COLUMN_HEIGHT,
): WineFlowResult {
  const columns: WineColumnFragment[][] = Array.from({ length: WINE_COLUMN_SLOTS }, () => []);
  const used = new Array<number>(WINE_COLUMN_SLOTS).fill(0);

  let column = 0;
  let overflow = false;
  let overflowSlot: number | null = null;

  /** Records the first column to run over — later ones are consequences of it. */
  function recordOverflow(): void {
    overflow = true;
    if (overflowSlot === null) overflowSlot = column;
  }

  /** Moves to the next column. On the last one, records overflow and stays. */
  function advance(): boolean {
    if (column < WINE_COLUMN_SLOTS - 1) {
      column += 1;
      return true;
    }
    recordOverflow();
    return false;
  }

  /** Space before the next section in this column — nothing if it's still empty. */
  function leadingGap(): number {
    return used[column] > 0 ? theme.wine.sectionHeader.betweenSections : 0;
  }

  for (const block of blocks) {
    const height = estimateWineBlockHeight(block);

    // Whole or not at all: a section that does not fit what is left of this
    // column starts the next one instead of splitting across the break.
    if (used[column] > 0 && used[column] + leadingGap() + height > columnHeight) {
      advance();
    }

    const gap = leadingGap();

    // Still too tall — either this is the last column, or the section is taller
    // than any column on the sheet. Place it anyway and say which column it
    // ruined, so the fit gate can name it and disable export.
    if (used[column] + gap + height > columnHeight) recordOverflow();

    columns[column].push({
      kind: "section",
      id: block.id,
      title: block.title,
      wines: block.wines,
      // First in this column, so the price-column labels print here.
      showsPriceLabels: columns[column].length === 0,
    });
    used[column] += gap + height;
  }

  return {
    columns,
    overflow,
    overflowColumn: overflowSlot === null ? null : WINE_SLOT_LABELS[overflowSlot],
  };
}
