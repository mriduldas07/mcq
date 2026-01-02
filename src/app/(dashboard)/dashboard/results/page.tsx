import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart3, Users, Trophy, TrendingUp, Eye, Clock, CheckCircle2 } from "lucide-react";
import { Prisma } from "@prisma/client";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";

type ExamWithAttempts = Prisma.ExamGetPayload<{
    include: {
        _count: {
            select: {
                attempts: true;
            }
        }
    }
}>;

export default async function ResultsIndexPage() {
    const session = await verifySession();
    if (!session) return redirect("/login");

    let exams: ExamWithAttempts[] = [];
    let totalAttempts = 0;
    let publishedCount = 0;
    
    try {
        exams = await prisma.exam.findMany({
            where: { teacherId: session.userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        attempts: true,
                    }
                }
            }
        });
        
        totalAttempts = await prisma.studentAttempt.count({
            where: { exam: { teacherId: session.userId } }
        });
        
        publishedCount = exams.filter(e => e.status === 'PUBLISHED').length;
    } catch (error) {
        console.error("Error fetching results data:", error);
    }

    return (
        <div className="flex-1 space-y-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-lg bg-linear-to-br from-blue-600 via-purple-600 to-pink-600 p-6 sm:p-8 text-white">
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-size-[30px_30px]"></div>
                <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Results & Analytics</h1>
                            <p className="text-sm sm:text-base text-white/80 mt-1">Track performance and analyze student results</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{exams.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {publishedCount} published
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAttempts}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across all exams
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Attempts</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {exams.length > 0 ? (totalAttempts / exams.length).toFixed(1) : 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Per exam
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Exams Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold">Exam Leaderboards</h2>
                    <Badge variant="secondary" className="text-xs sm:text-sm">
                        {exams.length} {exams.length === 1 ? 'Exam' : 'Exams'}
                    </Badge>
                </div>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {exams.length === 0 ? (
                        <Card className="col-span-full border-2 border-dashed">
                            <CardContent className="pt-12 pb-12 text-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-4 bg-muted rounded-full">
                                        <BarChart3 className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-semibold">No exams yet</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm">
                                            Create and publish exams to see student results and leaderboards here.
                                        </p>
                                    </div>
                                    <Link href="/dashboard/exams/create">
                                        <Button className="mt-2">
                                            Create Your First Exam
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        exams.map((exam) => {
                            const hasAttempts = exam._count.attempts > 0;
                            return (
                                <Card 
                                    key={exam.id} 
                                    className="relative group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-linear-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                    <CardHeader className="relative z-10">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="line-clamp-2 text-base sm:text-lg mb-2">{exam.title}</CardTitle>
                                                <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(exam.createdAt).toLocaleDateString()}
                                                    </span>
                                                </CardDescription>
                                            </div>
                                            <Badge 
                                                variant={exam.status === 'PUBLISHED' ? 'default' : 'secondary'}
                                                className="shrink-0 text-xs"
                                            >
                                                {exam.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="relative z-10 space-y-4">
                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Attempts</p>
                                                <p className="text-lg font-bold flex items-center gap-1">
                                                    <Users className="h-4 w-4 text-primary" />
                                                    {exam._count.attempts}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Duration</p>
                                                <p className="text-lg font-bold flex items-center gap-1">
                                                    <Clock className="h-4 w-4 text-primary" />
                                                    {exam.duration}m
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <Link href={`/dashboard/results/${exam.id}`}>
                                            <Button 
                                                className="w-full group-hover:shadow-lg transition-all" 
                                                variant={hasAttempts ? "default" : "outline"}
                                            >
                                                <Eye className="mr-2 h-4 w-4" />
                                                {hasAttempts ? 'View Leaderboard' : 'View Details'}
                                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </Link>

                                        {!hasAttempts && (
                                            <p className="text-xs text-center text-muted-foreground">
                                                No attempts yet
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
