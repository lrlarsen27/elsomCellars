import { FOOD_SOURCE } from "@/lib/food-sheet";
import { WINE_SOURCE } from "@/lib/wine-sheet";
import type { MenuSource } from "@/lib/sheet";

/**
 * A menu's bundle: everything that is this menu rather than the shell around
 * it, gathered in one place so adding a menu is one entry rather than a search
 * for every switch that mentions the last one.
 *
 * Only the source half exists so far — where the content is read from and how a
 * row becomes content. That half is pure and server-safe. The column flow and
 * the preview join the bundle in a later unit, and the page shell stops holding
 * either.
 *
 * Nothing here may name a template. The PDF engine is reachable only through
 * the dynamic import inside the export handler, and a template reference in
 * this module would pull `@react-pdf/renderer` into the prerendered graph.
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

export type MenuKind<C extends PrintableContent = PrintableContent> = {
  source: MenuSource<C>;
};

const KINDS: Record<string, MenuKind> = {
  food: { source: FOOD_SOURCE },
  wine: { source: WINE_SOURCE },
};

/**
 * Undefined for a menu with no reader, rather than falling back to another
 * menu's — a URL for a menu nobody has built must not quietly serve the food
 * menu's content.
 */
export function menuKindFor(menuId: string): MenuKind | undefined {
  return Object.prototype.hasOwnProperty.call(KINDS, menuId) ? KINDS[menuId] : undefined;
}
