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
  | {
      kind: "section";
      id: string;
      title: string;
      items: MenuItem[];
      /**
       * An add-on that applies to the whole section rather than one item, e.g.
       * "+ Grilled Chicken $6" on Salads. Optional because the printed template
       * has no slot for it yet — the content is carried so nothing is lost, and
       * it starts printing when the design says where it goes.
       */
      addOn?: string;
    }
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

// --------------------------------------------------------------- wine ---

/**
 * The wine menu's content, modelled on the Elsom Wine Menu Figma artboard
 * (node `29:5658`).
 *
 * A second model rather than a widening of the food one. A wine carries two
 * prices and an appellation and no dietary tags, and the food menu is in print
 * — bending `MenuItem` to hold both would put optional fields on a type whose
 * every consumer is calibrated to the food card.
 *
 * The same rule holds as above: every field is a plain string, and there is no
 * font, size, colour, column or page field anywhere in here. Which column a
 * wine section prints in is computed from how much content there is, not stored.
 */
export type Wine = {
  id: string;
  name: string;
  /**
   * Free text, so "$30" survives exactly as typed. Empty for a wine sold only
   * by the glass — the bottle column simply prints nothing.
   */
  bottlePrice: string;
  /** Empty for a wine sold only by the bottle. */
  glassPrice: string;
  /** The appellation, e.g. "Horse Heaven Hills". Its own line under the name. */
  location: string;
  /** Newlines are preserved when rendered. */
  tastingNotes: string;
};

/**
 * The bordered box above the columns. Content rather than template copy, so the
 * winery can change a $20 pour price without a designer.
 */
export type TastingExperience = {
  id: string;
  title: string;
  /** Free text, like a wine's. */
  price: string;
  description: string;
};

/**
 * One kind so far, and the discriminant is carried anyway: it keeps the wine
 * blocks readable the way the food blocks are, and a second kind is an added
 * member rather than a reshaping of every consumer.
 */
export type WineBlock = { kind: "section"; id: string; title: string; wines: Wine[] };

export type WineContent = {
  /** Header, right side. Shared with the food menu. e.g. "Summer 2026" */
  season: string;
  blocks: WineBlock[];
  /**
   * Absent when the tab carries no `Experience` row. Held beside the blocks
   * rather than in them because it prints in a box across the top rather than
   * flowing into a column.
   */
  experience?: TastingExperience;
  /** Footer line 1 — the 21+ notice. The wine menu's own, not the food disclaimer. */
  wineFooter: string;
  /** Footer line 2 — the service charge notice. Shared with the food menu. */
  serviceCharge: string;
};

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
      (block.addOn === undefined || typeof block.addOn === "string") &&
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

function isWine(value: unknown): value is Wine {
  if (typeof value !== "object" || value === null) return false;
  const wine = value as Record<string, unknown>;
  return (
    typeof wine.id === "string" &&
    typeof wine.name === "string" &&
    typeof wine.bottlePrice === "string" &&
    typeof wine.glassPrice === "string" &&
    typeof wine.location === "string" &&
    typeof wine.tastingNotes === "string"
  );
}

function isTastingExperience(value: unknown): value is TastingExperience {
  if (typeof value !== "object" || value === null) return false;
  const experience = value as Record<string, unknown>;
  return (
    typeof experience.id === "string" &&
    typeof experience.title === "string" &&
    typeof experience.price === "string" &&
    typeof experience.description === "string"
  );
}

function isWineBlock(value: unknown): value is WineBlock {
  if (typeof value !== "object" || value === null) return false;
  const block = value as Record<string, unknown>;
  return (
    block.kind === "section" &&
    typeof block.id === "string" &&
    typeof block.title === "string" &&
    Array.isArray(block.wines) &&
    block.wines.every(isWine)
  );
}

/**
 * The wine menu's counterpart to `isMenuContent`, rejecting rather than
 * coercing for the same reason. An absent tasting experience is valid; one that
 * is present and off-shape is not.
 */
export function isWineContent(value: unknown): value is WineContent {
  if (typeof value !== "object" || value === null) return false;
  const menu = value as Record<string, unknown>;

  return (
    typeof menu.season === "string" &&
    typeof menu.wineFooter === "string" &&
    typeof menu.serviceCharge === "string" &&
    (menu.experience === undefined || isTastingExperience(menu.experience)) &&
    Array.isArray(menu.blocks) &&
    menu.blocks.every(isWineBlock)
  );
}
