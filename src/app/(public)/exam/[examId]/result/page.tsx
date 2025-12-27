import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle, Circle, Award } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ResultPage({
    params,
    searchParams,
}: {
    params: Promise<{ examId: string }>;
    searchParams: Promise<{ attemptId?: string }>;
}) {
    const { examId } = await params;
    const { attemptId } = await searchParams;

    // TASK 2: Fetch attempt to show student their result
    if (!attemptId) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-4">
                            <XCircle className="h-10 w-10 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl">Invalid Result Link</CardTitle>
                        <CardDescription>
                            No attempt ID provided.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    let attempt = null;
    let exam = null;

    try {
        attempt = await prisma.studentAttempt.findUnique({
            where: { id: attemptId },
            include: {
                exam: {
                    include: {
                        questions: true,
                    },
                },
            },
        });

        if (!attempt || attempt.examId !== examId) {
            return notFound();
        }

        exam = attempt.exam;
    } catch (e) {
        console.error("Error fetching result", e);
        return notFound();
    }

    if (!attempt || !exam) {
        return notFound();
    }

    // TASK 3: Calculate total marks and accuracy
    const totalMarks = exam.questions.reduce((sum, q) => sum + q.marks, 0);
    const percentage = totalMarks > 0 ? Math.round((attempt.score / totalMarks) * 100) : 0;
    const accuracy = attempt.totalQuestions > 0 
        ? Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100) 
        : 0;

    // Calculate rank (optional)
    let rank = null;
    let totalAttempts = 0;
    try {
        const allAttempts = await prisma.studentAttempt.findMany({
            where: { examId },
            orderBy: [
                { score: 'desc' },
                { completedAt: 'asc' }
            ],
            select: { id: true }
        });
        totalAttempts = allAttempts.length;
        rank = allAttempts.findIndex(a => a.id === attemptId) + 1;
    } catch (e) {
        console.error("Error calculating rank", e);
    }

    // Determine pass/fail based on exam's passPercentage setting
    const passPercentage = exam.passPercentage || 50;
    const isPassing = percentage >= passPercentage;

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10 p-4">
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader className="text-center">
                    <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-4 ${
                        isPassing ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                        {isPassing ? (
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        ) : (
                            <XCircle className="h-10 w-10 text-red-600" />
                        )}
                    </div>
                    <CardTitle className="text-2xl">
                        {isPassing ? '🎉 Congratulations! You Passed!' : '😔 You Did Not Pass'}
                    </CardTitle>
                    <CardDescription>
                        {isPassing 
                            ? `You scored ${percentage}% which is above the passing requirement of ${passPercentage}%`
                            : `You scored ${percentage}%. The passing requirement is ${passPercentage}%`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Main Score Display */}
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
                        <p className="text-sm font-medium text-muted-foreground text-center">Your Score</p>
                        <p className="text-5xl font-bold mt-2 text-center">
                            {attempt.score} / {totalMarks}
                        </p>
                        <p className="text-2xl font-semibold text-primary mt-2 text-center">
                            {percentage}%
                        </p>
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-center mb-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <p className="text-2xl font-bold text-green-600">{attempt.correctAnswers}</p>
                            <p className="text-xs text-green-700 mt-1">Correct</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center justify-center mb-2">
                                <XCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <p className="text-2xl font-bold text-red-600">{attempt.wrongAnswers}</p>
                            <p className="text-xs text-red-700 mt-1">Wrong</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-center mb-2">
                                <Circle className="h-5 w-5 text-gray-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-600">{attempt.unanswered}</p>
                            <p className="text-xs text-gray-700 mt-1">Unanswered</p>
                        </div>
                    </div>

                    {/* Pass/Fail Status Badge */}
                    <div className={`p-4 rounded-lg border-2 text-center ${
                        isPassing 
                            ? 'bg-green-50 border-green-300' 
                            : 'bg-red-50 border-red-300'
                    }`}>
                        <p className={`text-sm font-medium ${
                            isPassing ? 'text-green-700' : 'text-red-700'
                        }`}>
                            Result Status
                        </p>
                        <p className={`text-3xl font-bold mt-1 ${
                            isPassing ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {isPassing ? 'PASSED ✓' : 'FAILED ✗'}
                        </p>
                        <p className={`text-xs mt-2 ${
                            isPassing ? 'text-green-600' : 'text-red-600'
                        }`}>
                            Pass mark: {passPercentage}%
                        </p>
                    </div>

                    {/* Additional Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="bg-muted p-3 rounded-lg">
                            <p className="text-muted-foreground">Total Questions</p>
                            <p className="text-xl font-bold mt-1">{attempt.totalQuestions}</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                            <p className="text-muted-foreground">Accuracy</p>
                            <p className="text-xl font-bold mt-1">{accuracy}%</p>
                        </div>
                        {rank && (
                            <>
                                <div className="bg-muted p-3 rounded-lg">
                                    <p className="text-muted-foreground">Your Rank</p>
                                    <p className="text-xl font-bold mt-1">#{rank}</p>
                                </div>
                                <div className="bg-muted p-3 rounded-lg">
                                    <p className="text-muted-foreground">Total Attempts</p>
                                    <p className="text-xl font-bold mt-1">{totalAttempts}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Student Info */}
                    <div className="border-t pt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Student Name:</span>
                            <span className="font-medium">{attempt.studentName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Roll Number:</span>
                            <span className="font-medium">{attempt.rollNumber || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Exam:</span>
                            <span className="font-medium">{exam.title}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Submitted:</span>
                            <span className="font-medium">
                                {attempt.completedAt 
                                    ? new Date(attempt.completedAt).toLocaleString()
                                    : "Just now"}
                            </span>
                        </div>
                        {attempt.trustScore < 100 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Trust Score:</span>
                                <span className={`font-medium ${
                                    attempt.trustScore >= 80 ? 'text-green-600' :
                                    attempt.trustScore >= 60 ? 'text-yellow-600' :
                                    'text-red-600'
                                }`}>
                                    {attempt.trustScore}/100
                                </span>
                            </div>
                        )}
                    </div>

                    <Link href="/">
                        <Button className="w-full">
                            Return to Home
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
