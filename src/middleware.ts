import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";

// Routes that don't require authentication
const publicRoutes = ["/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for catalog mode on API catalog endpoints
  if (pathname.startsWith("/api/catalog/products")) {
    const response = NextResponse.next();
    response.headers.set("x-middleware-catalog", "true");
    return response;
  }

  // Generar o mantener sessionId para usuarios no autenticados
  // Esta es la sesión del navegador para rastrear carritos/órdenes de invitados
  let response = NextResponse.next();
  
  let sessionId = request.cookies.get("x-session-id")?.value;
  if (!sessionId) {
    sessionId = randomUUID();
    response.cookies.set("x-session-id", sessionId, {
      httpOnly: false, // Accesible desde cliente para APIs
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: "/",
    });
  }

  // Pasar sessionId como header a los route handlers
  response.headers.set("x-session-id", sessionId);

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
