import { cookies } from "next/headers";
import { verifySession, UserSession } from "./session";

/** Verify SUPER_ADMIN session from site_auth cookie. */
export async function verifySuperAdminSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("site_auth");
  if (!authCookie) return null;

  const session = verifySession(authCookie.value);
  if (!session || session.role !== "SUPER_ADMIN") return null;

  return session;
}
