"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Clock, 
    FileText, 
    Target, 
    TrendingUp,
    BarChart3,
    CheckCircle2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Question {
    marks: number;
    difficulty?: string;
    subject?: string;
    topic?: string;
}

interface ExamBlueprintProps {
    questions: Question[];
    duration: number;
    passPercentage: number;
    title?: string;
}

export function ExamBlueprint({
    questions,
    duration,
    passPercentage,
    title = "Exam Blueprint"
}: ExamBlueprintProps) {
    // Calculate statistics
    const totalQuestions = questions.length;
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    const avgMarksPerQuestion = totalQuestions > 0 ? (totalMarks / totalQuestions).toFixed(1) : 0;
    const estimatedTimePerQuestion = totalQuestions > 0 ? Math.round((duration * 60) / totalQuestions) : 0;

    // Difficulty distribution
    const difficultyCount = questions.reduce((acc, q) => {
        const diff = q.difficulty || "MEDIUM";
        acc[diff] = (acc[diff] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const easyCount = difficultyCount["EASY"] || 0;
    const mediumCount = difficultyCount["MEDIUM"] || 0;
    const hardCount = difficultyCount["HARD"] || 0;

    const easyPercent = totalQuestions > 0 ? (easyCount / totalQuestions) * 100 : 0;
    const mediumPercent = totalQuestions > 0 ? (mediumCount / totalQuestions) * 100 : 0;
    const hardPercent = totalQuestions > 0 ? (hardCount / totalQuestions) * 100 : 0;

    // Subject distribution
    const subjectCount = questions.reduce((acc, q) => {
        if (q.subject) {
            acc[q.subject] = (acc[q.subject] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const subjects = Object.entries(subjectCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalQuestions}</p>
                            <p className="text-xs text-muted-foreground">Questions</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                            <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalMarks}</p>
                            <p className="text-xs text-muted-foreground">Total Marks</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                        <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                            <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{duration}</p>
                            <p className="text-xs text-muted-foreground">Minutes</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                        <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                            <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{passPercentage}%</p>
                            <p className="text-xs text-muted-foreground">Pass Mark</p>
                        </div>
                    </div>
                </div>

                {/* Difficulty Distribution */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Difficulty Distribution
                    </h4>
                    
                    {totalQuestions > 0 ? (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Easy</span>
                                    <span className="font-medium">{easyCount} ({easyPercent.toFixed(0)}%)</span>
                                </div>
                                <Progress value={easyPercent} className="h-2 bg-green-100 dark:bg-green-950">
                                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${easyPercent}%` }} />
                                </Progress>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Medium</span>
                                    <span className="font-medium">{mediumCount} ({mediumPercent.toFixed(0)}%)</span>
                                </div>
                                <Progress value={mediumPercent} className="h-2 bg-amber-100 dark:bg-amber-950">
                                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${mediumPercent}%` }} />
                                </Progress>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Hard</span>
                                    <span className="font-medium">{hardCount} ({hardPercent.toFixed(0)}%)</span>
                                </div>
                                <Progress value={hardPercent} className="h-2 bg-red-100 dark:bg-red-950">
                                    <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${hardPercent}%` }} />
                                </Progress>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No questions added yet</p>
                    )}
                </div>

                {/* Additional Stats */}
                <div className="space-y-2 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg. marks/question</span>
                        <span className="font-medium">{avgMarksPerQuestion}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Est. time/question</span>
                        <span className="font-medium">{estimatedTimePerQuestion}s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pass marks required</span>
                        <span className="font-medium">{Math.ceil((totalMarks * passPercentage) / 100)}/{totalMarks}</span>
                    </div>
                </div>

                {/* Subject Coverage (if available) */}
                {subjects.length > 0 && (
                    <div className="space-y-2 pt-3 border-t">
                        <h4 className="font-semibold text-sm">Subject Coverage</h4>
                        <div className="flex flex-wrap gap-2">
                            {subjects.map(([subject, count]) => (
                                <Badge key={subject} variant="secondary" className="text-xs">
                                    {subject} ({count})
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Exam Readiness Indicator */}
                {totalQuestions > 0 && (
                    <div className="pt-3 border-t">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <div className="flex-1">
                                <p className="font-medium text-sm text-green-900 dark:text-green-100">Exam Ready</p>
                                <p className="text-xs text-green-700 dark:text-green-300">
                                    {totalQuestions} {totalQuestions === 1 ? 'question' : 'questions'} configured
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
