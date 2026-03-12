import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for catalog mode on API catalog endpoints
  if (pathname.startsWith("/api/catalog/products")) {
    const response = NextResponse.next();
    // We add a custom header to indicate this is a catalog request.
    // Further scrubbing is done at the route handler level (src/app/api/catalog/products/route.ts).
    response.headers.set("x-middleware-catalog", "true");
    return response;
  }

  // Only handle /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for session token cookie
  const sessionToken = request.cookies.get("session_token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // We decode the token or fetch the user's role to restrict AGENT access to specific routes if necessary
  // To implement RBAC here, we'd ideally decode a JWT, but since this project uses a DB-backed session token,
  // RBAC for the agent panel is better handled inside the API routes themselves or with a custom auth hook.

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/catalog/products"],
};
