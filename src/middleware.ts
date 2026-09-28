import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/health", "/api/momo/callback"];

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return response;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const isLoggedIn = !!req.auth?.user?.id;

  if (!isPublic && !isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return applySecurityHeaders(
        NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
      );
    }
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if (pathname === "/login" && isLoggedIn) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin)),
    );
  }

  if (pathname.startsWith("/admin") && req.auth?.user?.role !== "ADMIN") {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin)),
    );
  }

  if (pathname === "/") {
    return applySecurityHeaders(
      NextResponse.redirect(
        new URL(isLoggedIn ? "/dashboard" : "/login", req.nextUrl.origin),
      ),
    );
  }

  return applySecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
