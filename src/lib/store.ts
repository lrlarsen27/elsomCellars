import { promises as fs } from "fs";
import path from "path";
import { SEED_MENUS } from "./seed";
import type { MenuContent, MenuStore } from "./schema";

/**
 * Storage adapter.
 *
 * Right now this is a JSON file on disk, which is all a local build needs.
 * This file is the *only* place that knows how menus are persisted — the API
 * routes just call `readMenu` / `writeMenu`. Moving to Vercel KV, Supabase, or
 * Cloudflare KV means rewriting these two functions and nothing else.
 *
 * Caveat worth knowing: a JSON file has no locking. Two people saving the same
 * menu at the same instant means last-write-wins. Fine for one kitchen, and it
 * stops being true the moment this moves to a real database.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "menus.json");

async function readStore(): Promise<MenuStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as MenuStore;
  } catch {
    // First run, or the file was deleted. Lay down the seed and use it.
    const seed = structuredClone(SEED_MENUS);
    await writeStore(seed);
    return seed;
  }
}

async function writeStore(store: MenuStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function readMenu(menuId: string): Promise<MenuContent | null> {
  const store = await readStore();
  return store[menuId] ?? null;
}

export async function writeMenu(
  menuId: string,
  content: MenuContent,
): Promise<void> {
  const store = await readStore();
  store[menuId] = content;
  await writeStore(store);
}
