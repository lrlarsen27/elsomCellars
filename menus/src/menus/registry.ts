/**
 * Metadata for each menu. Kept free of any `@react-pdf/renderer` imports so
 * server components and API routes can read it without pulling the PDF engine
 * into the server bundle. The templates live in `templates/index.tsx`, which is
 * imported by client code only.
 *
 * Only one menu exists so far. The wine menu hasn't been designed yet — when it
 * is, add a template, register it in `templates/index.tsx`, add seed copy, and
 * add a row here. Nothing else changes.
 */

export type MenuMeta = {
  id: string;
  label: string;
  description: string;
};

export const MENUS: MenuMeta[] = [
  {
    id: "food",
    label: "Food & Drink Menu",
    description: "Tabloid, front and back. Food on the front, beverages and desserts on the back.",
  },
];

export const MENU_IDS = MENUS.map((menu) => menu.id);

export function getMenuMeta(id: string): MenuMeta | undefined {
  return MENUS.find((menu) => menu.id === id);
}
