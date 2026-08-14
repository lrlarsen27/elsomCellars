/**
 * Metadata for each menu, and the id union the rest of the app is total over.
 *
 * Kept free of any `@react-pdf/renderer` import and of any client component:
 * the route and the home page are server components and read this module, so
 * anything it reaches lands in the server bundle. A menu's mapper, flow and
 * preview live in `kinds.ts`; its PDF template lives in `templates/index.tsx`,
 * reachable only through the dynamic import inside the export handler.
 * `kinds.test.ts` asserts this module reaches neither.
 *
 * Adding a menu is a row here, an entry in `kinds.ts`, and an entry in
 * `templates/index.tsx`. Both of those tables are typed as total records over
 * `MenuId`, so a row added here without them fails the type check rather than
 * reaching the winery with a page that cannot export.
 */

export type MenuMeta = {
  id: string;
  label: string;
  description: string;
};

/**
 * `as const satisfies` on purpose: the shape is still checked against
 * `MenuMeta`, and the ids stay literal so `MenuId` is a union of exactly the
 * menus listed here rather than `string`.
 *
 * The description is the only place staff learn which menu is which — the home
 * page shows it under the menu's name and nothing else explains the difference.
 */
export const MENUS = [
  {
    id: "food",
    label: "Food & Drink Menu",
    description: "Tabloid, front and back. Food on the front, beverages and desserts on the back.",
  },
  {
    id: "wine",
    label: "Wine Menu",
    description: "Tabloid, one side. The tasting experience across the top, wines by the glass and the bottle in two columns.",
  },
] as const satisfies readonly MenuMeta[];

export type MenuId = (typeof MENUS)[number]["id"];

export const MENU_IDS: MenuId[] = MENUS.map((menu) => menu.id);

export function getMenuMeta(id: string): MenuMeta | undefined {
  return MENUS.find((menu) => menu.id === id);
}
