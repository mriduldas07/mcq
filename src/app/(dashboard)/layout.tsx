import { DashboardNav } from "@/components/dashboard-nav";
import { MobileNav } from "@/components/mobile-nav";
import { UserAccountNav } from "@/components/user-account-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await verifySession();
    if (!session) {
        redirect("/login");
    }

    // Fetch user data
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            name: true,
            email: true,
            image: true,
            planType: true,
            credits: true,
        },
    });

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-3 sm:gap-4 md:gap-6 items-center">
                        <MobileNav />
                        <Link className="flex items-center font-bold text-base sm:text-lg hover:opacity-80 transition-opacity" href="/">
                            MCQ Platform
                        </Link>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <ThemeToggle />
                        <UserAccountNav user={user} />
                    </div>
                </div>
            </header>
            <div className="flex-1 w-full overflow-x-hidden">
                <div className="container px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-full">
                    <div className="grid gap-6 md:grid-cols-[200px_1fr] lg:gap-8">
                        <aside className="hidden w-50 flex-col md:flex shrink-0">
                            <DashboardNav />
                        </aside>
                        <main className="flex w-full flex-1 flex-col min-w-0 overflow-hidden">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}
