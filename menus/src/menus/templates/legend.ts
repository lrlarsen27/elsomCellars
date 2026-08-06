import { DIETARY_TAG_LABELS } from "@/lib/schema";

/**
 * The footer legend. Fixed furniture rather than editable copy: it documents
 * the dietary tag vocabulary, which is itself fixed in the schema. If a tag is
 * ever added there, add its gloss here too.
 *
 * This sits in its own file, free of any `@react-pdf/renderer` import, because
 * both the PDF template and the on-screen preview need it and the preview must
 * not drag the PDF engine into the editing bundle.
 */
export const LEGEND: Array<[string, string]> = [
  [DIETARY_TAG_LABELS.gf, "Gluten free"],
  [DIETARY_TAG_LABELS["gf+"], "Gluten free option"],
  [DIETARY_TAG_LABELS.v, "Vegan"],
  [DIETARY_TAG_LABELS["v+"], "Vegan option"],
  [DIETARY_TAG_LABELS.df, "Dairy free"],
];
