import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
    FileText, 
    Users, 
    Clock, 
    TrendingUp, 
    Plus,
    Eye,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Activity,
    Shield,
    Award
} from "lucide-react";
import { Prisma } from "@prisma/client";

type RecentAttempt = Prisma.StudentAttemptGetPayload<{
    include: {
        exam: {
            select: {
                title: true
            }
        }
    }
}>;

export default async function DashboardPage() {
    const session = await verifySession();
    if (!session) return redirect("/login");

    // Fetch real statistics
    const [
        totalExams,
        publishedExams,
        draftExams,
        totalQuestions,
        totalAttempts,
        completedAttempts,
        recentAttempts,
        uniqueStudents,
        violationCount
    ] = await Promise.all([
        prisma.exam.count({ where: { teacherId: session.userId } }),
        prisma.exam.count({ where: { teacherId: session.userId, status: 'PUBLISHED' } }),
        prisma.exam.count({ where: { teacherId: session.userId, status: 'DRAFT' } }),
        prisma.question.count({
            where: {
                exam: { teacherId: session.userId }
            }
        }),
        prisma.studentAttempt.count({
            where: {
                exam: { teacherId: session.userId }
            }
        }),
        prisma.studentAttempt.count({
            where: {
                exam: { teacherId: session.userId },
                submitted: true
            }
        }),
        prisma.studentAttempt.findMany({
            where: {
                exam: { teacherId: session.userId },
                submitted: true
            },
            include: {
                exam: {
                    select: { title: true }
                }
            },
            orderBy: { completedAt: 'desc' },
            take: 5
        }),
        prisma.studentAttempt.groupBy({
            by: ['studentName', 'rollNumber'],
            where: {
                exam: { teacherId: session.userId }
            }
        }),
        prisma.studentAttempt.aggregate({
            where: {
                exam: { teacherId: session.userId },
                violations: { gt: 0 }
            },
            _sum: {
                violations: true
            }
        })
    ]);

    const avgScore = completedAttempts > 0
        ? await prisma.studentAttempt.aggregate({
            where: {
                exam: { teacherId: session.userId },
                submitted: true
            },
            _avg: { score: true }
        })
        : { _avg: { score: 0 } };

    const uniqueStudentCount = uniqueStudents.length;
    const totalViolations = violationCount._sum.violations || 0;
    const averageScore = avgScore._avg.score || 0;

    return (
        <div className="flex-1 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Teacher Dashboard</h2>
                    <p className="text-sm sm:text-base text-muted-foreground">Welcome back! Here's what's happening with your exams.</p>
                </div>
                <Link href="/dashboard/exams/create" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Create Exam
                    </Button>
                </Link>
            </div>

            {/* Statistics Grid */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalExams}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-xs">{publishedExams} Published</Badge>
                            <Badge variant="secondary" className="text-xs">{draftExams} Draft</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAttempts}</div>
                        <p className="text-xs text-muted-foreground">
                            {completedAttempts} completed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uniqueStudentCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all exams
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            From {completedAttempts} submissions
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Stats */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalQuestions}</div>
                        <p className="text-xs text-muted-foreground">
                            {totalExams > 0 ? (totalQuestions / totalExams).toFixed(1) : 0} per exam avg
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Anti-Cheat Violations</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalViolations}</div>
                        <p className="text-xs text-muted-foreground">
                            {totalAttempts > 0 ? ((totalViolations / totalAttempts) * 100).toFixed(1) : 0}% violation rate
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalAttempts > 0 ? ((completedAttempts / totalAttempts) * 100).toFixed(1) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {completedAttempts} of {totalAttempts} attempts
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle className="text-lg sm:text-xl">Recent Exam Submissions</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Latest completed attempts from students</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    {recentAttempts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">No submissions yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentAttempts.map((attempt: RecentAttempt) => (
                                <div key={attempt.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium truncate">
                                                {attempt.studentName}
                                            </p>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                ({attempt.rollNumber})
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {attempt.exam.title}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="hidden sm:flex items-center gap-3">
                                            {attempt.violations > 0 && (
                                                <Badge variant="destructive" className="gap-1">
                                                    <Shield className="h-3 w-3" />
                                                    {attempt.violations}
                                                </Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                        
                                        <div className="text-right min-w-[3rem]">
                                            <div className="text-lg font-bold">{attempt.score}%</div>
                                            {attempt.violations > 0 && (
                                                <div className="sm:hidden text-xs text-destructive font-medium">
                                                    ⚠ {attempt.violations}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <Link href={`/dashboard/results/${attempt.examId}`}>
                                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">View details</span>
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                {recentAttempts.length > 0 && (
                    <CardFooter className="px-4 sm:px-6">
                        <Link href="/dashboard/exams" className="w-full">
                            <Button variant="outline" className="w-full">
                                View All Exams & Results
                            </Button>
                        </Link>
                    </CardFooter>
                )}
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                    <Link href="/dashboard/exams/create">
                        <Button variant="outline" className="w-full justify-start h-auto py-4">
                            <Plus className="mr-2 h-4 w-4" />
                            <div className="text-left">
                                <div className="font-medium">Create Exam</div>
                                <div className="text-xs text-muted-foreground">Start a new exam</div>
                            </div>
                        </Button>
                    </Link>
                    <Link href="/dashboard/exams">
                        <Button variant="outline" className="w-full justify-start h-auto py-4">
                            <FileText className="mr-2 h-4 w-4" />
                            <div className="text-left">
                                <div className="font-medium">Manage Exams</div>
                                <div className="text-xs text-muted-foreground">Edit & publish</div>
                            </div>
                        </Button>
                    </Link>
                    <Link href="/dashboard/exams">
                        <Button variant="outline" className="w-full justify-start h-auto py-4">
                            <Activity className="mr-2 h-4 w-4" />
                            <div className="text-left">
                                <div className="font-medium">View Results</div>
                                <div className="text-xs text-muted-foreground">Check submissions</div>
                            </div>
                        </Button>
                    </Link>
                    <Link href="/dashboard/settings">
                        <Button variant="outline" className="w-full justify-start h-auto py-4">
                            <Users className="mr-2 h-4 w-4" />
                            <div className="text-left">
                                <div className="font-medium">Settings</div>
                                <div className="text-xs text-muted-foreground">Account & prefs</div>
                            </div>
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
