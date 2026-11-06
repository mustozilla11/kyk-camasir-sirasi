import crypto from "crypto";
import { cookies } from "next/headers";
import { APP_CONFIG } from "./config";

const COOKIE_NAME = "kyk_admin_session";
const SESSION_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function signToken(payload: string): string {
  const hmac = crypto.createHmac("sha256", APP_CONFIG.jwtSecret);
  hmac.update(payload);
  const signature = hmac.digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

export function verifyToken(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [payloadB64, signature] = parts;
    const payload = Buffer.from(payloadB64, "base64url").toString();

    const hmac = crypto.createHmac("sha256", APP_CONFIG.jwtSecret);
    hmac.update(payload);
    const expectedSig = hmac.digest("hex");

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      const data = JSON.parse(payload);
      if (data.exp && Date.now() / 1000 > data.exp) {
        return false; // Expired
      }
      return data.role === "admin";
    }
  } catch (err) {
    return false;
  }
  return false;
}

export async function setAdminSessionCookie() {
  const payload = JSON.stringify({
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + SESSION_EXPIRY_SECONDS,
  });
  const token = signToken(payload);
  const cookieStore = await cookies();
  const isSecure = process.env.NODE_ENV === "production" && Boolean(process.env.VERCEL);
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_SECONDS,
  });
}

export async function removeAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAuthenticatedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyToken(token);
}
