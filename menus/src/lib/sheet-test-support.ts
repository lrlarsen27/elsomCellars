/**
 * Scaffolding shared by the sheet suites: a fetcher that never touches the
 * network, and the environment dance the per-menu tab resolution needs.
 *
 * Not a suite itself — the runner collects `*.test.ts`, so this file is only
 * ever imported. It sits beside the loader rather than beside either menu,
 * because the thing it stands in for is the transport, which names no menu.
 */

/** Answers each URL from a table keyed by tab id, so no test reaches the network. */
export function stubFetcher(byGid: Record<string, Response | Error>) {
  return async (url: string) => {
    const gid = new URL(url).searchParams.get("gid") ?? "";
    const answer = byGid[gid];
    if (answer instanceof Error) throw answer;
    if (!answer) throw new Error(`no stub for gid ${gid}`);
    return answer;
  };
}

/** What the export endpoint sends: CSV, with the content type the loader checks. */
export function csvResponse(body: string, init: ResponseInit = {}) {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/csv; charset=utf-8" },
    ...init,
  });
}

/**
 * Every variable the menus resolve from, so a suite can restore the ones it did
 * not set as well as the ones it did.
 */
export const SHEET_VARIABLES = [
  "NEXT_PUBLIC_SHEET_ID",
  "NEXT_PUBLIC_SHEET_SETTINGS_GID",
  "NEXT_PUBLIC_SHEET_MENU_GID",
  "NEXT_PUBLIC_SHEET_WINE_GID",
] as const;

/**
 * Swaps the sheet environment for the duration of a suite and puts back exactly
 * what was there — including variables the suite deleted rather than set.
 *
 * `overrides` is the whole environment, not a patch: a variable absent from it
 * is unset, which is the case these suites exist to cover. A menu reads its tab
 * id when its module loads, so pair this with `reloadSheetModules`.
 */
export function useSheetEnv(overrides: Partial<Record<(typeof SHEET_VARIABLES)[number], string>>) {
  let saved: Record<string, string | undefined> = {};

  return {
    apply() {
      saved = Object.fromEntries(SHEET_VARIABLES.map((name) => [name, process.env[name]]));
      for (const name of SHEET_VARIABLES) {
        const value = overrides[name];
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    },
    restore() {
      for (const name of SHEET_VARIABLES) {
        if (saved[name] === undefined) delete process.env[name];
        else process.env[name] = saved[name];
      }
    },
  };
}
