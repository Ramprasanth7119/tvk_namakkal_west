import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect the analytics route and its related API routes
  const isAnalyticsPage = pathname === "/analytics" || pathname.startsWith("/analytics/");
  const isAnalyticsApi = pathname.startsWith("/api/complaints");

  if (isAnalyticsPage || isAnalyticsApi) {
    // Check for auth cookie
    const authCookie = request.cookies.get("site_auth");

    if (!authCookie || authCookie.value !== "authenticated") {
      // If it's an API route, return 401 Unauthorized JSON response
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "அங்கீகரிக்கப்படாத அணுகல் (Unauthorized access)" },
          { status: 401 }
        );
      }
      
      // Redirect to login page, passing the original destination as a redirect parameter
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files
     */
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ],
};
