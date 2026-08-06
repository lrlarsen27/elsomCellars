import { Font } from "@react-pdf/renderer";

/**
 * Font registration for the PDF renderer.
 *
 * The design uses Barlow Condensed and Cormorant Garamond. Both are SIL Open
 * Font License, which permits embedding and redistribution as long as the
 * licence travels with the files — so `public/fonts/` carries a copy of each.
 *
 * --- Where the files came from ---
 *
 * `@react-pdf/renderer` needs TTF or OTF. It cannot use WOFF/WOFF2, and it
 * cannot use a webfont CSS link. That rules out `@fontsource/*`, which ships
 * only woff and woff2. The TTFs here were taken from `@expo-google-fonts/*`,
 * which ships the original Google Fonts TTF binaries, and committed to the
 * repo so the app doesn't depend on a package it otherwise never imports.
 *
 * To update a face: `npm install @expo-google-fonts/<family>`, copy the TTF
 * out of `node_modules`, then uninstall the package again.
 *
 * --- Why separate families instead of weights ---
 *
 * Each face is registered under its own family name rather than as a weight or
 * style of one family. The templates then name the exact face they want, so a
 * missing bold can't silently fall back to a synthesised one.
 */
export const FONTS_INSTALLED = true;

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
