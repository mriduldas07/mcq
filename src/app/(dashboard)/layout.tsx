import { DashboardNav } from "@/components/dashboard-nav";
import { MobileNav } from "@/components/mobile-nav";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 border-b bg-background">
                <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-3 sm:gap-4 md:gap-6 items-center">
                        <MobileNav />
                        <a className="flex items-center font-bold text-base sm:text-lg" href="/">
                            MCQ Platform
                        </a>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline-block">Teacher Account</span>
                    </div>
                </div>
            </header>
            <div className="flex-1 w-full">
                <div className="container px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="grid gap-6 md:grid-cols-[200px_1fr] lg:gap-8">
                        <aside className="hidden w-[200px] flex-col md:flex">
                            <DashboardNav />
                        </aside>
                        <main className="flex w-full flex-1 flex-col min-w-0">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}
