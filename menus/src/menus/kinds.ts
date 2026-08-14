"use client";

import { createElement, type ReactElement } from "react";
import { MenuPreview } from "@/components/MenuPreview";
import { WinePreview } from "@/components/WinePreview";
import { flowBlocksIntoColumns } from "@/menus/templates/layout";
import { flowWineBlocksIntoColumns } from "@/menus/templates/wine-layout";
import { FOOD_SOURCE } from "@/lib/food-sheet";
import { WINE_SOURCE } from "@/lib/wine-sheet";
import type { MenuSource } from "@/lib/sheet";
import type { MenuId } from "@/menus/registry";

/**
 * A menu's bundle: everything that is this menu rather than the shell around
 * it, gathered in one place so adding a menu is one entry rather than a search
 * for every switch that mentions the last one.
 *
 * It has two halves. The SOURCE half — where the content is read from and how a
 * row becomes content — is pure and server-safe, and lives beside each menu's
 * mapper in `lib/`. The RENDER half is here: the column flow, the on-screen
 * sheet, and what an overrun means on this menu's paper. Because the render
 * half names client components, this module is client-only, and only
 * `components/Editor.tsx` imports it.
 *
 * Nothing here may name a template. The PDF engine is reachable only through
 * the dynamic import inside the export handler, and a template reference in
 * this module would pull `@react-pdf/renderer` into the prerendered graph.
 * `kinds.test.ts` asserts that from source text, over everything this module
 * reaches — the flow and token modules under `templates/` are pure, and are
 * deliberately fine to import.
 *
 * Separate from `registry.ts`, which stays pure metadata for the route and the
 * home page: the shell reads both, and neither reads the other.
 */

/**
 * All the page shell needs from any menu's content. The blocks and the footer
 * belong to that menu's own flow and preview, so the shell does not ask for
 * them — it reads the season for the download filename and nothing else.
 */
export type PrintableContent = { season: string };

/**
 * One menu's content, placed. The fragment type is erased here on purpose: the
 * shell carries placement from the flow to the preview and on to the template
 * without ever naming a fragment type, and each end re-narrows to its own
 * inside its own entry.
 */
export type MenuPlacement = {
  /** Straight from this menu's flow — one array per column slot. */
  columns: unknown[][];
  /** True when content ran past the sheet. It is still placed, and visible. */
  overflow: boolean;
  /** Which column ran over, named for a reader. Null when nothing overflowed. */
  overflowColumn: string | null;
  /**
   * Draws this menu's on-screen sheet.
   *
   * A function returning an element rather than a component reference, so the
   * shell never has to name a preview's prop types — which is the whole reason
   * it can hold no content type.
   */
  preview: () => ReactElement;
};

export type MenuKind = {
  /** The source half: tab id, aliases, required columns and settings, mapper. */
  source: MenuSource<PrintableContent>;
  /** Places content that this same entry's source produced. */
  place: (content: PrintableContent) => MenuPlacement;
  /**
   * What to do about an overrun, and what exporting anyway will print. Bundle
   * data rather than a branch in the shell: the food menu's slot vocabulary
   * ("an earlier column") does not survive a single-sided sheet, and the
   * override's consequence differs between the two. The overflowing column's
   * own name comes back from the flow, so only the advice is per menu.
   */
  overflowAdvice: string;
};

/**
 * Ties a menu's two halves together at its own concrete content type.
 *
 * The one cast in the bundle is here, and this is the only place it can be
 * honest: the shell selects a bundle by menu id, which erases the content type
 * the transport was parameterised by, and every field below comes from a single
 * entry naming a single menu — so the content this receives is the content that
 * entry's own source produced. Written in the shell, the same cast would be a
 * guess about which menu is on screen. That is what `asFoodContent` was, and
 * why it is gone.
 */
function menuKind<C extends PrintableContent, F>(spec: {
  source: MenuSource<C>;
  flow: (content: C) => { columns: F[][]; overflow: boolean; overflowColumn: string | null };
  preview: (content: C, columns: F[][]) => ReactElement;
  overflowAdvice: string;
}): MenuKind {
  return {
    source: spec.source,
    overflowAdvice: spec.overflowAdvice,
    place: (content) => {
      const own = content as C;
      const flowed = spec.flow(own);

      return {
        columns: flowed.columns,
        overflow: flowed.overflow,
        overflowColumn: flowed.overflowColumn,
        // Placement is computed once, here, and the same result reaches both
        // renderers — so the fit gate the winery reads and the file it exports
        // cannot disagree, and no renderer runs a flow of its own.
        preview: () => spec.preview(own, flowed.columns),
      };
    },
  };
}

/**
 * Total over `MenuId`: a menu registered in `registry.ts` and forgotten here
 * fails the type check, rather than reaching the winery as a page that says it
 * has no reader.
 */
const KINDS: Record<MenuId, MenuKind> = {
  food: menuKind({
    source: FOOD_SOURCE,
    flow: (content) => flowBlocksIntoColumns(content.blocks),
    preview: (content, columns) => createElement(MenuPreview, { content, columns }),
    overflowAdvice:
      "Shorten something in the spreadsheet, or move a section up so it lands in an earlier column.",
  }),
  wine: menuKind({
    source: WINE_SOURCE,
    flow: (content) => flowWineBlocksIntoColumns(content.blocks),
    preview: (content, columns) => createElement(WinePreview, { content, columns }),
    overflowAdvice:
      "Shorten something on the wine tab, or move a section up so it lands in the left column. This menu prints on one side, so exporting anyway puts the overrun on a second side the design does not have.",
  }),
};

/**
 * Undefined for a menu with no reader, rather than falling back to another
 * menu's — a URL for a menu nobody has built must not quietly serve the food
 * menu's content.
 */
export function menuKindFor(menuId: string): MenuKind | undefined {
  return Object.prototype.hasOwnProperty.call(KINDS, menuId) ? KINDS[menuId as MenuId] : undefined;
}
