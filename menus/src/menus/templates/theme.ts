/**
 * Design tokens, read from the Elsom Menu Figma file.
 * File: ciJhmsPGUj0Gge5PKpBzhe · page "POR" · node 22:976
 *
 * Everything outside `theme.wine` describes the food menu, which is in print.
 * The wine menu's own values live in `theme.wine`, read from node 29:5658 in
 * the same file. They are a separate namespace on purpose — see the comment
 * there.
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

  /**
   * The wine menu, node 29:5658 ("Wine Menu") — ONE printed side, 792 x 1224.
   *
   * A separate namespace, not a widening of the tokens above. The wine menu
   * disagrees with the food menu on `space.itemTextWidth` (230 against 314),
   * `space.priceColumnWidth` (two columns of 43 and 71 against one of 34),
   * `space.afterHeaderDivider` (20 against 24) and the description line height
   * (a flat 17 against a 1.25 multiple). It also introduces a colour nothing
   * else on either menu uses. Retuning any of those in place would move a piece
   * that is already printed, so nothing here reaches back into the food tokens.
   *
   * What wine deliberately *reuses* from above, rather than restating:
   * `page` (792 x 1224, margin 36, content 720), `column.width`/`gutter`/
   * `count` (two 348s with a 24 gutter), the whole `font` map, the header
   * tokens (`space.headerHeight`, `size.seasonLabel`, `tracking.seasonLabel`),
   * `space.ruleWidth`, `color.rule`, `color.gold`, `color.description`,
   * `color.body`, `size.footer` and `space.footerGap`. The wine header is
   * byte-identical to the food header on every value.
   *
   * Values are MEASURED unless marked otherwise, same convention as above.
   */
  wine: {
    color: {
      /**
       * The tasting-experience block's border and all three of its text runs.
       * MEASURED (29:6262). Appears nowhere else on either menu, which is why
       * it is scoped here rather than added to `color`.
       */
      feature: "#536940",
    },

    /**
     * Where the two columns live vertically. Both are content-relative, so
     * 0 is `page.margin` from the top of the sheet.
     *
     * The 177 is a derivation, not an independent measurement: header 0–50,
     * then 20, feature block 70–146, then 31. The 983 is where the bottom logo
     * frame begins — the columns must stop there. MEASURED.
     */
    column: {
      top: 177,
      bottom: 983,
      /**
       * 983 - 177. The food menu's usable column is 1018; this one is NOT that,
       * and the difference is the feature block and the bottom lockup.
       */
      height: 806,
    },

    /**
     * The tasting-experience box below the header. MEASURED (29:6262).
     * No fill and no corner radius.
     */
    feature: {
      /**
       * 716, not the full 720 content width — its right edge lands 4pt inside
       * the column right edge. The artboard's own geometry; not a rounding slip.
       */
      width: 716,
      height: 76,
      /** Content-relative origin. */
      x: 0,
      y: 70,
      borderWidth: 1,
      /** Uniform on all four sides. */
      padding: 16,
      /** Below the header divider. The food menu's equivalent gap is 24. */
      afterHeaderDivider: 20,
      /** Above the top of the columns: 70 + 76 + 31 = 177. */
      beforeColumns: 31,
      /** Title, uppercase. MEASURED (29:6266). */
      titleSize: 20,
      titleTracking: 1,
      titleLineHeight: 22,
      /** Price, right-aligned. MEASURED (29:6307). */
      priceSize: 20,
      priceTracking: 0,
      /** Body, in the serif face. MEASURED (29:6268) — box height 19. */
      bodySize: 16,
      bodyLineHeight: 19,
      /** Between the block's own paragraphs. The wine item's equivalent is 2. */
      paragraphGap: 4,
    },

    /**
     * Section header, component 32:6720 — 348 x 22. MEASURED.
     *
     * Always 22 tall. There is no section add-on line on the wine menu, so
     * there is no wine equivalent of `space.sectionHeaderWithAddOn`.
     *
     * The rule beneath uses the shared `space.ruleWidth` and `color.rule`; the
     * name and the two labels use `color.gold`.
     */
    sectionHeader: {
      height: 22,
      /** The rule sits at the header's own height and runs the full 348. */
      ruleOffset: 22,
      ruleWidth: 348,
      nameSize: 14,
      nameTracking: 2,
      /**
       * The price-column labels, which print only on the first section in each
       * column. Same type treatment as the section name. Content-relative to
       * the column's left edge.
       */
      glassLabelX: 235,
      glassLabelWidth: 38,
      bottleLabelX: 297,
      bottleLabelWidth: 46,
      /** Header to its first item. */
      afterSectionHeader: 10,
      /** Between one section group and the next. */
      betweenSections: 20,
    },

    /**
     * Wine item, component 29:5998 — 348 wide. MEASURED.
     *
     * One horizontal row of three fixed-width children. 230 + 43 + 71 = 344, so
     * the bottle price's right edge sits 4pt inside the 348 column while the
     * section rule above it runs the full 348. That inset is the artboard's own
     * geometry — reproduce it, do not close it.
     *
     * There is no dietary-tag slot on a wine item.
     */
    item: {
      textWidth: 230,
      glassPriceX: 230,
      glassPriceWidth: 43,
      bottlePriceX: 273,
      bottlePriceWidth: 71,
      /** Item name. MEASURED (29:5980) — takes `color.gold`. */
      nameSize: 16,
      nameTracking: 1,
      nameLineHeight: 22,
      /**
       * The title row is 21 tall even though the name sits on a 22pt line and
       * the price boxes are 19. Measured from the component, not derived.
       */
      titleRowHeight: 21,
      /** Glass and bottle prices — `color.gold`, box height 19. */
      priceSize: 16,
      priceTracking: 0,
      priceBoxHeight: 19,
      /** Location / AVA line. MEASURED (29:5982) — takes `color.description`. */
      locationSize: 14,
      locationLineHeight: 17,
      /** Tasting notes. MEASURED (29:5986) — takes `color.description`. */
      notesSize: 14,
      notesLineHeight: 17,
      /** Between an item's own lines: title, gap, location, gap, notes. */
      innerGap: 2,
      /** 21 + 2 + 17 + 2 + 17. The two heights the artboard actually has. */
      height: 59,
      /** The same item with its tasting notes wrapped to two lines. */
      heightWithWrappedNotes: 76,
      /** Between consecutive items. */
      betweenItems: 10,
    },

    /**
     * The bottom logo lockup, node 29:6274. MEASURED.
     *
     * The frame is exactly centred in the 720 content width: (720 - 170) / 2.
     * `column.bottom` is this frame's top — the columns end where it begins.
     */
    lockup: {
      width: 170,
      height: 125.5997,
      /** Content-relative origin. */
      x: 275,
      y: 983,
      padding: 20,
      /** The artwork inside, at frame-relative (20, 20). */
      artWidth: 138,
      artHeight: 85.5997,
    },

    /**
     * Footer, nodes 29:5744 / 29:5745. MEASURED.
     *
     * The same 720 x 44 frame at content y=1104 as the food menu, but the wine
     * instance is 541 x 28 bottom-aligned inside it rather than filling it. Two
     * centred lines where the food menu has three; the type is the shared
     * `size.footer`, `color.body` and `space.footerGap`.
     */
    footer: {
      frameY: 1104,
      frameHeight: 44,
      width: 541,
      height: 28,
      /** From the frame top: 44 - 28, i.e. bottom-aligned. */
      topOffset: 16,
      lines: 2,
    },
  },
} as const;

export type DietaryTag = keyof typeof theme.dietaryTags;

/**
 * Fonts are wired up — see `fonts.ts` for where the files came from and why
 * `@fontsource` can't be used (it ships woff/woff2; react-pdf needs TTF/OTF).
 */
