import "server-only";
import { auth, signOut } from "@/auth";
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
 * If session exists but user doesn't exist in DB (e.g., after DB reset),
 * this will sign out the user and return null
 * 
 * Use this for protected pages that need to ensure the user is valid
 */
export async function verifySessionWithDbCheck(): Promise<SessionUser | null> {
    const session = await verifySession();
    
    if (!session) {
        return null;
    }

    try {
        // Check if user actually exists in the database
        const dbUser = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { id: true },
        });

        if (!dbUser) {
            // User doesn't exist in DB - session is stale/invalid
            // Sign out to clear the invalid cookies
            console.warn(`Session user ${session.userId} not found in database. Signing out.`);
            await forceSignOut();
            return null;
        }

        return session;
    } catch (error) {
        console.error("Database check failed during session verification:", error);
        // If DB is completely down, we might want to allow the session to continue
        // But if it's a "user not found" scenario after DB reset, sign out
        // For safety, sign out on any DB error related to user lookup
        await forceSignOut();
        return null;
    }
}

/**
 * Force sign out the current user (clears cookies and session)
 * Used when session is invalid or user no longer exists
 */
export async function forceSignOut(): Promise<void> {
    try {
        await signOut({ redirect: false });
    } catch (error) {
        // Ignore errors during sign out - we just want to clear the session
        console.error("Error during force sign out:", error);
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
