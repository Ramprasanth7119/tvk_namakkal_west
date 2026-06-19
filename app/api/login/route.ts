import { NextResponse } from "next/server";
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
    const { password } = body;

    const correctPassword = process.env.SITE_PASSWORD || "thalapathy";

    if (password === correctPassword) {
      await logSecurityEvent(ip, "ADMIN_LOGIN_SUCCESS", { message: "Successful admin login" });

      const response = NextResponse.json({ success: true });
      
      // Set secure cookie
      response.cookies.set("site_auth", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    // Log failed login attempt
    await logSecurityEvent(ip, "ADMIN_LOGIN_FAILED", { passwordAttempt: password ? "[REDACTED]" : "empty" });

    return NextResponse.json(
      { error: "தவறான கடவுச்சொல் (Incorrect password)" },
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
