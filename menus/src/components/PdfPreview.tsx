"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { renderMenuDocument } from "@/menus/templates";
import type { MenuContent } from "@/lib/schema";

/**
 * The preview is a real PDF, rendered by the same code that produces the
 * download. That's the point: there is no separate HTML mockup that could
 * drift out of sync with the exported file. What you see here is the file.
 *
 * Imported with `ssr: false` by the Editor — PDFViewer needs a browser.
 */
export default function PdfPreview({
  menuId,
  content,
}: {
  menuId: string;
  content: MenuContent;
}) {
  const document = renderMenuDocument(menuId, content);
  if (!document) return null;

  return (
    <PDFViewer
      style={{ width: "100%", height: "100%", border: "none" }}
      showToolbar={false}
    >
      {document}
    </PDFViewer>
  );
}
