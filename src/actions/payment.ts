"use server";

import { verifySession } from "@/lib/session";
import { PaymentService } from "@/lib/payment-service";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function buyCreditsAction(formData: FormData) {
    const session = await verifySession();
    if (!session) return { error: "Unauthorized" };

    const amount = parseInt(formData.get("amount") as string);
    const cost = parseInt(formData.get("cost") as string); // In cents ideally

    if (!amount || amount <= 0) return { error: "Invalid amount" };

    try {
        // 1. In a real app, verify Stripe payment signature/webhook here.
        // 2. For MVP/Demo: We simulate instant success.

        // Record the transaction
        await prisma.payment.create({
            data: {
                teacherId: session.userId,
                amount: cost, // store in cents or raw value
                currency: "USD",
                status: "COMPLETED",
                type: "CREDIT_PURCHASE"
            }
        });

        // Grant the credits
        await PaymentService.grantCredits(session.userId, amount);

        revalidatePath("/dashboard/billing");
        return { success: true };

    } catch (e) {
        console.error("Payment failed", e);
        return { error: "Transaction failed" };
    }
}

export async function upgradeSubscriptionAction(formData: FormData) {
    const session = await verifySession();
    if (!session) return { error: "Unauthorized" };

    try {
        // Simulate Subscription Start
        await prisma.payment.create({
            data: {
                teacherId: session.userId,
                amount: 1500, // $15.00
                currency: "USD",
                status: "COMPLETED",
                type: "SUBSCRIPTION"
            }
        });

        await PaymentService.upgradeToPro(session.userId);
        revalidatePath("/dashboard/billing");
        return { success: true };

    } catch (e) {
        console.error("Upgrade failed", e);
        return { error: "Upgrade failed" };
    }
}
