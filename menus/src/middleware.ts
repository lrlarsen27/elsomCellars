import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSessionToken } from "@/lib/auth";

/**
 * Gates every page and API route behind the shared passcode. Running the check
 * here rather than in each page means a new route is protected by default —
 * you have to opt out on purpose, not remember to opt in.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    pathname === "/login" || pathname === "/api/login" || pathname === "/api/logout";
  if (isPublic) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await isValidSessionToken(token)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  /**
   * Everything except static assets.
   *
   * `fonts/` and `brand/` are served from `public/` and must stay outside the
   * gate: the PDF renderer fetches the font files itself, and gating them made
   * every request 307 to /login. They're public design assets, not data.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts/|brand/).*)"],
};
