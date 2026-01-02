"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Shield, BarChart3 } from "lucide-react";

interface QuestionAnalytic {
    id: string;
    text: string;
    marks: number;
    correctCount: number;
    attemptedCount: number;
    accuracy: number;
    skipRate: number;
    difficulty: string;
}

interface StudentAttempt {
    id: string;
    studentName: string;
    rollNumber: string | null;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    trustScore: number;
    completedAt: Date | null;
}

interface ExamResultsTabsProps {
    questionAnalytics: QuestionAnalytic[];
    attempts: StudentAttempt[];
    totalMarks: number;
    totalAttempts: number;
}

export function ExamResultsTabs({ 
    questionAnalytics, 
    attempts, 
    totalMarks, 
    totalAttempts 
}: ExamResultsTabsProps) {
    const [activeTab, setActiveTab] = useState<"leaderboard" | "analytics">("leaderboard");

    return (
        <div className="space-y-4">
            {/* Tabs Header */}
            <div className="border-b">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab("leaderboard")}
                        className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative ${
                            activeTab === "leaderboard"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Trophy className="h-4 w-4" />
                        <span>Leaderboard</span>
                        {activeTab === "leaderboard" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("analytics")}
                        className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative ${
                            activeTab === "analytics"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <BarChart3 className="h-4 w-4" />
                        <span>Question Analysis</span>
                        {activeTab === "analytics" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-100">
                {activeTab === "leaderboard" ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5" />
                                Leaderboard
                            </CardTitle>
                            <CardDescription>
                                Ranked by score (highest first), ties broken by submission time
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6">
                            {attempts.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>No attempts yet.</p>
                                    <p className="text-sm mt-1">Results will appear here once students submit.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {attempts.map((attempt, index) => {
                                        const percentage = totalMarks > 0 ? (attempt.score / totalMarks) * 100 : 0;
                                        const accuracy = attempt.totalQuestions > 0 
                                            ? (attempt.correctAnswers / attempt.totalQuestions) * 100 
                                            : 0;
                                        
                                        return (
                                            <div 
                                                key={attempt.id} 
                                                className="group flex items-center gap-3 sm:gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-200"
                                            >
                                                {/* Rank */}
                                                <div className="flex items-center justify-center w-10 h-10 shrink-0">
                                                    {index < 3 ? (
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base ${
                                                            index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                            index === 1 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                                                            'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                        }`}>
                                                            {index + 1}
                                                        </div>
                                                    ) : (
                                                        <span className="text-lg font-semibold text-muted-foreground">
                                                            {index + 1}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* Student Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-sm sm:text-base truncate">
                                                            {attempt.studentName}
                                                        </h4>
                                                        {attempt.rollNumber && (
                                                            <span className="text-xs text-muted-foreground">
                                                                ({attempt.rollNumber})
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Metrics Row */}
                                                    <div className="flex items-center gap-3 flex-wrap text-xs">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-muted-foreground">Accuracy:</span>
                                                            <span className="font-medium">{accuracy.toFixed(0)}%</span>
                                                        </div>
                                                        <div className="hidden sm:block h-3 w-px bg-border" />
                                                        <div className={`flex items-center gap-1.5 ${
                                                            attempt.trustScore >= 90 ? 'text-green-600 dark:text-green-400' :
                                                            attempt.trustScore >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                                                            'text-red-600 dark:text-red-400'
                                                        }`}>
                                                            <Shield className="h-3 w-3" />
                                                            <span className="font-medium">{attempt.trustScore}%</span>
                                                        </div>
                                                        <div className="hidden sm:block h-3 w-px bg-border" />
                                                        <span className="text-muted-foreground hidden sm:inline">
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
                                                </div>
                                                
                                                {/* Score */}
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold">
                                                            {percentage.toFixed(0)}%
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {attempt.score}/{totalMarks}
                                                        </div>
                                                    </div>
                                                    <div className={`w-1 h-12 rounded-full ${
                                                        percentage >= 90 ? 'bg-green-500' :
                                                        percentage >= 70 ? 'bg-blue-500' :
                                                        percentage >= 40 ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                    }`} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Question Analysis</CardTitle>
                            <CardDescription>
                                Performance breakdown by question - helps identify difficult topics
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6">
                            {totalAttempts === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>No data available yet.</p>
                                    <p className="text-sm mt-1">Analytics will appear once students submit attempts.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {questionAnalytics.map((q, index) => (
                                        <div key={q.id} className="border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                                                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                                        {q.text}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-3 gap-4 sm:gap-6">
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Accuracy</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <p className={`text-2xl font-bold ${
                                                            q.accuracy >= 70 ? 'text-green-600 dark:text-green-400' :
                                                            q.accuracy >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                                                            'text-red-600 dark:text-red-400'
                                                        }`}>
                                                            {q.accuracy.toFixed(0)}%
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {q.correctCount} of {q.attemptedCount}
                                                    </p>
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Attempted</p>
                                                    <p className="text-2xl font-bold">
                                                        {q.attemptedCount}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        of {totalAttempts} students
                                                    </p>
                                                </div>
                                                
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Skipped</p>
                                                    <p className={`text-2xl font-bold ${
                                                        q.skipRate > 20 ? 'text-orange-600 dark:text-orange-400' : ''
                                                    }`}>
                                                        {totalAttempts - q.attemptedCount}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {q.skipRate.toFixed(0)}% skip rate
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Visual progress bar */}
                                            <div className="mt-4">
                                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
