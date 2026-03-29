import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/admin/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generar o mantener sessionId para usuarios no autenticados.
  // IMPORTANTE: usar NextResponse.next({ request: { headers } }) para que
  // el header x-session-id llegue al route handler (no solo al browser).
  let sessionId = request.cookies.get("x-session-id")?.value;
  const isNewSession = !sessionId;
  if (!sessionId) {
    sessionId = globalThis.crypto.randomUUID();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-session-id", sessionId);

  // Check for catalog mode on API catalog endpoints
  if (pathname.startsWith("/api/catalog/products")) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("x-middleware-catalog", "true");
    if (isNewSession) {
      response.cookies.set("x-session-id", sessionId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });
    }
    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Persistir la cookie solo si es nueva (evita Set-Cookie innecesarios en cada request)
  if (isNewSession) {
    response.cookies.set("x-session-id", sessionId, {
      httpOnly: false, // Accesible desde cliente para APIs
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: "/",
    });
  }

  // Only handle /admin routes further
  if (!pathname.startsWith("/admin")) {
    return response;
  }

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return response;
  }

  // Check for session token cookie
  const sessionToken = request.cookies.get("session_token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/catalog/products", "/api/:path*"],
};