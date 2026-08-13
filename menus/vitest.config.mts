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
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
