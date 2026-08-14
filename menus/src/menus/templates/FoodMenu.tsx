import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { theme } from "./theme";
import { fonts } from "./fonts";
import { ElsomWordmark, CellarsMark } from "./logo";
import { LEGEND } from "./legend";
import type { ColumnFragment } from "./layout";
import { DIETARY_TAG_LABELS } from "@/lib/schema";
import type { MenuContent, MenuItem } from "@/lib/schema";

/**
 * The Elsom Cellars menu: one tabloid sheet (11" x 17"), printed front and back.
 *
 * Built from ciJhmsPGUj0Gge5PKpBzhe, page "POR", nodes 22:977 and 22:1065.
 *
 * Content is not placed by hand — `layout.ts` decides which of the four column
 * slots each block lands in, based on how much text there is. See that file for
 * how the estimate works and where it deviates from the artboard.
 *
 * That flow is run by the page and handed in, not called here: the fit gate the
 * page shows and the file it exports read the same result. Every template in
 * this folder takes its placement the same way.
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

  // --- Columns ---
  columns: {
    flexDirection: "row",
    gap: theme.column.gutter,
    marginTop: theme.space.afterHeaderDivider,
    flexGrow: 1,
  },
  column: { width: theme.column.width },

  // --- Section ---
  section: { marginBottom: theme.space.betweenSections },
  sectionHeader: {
    height: theme.space.sectionHeaderRuleOffset,
    borderBottomWidth: theme.space.ruleWidth,
    borderBottomColor: theme.color.rule,
    marginBottom: theme.space.afterSectionHeader,
  },
  sectionTitle: {
    fontFamily: fonts.headingRegular,
    fontSize: theme.size.sectionHeader,
    color: theme.color.gold,
    letterSpacing: theme.tracking.sectionHeader,
    textTransform: "uppercase",
  },
  /** An add-on that applies to the whole section, below the rule. */
  sectionAddOn: {
    fontFamily: fonts.body,
    fontSize: theme.size.sectionAddOn,
    color: theme.color.description,
    width: theme.space.itemTextWidth,
    marginBottom: theme.space.afterSectionHeader,
  },

  // --- Item ---
  item: { flexDirection: "row", marginBottom: theme.space.betweenItems },
  itemBody: { width: theme.space.itemTextWidth },
  itemNameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: theme.space.nameToTagGap,
    marginBottom: theme.space.afterItemName,
  },
  itemName: {
    fontFamily: fonts.headingMedium,
    fontSize: theme.size.itemName,
    lineHeight: theme.lineHeight.itemName / theme.size.itemName,
    color: theme.color.gold,
    letterSpacing: theme.tracking.itemName,
    textTransform: "uppercase",
  },
  itemTags: {
    fontFamily: fonts.headingMedium,
    fontSize: theme.size.dietaryTag,
    /*
     * Drops the tag onto the name's baseline. `itemNameRow` asks for
     * `alignItems: "baseline"`, and in the browser that is enough — CSS aligns
     * the baselines themselves. react-pdf does not: it puts each run's baseline
     * at `ascent x fontSize` below the top of its line box and aligns the boxes,
     * so two runs at different sizes come out on different baselines however
     * their line heights are set. Barlow Condensed has an ascent of 1em, which
     * makes the error exactly the difference between the two sizes.
     *
     * Written as that difference rather than as the 4 it comes to, so changing
     * either size in the theme keeps the tag on the line. Measured from the
     * exported PDF's own text matrices, not from the preview — the preview was
     * already correct and is not evidence about this.
     */
    /*
     * Puts the tag on the name's baseline.
     *
     * `itemNameRow` asks for `alignItems: "baseline"`, and in the browser that
     * is the whole story — CSS aligns the baselines themselves, and the preview
     * measures the name, the tag and the price to within 0px of each other
     * without any of this. react-pdf does not do that. It aligns the tops of
     * the line boxes and then drops each baseline by its own box height, so two
     * runs at different sizes land on different baselines and no amount of
     * `alignItems` moves them. `marginTop` does not move them either — Yoga's
     * baseline ignores it.
     *
     * The line box is the only lever, and the exported PDF's text matrices put
     * the tag's baseline exactly one point off the name's for every point of
     * line box: 22 gave +4, 14 gave -4, so 18 gives 0. That 18 is the name's
     * own 22 less the 4 its type is larger, which is why it is written that way
     * — change either size in the theme and the tag stays on the line.
     *
     * Measured from the PDF, not from the preview. The preview was already
     * right and is not evidence about this.
     */
    lineHeight:
      (theme.lineHeight.itemName - (theme.size.itemName - theme.size.dietaryTag)) /
      theme.size.dietaryTag,
    color: theme.color.gold,
    letterSpacing: theme.tracking.dietaryTag,
    textTransform: "uppercase",
  },
  description: {
    fontFamily: fonts.body,
    fontSize: theme.size.description,
    lineHeight: theme.lineHeight.description,
    color: theme.color.description,
  },
  /** The add-on run continues the description paragraph, set bold. */
  addOn: { fontFamily: fonts.bodyBold },
  pairing: {
    fontFamily: fonts.body,
    fontSize: theme.size.description,
    lineHeight: theme.lineHeight.description,
    color: theme.color.body,
  },
  price: {
    width: theme.space.priceColumnWidth,
    fontFamily: fonts.headingMedium,
    fontSize: theme.size.price,
    lineHeight: theme.lineHeight.itemName / theme.size.price,
    color: theme.color.gold,
    textAlign: "right",
  },

  // --- Chef note ---
  note: { marginBottom: theme.space.betweenSections },
  noteRule: {
    borderTopWidth: theme.space.ruleWidth,
    borderTopColor: theme.color.rule,
    marginBottom: theme.space.afterSectionHeader,
  },
  noteHeading: {
    fontFamily: fonts.headingMedium,
    fontSize: theme.size.chefNoteHeading,
    color: theme.color.gold,
    letterSpacing: theme.tracking.itemName,
    textTransform: "uppercase",
    marginBottom: theme.space.afterItemName,
  },
  noteBody: {
    fontFamily: fonts.bodyItalic,
    fontSize: theme.size.chefNoteBody,
    lineHeight: 1.25,
    color: theme.color.body,
  },

  // --- Footer ---
  footer: {
    width: theme.page.contentWidth,
    alignItems: "center",
    gap: theme.space.footerGap,
    marginTop: theme.space.footerTopMargin,
  },
  footerLine: {
    fontFamily: fonts.body,
    fontSize: theme.size.footer,
    color: theme.color.body,
    textAlign: "center",
  },
  footerTag: { fontFamily: fonts.headingMedium },

  /**
   * The back-page watermark. Positions are measured from the artboard (node
   * 22:1137 sits at 233,875 inside the content box) and offset by the page
   * margin, since absolute coordinates here are relative to the page edge.
   */
  watermark: {
    position: "absolute",
    left: theme.page.margin + 233,
    top: theme.page.margin + 875,
    width: 215,
    height: 214,
  },
  /**
   * react-pdf doesn't reliably inherit fontFamily into nested <Text>, so every
   * span in the legend names its face explicitly. Without this the glosses
   * silently render in Helvetica and drag it into the embedded font list.
   */
  footerGloss: { fontFamily: fonts.body },
});

function Header({ season }: { season: string }) {
  return (
    <View style={styles.header} fixed>
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

function Footer({ disclaimer, serviceCharge }: { disclaimer: string; serviceCharge: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerLine}>
        {LEGEND.map(([abbreviation, gloss], index) => (
          <Text key={abbreviation} style={styles.footerGloss}>
            <Text style={styles.footerTag}>{abbreviation}</Text>
            {` - ${gloss}${index < LEGEND.length - 1 ? ", " : ""}`}
          </Text>
        ))}
      </Text>
      <Text style={styles.footerLine}>{disclaimer}</Text>
      <Text style={styles.footerLine}>{serviceCharge}</Text>
    </View>
  );
}

function Item({ item }: { item: MenuItem }) {
  const hasBody = Boolean(item.description || item.addOn);

  return (
    <View style={styles.item} wrap={false}>
      <View style={styles.itemBody}>
        <View style={styles.itemNameRow}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.tags.length > 0 ? (
            <Text style={styles.itemTags}>
              {item.tags.map((tag) => DIETARY_TAG_LABELS[tag]).join(" · ")}
            </Text>
          ) : null}
        </View>

        {hasBody ? (
          <Text style={styles.description}>
            {item.description}
            {item.addOn ? <Text style={styles.addOn}>{` ${item.addOn}`}</Text> : null}
          </Text>
        ) : null}

        {item.pairing ? <Text style={styles.pairing}>{item.pairing}</Text> : null}
      </View>

      {item.price ? <Text style={styles.price}>{item.price}</Text> : null}
    </View>
  );
}

function ColumnBlock({ fragment }: { fragment: ColumnFragment }) {
  if (fragment.kind === "note") {
    return (
      <View style={styles.note} wrap={false}>
        <View style={styles.noteRule} />
        <Text style={styles.noteHeading}>{fragment.heading}</Text>
        <Text style={styles.noteBody}>{fragment.body}</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {/* A continuation carries no heading — it just picks up where the
          previous column left off, the way the artboard does. */}
      {fragment.kind === "section" ? (
        <>
          <View style={styles.sectionHeader} wrap={false}>
            <Text style={styles.sectionTitle}>{fragment.title}</Text>
          </View>
          {fragment.addOn ? (
            <Text style={styles.sectionAddOn}>{fragment.addOn}</Text>
          ) : null}
        </>
      ) : null}

      {fragment.items.map((item) => (
        <Item key={item.id} item={item} />
      ))}
    </View>
  );
}

function Side({
  content,
  left,
  right,
  watermark = false,
}: {
  content: MenuContent;
  left: ColumnFragment[];
  right: ColumnFragment[];
  watermark?: boolean;
}) {
  return (
    <Page size={{ width: theme.page.width, height: theme.page.height }} style={styles.page}>
      {/* First child so the columns paint over it — react-pdf has no z-index. */}
      {watermark ? <Image src="/brand/watermark-e.png" style={styles.watermark} /> : null}

      <Header season={content.season} />

      <View style={styles.columns}>
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

      <Footer disclaimer={content.disclaimer} serviceCharge={content.serviceCharge} />
    </Page>
  );
}

/** `columns` comes from `flowBlocksIntoColumns`: four slots, front then back. */
export function FoodMenu({
  content,
  columns,
}: {
  content: MenuContent;
  columns: ColumnFragment[][];
}) {
  return (
    <Document title={`Elsom Cellars — ${content.season}`}>
      <Side content={content} left={columns[0]} right={columns[1]} />
      <Side content={content} left={columns[2]} right={columns[3]} watermark />
    </Document>
  );
}

/**
 * The back-page watermark is `public/brand/watermark-e.png`, supplied as a
 * 738x741 PNG with alpha. At 215pt on the page that's about 247dpi — under the
 * 300dpi print ideal, but it's a soft watercolour texture rather than type, so
 * it holds up. Replace it with a larger export if a printer objects.
 *
 * It's a raster because the Figma node is roughly 300 separate vector paths;
 * inlining those would bloat the template for no visible gain.
 */
