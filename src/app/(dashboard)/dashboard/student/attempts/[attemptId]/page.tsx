import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { sanitizeHtml } from "@/lib/sanitize";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Shield,
    Award,
    HelpCircle,
    Info,
    Clock,
    Zap
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AttemptDiagnosticReviewPage({
    params,
}: {
    params: Promise<{ attemptId: string }>;
}) {
    const { attemptId } = await params;
    const session = await verifySession();
    if (!session) return redirect("/login");

    // Fetch the specific attempt with security guard
    const attempt = await prisma.studentAttempt.findUnique({
        where: { id: attemptId },
        include: {
            exam: {
                include: {
                    questions: true,
                }
            },
            integrityEvents: {
                orderBy: { timestamp: "asc" }
            }
        }
    });

    if (!attempt) return notFound();

    // Security Gate: Ensure students can only access their own attempts
    if (attempt.studentId !== session.userId) {
        return redirect("/dashboard/student");
    }

    const exam = attempt.exam;
    const questions = exam.questions;
    const answersMap = (attempt.answers as Record<string, string>) || {};
    
    const isPassed = attempt.score >= exam.passPercentage;
    const accuracy = attempt.totalQuestions > 0 ? (attempt.correctAnswers / attempt.totalQuestions) * 100 : 0;
    
    // Parse timestamp format
    const completedDateFormatted = attempt.completedAt
        ? new Date(attempt.completedAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short"
          })
        : "N/A";

    const durationTakenSeconds = attempt.startTime && attempt.completedAt
        ? Math.floor((new Date(attempt.completedAt).getTime() - new Date(attempt.startTime).getTime()) / 1000)
        : 0;

    const durationFormatted = durationTakenSeconds > 0
        ? `${Math.floor(durationTakenSeconds / 60)}m ${durationTakenSeconds % 60}s`
        : "N/A";

    return (
        <div className="flex-1 space-y-6 max-w-4xl mx-auto w-full">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <Link href="/dashboard/student/attempts">
                    <Button variant="ghost" size="sm" className="gap-1.5 font-semibold text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" /> Back to History
                    </Button>
                </Link>
                <Badge variant={attempt.submitted ? "default" : "secondary"} className="uppercase font-bold text-[10px] tracking-wider py-0.5 px-2">
                    {attempt.submitted ? "Graded & Closed" : "Active / Unsubmitted"}
                </Badge>
            </div>

            {/* Title block */}
            <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{exam.title}</h1>
                <p className="text-sm text-muted-foreground font-medium">
                    Attempt Diagnostic Summary • Taken on {completedDateFormatted}
                </p>
            </div>

            {/* Score Summary Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Result Card */}
                <Card className={`shadow-sm border-muted/60 relative overflow-hidden flex flex-col justify-between ${
                    isPassed 
                        ? 'bg-gradient-to-br from-emerald-50/20 to-teal-50/20 border-emerald-200' 
                        : 'bg-gradient-to-br from-red-50/10 to-rose-50/10 border-red-200'
                }`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Exam Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-baseline gap-2">
                            <span className={`text-4xl font-extrabold ${isPassed ? 'text-emerald-600' : 'text-destructive'}`}>
                                {attempt.score}%
                            </span>
                            <span className="text-sm font-semibold text-muted-foreground">
                                (Pass mark: {exam.passPercentage}%)
                            </span>
                        </div>
                        <Badge className={`font-extrabold text-xs py-1 px-3 ${
                            isPassed 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                : 'bg-destructive hover:bg-destructive/90 text-white'
                        }`}>
                            {isPassed ? "PASSED ASSESSMENT" : "FAILED ASSESSMENT"}
                        </Badge>
                    </CardContent>
                </Card>

                {/* Accuracy Card */}
                <Card className="shadow-sm border-muted/60 flex flex-col justify-between">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Answer Diagnostics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pb-4">
                        <div className="flex justify-between items-center text-sm font-medium border-b pb-1.5 border-muted">
                            <span className="text-muted-foreground">Total Questions</span>
                            <span className="font-semibold">{attempt.totalQuestions}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-medium border-b pb-1.5 border-muted">
                            <span className="text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" /> Correct
                            </span>
                            <span className="font-semibold text-emerald-600">{attempt.correctAnswers}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-medium border-b pb-1.5 border-muted">
                            <span className="text-destructive flex items-center gap-1">
                                <XCircle className="h-4 w-4" /> Wrong
                            </span>
                            <span className="font-semibold text-destructive">{attempt.wrongAnswers}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <HelpCircle className="h-4 w-4" /> Unanswered
                            </span>
                            <span className="font-semibold">{attempt.unanswered}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Proctoring Card */}
                <Card className={`shadow-sm border-muted/60 flex flex-col justify-between ${
                    attempt.trustScore >= 80 ? 'border-teal-200' :
                    attempt.trustScore >= 60 ? 'border-amber-200' :
                    'border-destructive'
                }`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Proctor Integrity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-extrabold ${
                                attempt.trustScore >= 90 ? 'text-teal-600' :
                                attempt.trustScore >= 70 ? 'text-amber-600' :
                                'text-destructive'
                            }`}>
                                {attempt.trustScore}
                            </span>
                            <span className="text-sm font-bold text-muted-foreground">/100</span>
                        </div>
                        <div className="space-y-1.5 text-xs font-semibold text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                                {attempt.violations} tab/fullscreen infractions
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                Completed in {durationFormatted}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Proctor Infractions Feed */}
            {attempt.integrityEvents.length > 0 && (
                <Card className="shadow-sm border-red-200 bg-red-50/10 dark:bg-red-950/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-destructive flex items-center gap-1.5">
                            <Shield className="h-5 w-5" /> Integrity Audit Timeline
                        </CardTitle>
                        <CardDescription className="text-xs">Security occurrences logged automatically during your session</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[140px] overflow-y-auto px-4 sm:px-6">
                        {attempt.integrityEvents.map((evt) => (
                            <div key={evt.id} className="flex items-center gap-3 text-xs border-b border-muted/50 pb-1.5 last:border-0 last:pb-0">
                                <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                <div className="flex-1 font-semibold text-muted-foreground">
                                    <span className="text-foreground uppercase text-[10px] tracking-wider font-extrabold mr-2">
                                        {evt.eventType.replace("_", " ")}
                                    </span>
                                    <span>Recorded during session</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                                    {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'N/A'}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Question Breakdown Diagnostics */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Info className="h-5 w-5 text-indigo-600" /> Question-by-Question Review
                </h3>

                {questions.map((q, idx) => {
                    const studentAnswerId = answersMap[q.id];
                    const isCorrect = studentAnswerId === q.correctOption;
                    const options = typeof q.options === "string" ? JSON.parse(q.options) : q.options;

                    return (
                        <Card key={q.id} className={`shadow-sm border-muted/60 relative overflow-hidden ${
                            !studentAnswerId ? 'border-amber-200 bg-amber-50/5' :
                            isCorrect ? 'border-emerald-200 bg-emerald-50/5' :
                            'border-red-200 bg-red-50/5'
                        }`}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        Question {idx + 1} ({q.marks} Mark{q.marks !== 1 ? 's' : ''})
                                    </span>
                                    {!studentAnswerId ? (
                                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 font-extrabold text-[9px] uppercase tracking-wider">
                                            Skipped
                                        </Badge>
                                    ) : isCorrect ? (
                                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 font-extrabold text-[9px] uppercase tracking-wider">
                                            Correct
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 font-extrabold text-[9px] uppercase tracking-wider">
                                            Incorrect
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle 
                                    className="text-sm sm:text-base leading-relaxed font-semibold text-foreground"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.text) }}
                                />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Options list */}
                                <div className="grid gap-2">
                                    {options.map((opt: { id: string; text: string }) => {
                                        const isCorrectOpt = opt.id === q.correctOption;
                                        const isStudentOpt = opt.id === studentAnswerId;

                                        return (
                                            <div key={opt.id} className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs sm:text-sm font-medium ${
                                                isCorrectOpt 
                                                    ? 'border-emerald-500 bg-emerald-500/5 text-emerald-900 dark:text-emerald-300 font-semibold' 
                                                    : isStudentOpt 
                                                    ? 'border-red-500 bg-red-500/5 text-red-900 dark:text-red-300' 
                                                    : 'border-muted bg-background text-muted-foreground'
                                            }`}>
                                                <div className="mt-0.5 shrink-0">
                                                    {isCorrectOpt ? (
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                    ) : isStudentOpt ? (
                                                        <XCircle className="h-4 w-4 text-red-600" />
                                                    ) : (
                                                        <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(opt.text) }} />
                                                    <div className="mt-1 flex gap-2">
                                                        {isCorrectOpt && (
                                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Correct Answer</span>
                                                        )}
                                                        {isStudentOpt && (
                                                            <span className={`text-[10px] font-bold uppercase tracking-wide ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>Your Choice</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Explanation text */}
                                {q.explanation && (
                                    <div className="rounded-lg bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/50 p-3 sm:p-4 text-xs sm:text-sm">
                                        <div className="flex gap-2">
                                            <Zap className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                                            <div className="space-y-1">
                                                <p className="font-bold text-indigo-900 dark:text-indigo-300">Explanation Diagnostic:</p>
                                                <p className="text-muted-foreground leading-relaxed font-medium">
                                                    {q.explanation}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
