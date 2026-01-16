import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { BillingClient } from "@/components/billing-client";

type Payment = Prisma.PaymentGetPayload<{}>;

export default async function BillingPage() {
    const session = await verifySession();
    if (!session) return redirect("/login");

    let user = null;
    let payments: Payment[] = [];

    try {
        user = await prisma.user.findUnique({
            where: { id: session.userId }
        });

        payments = await prisma.payment.findMany({
            where: { teacherId: session.userId },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
    } catch (e) {
        console.error("Billing Loading Error", e);
    }

    // Calculate quota status
    const freeExamsUsed = user?.freeExamsUsed || 0;
    const freeExamsRemaining = Math.max(0, 3 - freeExamsUsed);
    const oneTimeExamsRemaining = user?.oneTimeExamsRemaining || 0;
    const isPro = user?.planType === "PRO";

    return (
        <BillingClient
            isPro={isPro}
            freeExamsRemaining={freeExamsRemaining}
            oneTimeExamsRemaining={oneTimeExamsRemaining}
            payments={payments}
        />
    );
}
