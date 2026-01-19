import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
    userId: string;
    email: string;
    name: string;
    image: string;
    planType: string;
    freeExamsUsed: number;
    oneTimeExamsRemaining: number;
};

// Special result type for session validation with DB check
export type SessionCheckResult = 
    | { status: "valid"; session: SessionUser }
    | { status: "no_session" }
    | { status: "invalid_session" }; // Session exists but user not in DB

/**
 * Get current session (NextAuth wrapper)
 * Returns user data if authenticated, null otherwise
 */
export async function verifySession(): Promise<SessionUser | null> {
    const session = await auth();
    
    if (!session || !session.user) {
        return null;
    }

    return {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        planType: session.user.planType,
        freeExamsUsed: session.user.freeExamsUsed || 0,
        oneTimeExamsRemaining: session.user.oneTimeExamsRemaining || 0,
    };
}

/**
 * Verify session AND validate user exists in database
 * Returns a result object indicating the session status:
 * - "valid": Session is valid and user exists in DB
 * - "no_session": No session exists (not logged in)
 * - "invalid_session": Session exists but user not in DB (needs force sign-out)
 * 
 * Use this for protected pages that need to ensure the user is valid.
 * The calling code should redirect to /api/auth/force-signout for "invalid_session"
 */
export async function verifySessionWithDbCheck(): Promise<SessionCheckResult> {
    const session = await verifySession();
    
    if (!session) {
        return { status: "no_session" };
    }

    try {
        // Check if user actually exists in the database
        const dbUser = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { id: true },
        });

        if (!dbUser) {
            // User doesn't exist in DB - session is stale/invalid
            console.warn(`Session user ${session.userId} not found in database. Session is invalid.`);
            return { status: "invalid_session" };
        }

        return { status: "valid", session };
    } catch (error) {
        console.error("Database check failed during session verification:", error);
        // For safety, treat DB errors as invalid session
        return { status: "invalid_session" };
    }
}

/**
 * Get current session (alias for verifySession)
 */
export async function getSession() {
    return verifySession();
}

// Legacy function names for backward compatibility
export async function createSession() {
    throw new Error("createSession is deprecated. Use signIn from next-auth instead.");
}

export async function deleteSession() {
    throw new Error("deleteSession is deprecated. Use signOut from next-auth instead.");
}
