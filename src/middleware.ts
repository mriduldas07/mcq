import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET || "mock-secret-key-change-me";
const encodedKey = new TextEncoder().encode(secretKey);

export async function middleware(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
    const isAuthPage = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/register");

    // Validate session
    let verifiedSession = null;
    if (session) {
        try {
            const { payload } = await jwtVerify(session, encodedKey, {
                algorithms: ["HS256"],
            });
            verifiedSession = payload;
        } catch (e) {
            // Invalid session
        }
    }

    // 1. Protect Dashboard
    if (isDashboard && !verifiedSession) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 2. Redirect Authenticated Users away from Auth Pages
    if (isAuthPage && verifiedSession) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/register"],
};
