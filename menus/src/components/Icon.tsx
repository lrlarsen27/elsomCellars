/**
 * The icon set.
 *
 * These are hand-authored on Material's 24dp grid and drawn in the Material
 * Symbols idiom — filled, single path, optical center at 12,12 — but they are
 * not the shipped Google glyphs. That's deliberate: pulling the real symbol font
 * would mean either a Google Fonts CDN request on every page, which nothing else
 * in this app does, or committing a fourth font file to `public/fonts/` for a
 * dozen glyphs. Hand-drawn paths cost nothing and can't 404.
 *
 * Names match the Material Symbols they stand in for, so swapping in the real
 * font later is a find-and-replace rather than a redesign.
 */

type IconProps = {
  /** 18px for icons set inside chips and dense rows; 24px everywhere else. */
  size?: "sm" | "md";
};

function svg(path: string, { size = "md" }: IconProps) {
  return (
    <svg
      className={size === "sm" ? "md-icon sm" : "md-icon"}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} />
    </svg>
  );
}

/* -- navigation ----------------------------------------------------------- */

export const ArrowBackIcon = (props: IconProps) =>
  svg("M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z", props);

export const ChevronRightIcon = (props: IconProps) =>
  svg("M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z", props);

export const LockIcon = (props: IconProps) =>
  svg(
    "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z",
    props,
  );

/* -- actions -------------------------------------------------------------- */

export const SaveIcon = (props: IconProps) =>
  svg(
    "M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z",
    props,
  );

export const DownloadIcon = (props: IconProps) =>
  svg("M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z", props);

export const AddIcon = (props: IconProps) => svg("M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z", props);

export const OpenInNewIcon = (props: IconProps) =>
  svg(
    "M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z",
    props,
  );

export const CloseIcon = (props: IconProps) =>
  svg(
    "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z",
    props,
  );

export const DeleteIcon = (props: IconProps) =>
  svg(
    "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
    props,
  );

export const ArrowUpwardIcon = (props: IconProps) =>
  svg("M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z", props);

export const ArrowDownwardIcon = (props: IconProps) =>
  svg("M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z", props);

/* -- status --------------------------------------------------------------- */

export const ErrorIcon = (props: IconProps) =>
  svg(
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z",
    props,
  );

export const CheckIcon = (props: IconProps) =>
  svg("M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z", props);

export const CheckCircleIcon = (props: IconProps) =>
  svg(
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    props,
  );

/* -- content -------------------------------------------------------------- */

export const MenuBookIcon = (props: IconProps) =>
  svg(
    "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
    props,
  );

export const NotesIcon = (props: IconProps) =>
  svg("M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z", props);

/** Stands in for `view_column` — the placement readout. */
export const ViewColumnIcon = (props: IconProps) =>
  svg("M14.67 5v14H9.33V5h5.34zm1 14H21V5h-5.33v14zm-7.34 0V5H3v14h5.33z", props);
