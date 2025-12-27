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
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Exams</h2>
                    <p className="text-muted-foreground">Manage your exams and view results here.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Link href="/dashboard/exams/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Exam
                        </Button>
                    </Link>
                </div>
            </div>

            {exams.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                        <Plus className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No exams created</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        You haven&apos;t created any exams yet. Start by creating one.
                    </p>
                    <Link href="/dashboard/exams/create">
                        <Button variant="outline">
                            Create your first exam
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {exams.map((exam: ExamWithCounts) => (
                        <Card key={exam.id} className="flex flex-col hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="line-clamp-1">{exam.title}</CardTitle>
                                        <CardDescription className="line-clamp-1">
                                            {exam.description || "No description"}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={exam.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                                        {exam.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 grid gap-4">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Clock className="mr-2 h-4 w-4" />
                                    {exam.duration} mins
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <FileText className="mr-2 h-4 w-4" />
                                    {exam._count.questions} Questions
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {exam.createdAt.toLocaleDateString()}
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Link href={`/dashboard/exams/${exam.id}`} className="flex-1">
                                    <Button variant="outline" className="w-full">Manage</Button>
                                </Link>
                                {exam.status === 'PUBLISHED' && (
                                    <Link href={`/dashboard/results/${exam.id}`}>
                                        <Button variant="default" size="sm">Results</Button>
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

