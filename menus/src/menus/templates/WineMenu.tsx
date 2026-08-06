import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { theme } from "./theme";
import type { MenuContent } from "@/lib/schema";

/**
 * The Wine Menu layout — the second of the two designs.
 *
 * Deliberately a different treatment from the Food Menu (left-aligned section
 * headings with a rule, price set in a fixed-width column) so the two templates
 * demonstrate that layouts are genuinely independent, not one design with a
 * swapped title.
 *
 * PLACEHOLDER LAYOUT — replace with the real design from Figma.
 */

const PRICE_COLUMN_WIDTH = 42;

const styles = StyleSheet.create({
  page: {
    width: theme.page.width,
    height: theme.page.height,
    padding: theme.page.padding,
    backgroundColor: theme.color.paper,
    color: theme.color.ink,
  },
  title: {
    fontFamily: theme.font.display,
    fontSize: theme.size.title,
    marginBottom: theme.space.afterTitle,
  },
  subtitle: {
    fontFamily: theme.font.mono,
    fontSize: theme.size.subtitle,
    color: theme.color.muted,
    letterSpacing: theme.letterSpacing.subtitle,
    textTransform: "uppercase",
    marginBottom: theme.space.afterSubtitle,
  },
  section: {
    marginBottom: theme.space.betweenSections,
  },
  sectionTitle: {
    fontFamily: theme.font.bodyBold,
    fontSize: theme.size.sectionTitle,
    letterSpacing: theme.letterSpacing.sectionTitle,
    textTransform: "uppercase",
    paddingBottom: 5,
    marginBottom: theme.space.afterSectionTitle,
    borderBottomWidth: 1,
    borderBottomColor: theme.color.ink,
  },
  item: {
    flexDirection: "row",
    marginBottom: theme.space.betweenItems,
  },
  itemBody: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 10,
  },
  itemName: {
    fontFamily: theme.font.bodyBold,
    fontSize: theme.size.itemName,
    marginBottom: theme.space.afterItemName,
  },
  itemDescription: {
    fontFamily: theme.font.body,
    fontSize: theme.size.itemDescription,
    color: theme.color.muted,
  },
  price: {
    width: PRICE_COLUMN_WIDTH,
    flexShrink: 0,
    fontFamily: theme.font.mono,
    fontSize: theme.size.price,
    color: theme.color.accent,
    textAlign: "right",
  },
  footer: {
    marginTop: "auto",
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: theme.color.rule,
    fontFamily: theme.font.body,
    fontSize: theme.size.footer,
    color: theme.color.muted,
  },
});

export function WineMenu({ content }: { content: MenuContent }) {
  return (
    <Document title={content.title || "Menu"}>
      <Page size={{ width: theme.page.width, height: theme.page.height }} style={styles.page}>
        {content.title ? <Text style={styles.title}>{content.title}</Text> : null}
        {content.subtitle ? <Text style={styles.subtitle}>{content.subtitle}</Text> : null}

        {content.sections.map((section) => (
          <View key={section.id} style={styles.section} wrap={false}>
            {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}

            {section.items.map((item) => (
              <View key={item.id} style={styles.item} wrap={false}>
                <View style={styles.itemBody}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.itemDescription}>{item.description}</Text>
                  ) : null}
                </View>
                <Text style={styles.price}>{item.price}</Text>
              </View>
            ))}
          </View>
        ))}

        {content.footer ? <Text style={styles.footer}>{content.footer}</Text> : null}
      </Page>
    </Document>
  );
}
