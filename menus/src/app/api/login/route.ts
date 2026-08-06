import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  checkPasscode,
  createSessionToken,
} from "@/lib/auth";

export async function POST(request: Request) {
  let passcode = "";
  try {
    const body = await request.json();
    passcode = typeof body?.passcode === "string" ? body.passcode : "";
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  let ok: boolean;
  try {
    ok = checkPasscode(passcode);
  } catch (error) {
    // Missing env vars — a setup problem, not a user problem. Say so plainly.
    const message = error instanceof Error ? error.message : "Server misconfigured.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!ok) {
    return NextResponse.json({ error: "That passcode didn't work." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(), SESSION_COOKIE_OPTIONS);
  return response;
}
