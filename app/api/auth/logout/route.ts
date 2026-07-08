import { getBackendT } from "@/lib/backendI18n";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { logAuditEvent } from "@/lib/auditLog";

// Cookie attributes must match those used when the cookie was set (see app/api/login/route.ts)
// so the browser reliably clears it. maxAge: 0 expires it immediately.
const CLEAR_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 0,
};

export async function POST() {
  try {
    // Best-effort audit log of who logged out (never block logout on failure).
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("site_auth");
    if (authCookie) {
      const session = verifySession(authCookie.value);
      if (session) {
        await logAuditEvent({
          username: session.username,
          role: session.role,
          constituency: session.constituency ?? null,
          action: "LOGOUT",
        });
      }
    }
  } catch (error) {
    console.error("Logout audit error:", error);
  }

  // Always clear the session cookie, even if the audit step above failed.
  const response = NextResponse.json({ success: true });
  response.cookies.set("site_auth", "", CLEAR_OPTIONS);
  return response;
}
