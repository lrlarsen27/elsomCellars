"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MenuForm } from "./MenuForm";
import { flowBlocksIntoColumns } from "@/menus/templates/layout";
import type { MenuContent } from "@/lib/schema";

// PDFViewer needs a browser, so it must not render on the server.
const PdfPreview = dynamic(() => import("./PdfPreview"), {
  ssr: false,
  loading: () => <PreviewMessage>Preparing preview…</PreviewMessage>,
});

// Re-rendering the PDF on every keystroke is visibly janky. Waiting for a
// pause in typing keeps the preview feeling live without the churn.
const PREVIEW_DEBOUNCE_MS = 400;

type SaveState = "idle" | "saving" | "saved" | "error";

export function Editor({
  menuId,
  menuLabel,
  initialContent,
}: {
  menuId: string;
  menuLabel: string;
  initialContent: MenuContent;
}) {
  const [content, setContent] = useState<MenuContent>(initialContent);
  const [savedContent, setSavedContent] = useState<MenuContent>(initialContent);
  const [previewContent, setPreviewContent] = useState<MenuContent>(initialContent);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const isDirty = useMemo(
    () => JSON.stringify(content) !== JSON.stringify(savedContent),
    [content, savedContent],
  );

  // Cheap estimate, same one the template uses to pick column breaks. It warns
  // early rather than accurately — the preview below is the real answer.
  const flow = useMemo(() => flowBlocksIntoColumns(content.blocks), [content.blocks]);

  useEffect(() => {
    const timer = setTimeout(() => setPreviewContent(content), PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [content]);

  // Don't let someone close the tab on unsaved edits without a nudge.
  useEffect(() => {
    if (!isDirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const handleChange = useCallback((next: MenuContent) => {
    setContent(next);
    setSaveState("idle");
    setSaveError(null);
  }, []);

  async function handleSave() {
    setSaveState("saving");
    setSaveError(null);

    try {
      const response = await fetch(`/api/menus/${menuId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setSaveState("error");
        setSaveError(data.error ?? "Couldn't save.");
        return;
      }

      setSavedContent(content);
      setSaveState("saved");
    } catch {
      setSaveState("error");
      setSaveError("Couldn't reach the server.");
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      // Imported here rather than at module scope so the PDF engine never runs
      // during server rendering.
      const [{ pdf }, { renderMenuDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/menus/templates"),
      ]);

      const document = renderMenuDocument(menuId, content);
      if (!document) return;

      const blob = await pdf(document).toBlob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `elsom-${menuId}-menu-${slugify(content.season) || "current"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 20px",
          borderBottom: "1px solid var(--line)",
          background: "var(--surface)",
          flexShrink: 0,
        }}
      >
        <Link href="/" style={{ color: "var(--muted)", textDecoration: "none", fontSize: 13 }}>
          ← Menus
        </Link>
        <h1 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{menuLabel}</h1>

        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
          <StatusLabel state={saveState} isDirty={isDirty} error={saveError} />
        </span>

        <button type="button" onClick={handleSave} disabled={!isDirty || saveState === "saving"}>
          {saveState === "saving" ? "Saving…" : "Save"}
        </button>
        <button type="button" className="primary" onClick={handleDownload} disabled={downloading}>
          {downloading ? "Building…" : "Download PDF"}
        </button>
      </header>

      <div style={{ flexGrow: 1, display: "flex", minHeight: 0 }}>
        <div
          style={{
            width: "44%",
            minWidth: 340,
            overflowY: "auto",
            padding: 24,
            borderRight: "1px solid var(--line)",
          }}
        >
          {flow.overflow ? (
            <p
              role="status"
              style={{
                margin: "0 0 18px",
                padding: "10px 12px",
                border: "1px solid var(--line)",
                borderLeft: "3px solid var(--danger)",
                borderRadius: "var(--radius)",
                fontSize: 13,
                color: "var(--muted)",
              }}
            >
              This is more than fits on the sheet — the last column runs past the
              bottom of the page. Shorten something, or move a section up so it
              lands in an earlier column.
            </p>
          ) : null}

          <MenuForm content={content} onChange={handleChange} />
        </div>

        <div style={{ flexGrow: 1, background: "#525659", minWidth: 0 }}>
          <PdfPreview menuId={menuId} content={previewContent} />
        </div>
      </div>
    </div>
  );
}

function StatusLabel({
  state,
  isDirty,
  error,
}: {
  state: SaveState;
  isDirty: boolean;
  error: string | null;
}) {
  if (state === "error") return <span style={{ color: "var(--danger)" }}>{error}</span>;
  if (isDirty) return <>Unsaved changes</>;
  if (state === "saved") return <>Saved</>;
  return null;
}

function PreviewMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        height: "100%",
        display: "grid",
        placeItems: "center",
        color: "#cfcfcf",
        fontSize: 13,
      }}
    >
      {children}
    </div>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
