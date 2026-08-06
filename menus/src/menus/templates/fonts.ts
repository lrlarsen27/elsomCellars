import { Font } from "@react-pdf/renderer";

/**
 * Font registration for the PDF renderer.
 *
 * The design uses Barlow Condensed and Cormorant Garamond. Both are SIL Open
 * Font License, so embedding them in a PDF is permitted.
 *
 * `@react-pdf/renderer` needs real font files — it cannot use a webfont CSS
 * link. Until those files exist in `public/fonts/`, this module falls back to
 * the three faces built into every PDF reader so the app still renders. The
 * fallback is legible but looks nothing like the design.
 *
 * To switch the real fonts on:
 *
 *   1. npm install @fontsource/barlow-condensed @fontsource/cormorant-garamond
 *   2. Copy these files into `public/fonts/`, renaming as shown:
 *        barlow-condensed/files/barlow-condensed-latin-400-normal.woff2   -> barlow-condensed-400.ttf
 *        barlow-condensed/files/barlow-condensed-latin-500-normal.woff2   -> barlow-condensed-500.ttf
 *        cormorant-garamond/files/...-400-normal.woff2                    -> cormorant-garamond-400.ttf
 *        cormorant-garamond/files/...-700-normal.woff2                    -> cormorant-garamond-700.ttf
 *        cormorant-garamond/files/...-400-italic.woff2                    -> cormorant-garamond-400-italic.ttf
 *      (Use the .ttf files from the package, not .woff2 — react-pdf needs TTF.)
 *   3. Flip FONTS_INSTALLED to true below.
 */
export const FONTS_INSTALLED = false;

const REAL = {
  headingRegular: "BarlowCondensed",
  headingMedium: "BarlowCondensedMedium",
  body: "CormorantGaramond",
  bodyBold: "CormorantGaramondBold",
  bodyItalic: "CormorantGaramondItalic",
} as const;

/** Built into every PDF reader — no files, always renders. */
const FALLBACK = {
  headingRegular: "Helvetica",
  headingMedium: "Helvetica-Bold",
  body: "Times-Roman",
  bodyBold: "Times-Bold",
  bodyItalic: "Times-Italic",
} as const;

if (FONTS_INSTALLED) {
  Font.register({ family: REAL.headingRegular, src: "/fonts/barlow-condensed-400.ttf" });
  Font.register({ family: REAL.headingMedium, src: "/fonts/barlow-condensed-500.ttf" });
  Font.register({ family: REAL.body, src: "/fonts/cormorant-garamond-400.ttf" });
  Font.register({ family: REAL.bodyBold, src: "/fonts/cormorant-garamond-700.ttf" });
  Font.register({ family: REAL.bodyItalic, src: "/fonts/cormorant-garamond-400-italic.ttf" });
}

/**
 * Turns hyphenation off. react-pdf hyphenates by default, which is wrong for a
 * menu — "prosciut-to" breaking across a line looks like a mistake. Returning
 * the word as a single chunk tells the layout engine never to split it.
 */
Font.registerHyphenationCallback((word) => [word]);

export const fonts = FONTS_INSTALLED ? REAL : FALLBACK;
