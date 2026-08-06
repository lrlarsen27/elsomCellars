/**
 * Shared-passcode auth.
 *
 * One passcode, checked on the server, that mints a signed cookie. The cookie
 * carries nothing but an expiry and an HMAC of that expiry, so it can't be
 * forged without `SESSION_SECRET` and it can't be replayed after it lapses.
 *
 * Built on Web Crypto rather than Node's `crypto` so the same code runs in
 * middleware (Edge runtime) and in API routes (Node runtime).
 *
 * What this is not: per-user identity. Everyone shares one passcode, so the
 * logs can't tell you who changed a price. That was the tradeoff chosen for
 * simplicity — worth revisiting if you ever need an audit trail.
 */

export const SESSION_COOKIE = "menu_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Copy .env.local.example to .env.local and fill it in.",
    );
  }
  return secret;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(signature);
}

/** Compares two strings without leaking their difference through timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function checkPasscode(submitted: string): boolean {
  const expected = process.env.APP_PASSCODE;
  if (!expected) {
    throw new Error(
      "APP_PASSCODE is not set. Copy .env.local.example to .env.local and fill it in.",
    );
  }
  return safeEqual(submitted, expected);
}

export async function createSessionToken(): Promise<string> {
  const expiresAt = String(Date.now() + SESSION_DURATION_MS);
  const signature = await sign(expiresAt, getSecret());
  return `${expiresAt}.${signature}`;
}

export async function isValidSessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;

  const separator = token.indexOf(".");
  if (separator === -1) return false;

  const expiresAt = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const expiryMs = Number(expiresAt);
  if (!Number.isFinite(expiryMs) || Date.now() > expiryMs) return false;

  let expected: string;
  try {
    expected = await sign(expiresAt, getSecret());
  } catch {
    return false;
  }

  return safeEqual(signature, expected);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION_MS / 1000,
  secure: process.env.NODE_ENV === "production",
};
