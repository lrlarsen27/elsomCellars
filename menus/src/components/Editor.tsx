"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MenuForm } from "./MenuForm";
import { flowBlocksIntoColumns, placementByBlock } from "@/menus/templates/layout";
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
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 20px",
          borderBottom: "1px solid var(--line)",
          background: "var(--surface)",
        }}
      >
        <Link href="/" style={{ color: "var(--muted)", textDecoration: "none", fontSize: 13 }}>
          ← Menus
        </Link>
        <h1 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{menuLabel}</h1>

        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
          {saveState === "error" ? (
            <span style={{ color: "var(--danger)" }}>{saveError}</span>
          ) : isDirty ? (
            "Unsaved changes"
          ) : saveState === "saved" ? (
            "Saved"
          ) : null}
        </span>

        <button type="button" onClick={handleSave} disabled={!isDirty || saveState === "saving"}>
          {saveState === "saving" ? "Saving…" : "Save"}
        </button>
        <button type="button" className="primary" onClick={handleDownload} disabled={downloading}>
          {downloading ? "Building PDF…" : "Export PDF"}
        </button>
      </header>

      <main style={{ maxWidth: 780, margin: "0 auto", padding: "26px 24px 80px" }}>
        {flow.overflow ? (
          <Banner tone="danger">
            This is more than fits on the sheet — the last column runs past the
            bottom of the page. Shorten something, or move a section up so it
            lands in an earlier column.
          </Banner>
        ) : null}

        {downloadError ? <Banner tone="danger">{downloadError}</Banner> : null}

        <p style={{ margin: "0 0 22px", fontSize: 13, color: "var(--muted)" }}>
          Edit the text below, then <strong>Export PDF</strong> for the printable
          sheet. Where each section lands is worked out from how long it is — the
          column shown beside each one updates as you type.
        </p>

        <MenuForm content={content} onChange={handleChange} placement={placement} />
      </main>
    </div>
  );
}

function Banner({ tone, children }: { tone: "danger"; children: React.ReactNode }) {
  return (
    <p
      role="status"
      style={{
        margin: "0 0 18px",
        padding: "10px 12px",
        border: "1px solid var(--line)",
        borderLeft: `3px solid var(--${tone})`,
        borderRadius: "var(--radius)",
        fontSize: 13,
        color: "var(--muted)",
      }}
    >
      {children}
    </p>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
