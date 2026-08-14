import type { ReactElement } from "react";
import { FoodMenu } from "./FoodMenu";
import { WineMenu } from "./WineMenu";
import type { ColumnFragment } from "./layout";
import type { WineColumnFragment } from "./wine-layout";
import type { MenuContent, WineContent } from "@/lib/schema";

/**
 * Maps a menu id to its PDF document. Imported by client components only —
 * keeping `@react-pdf/renderer` out of the server bundle.
 *
 * Every template is handed both halves of what it draws: the menu's content,
 * and the columns that menu's own flow already placed. Placement is computed
 * once, by the page, so the fit gate the winery reads and the file it exports
 * cannot disagree — and no template runs a flow of its own.
 *
 * To add a menu once it's designed: write the template, add it here, add its
 * metadata to `src/menus/registry.ts`, and add its source to `src/menus/kinds.ts`.
 */

/** Whichever menu's content this is. Each entry below narrows to its own. */
export type TemplateContent = MenuContent | WineContent;

/** The same, for placement: four slots for the food menu, two for the wine. */
export type TemplateColumns = ColumnFragment[][] | WineColumnFragment[][];

const TEMPLATES: Record<
  string,
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
  const template = TEMPLATES[menuId];
  return template ? template(content, columns) : null;
}
