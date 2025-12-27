import { prisma } from "@/lib/prisma";

export const PaymentService = {
    async hasCredits(userId: string, amount: number = 1) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true, planType: true },
        });

        if (!user) return false;

        // Pro users don't need credits
        if (user.planType === "PRO") return true;

        return user.credits >= amount;
    },

    async deductCredits(userId: string, amount: number = 1) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true, planType: true },
        });

        if (!user) throw new Error("User not found");
        if (user.planType === "PRO") return true; // No deduction for PRO

        if (user.credits < amount) {
            throw new Error("Insufficient credits");
        }

        await prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: amount } },
        });

        return true;
    },

    async grantCredits(userId: string, amount: number) {
        await prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: amount } }
        });
    },

    async upgradeToPro(userId: string) {
        await prisma.user.update({
            where: { id: userId },
            data: { planType: "PRO" }
        });
    }
};
