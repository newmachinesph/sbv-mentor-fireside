import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Public routes
  const publicPaths = ["/", "/login", "/register"];
  const isPublicPage =
    publicPaths.includes(pathname) || pathname.startsWith("/mentors");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isPublicApi =
    pathname.startsWith("/api/mentors") && req.method === "GET";
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".");

  if (isPublicPage || isApiAuth || isPublicApi || isStaticAsset) {
    return NextResponse.next();
  }

  // Protected routes require auth
  if (!isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin/moderator-only routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (userRole !== "admin" && userRole !== "moderator") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|avatars|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};
