"use client";

import { useEffect, useRef, useState } from "react";
import { theme } from "@/menus/templates/theme";
import { LEGEND } from "@/menus/templates/legend";
import { face } from "@/menus/templates/faces";
import { ElsomLogo } from "./Logo";
import { DIETARY_TAG_LABELS } from "@/lib/schema";
import type { ColumnFragment } from "@/menus/templates/layout";
import type { MenuContent, MenuItem } from "@/lib/schema";

/**
 * An on-screen replica of the printed sheet, updating as you type.
 *
 * --- Read this before changing anything here ---
 *
 * This is NOT the PDF. It's a second rendering of the same content, and the
 * README used to say the editor deliberately had no such thing, because a
 * second layout implementation can drift from the first. That risk is real and
 * the mitigation is structural, not vigilance:
 *
 *   - Every size, colour, face and gap is read from `templates/theme.ts` — the
 *     same object `FoodMenu.tsx` styles itself from. There are no literal
 *     design values in this file. If you find yourself typing a number that
 *     isn't a page coordinate, it belongs in the theme instead.
 *   - Which fragment lands in which of the four columns comes from
 *     `flowBlocksIntoColumns` in `templates/layout.ts`, computed once by the
 *     Editor and passed in. This file never decides placement.
 *   - The header lockup is the same `ElsomLogo` the app bar uses, drawn from
 *     the same Figma path data as the PDF's logo.
 *
 * What CAN still differ is line breaking inside a column: the browser and
 * react-pdf wrap text with different algorithms, so a near-full column may show
 * one more or one fewer line here than it prints. The PDF remains the artefact
 * of record — export before sending anything to a printer.
 *
 * The PDF engine is deliberately not imported here. This renders with ordinary
 * DOM nodes so typing stays responsive, which is the whole reason the editor
 * stopped rendering a live PDF in the first place.
 */

/** The sheet is drawn at true point size, then scaled to whatever fits. */
const SHEET_WIDTH = theme.page.width;
const SHEET_HEIGHT = theme.page.height;

const rule = `${theme.space.ruleWidth}px solid ${theme.color.rule}`;

export function MenuPreview({
  content,
  columns,
}: {
  content: MenuContent;
  /** Straight from `flowBlocksIntoColumns` — four slots, front then back. */
  columns: ColumnFragment[][];
}) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Sheet
        label="Front"
        content={content}
        left={columns[0]}
        right={columns[1]}
      />
      <Sheet
        label="Back"
        content={content}
        left={columns[2]}
        right={columns[3]}
        watermark
      />
    </div>
  );
}

/**
 * Scales the true-size sheet down to the pane's width.
 *
 * Drawing at 792pt and scaling is what keeps proportions honest — every value
 * stays the number the theme says it is, and one transform handles the fit. Any
 * other approach means a second set of numbers that can disagree with the PDF.
 */
function Sheet({
  label,
  content,
  left,
  right,
  watermark = false,
}: {
  label: string;
  content: MenuContent;
  left: ColumnFragment[];
  right: ColumnFragment[];
  watermark?: boolean;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width > 0) setScale(width / SHEET_WIDTH);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <figure style={{ margin: 0 }}>
      <figcaption className="md-label-small md-on-surface-variant" style={{ marginBottom: 6 }}>
        {label}
      </figcaption>

      <div ref={frame}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            width: "100%",
            // Reserve the right box before the first measurement, so the panel
            // doesn't jump when the observer fires.
            height: scale ? SHEET_HEIGHT * scale : undefined,
            aspectRatio: scale ? undefined : `${SHEET_WIDTH} / ${SHEET_HEIGHT}`,
            borderRadius: 2,
            boxShadow: "var(--md-sys-elevation-1)",
            background: theme.color.paper,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: `scale(${scale || 0.5})`,
              transformOrigin: "0 0",
              visibility: scale ? "visible" : "hidden",
            }}
          >
            <Page content={content} left={left} right={right} watermark={watermark} />
          </div>
        </div>
      </div>
    </figure>
  );
}

function Page({
  content,
  left,
  right,
  watermark,
}: {
  content: MenuContent;
  left: ColumnFragment[];
  right: ColumnFragment[];
  watermark: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: SHEET_WIDTH,
        height: SHEET_HEIGHT,
        padding: theme.page.margin,
        background: theme.color.paper,
        /*
         * The app's baseline sets `line-height: 20px` and `letter-spacing:
         * 0.25px` on <body>, and both inherit. Left alone they leak into the
         * sheet: every element without an explicit value picks up UI metrics
         * instead of the font's own, and the footer grew tall enough to steal
         * 35pt from the column area — enough to make a column look full here
         * that prints fine. `normal` is what react-pdf does, so this puts the
         * two renderers back on the same footing.
         */
        lineHeight: "normal",
        letterSpacing: "normal",
      }}
    >
      {/* First child so the columns paint over it, matching the PDF's order. */}
      {watermark ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/brand/watermark-e.png"
          alt=""
          style={{
            position: "absolute",
            left: theme.page.margin + 233,
            top: theme.page.margin + 875,
            width: 215,
            height: 214,
          }}
        />
      ) : null}

      <Header season={content.season} />

      <div
        style={{
          display: "flex",
          gap: theme.column.gutter,
          marginTop: theme.space.afterHeaderDivider,
          flexGrow: 1,
          minHeight: 0,
        }}
      >
        <div style={{ width: theme.column.width }}>
          {left.map((fragment) => (
            <Fragment key={fragment.id} fragment={fragment} />
          ))}
        </div>
        <div style={{ width: theme.column.width }}>
          {right.map((fragment) => (
            <Fragment key={fragment.id} fragment={fragment} />
          ))}
        </div>
      </div>

      <Footer disclaimer={content.disclaimer} serviceCharge={content.serviceCharge} />
    </div>
  );
}

function Header({ season }: { season: string }) {
  return (
    <div
      style={{
        position: "relative",
        flex: "none",
        width: theme.page.contentWidth,
        height: theme.space.headerHeight,
        borderBottom: rule,
      }}
    >
      {/*
        The logo component's viewBox is the artboard lockup, so drawing it at
        the combined height puts the wordmark and "Cellars" exactly where
        FoodMenu.tsx positions them individually.
      */}
      <div style={{ position: "absolute", left: 0, top: 0, color: theme.color.gold }}>
        <ElsomLogo height={42.0018} decorative />
      </div>

      <div
        style={{
          ...face.headingRegular,
          position: "absolute",
          right: 0,
          top: 24,
          fontSize: theme.size.seasonLabel,
          color: theme.color.gold,
          letterSpacing: theme.tracking.seasonLabel,
          textTransform: "uppercase",
          textAlign: "right",
        }}
      >
        {season}
      </div>
    </div>
  );
}

function Footer({
  disclaimer,
  serviceCharge,
}: {
  disclaimer: string;
  serviceCharge: string;
}) {
  const line = {
    ...face.body,
    margin: 0,
    fontSize: theme.size.footer,
    color: theme.color.body,
    textAlign: "center" as const,
  };

  return (
    <div
      style={{
        flex: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: theme.space.footerGap,
        width: theme.page.contentWidth,
        marginTop: theme.space.footerTopMargin,
      }}
    >
      <p style={line}>
        {LEGEND.map(([abbreviation, gloss], index) => (
          <span key={abbreviation}>
            <span style={face.headingMedium}>{abbreviation}</span>
            {` - ${gloss}${index < LEGEND.length - 1 ? ", " : ""}`}
          </span>
        ))}
      </p>
      <p style={line}>{disclaimer}</p>
      <p style={line}>{serviceCharge}</p>
    </div>
  );
}

function Fragment({ fragment }: { fragment: ColumnFragment }) {
  if (fragment.kind === "note") {
    return (
      <div style={{ marginBottom: theme.space.betweenSections }}>
        <div style={{ borderTop: rule, marginBottom: theme.space.afterSectionHeader }} />
        <div
          style={{
            ...face.headingMedium,
            fontSize: theme.size.chefNoteHeading,
            color: theme.color.gold,
            letterSpacing: theme.tracking.itemName,
            textTransform: "uppercase",
            marginBottom: theme.space.afterItemName,
          }}
        >
          {fragment.heading}
        </div>
        <div
          style={{
            ...face.bodyItalic,
            fontSize: theme.size.chefNoteBody,
            lineHeight: 1.25,
            color: theme.color.body,
            whiteSpace: "pre-wrap",
          }}
        >
          {fragment.body}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: theme.space.betweenSections }}>
      {/* A continuation carries no heading — it picks up where the previous
          column left off, the way the artboard does. */}
      {fragment.kind === "section" ? (
        <div
          style={{
            height: theme.space.sectionHeaderRuleOffset,
            borderBottom: rule,
            marginBottom: theme.space.afterSectionHeader,
          }}
        >
          <div
            style={{
              ...face.headingRegular,
              fontSize: theme.size.sectionHeader,
              color: theme.color.gold,
              letterSpacing: theme.tracking.sectionHeader,
              textTransform: "uppercase",
            }}
          >
            {fragment.title}
          </div>
        </div>
      ) : null}

      {fragment.kind === "section" && fragment.addOn ? (
        <div
          style={{
            ...face.body,
            fontSize: theme.size.sectionAddOn,
            color: theme.color.description,
            width: theme.space.itemTextWidth,
            marginBottom: theme.space.afterSectionHeader,
          }}
        >
          {fragment.addOn}
        </div>
      ) : null}

      {fragment.items.map((item) => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
}

function Item({ item }: { item: MenuItem }) {
  const hasBody = Boolean(item.description || item.addOn);

  const bodyText = {
    ...face.body,
    margin: 0,
    fontSize: theme.size.description,
    lineHeight: theme.lineHeight.description,
    color: theme.color.description,
    whiteSpace: "pre-wrap" as const,
  };

  return (
    <div style={{ display: "flex", marginBottom: theme.space.betweenItems }}>
      <div style={{ width: theme.space.itemTextWidth }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: theme.space.nameToTagGap,
            marginBottom: theme.space.afterItemName,
          }}
        >
          <span
            style={{
              ...face.headingMedium,
              fontSize: theme.size.itemName,
              lineHeight: `${theme.lineHeight.itemName}px`,
              color: theme.color.gold,
              letterSpacing: theme.tracking.itemName,
              textTransform: "uppercase",
            }}
          >
            {item.name}
          </span>
          {item.tags.length > 0 ? (
            <span
              style={{
                ...face.headingMedium,
                fontSize: theme.size.dietaryTag,
                // No baseline nudge here, deliberately: the PDF's `itemTags`
                // carries one because react-pdf aligns line boxes rather than
                // baselines, and the browser needs no such correction. Measured
                // on the rendered page, the name, the tag and the price share a
                // baseline to within 0px. Copying the PDF's offset across would
                // push the tag off the line it is already on.
                color: theme.color.gold,
                letterSpacing: theme.tracking.dietaryTag,
                textTransform: "uppercase",
              }}
            >
              {item.tags.map((tag) => DIETARY_TAG_LABELS[tag]).join(" · ")}
            </span>
          ) : null}
        </div>

        {hasBody ? (
          <p style={bodyText}>
            {item.description}
            {item.addOn ? <span style={face.bodyBold}>{` ${item.addOn}`}</span> : null}
          </p>
        ) : null}

        {item.pairing ? <p style={bodyText}>{item.pairing}</p> : null}
      </div>

      {item.price ? (
        <span
          style={{
            ...face.headingMedium,
            width: theme.space.priceColumnWidth,
            fontSize: theme.size.price,
            lineHeight: `${theme.lineHeight.itemName}px`,
            color: theme.color.gold,
            textAlign: "right",
          }}
        >
          {item.price}
        </span>
      ) : null}
    </div>
  );
}
