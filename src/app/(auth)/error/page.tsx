"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

function ErrorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const error = searchParams.get("error");

    // Auto-redirect to login for OAuth errors (invalid_grant, code verifier issues)
    // These are usually caused by stale browser state and can be fixed by re-authenticating
    useEffect(() => {
        if (error === "Configuration" || error === "OAuthCallback") {
            // Wait 2 seconds to show the message, then auto-redirect
            const timeout = setTimeout(() => {
                router.push("/login");
            }, 2000);
            
            return () => clearTimeout(timeout);
        }
    }, [error, router]);

    const getErrorMessage = () => {
        switch (error) {
            case "Configuration":
                return {
                    title: "Authentication Issue",
                    message: "There was a temporary issue with the authentication process. Redirecting you to try again...",
                    autoRedirect: true,
                };
            case "OAuthCallback":
                return {
                    title: "Session Expired",
                    message: "Your authentication session expired. Redirecting you to sign in again...",
                    autoRedirect: true,
                };
            case "AccessDenied":
                return {
                    title: "Access Denied",
                    message: "You cancelled the sign-in process or denied access.",
                    autoRedirect: false,
                };
            case "Verification":
                return {
                    title: "Verification Failed",
                    message: "The sign-in link is no longer valid or has already been used.",
                    autoRedirect: false,
                };
            default:
                return {
                    title: "Authentication Error",
                    message: "An unexpected error occurred during sign-in.",
                    autoRedirect: false,
                };
        }
    };

    const errorInfo = getErrorMessage();

    return (
        <div className="min-h-screen max-w-full overflow-x-hidden flex flex-col">
            {/* Simple Header */}
            <header className="absolute top-0 left-0 right-0 z-50 px-6 py-6 flex items-center justify-between">
                <Link className="flex items-center gap-2 group" href="/">
                    <div className="h-10 w-10 rounded-xl bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
                        M
                    </div>
                    <span className="font-bold text-xl bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MCQ Platform</span>
                </Link>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="text-sm">← Back to Home</Button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                {/* Subtle Background */}
                <div className="absolute inset-0 overflow-hidden bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                    <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 animate-blob" />
                    <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
                    <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500/10 dark:bg-pink-500/5 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
                </div>

                {/* Centered Error Card */}
                <div className="relative w-full max-w-md z-10">
                    <div className="relative">
                        {/* Card */}
                        <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                            {/* Top gradient bar - orange/red for error */}
                            <div className="h-2 bg-linear-to-r from-orange-500 via-red-500 to-pink-500" />
                            
                            <div className="p-8 sm:p-10 space-y-6">
                                {/* Icon */}
                                <div className="text-center space-y-3">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-orange-500 via-red-500 to-pink-500 shadow-xl mb-2">
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            className="h-8 w-8 text-white" 
                                            viewBox="0 0 20 20" 
                                            fill="currentColor"
                                        >
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                                        {errorInfo.title}
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        {errorInfo.message}
                                    </p>
                                </div>

                                {/* Auto-redirect indicator */}
                                {errorInfo.autoRedirect && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Redirecting in 2 seconds...</span>
                                    </div>
                                )}

                                {/* Manual action button */}
                                <Link href="/login">
                                    <Button 
                                        className="w-full h-12 text-base font-semibold bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                        {errorInfo.autoRedirect ? "Go to Login Now" : "Try Again"}
                                    </Button>
                                </Link>

                                {/* Help text */}
                                <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                                    <p>Still having issues?</p>
                                    <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                                        Contact support
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Minimal Footer */}
            <footer className="absolute bottom-0 left-0 right-0 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                    © 2026 MCQ Platform. All rights reserved.
                </p>
            </footer>

            <style jsx global>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}

// Export the page with Suspense wrapper (required for useSearchParams)
export default function ErrorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ErrorContent />
        </Suspense>
    );
}
