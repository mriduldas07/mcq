"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, CreditCard, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { logoutAction } from "@/actions/auth";

interface UserAccountNavProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        planType?: string;
        credits?: number;
    };
}

export function UserAccountNav({ user }: UserAccountNavProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        await logoutAction();
    };

    const handleNavigation = (path: string) => {
        setOpen(false);
        router.push(path);
    };

    // Get initials for avatar fallback
    const initials = user.name
        ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : user.email?.[0]?.toUpperCase() || "U";

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button
                    className="relative h-10 w-10 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all hover:ring-2 hover:ring-primary/50"
                >
                    {user.image ? (
                        <img
                            src={user.image}
                            alt={user.name || "User"}
                            className="h-full w-full rounded-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {initials}
                        </div>
                    )}
                </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                <SheetTitle className="sr-only">Account Menu</SheetTitle>
                <div className="flex flex-col h-full">
                    {/* User Info Section */}
                    <div className="flex flex-col items-center pb-6 border-b">
                        {user.image ? (
                            <img
                                src={user.image}
                                alt={user.name || "User"}
                                className="h-20 w-20 rounded-full object-cover mb-3"
                            />
                        ) : (
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mb-3">
                                {initials}
                            </div>
                        )}
                        <h3 className="font-semibold text-lg">
                            {user.name || "User"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {user.email}
                        </p>

                        {/* Plan Badge */}
                        <div className="mt-3 flex items-center gap-2">
                            {user.planType === "PRO" ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                    ⭐ PRO Plan
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                                    Free Plan
                                </span>
                            )}
                        </div>

                        {/* Credits Display */}
                        {user.planType !== "PRO" && (
                            <div className="mt-2 text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                    {user.credits || 0}
                                </span>{" "}
                                credits available
                            </div>
                        )}
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 py-4">
                        <div className="space-y-1">
                            <button
                                onClick={() => handleNavigation("/dashboard/settings")}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors"
                            >
                                <User className="h-4 w-4" />
                                Account Settings
                            </button>
                            <button
                                onClick={() => handleNavigation("/dashboard/billing")}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors"
                            >
                                <CreditCard className="h-4 w-4" />
                                Billing & Plans
                            </button>
                        </div>
                    </nav>

                    {/* Logout Button */}
                    <div className="border-t pt-4">
                        <form action={handleLogout}>
                            <Button
                                type="submit"
                                variant="ghost"
                                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </form>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
