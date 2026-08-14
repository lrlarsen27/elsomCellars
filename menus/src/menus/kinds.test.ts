import { describe, it, expect } from "vitest";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * One rule, asserted from source text: neither the per-menu bundle nor the
 * registry may reach a PDF template.
 *
 * The rule matters because the PDF engine registers fonts at module scope and
 * is reachable only through the dynamic import inside the export handler. Pull
 * it in from either of these modules and it lands in the prerendered graph —
 * the registry is read by a server component, and the bundle is imported by the
 * page shell — which does not fail loudly. It fails as a slower build, a larger
 * bundle, and eventually a font registration running where there is no browser.
 *
 * Source text rather than imports, deliberately. The thing being guarded
 * against is exactly what importing these modules would trigger, so a runtime
 * test asserting it would have to do the damage to detect it. That is also why
 * the sibling of this check — that every registered menu has a template and a
 * bundle — is a totality type (`Record<MenuId, …>`) rather than a test: it
 * costs nothing at runtime and fails the build instead.
 *
 * The walk is transitive over local modules, so it also catches the reach one
 * module further out: a preview that imported `templates/logo.tsx`, say, which
 * draws with react-pdf's `Svg`, rather than the DOM logo beside it. What it
 * deliberately allows is everything else under `templates/` — `theme.ts`,
 * `layout.ts` and `wine-layout.ts` are pure modules the bundle is supposed to
 * read.
 */

const SRC = fileURLToPath(new URL("..", import.meta.url));

/** The modules under test, and the barrel they must not reach. */
const KINDS = path.join(SRC, "menus/kinds.ts");
const REGISTRY = path.join(SRC, "menus/registry.ts");
const TEMPLATE_DISPATCH = path.join(SRC, "menus/templates/index.tsx");

/** Package specifiers no prerendered module may reach. */
const FORBIDDEN_PACKAGES = ["@react-pdf/renderer"];

/**
 * Every specifier the file imports from, static and dynamic alike. The dynamic
 * form is the one the export handler uses, so a bundle that reached a template
 * "lazily" would still be caught.
 */
function importSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const pattern = /\bfrom\s+["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']/g;

  for (const match of source.matchAll(pattern)) {
    specifiers.push(match[1] ?? match[2]);
  }
  return specifiers;
}

/** `@/x` is the tsconfig alias for `src/x`; anything else relative is ordinary. */
function resolveLocal(specifier: string, fromFile: string): string | null {
  const base = specifier.startsWith("@/")
    ? path.join(SRC, specifier.slice(2))
    : specifier.startsWith(".")
      ? path.resolve(path.dirname(fromFile), specifier)
      : null;

  if (base === null) return null;

  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];

  // A bare specifier can name a directory (`@/menus/templates`), so the file
  // check has to be a file check rather than an existence check.
  return candidates.find((candidate) => statSync(candidate, { throwIfNoEntry: false })?.isFile()) ?? null;
}

type Reach = {
  /** Every local module reachable from the entry points, including them. */
  files: Set<string>;
  /** Every non-local specifier any of those files imports. */
  packages: Set<string>;
  /**
   * Local specifiers this walk could not turn into a file. Always empty, and
   * asserted to be: an unresolved import is a branch of the graph that went
   * unchecked, which would look exactly like a clean result.
   */
  unresolved: Set<string>;
};

function reachFrom(entries: string[]): Reach {
  const files = new Set<string>();
  const packages = new Set<string>();
  const unresolved = new Set<string>();
  const queue = [...entries];

  while (queue.length > 0) {
    const file = queue.shift() as string;
    if (files.has(file)) continue;
    files.add(file);

    for (const specifier of importSpecifiers(readFileSync(file, "utf8"))) {
      const isLocal = specifier.startsWith(".") || specifier.startsWith("@/");
      const local = resolveLocal(specifier, file);

      if (local) queue.push(local);
      else if (isLocal) unresolved.add(specifier);
      else packages.add(specifier);
    }
  }

  return { files, packages, unresolved };
}

/** Paths read better in a failure message relative to `src/`. */
function relative(files: Iterable<string>): string[] {
  return [...files].map((file) => path.relative(SRC, file).split(path.sep).join("/")).sort();
}

describe("what the registry and the menu bundle are allowed to reach", () => {
  const reach = reachFrom([KINDS, REGISTRY]);

  it("walks further than the two entry points, so the checks below mean something", () => {
    const walked = relative(reach.files);

    // The bundle's own halves, one module under `templates/`, and a preview:
    // if the walk stopped at the entry points these would be missing and every
    // assertion below would pass vacuously.
    expect(walked).toContain("lib/food-sheet.ts");
    expect(walked).toContain("lib/wine-sheet.ts");
    expect(walked).toContain("menus/templates/wine-layout.ts");
    expect(walked).toContain("components/WinePreview.tsx");
    expect([...reach.unresolved]).toEqual([]);
  });

  it("reaches no PDF template", () => {
    expect(relative(reach.files)).not.toContain("menus/templates/index.tsx");
  });

  it("reaches the PDF engine through nothing at all", () => {
    for (const forbidden of FORBIDDEN_PACKAGES) {
      expect([...reach.packages]).not.toContain(forbidden);
    }
  });

  it("still reads the pure modules under templates/, which are the point of the walk", () => {
    // Stated as a test so that "reaches nothing under templates/" is never the
    // fix for a failure above: the flow modules are exactly what the bundle is
    // supposed to import, and the theme is what keeps both renderers honest.
    const walked = relative(reach.files);
    expect(walked).toContain("menus/templates/layout.ts");
    expect(walked).toContain("menus/templates/theme.ts");
  });
});

describe("the same walk over the template dispatch", () => {
  const reach = reachFrom([TEMPLATE_DISPATCH]);

  it("finds the PDF engine, which is what makes the rule above worth having", () => {
    // The premise of every assertion above: the dispatch does reach the engine,
    // and this walk does find it. Without this, a detector that found nothing
    // anywhere would look like a clean bill of health.
    expect([...reach.packages]).toContain("@react-pdf/renderer");
  });
});
