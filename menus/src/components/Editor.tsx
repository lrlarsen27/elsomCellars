"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MenuPreview } from "./MenuPreview";
import { flowBlocksIntoColumns } from "@/menus/templates/layout";
import { ArrowBackIcon, DownloadIcon, ErrorIcon } from "@/components/Icon";
import { loadMenuContent, sheetConfigFromEnv, type SheetFailure, type SheetWarning } from "@/lib/sheet";
import { menuKindFor, type PrintableContent } from "@/menus/kinds";
import type { MenuContent } from "@/lib/schema";

/**
 * Preview and export. The menu's content lives in a spreadsheet, so there is
 * nothing to edit here — this page reads the sheet, draws the sheet as it will
 * print, and exports the PDF.
 *
 * Everything runs in the browser. The page itself is a static file.
 */

type LoadState =
  | { phase: "loading" }
  | { phase: "loaded"; content: PrintableContent; warnings: SheetWarning[] }
  | { phase: "failed"; failure: SheetFailure };

/**
 * Transitional. The shell asks a menu's content for a season and nothing more,
 * but the column flow and the preview it still calls are the food menu's own.
 * Both move onto the menu's bundle in a later unit and this goes with them;
 * until then the food menu is the only menu with either, so the content the
 * shell is holding is always food content.
 */
function asFoodContent(content: PrintableContent): MenuContent {
  return content as MenuContent;
}

export function Editor({ menuId, menuLabel }: { menuId: string; menuLabel: string }) {
  // The build prerenders this component, so the first render must not depend on
  // anything only the browser knows. Loading is the honest initial state.
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  // Cleared by every load, so a re-read that fixes the fit also clears the
  // override rather than leaving it armed against content it was never for.
  const [exportAnyway, setExportAnyway] = useState(false);

  // Resolution happens per menu, so a menu that was never wired up fails on its
  // own page and leaves every other menu reading exactly as before.
  const load = useCallback(() => {
    const kind = menuKindFor(menuId);
    if (!kind) {
      setState({
        phase: "failed",
        failure: {
          kind: "unconfigured",
          menu: menuId,
          detail: "This site has no reader for that menu.",
        },
      });
      return;
    }

    const resolved = sheetConfigFromEnv(kind.source);
    if (!resolved.ok) {
      setState({ phase: "failed", failure: resolved.failure });
      return;
    }

    setState({ phase: "loading" });
    setExportAnyway(false);
    void loadMenuContent(resolved.config).then((result) => {
      setState(
        result.ok
          ? { phase: "loaded", content: result.content, warnings: result.warnings }
          : { phase: "failed", failure: result.failure },
      );
    });
  }, [menuId]);

  useEffect(load, [load]);

  async function handleDownload(content: PrintableContent) {
    // The export draws the same placement the fit gate below was computed from,
    // rather than the template running the flow again. Content and flow arrive
    // together, so this is unreachable with content on screen.
    if (!flow) return;

    setDownloading(true);
    setDownloadError(null);

    try {
      // The PDF engine is imported only here, at export time. Keeping it a bare
      // dynamic import inside the handler is deliberate — it never enters the
      // prerender graph, and next/dynamic fails to resolve this package.
      const [{ pdf }, { renderMenuDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/menus/templates"),
      ]);

      const document = renderMenuDocument(menuId, asFoodContent(content), flow.columns);
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
    } catch (error) {
      setDownloadError(describeExportFailure(error));
    } finally {
      setDownloading(false);
    }
  }

  const content = state.phase === "loaded" ? state.content : null;
  const flow = content ? flowBlocksIntoColumns(asFoodContent(content).blocks) : null;

  // The fit check estimates from character counts and runs about 1% generous,
  // so a hard block would occasionally strand a menu that prints fine. It
  // blocks by default and lets someone say otherwise on purpose.
  const blockedByFit = Boolean(flow?.overflow) && !exportAnyway;

  return (
    <div style={{ minHeight: "100vh" }}>
      <header className="md-top-app-bar">
        <Link href="/" className="md-icon-button" aria-label="Back to menus" title="Back to menus">
          <ArrowBackIcon />
        </Link>
        <h1 className="md-title-large title">{menuLabel}</h1>

        {content ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <button
              type="button"
              className="md-button filled"
              onClick={() => handleDownload(content)}
              disabled={downloading || blockedByFit}
              title={blockedByFit ? "This menu doesn't fit on the sheet" : undefined}
            >
              <DownloadIcon />
              <span>{downloading ? "Building PDF…" : "Export PDF"}</span>
            </button>
          </div>
        ) : null}
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 96px" }}>
        {state.phase === "loading" ? <Loading /> : null}

        {state.phase === "failed" ? <Failure failure={state.failure} onRetry={load} /> : null}

        {state.phase === "loaded" && flow ? (
          <>
            {state.warnings.length > 0 ? <Warnings warnings={state.warnings} /> : null}

            {flow.overflow ? (
              <Notice tone="error">
                <span>
                  This is more than fits on the sheet — the{" "}
                  <strong>{(flow.overflowColumn ?? "last").toLowerCase()}</strong> column runs past
                  the bottom of the page. Shorten something in the spreadsheet, or move a section
                  up so it lands in an earlier column.
                  <label
                    style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}
                    className="md-body-medium"
                  >
                    <input
                      type="checkbox"
                      checked={exportAnyway}
                      onChange={(event) => setExportAnyway(event.target.checked)}
                    />
                    Export anyway, with the overrun
                  </label>
                </span>
              </Notice>
            ) : null}

            {downloadError ? <Notice tone="error">{downloadError}</Notice> : null}

            <p className="md-body-medium md-on-surface-variant" style={{ marginBottom: 24 }}>
              This is the menu as it will print, read from the spreadsheet. Edit the spreadsheet to
              change it, then reload this page.
            </p>

            <MenuPreview content={asFoodContent(state.content)} columns={flow.columns} />
          </>
        ) : null}
      </main>
    </div>
  );
}

function Loading() {
  return (
    <div className="md-loading" role="status">
      <span className="md-progress" aria-hidden="true" />
      <p className="md-body-medium md-on-surface-variant">Reading the spreadsheet…</p>
    </div>
  );
}

function Failure({ failure, onRetry }: { failure: SheetFailure; onRetry: () => void }) {
  // No retry: the tab ids are baked in at build time, so reading again reads
  // the same nothing. Offering the button would only look like it might help.
  if (failure.kind === "unconfigured") {
    return <Notice tone="error">This menu isn&apos;t set up to read yet. {failure.detail}</Notice>;
  }

  if (failure.kind === "unreachable") {
    return (
      <Notice tone="error" action={{ label: "Try again", onClick: onRetry }}>
        Couldn&apos;t read the spreadsheet. {failure.detail}
      </Notice>
    );
  }

  if (failure.kind === "empty") {
    return (
      <Notice tone="error" action={{ label: "Try again", onClick: onRetry }}>
        The spreadsheet has no menu in it. Add some rows to the menu tab, then reload.
      </Notice>
    );
  }

  if (failure.kind === "setting") {
    return (
      <Notice tone="error" action={{ label: "Try again", onClick: onRetry }}>
        {failure.problem}
      </Notice>
    );
  }

  return (
    <Notice tone="error" action={{ label: "Try again", onClick: onRetry }}>
      Row {failure.row} of the {failure.tab} tab couldn&apos;t be read. {failure.problem}
    </Notice>
  );
}

function Warnings({ warnings }: { warnings: SheetWarning[] }) {
  return (
    <Notice tone="error">
      <span>
        The menu below is complete apart from these, and exporting is fine:
        <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
          {warnings.map((warning) => (
            <li key={`${warning.row}-${warning.problem}`}>
              Row {warning.row}: {warning.problem}
            </li>
          ))}
        </ul>
      </span>
    </Notice>
  );
}

/** Stands in for M3's banner, which the spec dropped after M2. */
function Notice({
  children,
  action,
}: {
  children: React.ReactNode;
  tone: "error";
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="md-card error" role="status" style={{ marginBottom: 20 }}>
      <ErrorIcon />
      <div className="md-body-medium" style={{ flexGrow: 1 }}>
        {children}
      </div>
      {action ? (
        <button type="button" className="md-button text" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

/**
 * The PDF renderer throws rather than substituting when a typeface fails to
 * load, and the winery has no designer to interpret a stack trace — so lead
 * with what to do and keep the cause as detail.
 */
function describeExportFailure(error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error);
  if (/font/i.test(detail)) {
    return `The typefaces didn't load, so the PDF wasn't built. Reload the page and export again. (${detail})`;
  }
  return `Couldn't build the PDF. (${detail})`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
