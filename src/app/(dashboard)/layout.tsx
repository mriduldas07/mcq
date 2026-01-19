import { DashboardNav } from "@/components/dashboard-nav";
import { MobileNav } from "@/components/mobile-nav";
import { UserAccountNav } from "@/components/user-account-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { verifySessionWithDbCheck } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // This validates session AND checks if user exists in DB
    const sessionResult = await verifySessionWithDbCheck();
    
    // Handle different session states
    if (sessionResult.status === "no_session") {
        // Not logged in - redirect to login
        redirect("/login");
    }
    
    if (sessionResult.status === "invalid_session") {
        // Session exists but user not in DB (e.g., after DB reset)
        // Redirect to force sign-out route which will clear cookies and redirect to login
        redirect("/api/auth/force-signout");
    }
    
    // Session is valid
    const session = sessionResult.session;

    // Fetch full user data (we already know user exists from verifySessionWithDbCheck)
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            name: true,
            email: true,
            image: true,
            planType: true,
            freeExamsUsed: true,
            oneTimeExamsRemaining: true,
        },
    });

    if (!user) {
        // This shouldn't happen since verifySessionWithDbCheck already validated
        // But just in case, redirect to force sign-out
        redirect("/api/auth/force-signout");
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
