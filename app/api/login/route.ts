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
        { error: "அதிகப்படியான முயற்சிகள். ஒரு நிமிடம் கழித்து மீண்டும் முயற்சிக்கவும். (Too many login attempts. Please try again in a minute.)" },
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
            { error: "உங்கள் கணக்கு முடக்கப்பட்டுள்ளது. தயவுசெய்து நிர்வாகியைத் தொடர்பு கொள்ளவும். (Your account is deactivated. Please contact the administrator.)" },
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
      { error: "தவறான பயனர் பெயர் அல்லது கடவுச்சொல் (Incorrect username or password)" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login API Error:", error);
    await logSecurityEvent(ip, "ADMIN_LOGIN_ERROR", { error: String(error) });
    return NextResponse.json(
      { error: "உள் சேவையகப் பிழை (Internal server error)" },
      { status: 500 }
    );
  }
}
