import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings-client";

export default async function SettingsPage() {
    const session = await verifySession();
    if (!session) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            name: true,
            email: true,
            image: true,
            planType: true,
            credits: true,
            createdAt: true,
        },
    });

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="flex-1 space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>
                <p className="text-muted-foreground mt-2">
                    Manage your profile, subscription, and account preferences.
                </p>
            </div>

            <SettingsClient user={user} />
        </div>
    );
}
