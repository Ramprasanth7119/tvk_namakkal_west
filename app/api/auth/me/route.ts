import { getBackendT } from "@/lib/backendI18n";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("site_auth");

    if (!authCookie) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const session = verifySession(authCookie.value);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: session,
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ authenticated: false, error: "Internal server error" }, { status: 500 });
  }
}
