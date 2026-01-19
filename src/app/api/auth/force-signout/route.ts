import { signOut } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Force sign-out route handler
 * This route is called when we detect an invalid session (e.g., user deleted from DB)
 * 
 * Route Handlers CAN modify cookies, unlike Server Components during render.
 * This is the proper way to handle forced sign-outs in Next.js App Router.
 */
export async function GET() {
    try {
        // Sign out the user - this clears the session cookie
        await signOut({ redirect: false });
    } catch (error) {
        // If signOut fails, we still want to redirect to login
        console.error("Force sign-out error:", error);
    }
    
    // Redirect to login page with a message
    return NextResponse.redirect(new URL("/login?session_expired=true", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}

export async function POST() {
    return GET();
}
