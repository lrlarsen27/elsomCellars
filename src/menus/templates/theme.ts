/**
 * Design tokens for the printed menus.
 *
 * This file is the single source of truth for type, spacing, and color. It is
 * never exposed through the app UI — changing anything here is a code change,
 * which is exactly the point.
 *
 * PLACEHOLDER: these values are a reasonable-looking stand-in, not the real
 * design. When the Figma file is available, replace them with the real specs
 * and register the real font files (see the note below).
 *
 * --- On fonts ---
 * These currently use the three typefaces built into every PDF reader
 * (Helvetica, Times-Roman, Courier), which need no font files and always embed
 * correctly. To use real brand fonts, drop the .ttf files in `public/fonts/`
 * and register them once at module load:
 *
 *   import { Font } from "@react-pdf/renderer";
 *   Font.register({
 *     family: "YourFont",
 *     fonts: [
 *       { src: "/fonts/YourFont-Regular.ttf", fontWeight: "normal" },
 *       { src: "/fonts/YourFont-Bold.ttf", fontWeight: "bold" },
 *     ],
 *   });
 *
 * You'll need the actual font files and a license permitting embedding.
 */

export const theme = {
  page: {
    // Points, at 72pt per inch. 396 x 612 is a 5.5" x 8.5" menu card.
    width: 396,
    height: 612,
    padding: 44,
  },
  color: {
    ink: "#1a1a1a",
    muted: "#6b6b6b",
    rule: "#d8d4cc",
    paper: "#faf8f4",
    accent: "#7a2e2e",
  },
  font: {
    display: "Times-Roman",
    displayBold: "Times-Bold",
    body: "Helvetica",
    bodyBold: "Helvetica-Bold",
    mono: "Courier",
  },
  size: {
    title: 26,
    subtitle: 9,
    sectionTitle: 12,
    itemName: 10,
    itemDescription: 8.5,
    price: 10,
    footer: 7.5,
  },
  space: {
    afterTitle: 4,
    afterSubtitle: 26,
    betweenSections: 20,
    afterSectionTitle: 10,
    betweenItems: 11,
    afterItemName: 2.5,
  },
  letterSpacing: {
    subtitle: 1.6,
    sectionTitle: 1.8,
  },
} as const;
