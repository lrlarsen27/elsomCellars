/**
 * The web half of the font mapping, shared by every preview.
 *
 * `theme.font` names the families `fonts.ts` registers with react-pdf, and
 * those are not CSS family names — this is the translation between the two, and
 * the stacks here must match the `@font-face` families declared in
 * `src/app/globals.css`.
 *
 * It lives beside `fonts.ts` rather than inside a preview because both previews
 * need it and a second copy is a second thing to keep in step: change a
 * fallback in one and the two sheets start rendering different type on a
 * machine that is missing the real face. Deliberately free of
 * `@react-pdf/renderer` imports, for the same reason `legend.ts` and
 * `layout.ts` are — the previews share it without pulling the PDF engine into
 * the page bundle.
 */

const BARLOW = '"Barlow Condensed", "Roboto Condensed", sans-serif';
const CORMORANT = '"Cormorant Garamond", Georgia, serif';

export const face = {
  headingRegular: { fontFamily: BARLOW, fontWeight: 400 },
  headingMedium: { fontFamily: BARLOW, fontWeight: 500 },
  body: { fontFamily: CORMORANT, fontWeight: 400 },
  bodyBold: { fontFamily: CORMORANT, fontWeight: 700 },
  bodyItalic: { fontFamily: CORMORANT, fontWeight: 400, fontStyle: "italic" },
} as const;
