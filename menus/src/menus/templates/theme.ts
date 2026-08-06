/**
 * Design tokens, read from the Elsom Menu Figma file.
 * File: ciJhmsPGUj0Gge5PKpBzhe · page "POR" · node 22:976
 *
 * This file is the single source of truth for type, spacing, and color, and is
 * never exposed through the app UI. Changing anything here is a code change.
 *
 * Values marked MEASURED came back from `get_design_context` and are exact.
 * Values marked APPROX were read off the rendered artboard and should be
 * confirmed against Figma before this goes to print.
 */

export const theme = {
  /** Tabloid portrait, 11" x 17" at 72pt/inch. MEASURED. */
  page: {
    width: 792,
    height: 1224,
    margin: 36,
    /** 792 - (36 * 2). MEASURED. */
    contentWidth: 720,
  },

  /** Two columns of 348 with a 24pt gutter. MEASURED. */
  column: {
    width: 348,
    gutter: 24,
    count: 2,
  },

  color: {
    /** Section headers, item names, prices, logo. MEASURED. */
    gold: "#8c734b",
    /** Descriptions and pairing lines. MEASURED. */
    body: "#6f6455",
    /** Rules under section headers and the header divider. APPROX. */
    rule: "#c9bda6",
    paper: "#ffffff",
  },

  /**
   * Both families are open-source (SIL OFL) and free to embed. Registered in
   * `fonts.ts`; the TTFs live in `public/fonts/`.
   */
  font: {
    /** Barlow Condensed Regular — section headers. MEASURED. */
    headingRegular: "BarlowCondensed",
    /** Barlow Condensed Medium — item names, dietary tags, prices. MEASURED. */
    headingMedium: "BarlowCondensedMedium",
    /** Cormorant Garamond Regular — descriptions. MEASURED. */
    body: "CormorantGaramond",
    /** Cormorant Garamond Bold — inline add-on runs. MEASURED from artboard. */
    bodyBold: "CormorantGaramondBold",
    /** Cormorant Garamond Italic — the chef's note. APPROX. */
    bodyItalic: "CormorantGaramondItalic",
  },

  size: {
    /** MEASURED. */
    sectionHeader: 12,
    itemName: 16,
    dietaryTag: 12,
    price: 16,
    description: 14,
    /** APPROX — header season label and footer lines. */
    seasonLabel: 12,
    chefNoteHeading: 12,
    chefNoteBody: 12,
    footer: 8,
  },

  tracking: {
    /** Letter spacing in points. MEASURED. */
    sectionHeader: 2,
    itemName: 1,
    dietaryTag: 1,
    /** APPROX. */
    seasonLabel: 3,
  },

  lineHeight: {
    /** MEASURED — item name and dietary tag sit on a 22pt line. */
    itemName: 22,
    /** APPROX — Cormorant at 14pt renders comfortably around 1.25. */
    description: 1.25,
  },

  space: {
    /** MEASURED. */
    headerHeight: 50,
    afterHeaderDivider: 24,
    sectionHeaderRuleOffset: 22,
    afterSectionHeader: 10,
    betweenItems: 10,
    afterItemName: 2,
    nameToTagGap: 8,
    /** MEASURED — the price column is a fixed 34pt, right-aligned. */
    priceColumnWidth: 34,
    /** 348 - 34. MEASURED. */
    itemTextWidth: 314,
    /** APPROX. */
    betweenSections: 20,
  },

  /** The fixed vocabulary used on the artboard. MEASURED. */
  dietaryTags: {
    gf: "GF",
    "gf+": "GF+",
    v: "V",
    "v+": "V+",
    df: "DF",
  },
} as const;

export type DietaryTag = keyof typeof theme.dietaryTags;

/**
 * Fonts are wired up — see `fonts.ts` for where the files came from and why
 * `@fontsource` can't be used (it ships woff/woff2; react-pdf needs TTF/OTF).
 */
