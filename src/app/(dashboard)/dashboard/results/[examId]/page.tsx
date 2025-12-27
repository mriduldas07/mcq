import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trophy, Target, Users, TrendingUp } from "lucide-react";
import { Prisma } from "@prisma/client";

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
        <div className="flex-1 space-y-4 p-4 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Results: {exam.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {exam.questions.length} Questions • {totalMarks} Total Marks
                    </p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

            {/* TASK 7: Question Analytics */}
            {totalAttempts > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Question Analytics</CardTitle>
                        <CardDescription>
                            Performance breakdown by question - helps identify difficult topics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {questionAnalytics.map((q, index) => (
                                <div key={q.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-sm">Q{index + 1}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                                                </Badge>
                                                <Badge 
                                                    variant={
                                                        q.difficulty === 'Easy' ? 'default' :
                                                        q.difficulty === 'Medium' ? 'secondary' :
                                                        'destructive'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {q.difficulty}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {q.text}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Accuracy</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className={`text-2xl font-bold ${
                                                    q.accuracy >= 70 ? 'text-green-600' :
                                                    q.accuracy >= 40 ? 'text-yellow-600' :
                                                    'text-red-600'
                                                }`}>
                                                    {q.accuracy.toFixed(0)}%
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {q.correctCount}/{q.attemptedCount} correct
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <p className="text-xs text-muted-foreground">Attempted</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-2xl font-bold">
                                                    {q.attemptedCount}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    / {totalAttempts} students
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <p className="text-xs text-muted-foreground">Skip Rate</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className={`text-2xl font-bold ${
                                                    q.skipRate > 20 ? 'text-orange-600' : 'text-muted-foreground'
                                                }`}>
                                                    {q.skipRate.toFixed(0)}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Visual progress bar */}
                                    <div className="mt-3">
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all ${
                                                    q.accuracy >= 70 ? 'bg-green-500' :
                                                    q.accuracy >= 40 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                                }`}
                                                style={{ width: `${q.accuracy}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Leaderboard */}
            <Card>
                <CardHeader>
                    <CardTitle>Leaderboard</CardTitle>
                    <CardDescription>
                        Ranked by score (highest first), ties broken by submission time (earlier wins)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {/* Header */}
                        <div className="grid grid-cols-[60px_1fr_120px_100px_100px_120px] gap-2 border-b pb-2 font-medium text-sm text-muted-foreground">
                            <span>Rank</span>
                            <span>Student</span>
                            <span>Score</span>
                            <span>Accuracy</span>
                            <span>Trust</span>
                            <span>Submitted</span>
                        </div>
                        
                        {/* Rows */}
                        {attempts.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No attempts yet.</p>
                                <p className="text-sm mt-1">Results will appear here once students submit.</p>
                            </div>
                        ) : (
                            attempts.map((attempt, index) => {
                                const percentage = totalMarks > 0 ? (attempt.score / totalMarks) * 100 : 0;
                                const accuracy = attempt.totalQuestions > 0 
                                    ? (attempt.correctAnswers / attempt.totalQuestions) * 100 
                                    : 0;
                                const isPassing = percentage >= 40;
                                const isTopThree = index < 3;
                                
                                return (
                                    <div 
                                        key={attempt.id} 
                                        className={`grid grid-cols-[60px_1fr_120px_100px_100px_120px] gap-2 py-3 items-center text-sm border-b last:border-0 hover:bg-muted/50 transition-colors ${
                                            isTopThree ? 'bg-primary/5' : ''
                                        }`}
                                    >
                                        {/* Rank with medals for top 3 */}
                                        <div className="flex items-center gap-1">
                                            <span className={`font-bold text-lg ${
                                                index === 0 ? 'text-yellow-500' :
                                                index === 1 ? 'text-gray-400' :
                                                index === 2 ? 'text-orange-600' :
                                                'text-muted-foreground'
                                            }`}>
                                                {index < 3 ? (
                                                    <Trophy className="h-5 w-5" />
                                                ) : (
                                                    `#${index + 1}`
                                                )}
                                            </span>
                                        </div>
                                        
                                        {/* Student name and roll */}
                                        <div>
                                            <div className="font-medium">{attempt.studentName}</div>
                                            {attempt.rollNumber && (
                                                <div className="text-xs text-muted-foreground">{attempt.rollNumber}</div>
                                            )}
                                        </div>
                                        
                                        {/* Score with badge */}
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{attempt.score}/{totalMarks}</span>
                                            <Badge variant={isPassing ? "default" : "secondary"} className="text-xs">
                                                {percentage.toFixed(0)}%
                                            </Badge>
                                        </div>
                                        
                                        {/* Accuracy */}
                                        <span className="text-muted-foreground">
                                            {accuracy.toFixed(0)}%
                                            <span className="text-xs ml-1">
                                                ({attempt.correctAnswers}/{attempt.totalQuestions})
                                            </span>
                                        </span>
                                        
                                        {/* Trust Score */}
                                        <Badge 
                                            variant="outline" 
                                            className={`${
                                                attempt.trustScore >= 90 ? 'border-green-500 text-green-700' :
                                                attempt.trustScore >= 70 ? 'border-yellow-500 text-yellow-700' :
                                                'border-red-500 text-red-700'
                                            }`}
                                        >
                                            {attempt.trustScore}%
                                        </Badge>
                                        
                                        {/* Date */}
                                        <span className="text-xs text-muted-foreground">
                                            {attempt.completedAt 
                                                ? new Date(attempt.completedAt).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                                : 'N/A'}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
