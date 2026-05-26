import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    Award,
    Calendar,
    Clock,
    Eye,
    FileText,
    GraduationCap,
    History,
    Shield,
    TrendingUp
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentAttemptsListPage() {
    const session = await verifySession();
    if (!session) return redirect("/login");

    // Fetch all attempts for the current student
    const attempts = await prisma.studentAttempt.findMany({
        where: { studentId: session.userId },
        include: {
            exam: {
                select: {
                    title: true,
                    duration: true,
                    passPercentage: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' },
    });

    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.submitted);
    const passedAttempts = completedAttempts.filter(a => a.score >= (a.exam?.passPercentage || 50));

    return (
        <div className="flex-1 space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <History className="h-6 w-6 text-indigo-600 sm:h-7 sm:w-7" /> Attempt History
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Inspect every single one of your completed exam sheets, marks, and proctoring records.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="border-indigo-200 bg-indigo-50/50 text-indigo-700 px-3 py-1 font-bold text-xs uppercase dark:bg-indigo-950/20 dark:text-indigo-400">
                        {totalAttempts} Total Attempts
                    </Badge>
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50/50 text-emerald-700 px-3 py-1 font-bold text-xs uppercase dark:bg-emerald-950/20 dark:text-emerald-400">
                        {passedAttempts.length} Passed
                    </Badge>
                </div>
            </div>

            {/* List Table Card */}
            <Card className="shadow-sm border-muted/60 overflow-hidden">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base sm:text-lg">All Registered Sessions</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Click review on any submitted attempt to see a detailed question-by-question diagnostic</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {attempts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                            <GraduationCap className="h-14 w-14 text-muted-foreground/60 mb-3 animate-pulse" />
                            <h3 className="font-bold text-base text-foreground">No History Found</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-[280px] mt-1 leading-relaxed">
                                You haven't taken any exams on this account yet. Shared exams will link here automatically when you sign in.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto w-full">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-y bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        <th className="p-4 pl-6">Exam Title</th>
                                        <th className="p-4 hidden md:table-cell">Date Attempted</th>
                                        <th className="p-4 hidden sm:table-cell">Duration</th>
                                        <th className="p-4 text-center">Infractions</th>
                                        <th className="p-4 text-right">Score</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 pr-6 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {attempts.map((attempt) => {
                                        const isPassed = attempt.score >= (attempt.exam?.passPercentage || 50);
                                        const formattedDate = attempt.createdAt 
                                            ? new Date(attempt.createdAt).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                              })
                                            : 'N/A';

                                        return (
                                            <tr key={attempt.id} className="hover:bg-accent/40 transition-colors">
                                                {/* Title */}
                                                <td className="p-4 pl-6 font-semibold max-w-[200px] truncate">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        <span className="truncate">{attempt.exam?.title || "Exam"}</span>
                                                    </div>
                                                </td>

                                                {/* Date */}
                                                <td className="p-4 text-muted-foreground hidden md:table-cell">
                                                    <div className="flex items-center gap-1.5 font-medium text-xs">
                                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {formattedDate}
                                                    </div>
                                                </td>

                                                {/* Duration */}
                                                <td className="p-4 text-muted-foreground hidden sm:table-cell">
                                                    <div className="flex items-center gap-1.5 font-medium text-xs">
                                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" /> {attempt.exam?.duration} Mins
                                                    </div>
                                                </td>

                                                {/* Infractions */}
                                                <td className="p-4 text-center">
                                                    {attempt.violations > 0 ? (
                                                        <Badge variant="destructive" className="gap-1 font-bold text-[10px] py-0 px-2 uppercase shrink-0">
                                                            <Shield className="h-3 w-3" /> {attempt.violations} Violation{attempt.violations !== 1 ? 's' : ''}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-teal-600 font-bold uppercase tracking-wide">Clean</span>
                                                    )}
                                                </td>

                                                {/* Score */}
                                                <td className="p-4 text-right font-extrabold text-base">
                                                    {attempt.submitted ? (
                                                        <span className={isPassed ? 'text-emerald-600' : 'text-destructive'}>
                                                            {attempt.score}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground font-normal">--</span>
                                                    )}
                                                </td>

                                                {/* Status Badge */}
                                                <td className="p-4 text-center">
                                                    {attempt.submitted ? (
                                                        <Badge variant="outline" className={`font-bold text-[10px] tracking-wider uppercase py-0.5 px-2 ${
                                                            isPassed 
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                                                                : 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                                                        }`}>
                                                            {isPassed ? "Pass" : "Fail"}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="font-bold text-[10px] tracking-wider uppercase py-0.5 px-2">
                                                            Resumable
                                                        </Badge>
                                                    )}
                                                </td>

                                                {/* Action review button */}
                                                <td className="p-4 pr-6 text-center">
                                                    <Link href={attempt.submitted ? `/dashboard/student/attempts/${attempt.id}` : `/exam/${attempt.examId}/start`}>
                                                        <Button variant="outline" size="sm" className="h-8 font-semibold border-muted hover:border-indigo-200 hover:bg-indigo-50/20 hover:text-indigo-700">
                                                            {attempt.submitted ? (
                                                                <>
                                                                    <Eye className="mr-1.5 h-3.5 w-3.5" /> Review
                                                                </>
                                                            ) : (
                                                                "Resume"
                                                            )}
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
