import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, FileText } from "lucide-react";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Prisma } from "@prisma/client";

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

    return (
        <div className="flex-1 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Exams</h2>
                    <p className="text-sm sm:text-base text-muted-foreground">Manage your exams and view results here.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Link href="/dashboard/exams/create" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" /> Create Exam
                        </Button>
                    </Link>
                </div>
            </div>

            {exams.length === 0 ? (
                <div className="flex min-h-[300px] sm:min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-6 sm:p-8 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-muted">
                        <Plus className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-base sm:text-lg font-semibold">No exams created</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                        You haven&apos;t created any exams yet. Start by creating one.
                    </p>
                    <Link href="/dashboard/exams/create" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-auto">
                            Create your first exam
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {exams.map((exam: ExamWithCounts) => (
                        <Card key={exam.id} className="flex flex-col hover:shadow-md transition-shadow">
                            <CardHeader className="space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <CardTitle className="line-clamp-1 text-base sm:text-lg">{exam.title}</CardTitle>
                                        <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                                            {exam.description || "No description"}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={exam.status === 'PUBLISHED' ? 'default' : 'secondary'} className="text-xs shrink-0">
                                        {exam.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 grid gap-2 sm:gap-3">
                                <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                                    <Clock className="mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                    {exam.duration} mins
                                </div>
                                <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                                    <FileText className="mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                    {exam._count.questions} Questions
                                </div>
                                <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                                    <Calendar className="mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                    {exam.createdAt.toLocaleDateString()}
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Link href={`/dashboard/exams/${exam.id}`} className="flex-1">
                                    <Button variant="outline" className="w-full text-xs sm:text-sm">Manage</Button>
                                </Link>
                                {exam.status === 'PUBLISHED' && (
                                    <Link href={`/dashboard/results/${exam.id}`}>
                                        <Button variant="default" size="sm" className="text-xs sm:text-sm">Results</Button>
                                    </Link>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

