import type { ReactElement } from "react";
import { FoodMenu } from "./FoodMenu";
import { WineMenu } from "./WineMenu";
import type { ColumnFragment } from "./layout";
import type { WineColumnFragment } from "./wine-layout";
import type { MenuContent, WineContent } from "@/lib/schema";
import type { PrintableContent } from "@/menus/kinds";
import type { MenuId } from "@/menus/registry";

/**
 * Maps a menu id to its PDF document. Reached only through the dynamic import
 * inside the export handler — that is what keeps `@react-pdf/renderer` out of
 * the server bundle and out of the prerendered graph, and it is also the only
 * import shape that resolves this package under this Next version.
 *
 * Every template is handed both halves of what it draws: the menu's content,
 * and the columns that menu's own flow already placed. Placement is computed
 * once, by the page, so the fit gate the winery reads and the file it exports
 * cannot disagree — and no template runs a flow of its own.
 *
 * To add a menu: write the template, add it here, add its metadata to
 * `src/menus/registry.ts`, and add its bundle to `src/menus/kinds.ts`.
 */

/**
 * What the page shell can promise about content by the time it reaches here —
 * which is only that it carries a season. The shell holds no content type, so
 * each entry below re-narrows to its own, exactly as the bundle does.
 */
export type TemplateContent = PrintableContent;

/** The same, for placement: four slots for the food menu, two for the wine. */
export type TemplateColumns = unknown[][];

/**
 * Total over `MenuId`: removing an entry, or registering a menu without one,
 * fails the type check rather than reaching the winery as an export button that
 * reports there is no template.
 */
const TEMPLATES: Record<
  MenuId,
  (content: TemplateContent, columns: TemplateColumns) => ReactElement
> = {
  food: (content, columns) => (
    <FoodMenu content={content as MenuContent} columns={columns as ColumnFragment[][]} />
  ),
  wine: (content, columns) => (
    <WineMenu content={content as WineContent} columns={columns as WineColumnFragment[][]} />
  ),
};

export function renderMenuDocument(
  menuId: string,
  content: TemplateContent,
  columns: TemplateColumns,
): ReactElement | null {
  if (!Object.prototype.hasOwnProperty.call(TEMPLATES, menuId)) return null;
  return TEMPLATES[menuId as MenuId](content, columns);
}
