import { createHmac } from "crypto";
import type { NextApiRequest } from "next";
import type { IncomingMessage } from "http";

const SA_COOKIE = "__sa_v";
const TTL_MS = 12 * 60 * 60 * 1000;

function sign(userId: string, exp: number): string {
  const secret = process.env.ENCRYPTION_SECRET ?? "default-32-char-secret-fallback!";
  return createHmac("sha256", secret).update(`${userId}:${exp}`).digest("hex");
}

export function buildSaSessionCookie(userId: string): string {
  const exp = Date.now() + TTL_MS;
  const sig = sign(userId, exp);
  const value = Buffer.from(JSON.stringify({ uid: userId, exp, sig })).toString("base64");
  return `${SA_COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${TTL_MS / 1000}`;
}

export function clearSaSessionCookie(): string {
  return `${SA_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

function parseSaSessionCookie(req: NextApiRequest | IncomingMessage): { uid: string; exp: number; sig: string } | null {
  const raw = (req.headers.cookie ?? "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SA_COOKIE}=`));
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw.slice(SA_COOKIE.length + 1), "base64").toString());
  } catch {
    return null;
  }
}

export function isSaSessionValid(req: NextApiRequest | IncomingMessage, userId: string): boolean {
  const parsed = parseSaSessionCookie(req);
  if (!parsed) return false;
  if (parsed.uid !== userId) return false;
  if (parsed.exp < Date.now()) return false;
  const expected = sign(userId, parsed.exp);
  return parsed.sig === expected;
}
