import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isErrorPage = req.nextUrl.pathname.startsWith("/error");

  // 1. Allow error page access without authentication
  if (isErrorPage) {
    return NextResponse.next();
  }

  // 2. Protect Dashboard - redirect to login if not authenticated
  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3. Redirect authenticated users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/error"],
};
