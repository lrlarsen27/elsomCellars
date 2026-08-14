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
 * Every specifier the file imports from, in every shape that reaches a module.
 * The dynamic form is the one the export handler uses, so a bundle that reached
 * a template "lazily" would still be caught.
 *
 * Four shapes, because a detector that misses one is worse than no detector:
 * it reports a clean walk over a graph it never finished, and the failure it
 * guards against is silent to begin with. `from "x"` and `import("x")` are the
 * shapes this repo writes; `import "x"` (side-effect only — and enough on its
 * own to run react-pdf's module-scope font registration), `require("x")`, and a
 * backtick-delimited specifier are the ones it does not write TODAY, which is
 * exactly why nothing else would notice them going unwalked.
 *
 * Two deliberate narrowings, both about not matching prose. Backticks are
 * accepted only in the call form, because that is the only place JavaScript
 * allows them — a specifier after `from` or after a bare `import` must be a
 * plain string literal — and this file's neighbours are full of doc comments
 * that name a module in backticks after the word "from". And `\bimport\s+`
 * cannot match `import(`, since the whitespace is required, so the side-effect
 * branch and the dynamic branch stay separate.
 */
function importSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const quoted = String.raw`["']([^"']+)["']`;
  const backquoted = String.raw`["'\`]([^"'\`]+)["'\`]`;
  const pattern = new RegExp(
    [
      String.raw`\bfrom\s+${quoted}`,
      String.raw`\b(?:import|require)\(\s*${backquoted}`,
      String.raw`\bimport\s+${quoted}`,
    ].join("|"),
    "g",
  );

  for (const match of source.matchAll(pattern)) {
    specifiers.push(match[1] ?? match[2] ?? match[3]);
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

/**
 * The guard's own blind spot, covered.
 *
 * Everything above is only as good as the extraction: a shape the pattern does
 * not recognise is a branch of the import graph that goes unwalked, and an
 * unwalked branch looks exactly like a clean result. Each case below is a shape
 * the repo does not currently write — which is precisely why nothing else would
 * notice if it stopped being detected.
 */
describe("the detector that every assertion above rests on", () => {
  const forbidden = FORBIDDEN_PACKAGES[0];

  const shapes: Record<string, string> = {
    "a static import": `import { Document } from "${forbidden}";`,
    "a single-quoted static import": `import { Document } from '${forbidden}';`,
    "a dynamic import": `const pdf = await import("${forbidden}");`,
    "a bare side-effect import": `import "${forbidden}";`,
    "a require call": `const pdf = require("${forbidden}");`,
    "a backtick-delimited dynamic specifier": "const pdf = await import(`" + forbidden + "`);",
    "a re-export": `export { Document } from "${forbidden}";`,
  };

  for (const [shape, source] of Object.entries(shapes)) {
    it(`finds a forbidden package written as ${shape}`, () => {
      expect(importSpecifiers(source)).toContain(forbidden);
    });
  }

  it("does not read a doc comment naming a module in backticks as an import", () => {
    // The narrowing that makes the backtick support safe here: every module in
    // this repo carries prose like the line below, and a specifier after `from`
    // is a plain string literal in JavaScript anyway.
    const source = "/** Every size and colour is read from `./theme` rather than typed. */";

    expect(importSpecifiers(source)).toEqual([]);
  });

  it("finds every specifier in a file that mixes the shapes", () => {
    const source = [
      `import { a } from "./a";`,
      `import "./b";`,
      `const c = require("./c");`,
      `const d = await import("./d");`,
    ].join("\n");

    expect(importSpecifiers(source)).toEqual(["./a", "./b", "./c", "./d"]);
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
