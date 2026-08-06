"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MenuForm } from "./MenuForm";
import { MenuPreview } from "./MenuPreview";
import { flowBlocksIntoColumns, placementByBlock } from "@/menus/templates/layout";
import { ArrowBackIcon, CheckCircleIcon, DownloadIcon, ErrorIcon, SaveIcon } from "@/components/Icon";
import type { MenuContent } from "@/lib/schema";

/**
 * A plain editing page. No PDF is rendered here — the layout engine only runs
 * when someone exports.
 *
 * What survives from the layout engine is the *placement*, which is cheap to
 * compute and shown next to each section so nobody has to export a PDF to find
 * out where their edit landed.
 */

type SaveState = "idle" | "saving" | "saved" | "error";

/** How long the "Saved" snackbar stays up. M3's "long" duration. */
const SNACKBAR_MS = 4000;

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
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const isDirty = useMemo(
    () => JSON.stringify(content) !== JSON.stringify(savedContent),
    [content, savedContent],
  );

  // Pure arithmetic over the block list — no PDF engine involved.
  const flow = useMemo(() => flowBlocksIntoColumns(content.blocks), [content.blocks]);
  const placement = useMemo(() => placementByBlock(flow.columns), [flow]);

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

  // The success snackbar is transient; the error one stays until the next save.
  useEffect(() => {
    if (!showSaved) return;
    const timer = window.setTimeout(() => setShowSaved(false), SNACKBAR_MS);
    return () => window.clearTimeout(timer);
  }, [showSaved]);

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
      setShowSaved(true);
    } catch {
      setSaveState("error");
      setSaveError("Couldn't reach the server.");
    }
  }

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);

    try {
      // The PDF engine is imported only here, at export time. It never loads
      // as part of the editing page.
      const [{ pdf }, { renderMenuDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/menus/templates"),
      ]);

      const document = renderMenuDocument(menuId, content);
      if (!document) {
        setDownloadError("No template for this menu.");
        return;
      }

      const blob = await pdf(document).toBlob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `elsom-${menuId}-menu-${slugify(content.season) || "current"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Couldn't build the PDF.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <header className="md-top-app-bar">
        <Link href="/" className="md-icon-button" aria-label="Back to menus" title="Back to menus">
          <ArrowBackIcon />
        </Link>
        <h1 className="md-title-large title">{menuLabel}</h1>

        {isDirty ? (
          <span className="md-label-medium md-on-surface-variant" style={{ marginLeft: 4 }}>
            Unsaved
          </span>
        ) : null}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <button
            type="button"
            className="md-button text"
            onClick={handleSave}
            disabled={!isDirty || saveState === "saving"}
          >
            <SaveIcon />
            <span>{saveState === "saving" ? "Saving…" : "Save"}</span>
          </button>
          <button
            type="button"
            className="md-button filled"
            onClick={handleDownload}
            disabled={downloading}
          >
            <DownloadIcon />
            <span>{downloading ? "Building PDF…" : "Export PDF"}</span>
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1360, margin: "0 auto", padding: "24px 24px 96px" }}>
        <div className="editor-layout">
          <div>
            {flow.overflow ? (
              <ErrorCard>
                This is more than fits on the sheet — the last column runs past the
                bottom of the page. Shorten something, or move a section up so it
                lands in an earlier column.
              </ErrorCard>
            ) : null}

            {downloadError ? <ErrorCard>{downloadError}</ErrorCard> : null}

            <p className="md-body-medium md-on-surface-variant" style={{ marginBottom: 24 }}>
              Edit the text below and the sheet beside it redraws as you type.
              It&apos;s a close replica, not the PDF —{" "}
              <strong>Export PDF</strong> for the file that goes to the printer.
            </p>

            <MenuForm content={content} onChange={handleChange} placement={placement} />
          </div>

          <aside className="editor-preview" aria-label="Menu preview">
            <MenuPreview content={content} columns={flow.columns} />
          </aside>
        </div>
      </main>

      {/*
        Save feedback moved out of the app bar and into a snackbar. The old
        inline "Saved" text sat next to the buttons in 12px gray and was easy to
        miss; the dirty state stays in the bar because it's a standing condition
        rather than a one-off event.
      */}
      {saveState === "error" && saveError ? (
        <div className="md-snackbar" role="alert">
          <ErrorIcon />
          <span className="md-body-medium" style={{ flexGrow: 1 }}>
            {saveError}
          </span>
          <button type="button" className="md-button text action" onClick={handleSave}>
            Retry
          </button>
        </div>
      ) : showSaved ? (
        <div className="md-snackbar" role="status">
          <CheckCircleIcon />
          <span className="md-body-medium">Saved</span>
        </div>
      ) : null}
    </div>
  );
}

/** Stands in for M3's banner, which the spec dropped after M2. */
function ErrorCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="md-card error" role="status" style={{ marginBottom: 20 }}>
      <ErrorIcon />
      <p className="md-body-medium">{children}</p>
    </div>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
