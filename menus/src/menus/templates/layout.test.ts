import { describe, it, expect } from "vitest";
import {
  COLUMN_HEIGHT,
  estimateBlockHeight,
  flowBlocksIntoColumns,
} from "./layout";
import type { MenuBlock, MenuItem } from "@/lib/schema";

/**
 * The rule these tests pin down: a section that fits in a column of its own is
 * never split across a column break. The artboard works that way — Desserts
 * carries six items and no orphan, and still sits whole in the back-right
 * column — and it is easy to lose by tuning the estimator for one month's menu.
 */

function item(name: string, description = ""): MenuItem {
  return { id: `item-${name}`, name, tags: [], price: "$10", description, addOn: "", pairing: "" };
}

function section(title: string, count: number, description = ""): MenuBlock {
  return {
    kind: "section",
    id: `section-${title}`,
    title,
    items: Array.from({ length: count }, (_, i) => item(`${title}-${i}`, description)),
  };
}

const LONG = "A description long enough to wrap onto a couple of lines in a column of this width.";

function continuationsFor(blocks: MenuBlock[], blockId: string) {
  return flowBlocksIntoColumns(blocks)
    .columns.flat()
    .filter((f) => f.kind === "section-continued" && f.blockId === blockId);
}

describe("keeping sections whole", () => {
  it("moves a section to the next column rather than splitting it", () => {
    const filler = section("Filler", 14, LONG);
    const whole = section("Whole", 6, LONG);

    // The premise: the second section does fit in a column on its own.
    expect(estimateBlockHeight(whole)).toBeLessThanOrEqual(COLUMN_HEIGHT);

    const flow = flowBlocksIntoColumns([filler, whole]);

    expect(continuationsFor([filler, whole], whole.id)).toHaveLength(0);

    // And it landed whole, in one column, with all its items.
    const fragment = flow.columns.flat().find((f) => f.kind === "section" && f.id === whole.id);
    expect(fragment && fragment.kind === "section" && fragment.items).toHaveLength(6);
  });

  it("still splits a section too tall for any single column", () => {
    const huge = section("Huge", 40, LONG);

    expect(estimateBlockHeight(huge)).toBeGreaterThan(COLUMN_HEIGHT);
    expect(continuationsFor([huge], huge.id).length).toBeGreaterThan(0);
  });

  it("names the column that ran over, and names none when nothing did", () => {
    const fits = flowBlocksIntoColumns([section("Small", 4, LONG)]);
    expect(fits.overflow).toBe(false);
    expect(fits.overflowColumn).toBeNull();

    // Five columns' worth of content on a four-column sheet.
    const tooMuch = Array.from({ length: 5 }, (_, i) => section(`S${i}`, 14, LONG));
    const over = flowBlocksIntoColumns(tooMuch);
    expect(over.overflow).toBe(true);
    expect(over.overflowColumn).toBe("Back right");
  });

  it("names the first column to overflow when a single item is taller than a column", () => {
    const giant = section("Giant", 1, LONG.repeat(60));
    const flow = flowBlocksIntoColumns([giant]);

    expect(flow.overflow).toBe(true);
    expect(flow.overflowColumn).toBe("Front left");
  });

  it("counts a section add-on against the column, so headers with one are taller", () => {
    const plain = section("Plain", 4, LONG);
    const withAddOn: MenuBlock = { ...section("Added", 4, LONG), addOn: "+ Something $6" } as MenuBlock;

    expect(estimateBlockHeight(withAddOn)).toBeGreaterThan(estimateBlockHeight(plain));
  });
});
