"use server";

import { signOut } from "@/auth";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Logout action - Sign out using NextAuth
 * This is the only auth action needed now
 * Login is handled by Google OAuth via the login page
 */
export async function logoutAction() {
    await signOut({ redirectTo: "/login" });
}

/**
 * Update user profile information
 */
export async function updateProfileAction(formData: FormData) {
    const session = await verifySession();
    if (!session) {
        redirect("/login");
    }

    const name = formData.get("name") as string;

    if (!name || name.trim().length === 0) {
        return { error: "Name is required" };
    }

    try {
        await prisma.user.update({
            where: { id: session.userId },
            data: { name: name.trim() },
        });

        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (error) {
        console.error("Profile update error:", error);
        return { error: "Failed to update profile" };
    }
}

/**
 * Delete user account (for GDPR compliance)
 */
export async function deleteAccountAction() {
    const session = await verifySession();
    if (!session) {
        redirect("/login");
    }

    try {
        // Delete user and all related data (cascade deletes will handle exams, etc.)
        await prisma.user.delete({
            where: { id: session.userId },
        });

        await signOut({ redirectTo: "/login" });
    } catch (error) {
        console.error("Account deletion error:", error);
        return { error: "Failed to delete account" };
    }
}

// DEPRECATED FUNCTIONS - Kept for migration reference
// These are no longer used as we've migrated to NextAuth with Google OAuth

export async function loginAction() {
    throw new Error("loginAction is deprecated. Use Google OAuth via /login page.");
}

export async function registerAction() {
    throw new Error("registerAction is deprecated. Use Google OAuth via /login page.");
}
