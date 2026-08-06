/**
 * The shape of an editable menu.
 *
 * Modelled on the Elsom Menu Figma file (ciJhmsPGUj0Gge5PKpBzhe, page "POR").
 *
 * Every field here is a plain string or a choice from a fixed list. There is
 * deliberately no font, size, color, alignment, column, or page field — those
 * live in `src/menus/templates/`, which the app never exposes for editing. If a
 * property can't be represented here, a user can't change it.
 *
 * Note what that means for placement: which column a section lands in is NOT
 * stored. It's computed at render time by `src/menus/templates/layout.ts` from
 * how much content there is. Nobody chooses it, so nobody can break it.
 */

/** The vocabulary printed in the footer legend. Fixed — users pick, not type. */
export const DIETARY_TAGS = ["gf", "gf+", "v", "v+", "df"] as const;
export type DietaryTag = (typeof DIETARY_TAGS)[number];

export const DIETARY_TAG_LABELS: Record<DietaryTag, string> = {
  gf: "GF",
  "gf+": "GF+",
  v: "V",
  "v+": "V+",
  df: "DF",
};

export type MenuItem = {
  id: string;
  name: string;
  tags: DietaryTag[];
  /** Free text, so "$8", "$14 / $48", or "" for items with no price all work. */
  price: string;
  /** Newlines are preserved when rendered. */
  description: string;
  /**
   * The bolded run that follows the description on the artboard, e.g.
   * "– add grilled chicken +$6". Stored separately rather than letting people
   * write markup, so the emphasis stays a template decision.
   */
  addOn: string;
  /** e.g. "Pairs with 2024 Albarino". Its own line when present. */
  pairing: string;
};

/**
 * A menu is an ordered list of blocks. Blocks flow into columns in order and
 * are never split, so reordering here is the only control anyone has over
 * where things land.
 */
export type MenuBlock =
  | { kind: "section"; id: string; title: string; items: MenuItem[] }
  | { kind: "note"; id: string; heading: string; body: string };

export type MenuContent = {
  /** Header, right side. e.g. "Summer 2026" */
  season: string;
  blocks: MenuBlock[];
  /** Footer line 2 — the asterisk disclaimer. */
  disclaimer: string;
  /** Footer line 3 — the service charge notice. */
  serviceCharge: string;
};

export type MenuStore = Record<string, MenuContent>;

/** Ids only need to be unique within one menu, and are never shown to users. */
export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function blankItem(): MenuItem {
  return {
    id: newId("item"),
    name: "",
    tags: [],
    price: "",
    description: "",
    addOn: "",
    pairing: "",
  };
}

export function blankSection(): Extract<MenuBlock, { kind: "section" }> {
  return {
    kind: "section",
    id: newId("section"),
    title: "New section",
    items: [blankItem()],
  };
}

function isDietaryTag(value: unknown): value is DietaryTag {
  return typeof value === "string" && (DIETARY_TAGS as readonly string[]).includes(value);
}

function isMenuItem(value: unknown): value is MenuItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "string" &&
    typeof item.description === "string" &&
    typeof item.addOn === "string" &&
    typeof item.pairing === "string" &&
    Array.isArray(item.tags) &&
    item.tags.every(isDietaryTag)
  );
}

function isMenuBlock(value: unknown): value is MenuBlock {
  if (typeof value !== "object" || value === null) return false;
  const block = value as Record<string, unknown>;
  if (typeof block.id !== "string") return false;

  if (block.kind === "section") {
    return (
      typeof block.title === "string" &&
      Array.isArray(block.items) &&
      block.items.every(isMenuItem)
    );
  }

  if (block.kind === "note") {
    return typeof block.heading === "string" && typeof block.body === "string";
  }

  return false;
}

/**
 * Guards the save endpoint. Anything off-shape is rejected rather than coerced,
 * so a malformed request can't quietly overwrite a good menu.
 */
export function isMenuContent(value: unknown): value is MenuContent {
  if (typeof value !== "object" || value === null) return false;
  const menu = value as Record<string, unknown>;

  return (
    typeof menu.season === "string" &&
    typeof menu.disclaimer === "string" &&
    typeof menu.serviceCharge === "string" &&
    Array.isArray(menu.blocks) &&
    menu.blocks.every(isMenuBlock)
  );
}
