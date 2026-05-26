import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    Activity,
    Award,
    BookOpen,
    CheckCircle2,
    Clock,
    Eye,
    GraduationCap,
    ShieldAlert,
    TrendingUp
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
    const session = await verifySession();
    if (!session) return redirect("/login");

    // Fetch student attempts
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

    const completedAttempts = attempts.filter(a => a.submitted);
    const totalAttemptsCount = attempts.length;
    const completedAttemptsCount = completedAttempts.length;

    // Stat Calculations
    const totalScore = completedAttempts.reduce((acc, curr) => acc + curr.score, 0);
    const averageScore = completedAttemptsCount > 0 ? totalScore / completedAttemptsCount : 0;

    const passedAttempts = completedAttempts.filter(a => a.score >= (a.exam?.passPercentage || 50));
    const passRate = completedAttemptsCount > 0 ? (passedAttempts.length / completedAttemptsCount) * 100 : 0;

    const totalCorrect = completedAttempts.reduce((acc, curr) => acc + curr.correctAnswers, 0);
    const totalQuestionsCount = completedAttempts.reduce((acc, curr) => acc + curr.totalQuestions, 0);
    const averageAccuracy = totalQuestionsCount > 0 ? (totalCorrect / totalQuestionsCount) * 100 : 0;

    const totalViolations = completedAttempts.reduce((acc, curr) => acc + curr.violations, 0);
    const avgTrustScore = completedAttemptsCount > 0 
        ? completedAttempts.reduce((acc, curr) => acc + curr.trustScore, 0) / completedAttemptsCount 
        : 100;

    // Sparkline Trend calculations (SVG area plot)
    const trendAttempts = [...completedAttempts].reverse().slice(-10); // Last 10 attempts chronologically
    const hasTrend = trendAttempts.length >= 2;
    
    let svgPath = "";
    let svgAreaPath = "";
    let sparklinePoints: { x: number; y: number; score: number; label: string }[] = [];

    if (hasTrend) {
        const width = 500;
        const height = 120;
        const paddingX = 30;
        const paddingY = 15;
        
        const stepX = (width - paddingX * 2) / (trendAttempts.length - 1);
        
        sparklinePoints = trendAttempts.map((attempt, idx) => {
            const x = paddingX + idx * stepX;
            // Scale score (0-100) to height
            const y = height - paddingY - (attempt.score / 100) * (height - paddingY * 2);
            return { x, y, score: attempt.score, label: attempt.exam?.title || "Exam" };
        });

        svgPath = `M ${sparklinePoints[0].x} ${sparklinePoints[0].y} ` + 
            sparklinePoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");

        svgAreaPath = `${svgPath} L ${sparklinePoints[sparklinePoints.length - 1].x} ${height} L ${sparklinePoints[0].x} ${height} Z`;
    }

    return (
        <div className="flex-1 space-y-6">
            {/* Top Row Welcome Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg border border-primary/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                            <GraduationCap className="h-3.5 w-3.5" /> Student Workspace
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Welcome back, {session.name || "Student"}!
                        </h1>
                        <p className="text-indigo-100 text-sm max-w-xl">
                            Track your academic journey, view proctored attempt analytics, and inspect detailed reviews of your past answers.
                        </p>
                    </div>
                    <Link href="/dashboard/student/attempts">
                        <Button size="lg" variant="secondary" className="font-semibold shadow-md shrink-0 bg-white text-indigo-700 hover:bg-indigo-50">
                            <BookOpen className="mr-2 h-4 w-4" /> View All Attempts
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Core Statistics Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm border-muted/60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Exams Taken</CardTitle>
                        <Activity className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAttemptsCount}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-[10px]">{completedAttemptsCount} Completed</Badge>
                            {totalAttemptsCount - completedAttemptsCount > 0 && (
                                <Badge variant="secondary" className="text-[10px]">{totalAttemptsCount - completedAttemptsCount} In Progress</Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-muted/60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <Award className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{averageScore.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across all scored attempts
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-muted/60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{passRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {passedAttempts.length} of {completedAttemptsCount} passed
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-muted/60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Integrity Score</CardTitle>
                        <ShieldAlert className={avgTrustScore >= 80 ? "h-4 w-4 text-teal-600" : "h-4 w-4 text-amber-600"} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${
                            avgTrustScore >= 90 ? 'text-teal-600' :
                            avgTrustScore >= 70 ? 'text-amber-600' :
                            'text-destructive'
                        }`}>
                            {avgTrustScore.toFixed(0)}/100
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totalViolations} proctor infractions recorded
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Sparkline & Details Block */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Visual Trends Chart */}
                <Card className="md:col-span-2 shadow-sm border-muted/60 flex flex-col justify-between">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-indigo-600" /> Performance Trends
                        </CardTitle>
                        <CardDescription>Visual timeline of your score history (up to last 10 completed attempts)</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center min-h-[160px] pb-4">
                        {hasTrend ? (
                            <div className="w-full space-y-3">
                                <div className="relative w-full h-[120px] bg-muted/20 border border-muted/40 rounded-xl overflow-hidden">
                                    <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.4" />
                                                <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.0" />
                                            </linearGradient>
                                        </defs>
                                        {/* Filled Area */}
                                        <path d={svgAreaPath} fill="url(#chartGradient)" />
                                        {/* Connecting Line */}
                                        <path d={svgPath} fill="none" stroke="rgb(79, 70, 229)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                        
                                        {/* Interactive Tooltip-style dots */}
                                        {sparklinePoints.map((pt, idx) => (
                                            <g key={idx} className="group/dot cursor-pointer">
                                                <circle cx={pt.x} cy={pt.y} r="5" fill="rgb(79, 70, 229)" stroke="white" strokeWidth="2" />
                                                <circle cx={pt.x} cy={pt.y} r="8" fill="rgb(79, 70, 229)" fillOpacity="0.2" className="opacity-0 group-hover/dot:opacity-100 transition-opacity" />
                                            </g>
                                        ))}
                                    </svg>
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground px-2">
                                    <span>Older Attempts</span>
                                    <span>Latest Attempt ({trendAttempts[trendAttempts.length - 1].score}%)</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Activity className="h-10 w-10 text-muted-foreground/60 mx-auto mb-2 animate-pulse" />
                                <p className="text-sm text-muted-foreground font-medium">Complete at least 2 exams to see visual trend reports</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Accuracy Card */}
                <Card className="shadow-sm border-muted/60 flex flex-col justify-between">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-indigo-600" /> Answer Accuracy
                        </CardTitle>
                        <CardDescription>Accuracy metrics across all questions</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center p-6 pb-8 text-center space-y-4">
                        <div className="relative flex items-center justify-center w-28 h-28">
                            {/* SVG Radial Progress */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="56" cy="56" r="48" stroke="rgb(243, 244, 246)" strokeWidth="8" fill="transparent" />
                                <circle cx="56" cy="56" r="48" stroke="rgb(79, 70, 229)" strokeWidth="8" fill="transparent"
                                    strokeDasharray={2 * Math.PI * 48}
                                    strokeDashoffset={2 * Math.PI * 48 * (1 - (averageAccuracy / 100))}
                                    strokeLinecap="round" />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-2xl font-extrabold text-indigo-600">{averageAccuracy.toFixed(0)}%</span>
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Correct</span>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground font-medium max-w-[200px]">
                            You have answered <span className="font-semibold text-foreground">{totalCorrect}</span> questions correctly out of <span className="font-semibold text-foreground">{totalQuestionsCount}</span> total questions attempted.
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Exam Submissions */}
            <Card className="shadow-sm border-muted/60">
                <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-indigo-600" /> Recent Exam Attempts
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Inspect your latest submittals and their detailed grade profiles</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    {attempts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-xl">
                            <GraduationCap className="h-12 w-12 text-muted-foreground/60 mb-3 animate-pulse" />
                            <h3 className="font-bold text-sm text-foreground">No Attempts Registered</h3>
                            <p className="text-xs text-muted-foreground max-w-[240px] mt-1 leading-relaxed">
                                Once you start and submit published exams, your results and audit analytics will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {attempts.slice(0, 5).map((attempt) => (
                                <div key={attempt.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-muted/60 hover:bg-accent/40 hover:border-indigo-100 transition-all">
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-foreground truncate">
                                                {attempt.exam?.title || "Exam"}
                                            </p>
                                            <Badge variant={attempt.submitted ? "default" : "secondary"} className="text-[10px] py-0 px-1.5 uppercase font-bold">
                                                {attempt.submitted ? "Submitted" : "Pending"}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground" /> {attempt.exam?.duration} Mins
                                            </span>
                                            <span>•</span>
                                            <span>{attempt.totalQuestions} Questions</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="text-right">
                                            {attempt.submitted ? (
                                                <>
                                                    <div className="text-base sm:text-lg font-bold text-foreground">{attempt.score}%</div>
                                                    <Badge variant={attempt.score >= (attempt.exam?.passPercentage || 50) ? "outline" : "destructive"} className={`text-[10px] font-bold py-0.5 border ${
                                                        attempt.score >= (attempt.exam?.passPercentage || 50) ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : ''
                                                    }`}>
                                                        {attempt.score >= (attempt.exam?.passPercentage || 50) ? "PASS" : "FAIL"}
                                                    </Badge>
                                                </>
                                            ) : (
                                                <span className="text-xs text-muted-foreground font-semibold">Resumable</span>
                                            )}
                                        </div>

                                        <Link href={attempt.submitted ? `/dashboard/student/attempts/${attempt.id}` : `/exam/${attempt.examId}/start`}>
                                            <Button variant="outline" size="sm" className="h-9 font-semibold border-muted hover:border-indigo-200 hover:bg-indigo-50/20 hover:text-indigo-700">
                                                {attempt.submitted ? (
                                                    <>
                                                        <Eye className="mr-1.5 h-4 w-4" /> Review
                                                    </>
                                                ) : (
                                                    "Resume"
                                                )}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                {attempts.length > 5 && (
                    <CardFooter className="px-4 sm:px-6">
                        <Link href="/dashboard/student/attempts" className="w-full">
                            <Button variant="outline" className="w-full font-semibold border-muted">
                                View Full Attempt History
                            </Button>
                        </Link>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
