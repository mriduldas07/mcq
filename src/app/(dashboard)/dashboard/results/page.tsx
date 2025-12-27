import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Prisma } from "@prisma/client";

type Exam = Prisma.ExamGetPayload<{}>;

export default async function ResultsIndexPage() {
    let exams: Exam[] = [];
    try {
        exams = await prisma.exam.findMany({
            orderBy: { createdAt: 'desc' }, // Should filter by teacher in real auth
        });
    } catch { }

    return (
        <div className="flex-1 space-y-4 p-4 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Results</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {exams.length === 0 ? (
                    <Card className="col-span-full border-dashed p-8">
                        <div className="text-center text-muted-foreground">
                            No exams found. Create an exam first.
                        </div>
                    </Card>
                ) : (
                    exams.map((exam) => (
                        <Card key={exam.id} className="hover:border-primary transition-colors">
                            <CardHeader>
                                <CardTitle>{exam.title}</CardTitle>
                                <CardDescription>
                                    Started {new Date(exam.createdAt).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href={`/dashboard/results/${exam.id}`}>
                                    <Button className="w-full">
                                        View Leaderboard <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
