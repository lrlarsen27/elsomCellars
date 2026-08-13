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
    /** Item descriptions and section add-ons. MEASURED (22:1010, 30:6347). */
    description: "#413a30",
    /** Footer lines. MEASURED (22:1064). Also the pairing line and chef note,
     *  neither of which has been re-measured since the redesign. */
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
    /** MEASURED (30:6352). */
    sectionHeader: 14,
    /** The line under a section's rule, when it carries one. MEASURED (30:6347). */
    sectionAddOn: 12,
    /** MEASURED (22:1010). */
    itemName: 16,
    dietaryTag: 12,
    price: 16,
    description: 14,
    /** MEASURED (22:997). */
    seasonLabel: 16,
    /** APPROX — not re-measured since the redesign. */
    chefNoteHeading: 12,
    chefNoteBody: 12,
    /** MEASURED (22:1064). */
    footer: 10,
  },

  tracking: {
    /** Letter spacing in points. MEASURED. */
    sectionHeader: 2,
    itemName: 1,
    dietaryTag: 1,
    /** MEASURED (22:997). */
    seasonLabel: 5.88,
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
    /**
     * A section header is 22pt tall normally and 42pt when it carries an
     * add-on, which sits below the rule. MEASURED (30:6352 vs 30:6347).
     */
    sectionHeaderWithAddOn: 42,
    afterSectionHeader: 10,
    /** Every hairline on the sheet: the header divider and the section rules. */
    ruleWidth: 0.5,
    /** Between the three footer lines. MEASURED (22:1064). */
    footerGap: 4,
    /**
     * Above the footer. This 14pt is the difference between COLUMN_HEIGHT's
     * 1030 budget in `layout.ts` and the ~1017 of real column area, which is
     * why the estimator runs about 1% generous.
     */
    footerTopMargin: 14,
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
