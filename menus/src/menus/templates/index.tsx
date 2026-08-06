import type { ReactElement } from "react";
import { FoodMenu } from "./FoodMenu";
import type { MenuContent } from "@/lib/schema";

/**
 * Maps a menu id to its PDF document. Imported by client components only —
 * keeping `@react-pdf/renderer` out of the server bundle.
 *
 * To add the wine menu once it's designed: write the template, add it here,
 * add its metadata to `src/menus/registry.ts`, and add starting copy to
 * `src/lib/seed.ts`.
 */
const TEMPLATES: Record<string, (content: MenuContent) => ReactElement> = {
  food: (content) => <FoodMenu content={content} />,
};

export function renderMenuDocument(
  menuId: string,
  content: MenuContent,
): ReactElement | null {
  const template = TEMPLATES[menuId];
  return template ? template(content) : null;
}
