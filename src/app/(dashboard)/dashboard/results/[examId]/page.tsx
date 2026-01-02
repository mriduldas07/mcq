import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trophy, Target, Users, TrendingUp } from "lucide-react";
import { Prisma } from "@prisma/client";
import { ExamResultsTabs } from "@/components/exam-results-tabs";

type StudentAttempt = Prisma.StudentAttemptGetPayload<{}>;
type Exam = Prisma.ExamGetPayload<{
    include: {
        questions: true;
    }
}>;

export default async function ExamResultsPage({
    params,
}: {
    params: Promise<{ examId: string }>;
}) {
    const { examId } = await params;

    let exam: Exam | null = null;
    let attempts: StudentAttempt[] = [];

    // TASK 4: Enhanced data fetching with proper sorting
    try {
        exam = await prisma.exam.findUnique({ 
            where: { id: examId },
            include: { questions: true }
        });
        
        // Sort by score DESC, then by completedAt ASC (earlier submission wins ties)
        attempts = await prisma.studentAttempt.findMany({
            where: { 
                examId,
                submitted: true // Only show submitted attempts
            },
            orderBy: [
                { score: 'desc' },
                { completedAt: 'asc' }
            ],
        });
    } catch (e) {
        console.error("Error fetching exam results", e);
    }

    if (!exam) return notFound();

    // Calculate statistics
    const totalMarks = exam.questions.reduce((sum, q) => sum + q.marks, 0);
    const totalAttempts = attempts.length;
    const avgScore = totalAttempts > 0 
        ? (attempts.reduce((acc, cur) => acc + cur.score, 0) / totalAttempts)
        : 0;
    const avgPercentage = totalMarks > 0 ? (avgScore / totalMarks) * 100 : 0;
    
    // Pass rate (assuming 40% is passing)
    const passRate = totalAttempts > 0
        ? (attempts.filter(a => (a.score / totalMarks) * 100 >= 40).length / totalAttempts) * 100
        : 0;
    
    // Highest score
    const highestScore = attempts.length > 0 ? attempts[0].score : 0;
    
    // Average accuracy
    const avgAccuracy = totalAttempts > 0
        ? (attempts.reduce((acc, cur) => acc + (cur.totalQuestions > 0 ? (cur.correctAnswers / cur.totalQuestions) * 100 : 0), 0) / totalAttempts)
        : 0;

    // TASK 7: Question-level analytics
    const questionAnalytics = exam.questions.map((question) => {
        let correctCount = 0;
        let attemptedCount = 0;

        attempts.forEach((attempt) => {
            const answers = typeof attempt.answers === 'string' 
                ? JSON.parse(attempt.answers)
                : attempt.answers || {};
            
            if (answers[question.id]) {
                attemptedCount++;
                if (answers[question.id] === question.correctOption) {
                    correctCount++;
                }
            }
        });

        const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;
        const skipRate = totalAttempts > 0 ? ((totalAttempts - attemptedCount) / totalAttempts) * 100 : 0;

        return {
            id: question.id,
            text: question.text,
            marks: question.marks,
            correctCount,
            attemptedCount,
            accuracy,
            skipRate,
            difficulty: accuracy >= 70 ? 'Easy' : accuracy >= 40 ? 'Medium' : 'Hard'
        };
    });

    return (
        <div className="flex-1 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">
                        Results: {exam.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {exam.questions.length} Questions • {totalMarks} Total Marks
                    </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0">
                    <Download className="mr-2 h-4 w-4" /> 
                    <span className="hidden sm:inline">Export CSV</span>
                    <span className="sm:hidden">Export</span>
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAttempts}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totalAttempts === 1 ? 'student' : 'students'} submitted
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {avgScore.toFixed(1)} / {totalMarks}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {avgPercentage.toFixed(1)}% average
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {highestScore} / {totalMarks}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totalMarks > 0 ? ((highestScore / totalMarks) * 100).toFixed(1) : 0}% top score
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{passRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totalAttempts > 0 ? Math.round((passRate / 100) * totalAttempts) : 0} students passed
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for Leaderboard and Question Analytics */}
            <ExamResultsTabs 
                questionAnalytics={questionAnalytics}
                attempts={attempts}
                totalMarks={totalMarks}
                totalAttempts={totalAttempts}
            />
        </div>
    );
}
