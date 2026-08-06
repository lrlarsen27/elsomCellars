import { NextResponse } from "next/server";
import { readMenu, writeMenu } from "@/lib/store";
import { isMenuContent } from "@/lib/schema";
import { MENU_IDS } from "@/menus/registry";

// The store touches the filesystem, so these routes need the Node runtime.
export const runtime = "nodejs";

type Params = { params: { menuId: string } };

export async function GET(_request: Request, { params }: Params) {
  if (!MENU_IDS.includes(params.menuId)) {
    return NextResponse.json({ error: "No such menu." }, { status: 404 });
  }

  const menu = await readMenu(params.menuId);
  if (!menu) {
    return NextResponse.json({ error: "No such menu." }, { status: 404 });
  }

  return NextResponse.json(menu);
}

export async function PUT(request: Request, { params }: Params) {
  if (!MENU_IDS.includes(params.menuId)) {
    return NextResponse.json({ error: "No such menu." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  // Reject anything off-shape rather than coercing it. A malformed save should
  // fail loudly instead of quietly writing a broken menu over a good one.
  if (!isMenuContent(body)) {
    return NextResponse.json({ error: "That doesn't look like a menu." }, { status: 400 });
  }

  await writeMenu(params.menuId, body);
  return NextResponse.json({ ok: true });
}
