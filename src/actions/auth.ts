"use server";

import { signOut } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Logout action - Sign out using NextAuth
 * This is the only auth action needed now
 * Login is handled by Google OAuth via the login page
 */
export async function logoutAction() {
    await signOut({ redirectTo: "/login" });
}

// DEPRECATED FUNCTIONS - Kept for migration reference
// These are no longer used as we've migrated to NextAuth with Google OAuth

export async function loginAction() {
    throw new Error("loginAction is deprecated. Use Google OAuth via /login page.");
}

export async function registerAction() {
    throw new Error("registerAction is deprecated. Use Google OAuth via /login page.");
}
