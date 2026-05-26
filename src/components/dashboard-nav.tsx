"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart, BookOpen, Home, Library } from "lucide-react";

const teacherItems = [
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
];

const studentItems = [
    {
        title: "Overview",
        href: "/dashboard/student",
        icon: Home,
    },
    {
        title: "My Attempts",
        href: "/dashboard/student/attempts",
        icon: BookOpen,
    },
];

export function DashboardNav({ onNavigate, role = "TEACHER" }: { onNavigate?: () => void; role?: string }) {
    const pathname = usePathname();
    const items = role === "STUDENT" ? studentItems : teacherItems;

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
        </nav>
    );
}
