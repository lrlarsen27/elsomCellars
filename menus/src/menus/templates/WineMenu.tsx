import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { theme } from "./theme";
import { fonts } from "./fonts";
import { ElsomWordmark, CellarsMark, ElsomLogoHorizontal } from "./logo";
import type { WineColumnFragment } from "./wine-layout";
import type { TastingExperience, Wine, WineContent } from "@/lib/schema";

/**
 * The Elsom Cellars wine menu: ONE tabloid side (11" x 17"), printed front only.
 *
 * Built from ciJhmsPGUj0Gge5PKpBzhe, page "POR", node 29:5658.
 *
 * A sibling of `FoodMenu.tsx` rather than a variant of it — read the two side by
 * side. The structure is the same (one `StyleSheet.create` grouped by banner,
 * every value from the theme, items that never wrap), and the numbers are all
 * different: this sheet's columns run 177 to 983 rather than the full page,
 * because the tasting-experience box and the bottom lockup are already out of
 * the budget.
 *
 * Every value here comes from `theme.wine`, or from the tokens that namespace
 * says it deliberately shares with the food menu — the page box, the two 348
 * columns, the fonts, the header, the rule colour and the footer type. A design
 * literal in this file is exactly the drift the wine namespace exists to stop.
 *
 * Placement is not decided here. `wine-layout.ts` decides which of the two
 * column slots each section lands in and which fragments carry the price-column
 * labels; this template is handed the answer and draws it.
 *
 * The react-pdf constraints the food template records hold here too: there is no
 * z-index (paint order is document order), `fontFamily` does not reliably
 * inherit into nested `Text`, and an item is `wrap={false}` so it is never split
 * across a break.
 */

const styles = StyleSheet.create({
  page: {
    width: theme.page.width,
    height: theme.page.height,
    paddingHorizontal: theme.page.margin,
    paddingVertical: theme.page.margin,
    backgroundColor: theme.color.paper,
    // Page-level default so any text added later without an explicit family
    // lands on a design face rather than react-pdf's built-in Helvetica.
    fontFamily: fonts.body,
  },

  // --- Header ---
  // Identical to the food menu's on every value — same marks, same season
  // label, same divider. Restated from the shared tokens rather than imported
  // from the food template, which keeps each menu one readable document.
  header: {
    width: theme.page.contentWidth,
    height: theme.space.headerHeight,
    position: "relative",
    borderBottomWidth: theme.space.ruleWidth,
    borderBottomColor: theme.color.rule,
  },
  // Positions measured from the artboard, relative to the 720 x 50 header.
  logoElsom: { position: "absolute", left: 0, top: 0 },
  logoCellars: { position: "absolute", left: 43.06, top: 37.95 },
  season: {
    position: "absolute",
    right: 0,
    top: 24,
    fontFamily: fonts.headingRegular,
    fontSize: theme.size.seasonLabel,
    color: theme.color.gold,
    letterSpacing: theme.tracking.seasonLabel,
    textTransform: "uppercase",
    textAlign: "right",
  },

  // --- Tasting experience ---
  /**
   * The bordered box under the header: 716 wide (4pt shy of the content width,
   * which is the artboard's own geometry), no fill, no corner radius.
   *
   * Its 76pt frame holds a 21pt title band on the artboard. react-pdf gives the
   * 20pt title its full 22pt line, so the stack runs about 3pt into the 16pt
   * bottom padding. The frame keeps the artboard's height because the top of
   * the columns is derived from it.
   */
  feature: {
    width: theme.wine.feature.width,
    height: theme.wine.feature.height,
    marginTop: theme.wine.feature.afterHeaderDivider,
    borderWidth: theme.wine.feature.borderWidth,
    borderColor: theme.wine.color.feature,
    padding: theme.wine.feature.padding,
  },
  featureTitleRow: { flexDirection: "row", justifyContent: "space-between" },
  featureTitle: {
    fontFamily: fonts.headingMedium,
    fontSize: theme.wine.feature.titleSize,
    lineHeight: theme.wine.feature.titleLineHeight / theme.wine.feature.titleSize,
    color: theme.wine.color.feature,
    letterSpacing: theme.wine.feature.titleTracking,
    textTransform: "uppercase",
  },
  featurePrice: {
    fontFamily: fonts.headingMedium,
    fontSize: theme.wine.feature.priceSize,
    lineHeight: theme.wine.feature.titleLineHeight / theme.wine.feature.priceSize,
    color: theme.wine.color.feature,
    letterSpacing: theme.wine.feature.priceTracking,
    textAlign: "right",
  },
  featureBody: {
    fontFamily: fonts.body,
    fontSize: theme.wine.feature.bodySize,
    lineHeight: theme.wine.feature.bodyLineHeight / theme.wine.feature.bodySize,
    color: theme.wine.color.feature,
    marginTop: theme.wine.feature.paragraphGap,
  },

  // --- Columns ---
  /**
   * Two 348s with a 24 gutter, in a band of exactly the height the estimator in
   * `wine-layout.ts` budgets. The band ends where the bottom lockup's frame
   * begins, which is what stops a column running under the logo.
   */
  columns: { flexDirection: "row", gap: theme.column.gutter },
  /** Below the tasting-experience box: the artboard's 177 to 983. */
  columnsBelowFeature: {
    marginTop: theme.wine.feature.beforeColumns,
    height: theme.wine.column.height,
  },
  /**
   * With no tasting experience to draw, the columns take its room: they start
   * where the box would have, right under the header divider, and run to the
   * same 983.
   */
  columnsBelowHeader: {
    marginTop: theme.wine.feature.afterHeaderDivider,
    height:
      theme.wine.column.bottom -
      (theme.space.headerHeight + theme.wine.feature.afterHeaderDivider),
  },
  /**
   * The gaps are the container's, not a trailing margin on each child: the
   * estimator charges the space *between* sections and between items and never
   * after the last one, and a template that charged it either way would draw a
   * sheet the fit gate had not budgeted.
   */
  column: { width: theme.column.width, gap: theme.wine.sectionHeader.betweenSections },

  // --- Section ---
  /** Always 22 tall: there is no add-on line on this menu. */
  sectionHeader: {
    position: "relative",
    width: theme.wine.sectionHeader.ruleWidth,
    height: theme.wine.sectionHeader.height,
    borderBottomWidth: theme.space.ruleWidth,
    borderBottomColor: theme.color.rule,
    marginBottom: theme.wine.sectionHeader.afterSectionHeader,
  },
  sectionTitle: {
    fontFamily: fonts.headingRegular,
    fontSize: theme.wine.sectionHeader.nameSize,
    color: theme.color.gold,
    letterSpacing: theme.wine.sectionHeader.nameTracking,
    textTransform: "uppercase",
  },
  /**
   * GLASS and BOTTLE sit inside the header's own band, each in the box the
   * artboard measured for it above its price column. The labels fill those
   * boxes, so they land on the artboard's own left edges either way.
   *
   * `wine-layout.ts` decides which fragments carry them — the first section in
   * each column and no other. This template does not re-derive that rule.
   */
  priceLabel: {
    position: "absolute",
    top: 0,
    fontFamily: fonts.headingRegular,
    fontSize: theme.wine.sectionHeader.nameSize,
    color: theme.color.gold,
    letterSpacing: theme.wine.sectionHeader.nameTracking,
    textTransform: "uppercase",
    textAlign: "right",
  },
  glassLabel: {
    left: theme.wine.sectionHeader.glassLabelX,
    width: theme.wine.sectionHeader.glassLabelWidth,
  },
  bottleLabel: {
    left: theme.wine.sectionHeader.bottleLabelX,
    width: theme.wine.sectionHeader.bottleLabelWidth,
  },
  /** The wines under a header, spaced the way the estimator counts them. */
  wines: { gap: theme.wine.item.betweenItems },

  // --- Wine ---
  /**
   * One row of three fixed-width children: 230 + 43 + 71 = 344, leaving the
   * bottle price's right edge 4pt inside the 348 column the rule above it fills.
   * That inset is the artboard's, not a rounding slip — do not close it.
   */
  item: { flexDirection: "row" },
  itemBody: { width: theme.wine.item.textWidth },
  /**
   * The artboard's title band is 21 while the name sits on a 22pt line, which no
   * box model can hold at once — so the band is a floor and react-pdf's 22pt
   * line decides, making an ordinary wine 60 against the artboard's 59. The
   * estimator charges the same 60, because it predicts print rather than design.
   * A fixed 21 is not the alternative: react-pdf drops a text run whose line
   * cannot fit its container's fixed height, and the name vanishes from the PDF.
   */
  itemTitleRow: { minHeight: theme.wine.item.titleRowHeight },
  itemName: {
    fontFamily: fonts.headingMedium,
    fontSize: theme.wine.item.nameSize,
    lineHeight: theme.wine.item.nameLineHeight / theme.wine.item.nameSize,
    color: theme.color.gold,
    letterSpacing: theme.wine.item.nameTracking,
    textTransform: "uppercase",
  },
  /**
   * Drawn only for a wine that has an appellation. Figma reports one height for
   * every instance of the component, but the artboard renders Vermouth — the
   * one live wine without one — with its note directly under its name. Reserved
   * here, the empty row printed as a gap with nothing in it.
   */
  location: {
    minHeight: theme.wine.item.locationLineHeight,
    marginTop: theme.wine.item.innerGap,
    fontFamily: fonts.body,
    fontSize: theme.wine.item.locationSize,
    lineHeight: theme.wine.item.locationLineHeight / theme.wine.item.locationSize,
    color: theme.color.description,
  },
  notes: {
    minHeight: theme.wine.item.notesLineHeight,
    marginTop: theme.wine.item.innerGap,
    fontFamily: fonts.body,
    fontSize: theme.wine.item.notesSize,
    lineHeight: theme.wine.item.notesLineHeight / theme.wine.item.notesSize,
    color: theme.color.description,
  },
  price: {
    fontFamily: fonts.headingMedium,
    fontSize: theme.wine.item.priceSize,
    lineHeight: theme.wine.item.priceBoxHeight / theme.wine.item.priceSize,
    color: theme.color.gold,
    letterSpacing: theme.wine.item.priceTracking,
    textAlign: "right",
  },
  glassPrice: { width: theme.wine.item.glassPriceWidth },
  bottlePrice: { width: theme.wine.item.bottlePriceWidth },

  // --- Bottom lockup ---
  /**
   * Absolutely placed, like the food menu's watermark, because it is a fixed
   * band on the sheet rather than something the columns push around: its top IS
   * where the columns stop. Absolute coordinates are page-relative, so each one
   * is the artboard's content-relative figure plus the page margin.
   *
   * Padding on two sides only: the artwork sits at frame-relative (20, 20) and
   * is 138 wide in a 170 frame, so the 20 is a left and top offset rather than
   * the symmetric inset a uniform padding would imply.
   */
  lockup: {
    position: "absolute",
    left: theme.page.margin + theme.wine.lockup.x,
    top: theme.page.margin + theme.wine.lockup.y,
    width: theme.wine.lockup.width,
    height: theme.wine.lockup.height,
    paddingLeft: theme.wine.lockup.padding,
    paddingTop: theme.wine.lockup.padding,
  },

  // --- Footer ---
  /**
   * Two centred lines, bottom-aligned in the 44pt frame the food menu fills
   * with three — hence the 16pt drop from the frame's top. Centred in the
   * content width at its own 541.
   */
  footer: {
    position: "absolute",
    left: theme.page.margin + (theme.page.contentWidth - theme.wine.footer.width) / 2,
    top: theme.page.margin + theme.wine.footer.frameY + theme.wine.footer.topOffset,
    width: theme.wine.footer.width,
    alignItems: "center",
    gap: theme.space.footerGap,
  },
  footerLine: {
    fontFamily: fonts.body,
    fontSize: theme.size.footer,
    color: theme.color.body,
    textAlign: "center",
  },
});

function Header({ season }: { season: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.logoElsom}>
        <ElsomWordmark width={78.7908} height={39.782} />
      </View>
      <View style={styles.logoCellars}>
        <CellarsMark width={35.0272} height={4.05181} />
      </View>
      <Text style={styles.season}>{season}</Text>
    </View>
  );
}

function Feature({ experience }: { experience: TastingExperience }) {
  return (
    <View style={styles.feature} wrap={false}>
      <View style={styles.featureTitleRow}>
        <Text style={styles.featureTitle}>{experience.title}</Text>
        <Text style={styles.featurePrice}>{experience.price}</Text>
      </View>
      <Text style={styles.featureBody}>{experience.description}</Text>
    </View>
  );
}

function PriceLabels() {
  return (
    <>
      <Text style={[styles.priceLabel, styles.glassLabel]}>Glass</Text>
      <Text style={[styles.priceLabel, styles.bottleLabel]}>Bottle</Text>
    </>
  );
}

function WineRow({ wine }: { wine: Wine }) {
  return (
    <View style={styles.item} wrap={false}>
      <View style={styles.itemBody}>
        <View style={styles.itemTitleRow}>
          <Text style={styles.itemName}>{wine.name}</Text>
        </View>
        {wine.location ? <Text style={styles.location}>{wine.location}</Text> : null}
        <Text style={styles.notes}>{wine.tastingNotes}</Text>
      </View>

      {/* A wine sold only one way prints one price and leaves the other column
          empty; the widths are fixed, so nothing shifts. */}
      <Text style={[styles.price, styles.glassPrice]}>{wine.glassPrice}</Text>
      <Text style={[styles.price, styles.bottlePrice]}>{wine.bottlePrice}</Text>
    </View>
  );
}

function ColumnBlock({ fragment }: { fragment: WineColumnFragment }) {
  return (
    <View>
      <View style={styles.sectionHeader} wrap={false}>
        <Text style={styles.sectionTitle}>{fragment.title}</Text>
        {fragment.showsPriceLabels ? <PriceLabels /> : null}
      </View>

      <View style={styles.wines}>
        {fragment.wines.map((wine) => (
          <WineRow key={wine.id} wine={wine} />
        ))}
      </View>
    </View>
  );
}

function Footer({ wineFooter, serviceCharge }: { wineFooter: string; serviceCharge: string }) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerLine}>{wineFooter}</Text>
      <Text style={styles.footerLine}>{serviceCharge}</Text>
    </View>
  );
}

/**
 * `columns` comes from `flowWineBlocksIntoColumns`, called once by the page so
 * the fit gate it shows and the file it exports cannot disagree. Two slots,
 * left then right — this template never runs a flow of its own.
 *
 * Nothing here is marked `fixed`: this menu is one side. A second page only
 * appears when content overran the sheet, which the fit gate has already named,
 * and repeating the header there would dress an overrun up as a designed side.
 */
export function WineMenu({
  content,
  columns,
}: {
  content: WineContent;
  columns: WineColumnFragment[][];
}) {
  const [left = [], right = []] = columns;

  return (
    <Document title={`Elsom Cellars Wine — ${content.season}`}>
      <Page size={{ width: theme.page.width, height: theme.page.height }} style={styles.page}>
        <Header season={content.season} />

        {content.experience ? <Feature experience={content.experience} /> : null}

        <View
          style={[
            styles.columns,
            content.experience ? styles.columnsBelowFeature : styles.columnsBelowHeader,
          ]}
        >
          <View style={styles.column}>
            {left.map((fragment) => (
              <ColumnBlock key={fragment.id} fragment={fragment} />
            ))}
          </View>
          <View style={styles.column}>
            {right.map((fragment) => (
              <ColumnBlock key={fragment.id} fragment={fragment} />
            ))}
          </View>
        </View>

        <View style={styles.lockup}>
          <ElsomLogoHorizontal
            width={theme.wine.lockup.artWidth}
            height={theme.wine.lockup.artHeight}
          />
        </View>

        <Footer wineFooter={content.wineFooter} serviceCharge={content.serviceCharge} />
      </Page>
    </Document>
  );
}
