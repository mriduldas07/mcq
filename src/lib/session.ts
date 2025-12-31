import "server-only";
import { auth } from "@/auth";

export type SessionUser = {
    userId: string;
    email: string;
    name: string;
    image: string;
    planType: string;
    credits: number;
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
        credits: session.user.credits,
    };
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
