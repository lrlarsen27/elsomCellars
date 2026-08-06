import { theme } from "./theme";
import type { MenuBlock } from "@/lib/schema";

/**
 * Decides which column each block lands in.
 *
 * The printed piece is a single tabloid sheet, so there are exactly four
 * column slots and no way to add a fifth:
 *
 *   0 = front left   1 = front right   2 = back left   3 = back right
 *
 * Blocks fill those slots in order and are never split, so the only control
 * anyone has over placement is the order of the blocks themselves. Nobody
 * picks a column, which is why a user can't put the document in a broken state
 * by editing text.
 *
 * --- The honest caveat ---
 *
 * react-pdf has no way to measure text before laying it out, so heights here
 * are ESTIMATED from character counts. The estimate is good enough to pick
 * sensible column breaks, but it is not exact. A column that lands within a
 * few percent of full may render slightly over or under. The preview shows the
 * true result — trust it over this file.
 *
 * --- Deviation from the Figma ---
 *
 * On the artboard the Sandwiches section deliberately splits across the front
 * page's column break: three of its items sit at the top of the right column
 * under no heading. Keeping sections whole means that no longer happens, so
 * the front page composition here differs from the design. That was the chosen
 * tradeoff: sections stay whole, and the layout can never break.
 */

/** Column slots available on one double-sided tabloid sheet. */
export const COLUMN_SLOTS = 4;

/**
 * Usable vertical space in a column, in points. Derived from the artboard:
 * columns start 74pt below the content top and the footer begins at 1104pt.
 */
export const COLUMN_HEIGHT = 1030;

/**
 * How many characters of description fit on one line at 14pt Cormorant
 * Garamond in a 314pt column. Measured off the artboard: "Organic
 * kettle-popped in coconut oil and tossed with a" is 54 characters and fills
 * exactly one line. Retune this if the column width or body size changes.
 */
const DESCRIPTION_CHARS_PER_LINE = 54;

/** Same measure for the chef's note, which is 12pt across the full column. */
const NOTE_CHARS_PER_LINE = 72;

const DESCRIPTION_LINE_HEIGHT = 17.5;
const NOTE_LINE_HEIGHT = 15;

/** Counts wrapped lines, honouring any explicit newlines in the text. */
function countLines(text: string, charsPerLine: number): number {
  if (!text) return 0;

  return text
    .split("\n")
    .reduce((total, paragraph) => total + Math.max(1, Math.ceil(paragraph.length / charsPerLine)), 0);
}

function estimateItemHeight(item: {
  description: string;
  addOn: string;
  pairing: string;
}): number {
  // The name and its dietary tags share one 22pt line.
  let height = theme.lineHeight.itemName + theme.space.afterItemName;

  // The add-on run continues the description paragraph rather than starting a
  // new one, so the two are measured together.
  const descriptionText = [item.description, item.addOn].filter(Boolean).join(" ");
  height += countLines(descriptionText, DESCRIPTION_CHARS_PER_LINE) * DESCRIPTION_LINE_HEIGHT;

  if (item.pairing) {
    height += countLines(item.pairing, DESCRIPTION_CHARS_PER_LINE) * DESCRIPTION_LINE_HEIGHT;
  }

  return height;
}

export function estimateBlockHeight(block: MenuBlock): number {
  if (block.kind === "note") {
    return (
      theme.space.sectionHeaderRuleOffset +
      theme.size.chefNoteHeading +
      theme.space.afterItemName +
      countLines(block.body, NOTE_CHARS_PER_LINE) * NOTE_LINE_HEIGHT +
      theme.space.betweenSections
    );
  }

  const header = theme.space.sectionHeaderRuleOffset + theme.space.afterSectionHeader;
  const items = block.items.reduce((total, item) => total + estimateItemHeight(item), 0);
  const gaps = Math.max(0, block.items.length - 1) * theme.space.betweenItems;

  return header + items + gaps + theme.space.betweenSections;
}

export type FlowResult = {
  /** Always length COLUMN_SLOTS. Empty arrays for unused columns. */
  columns: MenuBlock[][];
  /**
   * True when content didn't fit in four columns. The overflowing blocks are
   * still placed in the last column, where they will visibly run off the page
   * rather than disappear — a silent drop would be worse.
   */
  overflow: boolean;
  /** Blocks that did not fit, for messaging in the editor. */
  overflowingBlocks: MenuBlock[];
};

export function flowBlocksIntoColumns(blocks: MenuBlock[]): FlowResult {
  const columns: MenuBlock[][] = Array.from({ length: COLUMN_SLOTS }, () => []);
  const heights = new Array<number>(COLUMN_SLOTS).fill(0);
  const overflowingBlocks: MenuBlock[] = [];

  let current = 0;

  for (const block of blocks) {
    const height = estimateBlockHeight(block);

    // Move to the next column when this block won't fit — unless the column is
    // still empty, in which case the block is taller than a whole column and
    // moving it along would just loop.
    while (current < COLUMN_SLOTS - 1 && heights[current] > 0 && heights[current] + height > COLUMN_HEIGHT) {
      current += 1;
    }

    const doesNotFit = heights[current] + height > COLUMN_HEIGHT;
    if (doesNotFit && current === COLUMN_SLOTS - 1) {
      overflowingBlocks.push(block);
    }

    columns[current].push(block);
    heights[current] += height;
  }

  return {
    columns,
    overflow: overflowingBlocks.length > 0,
    overflowingBlocks,
  };
}
