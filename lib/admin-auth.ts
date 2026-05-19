import { cookies } from "next/headers";
import crypto from "crypto";
import { env } from "@/lib/env";

const ADMIN_COOKIE_NAME = "admin_session";

function adminHash() {
  return crypto.createHash("sha256").update(env.adminPassword).digest("hex");
}

export async function createAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, adminHash(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  const cookie = store.get(ADMIN_COOKIE_NAME);
  return cookie?.value === adminHash();
}
