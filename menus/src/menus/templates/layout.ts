import { theme } from "./theme";
import type { MenuBlock, MenuItem } from "@/lib/schema";

/**
 * Decides what goes in each column.
 *
 * The printed piece is a single tabloid sheet, so there are exactly four
 * column slots and no way to add a fifth:
 *
 *   0 = front left   1 = front right   2 = back left   3 = back right
 *
 * Content fills them in order. Individual items are never split. A section can
 * be, and its continuation carries no heading — but that is the exception, not
 * the normal path. Nothing on the current menu splits at all.
 *
 * --- Why the split is allowed at all ---
 *
 * It is the fallback for a section too tall for any single column, which would
 * otherwise have nowhere to go. Nothing on this menu reaches that case — the
 * tallest are Plates (577pt) and Sandwiches (542pt) against a 1030pt column —
 * so what actually decides the breaks is the rule further down: a section that
 * fits in a column of its own is moved whole to the next one rather than split.
 *
 * This used to be the other way round. Splitting was the routine path, chosen
 * to keep the front page full: Sandwiches and Plates can't share a column, so
 * refusing to split pushed Plates onto the back page and left the front several
 * hundred points empty. The old artboard avoided that by splitting Sandwiches
 * over the fold. The redesigned one doesn't, so that layout is now the intended
 * one — the front right carries Sandwiches alone, with 488pt to spare, on
 * purpose. Don't "fix" it by making splitting eager again.
 *
 * --- The honest caveat ---
 *
 * react-pdf can't measure text before laying it out, so heights here are
 * ESTIMATED from character counts. Good enough to pick sensible breaks, not
 * exact. A column that lands within a few percent of full may render slightly
 * over or under. The preview shows the truth — trust it over this file.
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
 * exactly one line. Retune if the column width or body size changes.
 */
const DESCRIPTION_CHARS_PER_LINE = 54;

/** Same measure for the chef's note, which is 12pt across the full column. */
const NOTE_CHARS_PER_LINE = 72;

const DESCRIPTION_LINE_HEIGHT = 17.5;
const NOTE_LINE_HEIGHT = 15;

const SECTION_HEADER_HEIGHT =
  theme.space.sectionHeaderRuleOffset + theme.space.afterSectionHeader;

/**
 * A section carrying an add-on has a taller header — the add-on prints under
 * the rule. Five of the food menu's sections have one, so ignoring this would
 * under-estimate the sheet by about 100pt and push column breaks late.
 */
const SECTION_HEADER_WITH_ADDON_HEIGHT =
  theme.space.sectionHeaderWithAddOn + theme.space.afterSectionHeader;

function sectionHeaderHeight(addOn: string | undefined): number {
  return addOn ? SECTION_HEADER_WITH_ADDON_HEIGHT : SECTION_HEADER_HEIGHT;
}

/**
 * What lands in a column. A section that spans a column break appears as one
 * `section` fragment followed by a `section-continued` fragment, which renders
 * without repeating the heading.
 */
export type ColumnFragment =
  | {
      kind: "section";
      id: string;
      blockId: string;
      title: string;
      items: MenuItem[];
      /** Applies to the whole section; prints under the header's rule. */
      addOn?: string;
    }
  | { kind: "section-continued"; id: string; blockId: string; items: MenuItem[] }
  | { kind: "note"; id: string; blockId: string; heading: string; body: string };

/** Human-readable name for each column slot, in order. */
export const SLOT_LABELS = ["Front left", "Front right", "Back left", "Back right"] as const;

/**
 * Which slots each block occupies, keyed by block id.
 *
 * The editor shows this so someone can tell where a section will land without
 * exporting a PDF. It's read-only feedback, not a control — placement still
 * isn't editable.
 */
export function placementByBlock(columns: ColumnFragment[][]): Record<string, string> {
  const slots: Record<string, number[]> = {};

  columns.forEach((fragments, index) => {
    for (const fragment of fragments) {
      if (!slots[fragment.blockId]) slots[fragment.blockId] = [];
      if (!slots[fragment.blockId].includes(index)) slots[fragment.blockId].push(index);
    }
  });

  return Object.fromEntries(
    Object.entries(slots).map(([blockId, indexes]) => {
      const first = SLOT_LABELS[indexes[0]];
      const last = SLOT_LABELS[indexes[indexes.length - 1]];
      return [blockId, first === last ? first : `${first} to ${last}`];
    }),
  );
}

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
 * one. That distinction matters: a margin below the last item in a column
 * occupies no visible space, and counting it made the estimate run about 6%
 * high — enough to push a block into the next column when it would have fit.
 */
export function estimateItemHeight(item: MenuItem): number {
  let height = theme.lineHeight.itemName + theme.space.afterItemName;

  // The add-on run continues the description paragraph, so they measure together.
  const body = [item.description, item.addOn].filter(Boolean).join(" ");
  height += countLines(body, DESCRIPTION_CHARS_PER_LINE) * DESCRIPTION_LINE_HEIGHT;

  if (item.pairing) {
    height += countLines(item.pairing, DESCRIPTION_CHARS_PER_LINE) * DESCRIPTION_LINE_HEIGHT;
  }

  return height;
}

function estimateNoteHeight(body: string): number {
  return (
    theme.space.sectionHeaderRuleOffset +
    theme.size.chefNoteHeading +
    theme.space.afterItemName +
    countLines(body, NOTE_CHARS_PER_LINE) * NOTE_LINE_HEIGHT
  );
}

/** Total height of a whole block, including the gaps between its items. */
export function estimateBlockHeight(block: MenuBlock): number {
  if (block.kind === "note") return estimateNoteHeight(block.body);

  const items = block.items.reduce((total, item) => total + estimateItemHeight(item), 0);
  const gaps = Math.max(0, block.items.length - 1) * theme.space.betweenItems;

  return sectionHeaderHeight(block.addOn) + items + gaps;
}

export type FlowResult = {
  /** Always length COLUMN_SLOTS. Empty arrays for unused columns. */
  columns: ColumnFragment[][];
  /**
   * True when content ran past the last column. Overflowing content is still
   * placed, where it visibly runs off the page — a silent drop would be worse.
   */
  overflow: boolean;
  /**
   * Which column ran over, named for a reader. Usually the last one, but not
   * always: a single item taller than an empty column overflows wherever it
   * happens to be, which can be the first. Null when nothing overflowed.
   */
  overflowColumn: (typeof SLOT_LABELS)[number] | null;
};

export function flowBlocksIntoColumns(blocks: MenuBlock[]): FlowResult {
  const columns: ColumnFragment[][] = Array.from({ length: COLUMN_SLOTS }, () => []);
  const used = new Array<number>(COLUMN_SLOTS).fill(0);

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
    if (column < COLUMN_SLOTS - 1) {
      column += 1;
      return true;
    }
    recordOverflow();
    return false;
  }

  /** Space before the next block in this column — nothing if it's still empty. */
  function leadingGap(): number {
    return used[column] > 0 ? theme.space.betweenSections : 0;
  }

  for (const block of blocks) {
    if (block.kind === "note") {
      const height = estimateNoteHeight(block.body);
      if (used[column] > 0 && used[column] + leadingGap() + height > COLUMN_HEIGHT) advance();

      columns[column].push({
        kind: "note",
        id: block.id,
        blockId: block.id,
        heading: block.heading,
        body: block.body,
      });
      used[column] += leadingGap() + height;
      continue;
    }

    let remaining = [...block.items];
    let isFirstFragment = true;

    while (remaining.length > 0) {
      const gap = leadingGap();
      // Only the first fragment carries the header, so only it pays for the
      // add-on line; a continuation has no heading at all.
      const headerHeight = isFirstFragment ? sectionHeaderHeight(block.addOn) : 0;
      const available = COLUMN_HEIGHT - used[column] - gap - headerHeight;

      // Take as many whole items as fit in what's left of this column, counting
      // the gap between consecutive items but not after the last one.
      const taken: MenuItem[] = [];
      let takenHeight = 0;
      for (const item of remaining) {
        const addition =
          (taken.length === 0 ? 0 : theme.space.betweenItems) + estimateItemHeight(item);
        if (takenHeight + addition > available) break;
        taken.push(item);
        takenHeight += addition;
      }

      // A section that fits in a column of its own is never split across a
      // column break — start it in a fresh column instead. That is what the
      // artboard does: Desserts has six items and no orphan, and still sits
      // whole in the back-right column. Splitting is reserved for a section too
      // tall for any single column.
      //
      // `isFirstFragment` stays true and the new column is empty, so the retry
      // takes everything and can't loop.
      const wouldSplit = taken.length > 0 && taken.length < remaining.length;

      if (
        wouldSplit &&
        isFirstFragment &&
        used[column] > 0 &&
        estimateBlockHeight(block) <= COLUMN_HEIGHT &&
        advance()
      ) {
        continue;
      }

      if (taken.length === 0) {
        // Nothing fits here. Try a fresh column — unless this column is already
        // empty, in which case a single item is taller than a whole column and
        // moving on would loop forever.
        if (used[column] > 0 && advance()) continue;

        const forced = remaining.shift();
        if (!forced) break;
        recordOverflow();
        columns[column].push(
          isFirstFragment
            ? {
                kind: "section",
                id: block.id,
                blockId: block.id,
                title: block.title,
                addOn: block.addOn,
                items: [forced],
              }
            : {
                kind: "section-continued",
                id: `${block.id}-cont`,
                blockId: block.id,
                items: [forced],
              },
        );
        used[column] += gap + headerHeight + estimateItemHeight(forced);
        isFirstFragment = false;
        continue;
      }

      columns[column].push(
        isFirstFragment
          ? {
              kind: "section",
              id: block.id,
              blockId: block.id,
              title: block.title,
              addOn: block.addOn,
              items: taken,
            }
          : {
              kind: "section-continued",
              id: `${block.id}-cont-${column}`,
              blockId: block.id,
              items: taken,
            },
      );
      used[column] += gap + headerHeight + takenHeight;
      remaining = remaining.slice(taken.length);
      isFirstFragment = false;

      // More to place means this column is full; the rest continues in the next.
      if (remaining.length > 0 && !advance()) {
        // Out of columns. Put the remainder here so it's visible, not dropped.
        columns[column].push({
          kind: "section-continued",
          id: `${block.id}-overflow`,
          blockId: block.id,
          items: remaining,
        });
        used[column] += remaining.reduce(
          (sum, item, index) =>
            sum + estimateItemHeight(item) + (index === 0 ? 0 : theme.space.betweenItems),
          0,
        );
        remaining = [];
      }
    }
  }

  return {
    columns,
    overflow,
    overflowColumn: overflowSlot === null ? null : SLOT_LABELS[overflowSlot],
  };
}
