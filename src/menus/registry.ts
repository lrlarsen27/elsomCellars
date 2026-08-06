/**
 * Metadata for the two menus. Kept free of any `@react-pdf/renderer` imports
 * so server components and API routes can read it without pulling the PDF
 * engine into the server bundle. The actual templates live in
 * `src/menus/templates/index.ts`, which is imported by client code only.
 */

export type MenuMeta = {
  id: string;
  label: string;
  description: string;
};

export const MENUS: MenuMeta[] = [
  {
    id: "food",
    label: "Food Menu",
    description: "Starters, mains, and desserts.",
  },
  {
    id: "drinks",
    label: "Drinks Menu",
    description: "Cocktails, wine, and non-alcoholic.",
  },
];

export const MENU_IDS = MENUS.map((menu) => menu.id);

export function getMenuMeta(id: string): MenuMeta | undefined {
  return MENUS.find((menu) => menu.id === id);
}
