import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { theme } from "./theme";
import type { MenuContent } from "@/lib/schema";

/**
 * The Food Menu layout. Every visual decision lives here; the only thing that
 * varies at runtime is the `content` prop, which is all strings.
 *
 * PLACEHOLDER LAYOUT — replace with the real design once the Figma file is
 * readable. The component's contract (take a MenuContent, return a Document)
 * is what the rest of the app depends on, so a redesign is contained to this
 * file and `theme.ts`.
 */

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
    textAlign: "center",
    marginBottom: theme.space.afterTitle,
  },
  subtitle: {
    fontFamily: theme.font.body,
    fontSize: theme.size.subtitle,
    color: theme.color.muted,
    textAlign: "center",
    letterSpacing: theme.letterSpacing.subtitle,
    textTransform: "uppercase",
    marginBottom: theme.space.afterSubtitle,
  },
  section: {
    marginBottom: theme.space.betweenSections,
  },
  sectionTitle: {
    fontFamily: theme.font.displayBold,
    fontSize: theme.size.sectionTitle,
    color: theme.color.accent,
    letterSpacing: theme.letterSpacing.sectionTitle,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: theme.space.afterSectionTitle,
  },
  item: {
    marginBottom: theme.space.betweenItems,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: theme.space.afterItemName,
  },
  itemName: {
    fontFamily: theme.font.bodyBold,
    fontSize: theme.size.itemName,
  },
  // A dotted leader between the dish and its price, the way printed menus do it.
  leader: {
    flexGrow: 1,
    borderBottomWidth: 0.5,
    borderBottomStyle: "dotted",
    borderBottomColor: theme.color.rule,
    marginHorizontal: 5,
    marginBottom: 2,
  },
  price: {
    fontFamily: theme.font.body,
    fontSize: theme.size.price,
  },
  itemDescription: {
    fontFamily: theme.font.body,
    fontSize: theme.size.itemDescription,
    color: theme.color.muted,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: theme.color.rule,
    fontFamily: theme.font.body,
    fontSize: theme.size.footer,
    color: theme.color.muted,
    textAlign: "center",
  },
});

export function FoodMenu({ content }: { content: MenuContent }) {
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
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.leader} />
                  <Text style={styles.price}>{item.price}</Text>
                </View>
                {item.description ? (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ))}

        {content.footer ? <Text style={styles.footer}>{content.footer}</Text> : null}
      </Page>
    </Document>
  );
}
