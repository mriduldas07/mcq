"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/session";
import bcrypt from "bcryptjs";

// Define State type for type safety
type ActionState = {
    error?: string;
    success?: boolean;
};

export async function loginAction(prevState: ActionState | undefined, formData: FormData): Promise<ActionState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { error: "Invalid credentials" };
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.passwordHash || "");

        // Only allow login if strictly matched or in dev mode fallback 
        // (but for real auth we require match)
        if (!passwordMatch) {
            return { error: "Invalid credentials" };
        }

        // Create Session
        await createSession(user.id);

    } catch (e: any) {
        console.error("Login Error:", e);
        if (e.message?.includes("Can't reach database server")) {
            return { error: "Database Connection Error. Please verify your connection string." };
        }
        return { error: "Something went wrong. Please try again." };
    }

    redirect("/dashboard");
}

export async function registerAction(prevState: ActionState | undefined, formData: FormData): Promise<ActionState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    if (!email || !password || !name) {
        return { error: "Missing fields" };
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return { error: "User already exists" };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash: hashedPassword,
                planType: "FREE",
                credits: 5, // Start with 5 credits
            }
        });

        await createSession(newUser.id);

    } catch (e: any) {
        console.error("Registration Error", e);
        if (e.message?.includes("Can't reach database server")) {
            return { error: "Database Connection Error. Please verify your connection string." };
        }
        return { error: "Failed to create account. Please try again." };
    }

    redirect("/dashboard");
}

export async function logoutAction() {
    await deleteSession();
    redirect("/login");
}
