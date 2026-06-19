import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    const correctPassword = process.env.SITE_PASSWORD || "thalapathy";

    if (password === correctPassword) {
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

    return NextResponse.json({ error: "தவறான கடவுச்சொல் (Incorrect password)" }, { status: 401 });
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "உள் சேவையகப் பிழை (Internal server error)" }, { status: 500 });
  }
}
