import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { theme } from "./theme";
import { fonts } from "./fonts";
import { ElsomWordmark, CellarsMark } from "./logo";
import { flowBlocksIntoColumns } from "./layout";
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
 */

/**
 * The footer legend. Fixed furniture rather than editable copy: it documents
 * the dietary tag vocabulary, which is itself fixed in the schema. If a tag is
 * ever added there, add its gloss here too.
 */
const LEGEND: Array<[string, string]> = [
  [DIETARY_TAG_LABELS.gf, "Gluten free"],
  [DIETARY_TAG_LABELS["gf+"], "Gluten free option"],
  [DIETARY_TAG_LABELS.v, "Vegan"],
  [DIETARY_TAG_LABELS["v+"], "Vegan option"],
  [DIETARY_TAG_LABELS.df, "Dairy free"],
];

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
    borderBottomWidth: 0.5,
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
    fontSize: theme.size.seasonLabel + 4,
    color: theme.color.gold,
    letterSpacing: 5.88,
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
    borderBottomWidth: 0.5,
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
    color: theme.color.gold,
    letterSpacing: theme.tracking.dietaryTag,
    textTransform: "uppercase",
  },
  description: {
    fontFamily: fonts.body,
    fontSize: theme.size.description,
    lineHeight: theme.lineHeight.description,
    color: theme.color.body,
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
    borderTopWidth: 0.5,
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
    gap: 4,
    marginTop: 14,
  },
  footerLine: {
    fontFamily: fonts.body,
    fontSize: theme.size.footer + 2,
    color: theme.color.body,
    textAlign: "center",
  },
  footerTag: { fontFamily: fonts.headingMedium },
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
        <View style={styles.sectionHeader} wrap={false}>
          <Text style={styles.sectionTitle}>{fragment.title}</Text>
        </View>
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
}: {
  content: MenuContent;
  left: ColumnFragment[];
  right: ColumnFragment[];
}) {
  return (
    <Page size={{ width: theme.page.width, height: theme.page.height }} style={styles.page}>
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

export function FoodMenu({ content }: { content: MenuContent }) {
  const { columns } = flowBlocksIntoColumns(content.blocks);

  return (
    <Document title={`Elsom Cellars — ${content.season}`}>
      <Side content={content} left={columns[0]} right={columns[1]} />
      <Side content={content} left={columns[2]} right={columns[3]} />
    </Document>
  );
}

/**
 * NOT YET IMPLEMENTED: the back page carries a large watercolour "E" watermark
 * behind the content (node 22:1137). It is built from roughly 300 separate
 * vector paths, so inlining it is impractical, and Figma only exports it at
 * 1x (215pt), which is too coarse to print.
 *
 * To add it: export that node from Figma as a PNG at 4x or higher, save it to
 * `public/brand/watermark-e.png`, and render it on the back page as an
 * absolutely positioned <Image> behind the columns.
 */
