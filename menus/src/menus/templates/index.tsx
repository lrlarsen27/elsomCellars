import type { ReactElement } from "react";
import { FoodMenu } from "./FoodMenu";
import { WineMenu } from "./WineMenu";
import type { MenuContent } from "@/lib/schema";

/**
 * Maps a menu id to its PDF document. Imported by client components only —
 * keeping `@react-pdf/renderer` out of the server bundle.
 *
 * To add a third menu: write the template, add it here, and add its metadata
 * to `src/menus/registry.ts`. Nothing else needs to change.
 */
const TEMPLATES: Record<string, (content: MenuContent) => ReactElement> = {
  food: (content) => <FoodMenu content={content} />,
  wine: (content) => <WineMenu content={content} />,
};

export function renderMenuDocument(
  menuId: string,
  content: MenuContent,
): ReactElement | null {
  const template = TEMPLATES[menuId];
  return template ? template(content) : null;
}
