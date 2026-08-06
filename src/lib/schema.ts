/**
 * The shape of an editable menu.
 *
 * Every field here is a plain string. There is deliberately no font, size,
 * color, alignment, or spacing field anywhere in this type — those live in the
 * PDF templates under `src/menus/templates/`, which the app never exposes for
 * editing. If a property can't be represented here, a user can't change it.
 */

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
};

export type MenuSection = {
  id: string;
  title: string;
  items: MenuItem[];
};

export type MenuContent = {
  title: string;
  subtitle: string;
  sections: MenuSection[];
  footer: string;
};

export type MenuStore = Record<string, MenuContent>;

/** Ids only need to be unique within one menu, and are never shown to users. */
export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function blankItem(): MenuItem {
  return { id: newId("item"), name: "", description: "", price: "" };
}

export function blankSection(): MenuSection {
  return { id: newId("section"), title: "New section", items: [blankItem()] };
}

/**
 * Guards the save endpoint. Anything not matching the shape above is rejected
 * rather than coerced, so a malformed request can't corrupt the stored menu.
 */
export function isMenuContent(value: unknown): value is MenuContent {
  if (typeof value !== "object" || value === null) return false;
  const menu = value as Record<string, unknown>;

  if (typeof menu.title !== "string") return false;
  if (typeof menu.subtitle !== "string") return false;
  if (typeof menu.footer !== "string") return false;
  if (!Array.isArray(menu.sections)) return false;

  return menu.sections.every((section: unknown) => {
    if (typeof section !== "object" || section === null) return false;
    const s = section as Record<string, unknown>;
    if (typeof s.id !== "string" || typeof s.title !== "string") return false;
    if (!Array.isArray(s.items)) return false;

    return s.items.every((item: unknown) => {
      if (typeof item !== "object" || item === null) return false;
      const i = item as Record<string, unknown>;
      return (
        typeof i.id === "string" &&
        typeof i.name === "string" &&
        typeof i.description === "string" &&
        typeof i.price === "string"
      );
    });
  });
}
