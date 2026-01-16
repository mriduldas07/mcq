import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { BillingClient } from "@/components/billing-client";

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
    const session = await verifySession();
    if (!session) return redirect("/login");

    try {
        // Fetch user with subscription and payment data
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
                id: true,
                planType: true,
                freeExamsUsed: true,
                oneTimeExamsRemaining: true,
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    orderBy: { currentPeriodEnd: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        plan: true,
                        status: true,
                        currentPeriodEnd: true,
                        cancelAtPeriodEnd: true,
                    },
                },
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        type: true,
                        status: true,
                        amount: true,
                        currency: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!user) {
            return redirect("/login");
        }

        // Calculate quota status
        const freeExamsRemaining = Math.max(0, 3 - (user.freeExamsUsed || 0));
        const oneTimeExamsRemaining = user.oneTimeExamsRemaining || 0;
        
        // Check if user has active Pro subscription
        const activeSubscription = user.subscriptions[0] || null;
        const isPro = activeSubscription 
            ? new Date() <= activeSubscription.currentPeriodEnd
            : user.planType === "PRO";

        return (
            <BillingClient
                isPro={isPro}
                freeExamsRemaining={freeExamsRemaining}
                oneTimeExamsRemaining={oneTimeExamsRemaining}
                subscription={activeSubscription}
                payments={user.payments}
            />
        );

    } catch (error) {
        console.error("Billing page error:", error);
        
        // Return with minimal data on error
        return (
            <BillingClient
                isPro={false}
                freeExamsRemaining={3}
                oneTimeExamsRemaining={0}
                subscription={null}
                payments={[]}
            />
        );
    }
}
