import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_COOKIE = "chitty_session";
const JWT_TTL = "7d";
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7,
  path: "/"
};

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: "ADMIN" | "MEMBER" | string;
  chittyId: number;
};

function getSecret() {
  const secret = process.env.JWT_SECRET || "devsecret";
  return secret;
}

export function createSessionToken(user: SessionUser) {
  return jwt.sign(user, getSecret(), { expiresIn: JWT_TTL });
}

export function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, cookieOptions);
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookie = cookies().get(SESSION_COOKIE);
  if (!cookie?.value) {
    return null;
  }

  try {
    const payload = jwt.verify(cookie.value, getSecret()) as SessionUser;
    // If chittyId is missing (old token), fetch from database
    if (!payload.chittyId) {
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (user && user.chittyId) {
        return {
          ...payload,
          chittyId: user.chittyId
        };
      }
      // If user doesn't have chittyId, return null to force re-login
      return null;
    }
    return payload;
  } catch {
    // Invalid or expired token
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return session;
}

// For API routes - throws error instead of redirecting
export async function requireUserApi(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }
  return user;
}

// For API routes - throws error instead of redirecting
export async function requireAdminApi(): Promise<SessionUser> {
  const user = await requireUserApi();
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function getUserWithRole(id: number) {
  return prisma.user.findUnique({ where: { id } });
}

