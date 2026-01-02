"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DashboardNav } from "@/components/dashboard-nav";
import { Button } from "@/components/ui/button";

export function MobileNav() {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch by only rendering Sheet after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // Return a placeholder button during SSR
    if (!mounted) {
        return (
            <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                disabled
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
            </Button>
        );
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="md:hidden"
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[280px]">
                <SheetTitle className="text-lg font-semibold mb-6">Navigation</SheetTitle>
                <div>
                    <DashboardNav onNavigate={() => setOpen(false)} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
