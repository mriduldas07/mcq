import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, FileText, Users, BarChart3, Eye, ExternalLink, Copy } from "lucide-react";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Prisma } from "@prisma/client";
import { CopyLinkButton } from "@/components/copy-link-button";

type ExamWithCounts = Prisma.ExamGetPayload<{
    include: {
        _count: {
            select: {
                questions: true;
                attempts: true;
            }
        }
    }
}>;

export default async function ExamsPage() {
    const session = await verifySession();
    if (!session) return redirect("/login");

    const exams = await prisma.exam.findMany({
        where: {
            teacherId: session.userId
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            _count: {
                select: { questions: true, attempts: true }
            }
        }
    });

    // Calculate statistics
    const totalExams = exams.length;
    const publishedExams = exams.filter(e => e.status === 'PUBLISHED').length;
    const draftExams = exams.filter(e => e.status === 'DRAFT').length;
    const totalAttempts = exams.reduce((sum, e) => sum + e._count.attempts, 0);

    return (
        <div className="flex-1 space-y-4 sm:space-y-6 overflow-hidden w-full max-w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Exams</h2>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">Create, manage, and monitor your exams</p>
                </div>
                <Link href="/dashboard/exams/create" className="w-full sm:w-auto">
                    <Button size="default" className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Create New Exam
                    </Button>
                </Link>
            </div>

            {exams.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="mt-6 text-xl font-semibold">Create Your First Exam</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-md">
                        Get started by creating your first exam. Add questions, set duration, and share with students.
                    </p>
                    <Link href="/dashboard/exams/create" className="mt-6">
                        <Button size="lg">
                            <Plus className="mr-2 h-5 w-5" /> Create Exam
                        </Button>
                    </Link>
                </div>
            ) : (
                <>
                    {/* Statistics Overview */}
                    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardContent className="p-4 sm:pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Exams</p>
                                        <p className="text-xl sm:text-2xl font-bold mt-1">{totalExams}</p>
                                    </div>
                                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground flex-shrink-0" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 sm:pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Published</p>
                                        <p className="text-xl sm:text-2xl font-bold mt-1 text-green-600">{publishedExams}</p>
                                    </div>
                                    <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 sm:pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Drafts</p>
                                        <p className="text-xl sm:text-2xl font-bold mt-1 text-orange-600">{draftExams}</p>
                                    </div>
                                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 flex-shrink-0" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 sm:pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Attempts</p>
                                        <p className="text-xl sm:text-2xl font-bold mt-1 text-blue-600">{totalAttempts}</p>
                                    </div>
                                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Exams Grid */}
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {exams.map((exam: ExamWithCounts) => (
                            <Card key={exam.id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden border-2 flex flex-col">
                                <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="line-clamp-1 text-base sm:text-lg break-words">{exam.title}</CardTitle>
                                            <CardDescription className="line-clamp-2 mt-1 sm:mt-1.5 text-xs sm:text-sm">
                                                {exam.description || "No description provided"}
                                            </CardDescription>
                                        </div>
                                        <Badge 
                                            variant={exam.status === 'PUBLISHED' ? 'default' : 'secondary'}
                                            className="shrink-0 text-[10px] sm:text-xs"
                                        >
                                            {exam.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                
                                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 flex-1">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-2 sm:p-3 bg-muted/50 rounded-lg">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5 sm:mb-1">
                                                <FileText className="h-3 w-3" />
                                            </div>
                                            <p className="text-base sm:text-lg font-bold">{exam._count.questions}</p>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground">Questions</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5 sm:mb-1">
                                                <Clock className="h-3 w-3" />
                                            </div>
                                            <p className="text-base sm:text-lg font-bold">{exam.duration}</p>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground">Minutes</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5 sm:mb-1">
                                                <Users className="h-3 w-3" />
                                            </div>
                                            <p className="text-base sm:text-lg font-bold">{exam._count.attempts}</p>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground">Attempts</p>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">Created {exam.createdAt.toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}</span>
                                    </div>
                                </CardContent>

                                <CardFooter className="flex flex-col gap-2 pt-3 sm:pt-4 border-t p-4 sm:p-6">
                                    <div className="flex gap-2 w-full">
                                        <Link href={`/dashboard/exams/${exam.id}`} className="flex-1">
                                            <Button variant="outline" className="w-full text-xs sm:text-sm" size="sm">
                                                <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
                                                <span>Manage</span>
                                            </Button>
                                        </Link>
                                        {exam.status === 'PUBLISHED' && (
                                            <Link href={`/dashboard/results/${exam.id}`} className="flex-1">
                                                <Button className="w-full text-xs sm:text-sm" size="sm">
                                                    <BarChart3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
                                                    <span>Results</span>
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                    {exam.status === 'PUBLISHED' && (
                                        <CopyLinkButton 
                                            examId={exam.id} 
                                            className="w-full"
                                        />
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

