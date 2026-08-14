import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * `vitest` ran with no configuration until now, which meant it resolved no `@`
 * path alias. That worked only by accident: the one aliased import in the test
 * graph was type-only, so the transform erased it before resolution ever
 * happened. Any test reaching a module that imports `@/…` at value position
 * would have failed to resolve.
 *
 * The alias mirrors `tsconfig.json`'s `paths`, so a module means the same thing
 * to the type checker, the Next build, and the test run.
 *
 * The JSX setting is the same story one layer down. `jsx: "preserve"` is right
 * in `tsconfig.json` — Next does its own transform — but the runner reads that
 * file too, so a `.tsx` module reached by a test came back with its JSX intact
 * and failed to parse as JavaScript. Every menu's bundle names that menu's
 * preview, so any test resolving a menu's source now reaches one. `automatic`
 * is the transform Next applies.
 */
export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
