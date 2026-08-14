"use client";

import { useEffect, useRef, useState } from "react";
import { theme } from "@/menus/templates/theme";
import { ElsomLogo, ElsomLogoHorizontal } from "./Logo";
import type { WineColumnFragment } from "@/menus/templates/wine-layout";
import type { TastingExperience, Wine, WineContent } from "@/lib/schema";

/**
 * An on-screen replica of the printed wine sheet.
 *
 * --- Read this before changing anything here ---
 *
 * A sibling of `MenuPreview.tsx`, standing to it exactly as `WineMenu.tsx`
 * stands to `FoodMenu.tsx`: the same shape, none of the same numbers. Read the
 * two side by side, and read this one against `menus/templates/WineMenu.tsx`,
 * which is the artefact of record. This file's only job is to draw on screen
 * what that template prints.
 *
 * The mitigations the food preview's header records hold here too, and this
 * file is the second half of each of them:
 *
 *   - Every size, colour, face, gap and geometry is read from `theme.wine`, or
 *     from the tokens that namespace deliberately shares with the food menu —
 *     the same object `WineMenu.tsx` styles itself from. There are no literal
 *     design values here. If you find yourself typing a number that isn't page
 *     arithmetic over a token, it belongs in the theme instead.
 *   - Which section lands in which column, and which fragments carry the GLASS
 *     and BOTTLE labels, comes from `flowWineBlocksIntoColumns` — computed once
 *     by the page and handed to both renderers. This file decides neither.
 *   - The header lockup is the same `ElsomLogo` the app bar uses, and the
 *     bottom one the same `ElsomLogoHorizontal` the PDF draws, from the same
 *     Figma exports.
 *
 * The wine menu is ONE printed side, so there is one sheet here and no
 * front/back caption.
 *
 * What CAN still differ is line breaking: the browser and react-pdf wrap text
 * with different algorithms, so a near-full column may show one more or one
 * fewer line than it prints. The PDF remains the artefact of record.
 *
 * The PDF engine is deliberately not imported here — this renders with ordinary
 * DOM nodes, the same reason the food preview does.
 */

/** The sheet is drawn at true point size, then scaled to whatever fits. */
const SHEET_WIDTH = theme.page.width;
const SHEET_HEIGHT = theme.page.height;

/**
 * The three faces this menu uses, mapped to the web families registered in
 * `globals.css`. `theme.font` names react-pdf's registered families, which
 * aren't CSS family names — this is the translation between the two, restated
 * from the food preview's rather than imported from it, the way `WineMenu.tsx`
 * restates the header styles `FoodMenu.tsx` also has.
 *
 * There is no bold or italic run anywhere on the wine menu.
 */
const BARLOW = '"Barlow Condensed", "Roboto Condensed", sans-serif';
const CORMORANT = '"Cormorant Garamond", Georgia, serif';

const face = {
  headingRegular: { fontFamily: BARLOW, fontWeight: 400 },
  headingMedium: { fontFamily: BARLOW, fontWeight: 500 },
  body: { fontFamily: CORMORANT, fontWeight: 400 },
} as const;

const rule = `${theme.space.ruleWidth}px solid ${theme.color.rule}`;

/**
 * react-pdf lays out on Yoga, whose `flexShrink` defaults to 0 where CSS
 * defaults to 1. Every fixed measurement on this sheet is one the artboard
 * took, so under pressure the PDF overflows and the browser would instead
 * quietly narrow a price column or squash a section — hiding the very overrun
 * the fit gate exists to name. This is the translation of one engine's default,
 * not a design value.
 */
const noShrink = { flexShrink: 0 } as const;

export function WinePreview({
  content,
  columns,
}: {
  content: WineContent;
  /** Straight from `flowWineBlocksIntoColumns` — two slots, left then right. */
  columns: WineColumnFragment[][];
}) {
  return <Sheet content={content} columns={columns} />;
}

/**
 * Scales the true-size sheet down to the pane's width.
 *
 * Lifted whole from `MenuPreview.tsx`, which is why it carries no wine in it:
 * drawing at 792pt and scaling is what keeps proportions honest — every value
 * stays the number the theme says it is, and one transform handles the fit. Any
 * other approach means a second set of numbers that can disagree with the PDF.
 */
function Sheet({
  content,
  columns,
}: {
  content: WineContent;
  columns: WineColumnFragment[][];
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
          <Page content={content} columns={columns} />
        </div>
      </div>
    </div>
  );
}

function Page({
  content,
  columns,
}: {
  content: WineContent;
  columns: WineColumnFragment[][];
}) {
  const [left = [], right = []] = columns;
  const { experience } = content;

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
        // Page-level default, mirroring the PDF's: any text added later without
        // an explicit face lands on a design face rather than the app's UI one.
        ...face.body,
        /*
         * The app's baseline sets `line-height: 20px` and `letter-spacing:
         * 0.25px` on <body>, and both inherit. Left alone they leak into the
         * sheet: every element without an explicit value picks up UI metrics
         * instead of the font's own, which costs the column area roughly 35pt
         * and stops the preview matching the PDF. `normal` is what react-pdf
         * does, so this puts the two renderers back on the same footing.
         */
        lineHeight: "normal",
        letterSpacing: "normal",
      }}
    >
      <Header season={content.season} />

      {experience ? <Feature experience={experience} /> : null}

      <div
        style={{
          ...noShrink,
          display: "flex",
          gap: theme.column.gutter,
          /*
           * With a tasting experience above them the columns run the artboard's
           * 177 to 983. With none, they take its room: they start where the box
           * would have, right under the header divider, and run to the same 983.
           */
          marginTop: experience
            ? theme.wine.feature.beforeColumns
            : theme.wine.feature.afterHeaderDivider,
          height: experience
            ? theme.wine.column.height
            : theme.wine.column.bottom -
              (theme.space.headerHeight + theme.wine.feature.afterHeaderDivider),
        }}
      >
        <Column fragments={left} />
        <Column fragments={right} />
      </div>

      <Lockup />

      <Footer wineFooter={content.wineFooter} serviceCharge={content.serviceCharge} />
    </div>
  );
}

/** Byte-identical to the food menu's header, as `WineMenu.tsx`'s is. */
function Header({ season }: { season: string }) {
  return (
    <div
      style={{
        ...noShrink,
        position: "relative",
        width: theme.page.contentWidth,
        height: theme.space.headerHeight,
        borderBottom: rule,
      }}
    >
      {/*
        The logo component's viewBox is the artboard lockup, so drawing it at
        the combined height puts the wordmark and "Cellars" exactly where
        WineMenu.tsx positions them individually (39.782 + 37.95 + 4.05181).
      */}
      <div style={{ position: "absolute", left: 0, top: 0, color: theme.color.gold }}>
        <ElsomLogo height={42.0018} decorative />
      </div>

      <div
        style={{
          ...face.headingRegular,
          position: "absolute",
          right: 0,
          // The artboard's own offset inside the 720 x 50 header, the same
          // literal `WineMenu.tsx` and `FoodMenu.tsx` carry.
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

/**
 * The bordered box under the header: 716 wide, no fill, no corner radius.
 *
 * Its 76pt frame holds a 21pt title band on the artboard, and the 20pt title
 * takes its full 22pt line, so the stack runs a little into the bottom padding
 * here exactly as it does in the PDF. The frame keeps the artboard's height
 * because the top of the columns is derived from it.
 */
function Feature({ experience }: { experience: TastingExperience }) {
  const heading = {
    ...face.headingMedium,
    ...noShrink,
    margin: 0,
    lineHeight: `${theme.wine.feature.titleLineHeight}px`,
    color: theme.wine.color.feature,
  };

  return (
    <div
      style={{
        ...noShrink,
        width: theme.wine.feature.width,
        height: theme.wine.feature.height,
        marginTop: theme.wine.feature.afterHeaderDivider,
        border: `${theme.wine.feature.borderWidth}px solid ${theme.wine.color.feature}`,
        padding: theme.wine.feature.padding,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <p
          style={{
            ...heading,
            fontSize: theme.wine.feature.titleSize,
            letterSpacing: theme.wine.feature.titleTracking,
            textTransform: "uppercase",
          }}
        >
          {experience.title}
        </p>
        <p
          style={{
            ...heading,
            fontSize: theme.wine.feature.priceSize,
            letterSpacing: theme.wine.feature.priceTracking,
            textAlign: "right",
          }}
        >
          {experience.price}
        </p>
      </div>
      <p
        style={{
          ...face.body,
          margin: 0,
          fontSize: theme.wine.feature.bodySize,
          lineHeight: `${theme.wine.feature.bodyLineHeight}px`,
          color: theme.wine.color.feature,
          marginTop: theme.wine.feature.paragraphGap,
          whiteSpace: "pre-wrap",
        }}
      >
        {experience.description}
      </p>
    </div>
  );
}

/**
 * The gaps are the container's, not a trailing margin on each child: the
 * estimator charges the space *between* sections and never after the last one.
 */
function Column({ fragments }: { fragments: WineColumnFragment[] }) {
  return (
    <div
      style={{
        ...noShrink,
        display: "flex",
        flexDirection: "column",
        width: theme.column.width,
        gap: theme.wine.sectionHeader.betweenSections,
      }}
    >
      {fragments.map((fragment) => (
        <Section key={fragment.id} fragment={fragment} />
      ))}
    </div>
  );
}

function Section({ fragment }: { fragment: WineColumnFragment }) {
  return (
    <div style={noShrink}>
      {/* Always 22 tall: there is no add-on line on this menu. */}
      <div
        style={{
          position: "relative",
          width: theme.wine.sectionHeader.ruleWidth,
          height: theme.wine.sectionHeader.height,
          borderBottom: rule,
          marginBottom: theme.wine.sectionHeader.afterSectionHeader,
        }}
      >
        <div
          style={{
            ...face.headingRegular,
            fontSize: theme.wine.sectionHeader.nameSize,
            color: theme.color.gold,
            letterSpacing: theme.wine.sectionHeader.nameTracking,
            textTransform: "uppercase",
          }}
        >
          {fragment.title}
        </div>
        {fragment.showsPriceLabels ? <PriceLabels /> : null}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: theme.wine.item.betweenItems,
        }}
      >
        {fragment.wines.map((wine) => (
          <WineRow key={wine.id} wine={wine} />
        ))}
      </div>
    </div>
  );
}

/**
 * GLASS and BOTTLE sit inside the header's own band, each in the box the
 * artboard measured for it above its price column. The labels fill those boxes,
 * so they land on the artboard's own left edges either way.
 *
 * `wine-layout.ts` decides which fragments carry them — the first section in
 * each column and no other. This file does not re-derive that rule.
 */
function PriceLabels() {
  const label = {
    ...face.headingRegular,
    position: "absolute" as const,
    top: 0,
    fontSize: theme.wine.sectionHeader.nameSize,
    color: theme.color.gold,
    letterSpacing: theme.wine.sectionHeader.nameTracking,
    textTransform: "uppercase" as const,
    textAlign: "right" as const,
  };

  return (
    <>
      <div
        style={{
          ...label,
          left: theme.wine.sectionHeader.glassLabelX,
          width: theme.wine.sectionHeader.glassLabelWidth,
        }}
      >
        Glass
      </div>
      <div
        style={{
          ...label,
          left: theme.wine.sectionHeader.bottleLabelX,
          width: theme.wine.sectionHeader.bottleLabelWidth,
        }}
      >
        Bottle
      </div>
    </>
  );
}

/**
 * One row of three fixed-width children: 230 + 43 + 71 = 344, leaving the bottle
 * price's right edge 4pt inside the 348 column the rule above it fills. That
 * inset is the artboard's, not a rounding slip — do not close it.
 */
function WineRow({ wine }: { wine: Wine }) {
  const price = {
    ...face.headingMedium,
    ...noShrink,
    margin: 0,
    fontSize: theme.wine.item.priceSize,
    lineHeight: `${theme.wine.item.priceBoxHeight}px`,
    color: theme.color.gold,
    letterSpacing: theme.wine.item.priceTracking,
    textAlign: "right" as const,
  };

  /**
   * `minHeight` rather than nothing: a wine with no appellation still reserves
   * its line, because the artboard has exactly two item heights and a collapsed
   * row would invent a third. Vermouth is the live case. A line long enough to
   * wrap still grows, which is what the estimator charges for it too.
   */
  const detail = {
    ...face.body,
    margin: 0,
    marginTop: theme.wine.item.innerGap,
    color: theme.color.description,
    whiteSpace: "pre-wrap" as const,
  };

  return (
    <div style={{ ...noShrink, display: "flex" }}>
      <div style={{ ...noShrink, width: theme.wine.item.textWidth }}>
        {/*
          The artboard's title band is 21 while the name sits on a 22pt line,
          which no box model can hold at once — so the band is a floor and the
          22pt line decides, exactly as it does in the PDF and exactly what the
          estimator charges. A fixed 21 would disagree with both.
        */}
        <div style={{ minHeight: theme.wine.item.titleRowHeight }}>
          <div
            style={{
              ...face.headingMedium,
              fontSize: theme.wine.item.nameSize,
              lineHeight: `${theme.wine.item.nameLineHeight}px`,
              color: theme.color.gold,
              letterSpacing: theme.wine.item.nameTracking,
              textTransform: "uppercase",
            }}
          >
            {wine.name}
          </div>
        </div>

        {/* Both rows are drawn whether or not they carry text — see `detail`. */}
        <p
          style={{
            ...detail,
            minHeight: theme.wine.item.locationLineHeight,
            fontSize: theme.wine.item.locationSize,
            lineHeight: `${theme.wine.item.locationLineHeight}px`,
          }}
        >
          {wine.location}
        </p>
        <p
          style={{
            ...detail,
            minHeight: theme.wine.item.notesLineHeight,
            fontSize: theme.wine.item.notesSize,
            lineHeight: `${theme.wine.item.notesLineHeight}px`,
          }}
        >
          {wine.tastingNotes}
        </p>
      </div>

      {/* A wine sold only one way prints one price and leaves the other column
          empty; the widths are fixed, so nothing shifts. */}
      <p style={{ ...price, width: theme.wine.item.glassPriceWidth }}>{wine.glassPrice}</p>
      <p style={{ ...price, width: theme.wine.item.bottlePriceWidth }}>{wine.bottlePrice}</p>
    </div>
  );
}

/**
 * Absolutely placed, like the food menu's watermark, because it is a fixed band
 * on the sheet rather than something the columns push around: its top IS where
 * the columns stop. Absolute coordinates are page-relative, so each one is the
 * artboard's content-relative figure plus the page margin.
 *
 * Padding on two sides only: the artwork sits at frame-relative (20, 20) and is
 * 138 wide in a 170 frame, so the 20 is a left and top offset rather than the
 * symmetric inset a uniform padding would imply. The DOM lockup is
 * width-driven, and its own aspect gives back the artboard's 85.5997 height.
 */
function Lockup() {
  return (
    <div
      style={{
        position: "absolute",
        left: theme.page.margin + theme.wine.lockup.x,
        top: theme.page.margin + theme.wine.lockup.y,
        width: theme.wine.lockup.width,
        height: theme.wine.lockup.height,
        paddingLeft: theme.wine.lockup.padding,
        paddingTop: theme.wine.lockup.padding,
        // The PDF's paths carry the gold baked in; the DOM ones take
        // `currentColor`, so the same token has to be set here.
        color: theme.color.gold,
      }}
    >
      {/* The header mark above is decorative, so this one carries the name. */}
      <ElsomLogoHorizontal width={theme.wine.lockup.artWidth} />
    </div>
  );
}

/**
 * Two centred lines, bottom-aligned in the 44pt frame the food menu fills with
 * three — hence the 16pt drop from the frame's top. Centred in the content
 * width at its own 541.
 */
function Footer({
  wineFooter,
  serviceCharge,
}: {
  wineFooter: string;
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
        position: "absolute",
        left: theme.page.margin + (theme.page.contentWidth - theme.wine.footer.width) / 2,
        top: theme.page.margin + theme.wine.footer.frameY + theme.wine.footer.topOffset,
        width: theme.wine.footer.width,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: theme.space.footerGap,
      }}
    >
      <p style={line}>{wineFooter}</p>
      <p style={line}>{serviceCharge}</p>
    </div>
  );
}
