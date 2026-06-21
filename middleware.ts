import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Protected pages — require authenticated session
  const protectedPages =
    pathname === "/complaints" ||
    pathname.startsWith("/complaints/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  // Protected API routes
  const isAdminApi = pathname.startsWith("/api/admin");
  const isComplaintsApi = pathname.startsWith("/api/complaints");
  const isComplaintsWrite = isComplaintsApi && method === "POST";
  const isComplaintsProtected = isComplaintsApi && !isComplaintsWrite;

  const requiresAuth = protectedPages || isAdminApi || isComplaintsProtected;

  if (requiresAuth) {
    const authCookie = request.cookies.get("site_auth");
    let session = null;
    if (authCookie) {
      session = verifySession(authCookie.value);
    }

    if (!session) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "அங்கீகரிக்கப்படாத அணுகல் (Unauthorized access)" },
          { status: 401 }
        );
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin routes — SUPER_ADMIN only
    if ((pathname === "/admin" || pathname.startsWith("/admin/") || isAdminApi) && session.role !== "SUPER_ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "அனுமதி மறுக்கப்பட்டது (Access Forbidden)" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/analytics", request.url));
    }

    // Field officers must not access the representative's constituency view (/complaints page).
    // Their scoped workspace is /my-tasks. The /api/complaints API stays accessible (filtered to
    // their own assignments) so /my-tasks keeps working.
    if (
      (pathname === "/complaints" || pathname.startsWith("/complaints/")) &&
      session.role === "FIELD_OFFICER"
    ) {
      return NextResponse.redirect(new URL("/my-tasks", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
