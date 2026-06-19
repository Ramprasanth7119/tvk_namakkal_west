import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define paths that should not be protected
  const isAuthPage = pathname === "/login";
  const isApiLogin = pathname === "/api/login";
  
  // Static files, assets, and images
  const isStaticAsset = 
    pathname.startsWith("/_next") || 
    pathname.startsWith("/static") || 
    pathname.includes(".") || // e.g. favicon.ico, .png, .jpg, .jpeg, .svg
    pathname.startsWith("/api/public");

  if (isAuthPage || isApiLogin || isStaticAsset) {
    return NextResponse.next();
  }

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
    
    // Redirect to login page
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
