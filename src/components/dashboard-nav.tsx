"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart, BookOpen, CreditCard, Home, Settings, Library } from "lucide-react";
import { logoutAction } from "@/actions/auth";

const items = [
    {
        title: "Overview",
        href: "/dashboard",
        icon: Home,
    },
    {
        title: "Exams",
        href: "/dashboard/exams",
        icon: BookOpen,
    },
    {
        title: "Question Bank",
        href: "/dashboard/question-bank",
        icon: Library,
    },
    {
        title: "Results",
        href: "/dashboard/results",
        icon: BarChart,
    },
    {
        title: "Billing",
        href: "/dashboard/billing",
        icon: CreditCard,
    },
    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
];

export function DashboardNav({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();

    return (
        <nav className="grid items-start gap-2">
            {items.map((item, index) => {
                const Icon = item.icon;
                return (
                    <Link
                        key={index}
                        href={item.href}
                        onClick={onNavigate}
                    >
                        <span
                            className={cn(
                                "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
                            )}
                        >
                            <Icon className="mr-2 h-4 w-4" />
                            <span>{item.title}</span>
                        </span>
                    </Link>
                );
            })}

            <form action={logoutAction}>
                <button 
                    type="submit"
                    onClick={onNavigate}
                    className="w-full text-left group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-red-100 text-red-600"
                >
                    <span className="mr-2">🚪</span> Logout
                </button>
            </form>
        </nav>
    );
}
