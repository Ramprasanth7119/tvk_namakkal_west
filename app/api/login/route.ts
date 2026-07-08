import { getBackendT } from "@/lib/backendI18n";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { hashPassword, signSession, UserSession } from "@/lib/session";
import { logAuditEvent } from "@/lib/auditLog";
import {
  getClientIp,
  validateRequestHeaders,
  checkRateLimit,
  sanitizeInput,
  logSecurityEvent,
} from "@/lib/security";

export async function POST(request: Request) {
  const t = await getBackendT();
  const ip = getClientIp(request);

  try {
    // 1. Validate request headers
    const headerCheck = validateRequestHeaders(request);
    if (!headerCheck.valid) {
      return NextResponse.json({ error: headerCheck.error }, { status: 400 });
    }

    // 2. Rate limiting (Admin Login: 20 requests per minute)
    const rateLimit = await checkRateLimit(ip, "admin_login", 20, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: t("api.rate_limit_login") },
        { status: 429 }
      );
    }

    // 3. Sanitize input
    const rawBody = await request.json();
    const body = sanitizeInput(rawBody);
    const { username, password } = body;

    let userSession: UserSession | null = null;

    if (username && username.trim() !== "") {
      const cleanUsername = username.trim().toLowerCase();
      const db = await getDb();
      const user = await db.collection("users").findOne({ username: cleanUsername });

      if (user) {
        if (user.active !== true) {
          await logSecurityEvent(ip, "ADMIN_LOGIN_DEACTIVATED", { usernameAttempt: cleanUsername });
          return NextResponse.json(
            { error: t("api.account_deactivated") },
            { status: 403 }
          );
        }

        const computedHash = hashPassword(password);
        if (user.passwordHash === computedHash) {
          userSession = {
            username: user.username,
            role: user.role,
            constituency: user.constituency || null,
          };
        }
      }
    } else {
      // Legacy login / Single password login
      const correctPassword = process.env.SITE_PASSWORD || "thalapathy";
      if (password === correctPassword) {
        userSession = {
          username: "admin",
          role: "SUPER_ADMIN",
          constituency: null,
        };
      }
    }

    if (userSession) {
      await logSecurityEvent(ip, "ADMIN_LOGIN_SUCCESS", { message: `Successful login for user: ${userSession.username}` });
      await logAuditEvent({
        username: userSession.username,
        role: userSession.role,
        constituency: userSession.constituency,
        action: "LOGIN",
      });

      const response = NextResponse.json({ success: true, user: userSession });
      const signedToken = signSession(userSession);
      
      // Set secure cookie
      response.cookies.set("site_auth", signedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    // Log failed login attempt
    await logSecurityEvent(ip, "ADMIN_LOGIN_FAILED", { usernameAttempt: username || "empty", passwordAttempt: password ? "[REDACTED]" : "empty" });

    return NextResponse.json(
      { error: t("api.incorrect_credentials") },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login API Error:", error);
    await logSecurityEvent(ip, "ADMIN_LOGIN_ERROR", { error: String(error) });
    return NextResponse.json(
      { error: t("api.internal_server_error") },
      { status: 500 }
    );
  }
}
