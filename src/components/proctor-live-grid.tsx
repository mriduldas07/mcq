"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    sendProctorWarningAction,
    clearProctorWarningAction,
    forceDisqualifyAttemptAction
} from "@/actions/student";
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    Clock,
    Lock,
    Play,
    Radio,
    Shield,
    ShieldAlert,
    Trash2,
    Users,
    Volume2
} from "lucide-react";
import { toast } from "sonner";

type AttemptStreamData = {
    id: string;
    studentName: string;
    rollNumber: string;
    startTime: string | null;
    endTime: string | null;
    submitted: boolean;
    score: number;
    totalQuestions: number;
    answeredCount: number;
    violations: number;
    trustScore: number;
    warningMessage: string | null;
    completedAt: string | null;
};

type ProctorLiveGridProps = {
    examId: string;
    examTitle: string;
    antiCheatEnabled: boolean;
    maxViolations: number;
};

export function ProctorLiveGrid({
    examId,
    examTitle,
    antiCheatEnabled,
    maxViolations
}: ProctorLiveGridProps) {
    const [attempts, setAttempts] = useState<AttemptStreamData[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<"connecting" | "live" | "closed">("connecting");
    const [infractionLogs, setInfractionLogs] = useState<string[]>([]);
    const [warningTarget, setWarningTarget] = useState<AttemptStreamData | null>(null);
    const [customWarning, setCustomWarning] = useState("");

    const prevAttemptsRef = useRef<Record<string, number>>({});

    // SSE EventSource setup
    useEffect(() => {
        setConnectionStatus("connecting");
        const eventSource = new EventSource(`/api/proctor/stream?examId=${examId}`);

        eventSource.onopen = () => {
            setConnectionStatus("live");
            toast.success("Live proctor session established!");
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as AttemptStreamData[];
                setAttempts(data);

                // Detect new infractions for logging
                data.forEach(attempt => {
                    const prevViolations = prevAttemptsRef.current[attempt.id] || 0;
                    if (attempt.violations > prevViolations) {
                        const message = `${new Date().toLocaleTimeString()} - ${attempt.studentName} (Roll: ${attempt.rollNumber}) flagged for tab focus loss (Infraction #${attempt.violations}/${maxViolations})`;
                        setInfractionLogs(prev => [message, ...prev].slice(0, 30));
                        toast.warning(`Violation: ${attempt.studentName} switched tabs!`);
                    }
                    prevAttemptsRef.current[attempt.id] = attempt.violations;
                });
            } catch (err) {
                console.error("Failed to parse proctor stream data", err);
            }
        };

        eventSource.onerror = (err) => {
            console.error("Proctor EventSource error:", err);
            setConnectionStatus("closed");
        };

        return () => {
            eventSource.close();
        };
    }, [examId, maxViolations]);

    // Action Handlers
    const handleSendWarning = async () => {
        if (!warningTarget) return;

        const msg = customWarning.trim() !== "" ? customWarning : "Please focus on your exam screen. Additional infractions will trigger auto-submission.";
        const result = await sendProctorWarningAction(warningTarget.id, msg);

        if (result.success) {
            toast.success(`Warning dispatched to ${warningTarget.studentName}`);
            setWarningTarget(null);
            setCustomWarning("");
        } else {
            toast.error(result.error || "Failed to send warning");
        }
    };

    const handleClearWarning = async (attemptId: string, name: string) => {
        const result = await clearProctorWarningAction(attemptId);
        if (result.success) {
            toast.success(`Active warning cleared for ${name}`);
        } else {
            toast.error(result.error || "Failed to clear warning");
        }
    };

    const handleForceDisqualify = async (attemptId: string, name: string) => {
        const confirm = window.confirm(`🛑 Are you absolutely sure you want to DISQUALIFY and LOCK OUT ${name}? This action is permanent.`);
        if (!confirm) return;

        const result = await forceDisqualifyAttemptAction(attemptId);
        if (result.success) {
            toast.success(`${name} has been disqualified and locked out.`);
            const logMsg = `${new Date().toLocaleTimeString()} - PROCTOR ACTION: Disqualified and locked out ${name}`;
            setInfractionLogs(prev => [logMsg, ...prev]);
        } else {
            toast.error(result.error || "Failed to disqualify student");
        }
    };

    // Statistical Aggregates
    const activeAttempts = attempts.filter(a => !a.submitted);
    const submittedAttempts = attempts.filter(a => a.submitted);
    const totalInfractions = attempts.reduce((acc, curr) => acc + curr.violations, 0);
    const activeInfracted = activeAttempts.filter(a => a.violations > 0);

    return (
        <div className="space-y-6">
            {/* Stream Status Indicator Block */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2">
                    <div className="relative flex h-3 w-3">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            connectionStatus === "live" ? "bg-emerald-400" :
                            connectionStatus === "connecting" ? "bg-amber-400" :
                            "bg-red-400"
                        }`} />
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${
                            connectionStatus === "live" ? "bg-emerald-500" :
                            connectionStatus === "connecting" ? "bg-amber-500" :
                            "bg-red-500"
                        }`} />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        {connectionStatus === "live" ? "Live Stream Connected" :
                         connectionStatus === "connecting" ? "Connecting to exam pool..." :
                         "Connection interrupted"}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Radio className="h-4 w-4 animate-pulse text-indigo-600" />
                    <span>Polling SSE channel every 2.0s</span>
                </div>
            </div>

            {/* Quick Metrics Header */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm border-muted/60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Candidates</CardTitle>
                        <Users className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{activeAttempts.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Currently taking the exam</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-muted/60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Submitted Attempts</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-emerald-600">{submittedAttempts.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Attempts finalized & closed</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-muted/60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Violations</CardTitle>
                        <Shield className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-amber-600">{totalInfractions}</div>
                        <p className="text-xs text-muted-foreground mt-1">Alt-tab & fullscreen exits flagged</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-muted/60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Security Flags</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-red-600">{activeInfracted.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active users with infractions</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main content grid: Live Cards + Infraction Timelines */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Live Cards Grid */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-1.5">
                        <Activity className="h-5 w-5 text-indigo-600" /> Active Session Grid
                    </h3>
                    
                    {attempts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-muted rounded-2xl">
                            <Users className="h-12 w-12 text-muted-foreground/60 mb-3 animate-pulse" />
                            <h4 className="font-bold text-sm">No Active Attempts</h4>
                            <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed mt-1">
                                Awaiting candidates. Once students input credentials and enter the exam loop, they will appear here live.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                            {attempts.map((attempt) => {
                                const isDisqualified = attempt.submitted && attempt.warningMessage === "DISQUALIFIED_BY_PROCTOR";
                                const isFinished = attempt.submitted && !isDisqualified;

                                return (
                                    <Card key={attempt.id} className={`shadow-sm border-muted/60 relative overflow-hidden transition-all flex flex-col justify-between ${
                                        isDisqualified ? 'border-red-300 bg-red-50/5 dark:bg-red-950/5' :
                                        isFinished ? 'border-emerald-300 bg-emerald-50/5 dark:bg-emerald-950/5' :
                                        attempt.violations >= maxViolations - 1 ? 'border-amber-300 bg-amber-50/5 animate-pulse dark:bg-amber-950/5' :
                                        attempt.violations > 0 ? 'border-yellow-200' :
                                        'border-muted hover:border-indigo-100'
                                    }`}>
                                        <CardHeader className="pb-3 px-4 pt-4">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-sm text-foreground truncate">{attempt.studentName}</h4>
                                                    <p className="text-[10px] text-muted-foreground font-semibold">Roll: {attempt.rollNumber}</p>
                                                </div>
                                                <Badge className={`text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-1.5 shrink-0 ${
                                                    isDisqualified ? 'bg-red-600 text-white' :
                                                    isFinished ? 'bg-emerald-600 text-white' :
                                                    attempt.violations > 0 ? 'bg-amber-500 text-white' :
                                                    'bg-indigo-600 text-white'
                                                }`}>
                                                    {isDisqualified ? "Disqualified" :
                                                     isFinished ? "Submitted" :
                                                     attempt.violations > 0 ? "Warning" :
                                                     "Monitoring"}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        
                                        <CardContent className="px-4 pb-3 space-y-3 flex-1 flex flex-col justify-end">
                                            {/* Progress bar */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                                                    <span>Exam Progress</span>
                                                    <span>{attempt.answeredCount} / {attempt.totalQuestions} Answered</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-600 transition-all" style={{ width: `${(attempt.answeredCount / attempt.totalQuestions) * 100}%` }} />
                                                </div>
                                            </div>

                                            {/* Trust score / Infractions */}
                                            <div className="flex justify-between items-center text-xs font-semibold">
                                                <span className="text-muted-foreground">Trust Rating:</span>
                                                <span className={
                                                    attempt.trustScore >= 90 ? 'text-teal-600' :
                                                    attempt.trustScore >= 70 ? 'text-amber-600' :
                                                    'text-destructive'
                                                }>
                                                    {attempt.trustScore}/100 ({attempt.violations} violations)
                                                </span>
                                            </div>

                                            {/* Warning alerts active */}
                                            {attempt.warningMessage && !attempt.submitted && (
                                                <div className="rounded bg-destructive/10 text-destructive text-[10px] p-1.5 font-bold flex items-start gap-1">
                                                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                    <span className="truncate">Warning sent: "{attempt.warningMessage}"</span>
                                                </div>
                                            )}
                                        </CardContent>

                                        <CardFooter className="border-t bg-muted/10 p-3 flex flex-wrap items-center justify-between gap-1.5">
                                            {!attempt.submitted ? (
                                                <>
                                                    <div className="flex gap-1.5 w-full justify-end">
                                                        {attempt.warningMessage ? (
                                                            <Button size="sm" variant="outline" className="text-[10px] font-bold border-muted" onClick={() => handleClearWarning(attempt.id, attempt.studentName)}>
                                                                Clear Warn
                                                            </Button>
                                                        ) : (
                                                            <Button size="sm" variant="outline" className="text-[10px] font-bold border-muted gap-1 bg-indigo-50/20 text-indigo-700 hover:bg-indigo-50" onClick={() => setWarningTarget(attempt)}>
                                                                <Volume2 className="h-3 w-3" /> Warn
                                                            </Button>
                                                        )}
                                                        <Button size="sm" variant="destructive" className="text-[10px] font-bold gap-1" onClick={() => handleForceDisqualify(attempt.id, attempt.studentName)}>
                                                            <Lock className="h-3 w-3" /> Lock Out
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-right w-full">
                                                    {isFinished && (
                                                        <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Final Score: {attempt.score}%</span>
                                                    )}
                                                    {isDisqualified && (
                                                        <span className="text-xs text-red-600 font-bold uppercase tracking-wider">Disqualified</span>
                                                    )}
                                                </div>
                                            )}
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Scrolling Timeline Sidebar */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-1.5">
                        <ShieldAlert className="h-5 w-5 text-indigo-600" /> Proctor Logs
                    </h3>
                    
                    <Card className="shadow-sm border-muted/60 flex flex-col h-[480px]">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold">Infraction Timeline</CardTitle>
                            <CardDescription className="text-xs">Incoming infraction logs from active candidates</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
                            {infractionLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                                    <Shield className="h-8 w-8 text-muted-foreground/40 mb-2 animate-pulse" />
                                    <p className="text-xs text-muted-foreground font-medium">No infraction anomalies reported yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {infractionLogs.map((log, idx) => (
                                        <div key={idx} className="text-[11px] font-semibold leading-relaxed border-b pb-1.5 border-muted/50 last:border-0 last:pb-0 text-muted-foreground">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Custom Warning Dialog */}
            {warningTarget && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full mx-3 border shadow-2xl">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-1.5">
                                <Volume2 className="h-5 w-5 text-indigo-600" /> Warn Candidate: {warningTarget.studentName}
                            </CardTitle>
                            <CardDescription>Dispatch a flashing alert block directly to the candidate's active exam page</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-2">
                            <Input
                                placeholder="Type a custom warning (e.g. Return to fullscreen immediately!). Leave empty for standard alert."
                                value={customWarning}
                                onChange={(e) => setCustomWarning(e.target.value)}
                                className="w-full text-xs sm:text-sm h-10"
                            />
                        </CardContent>
                        <CardFooter className="justify-end gap-2 border-t pt-3 mt-4 bg-muted/10">
                            <Button size="sm" variant="ghost" className="font-semibold text-xs h-9" onClick={() => setWarningTarget(null)}>
                                Cancel
                            </Button>
                            <Button size="sm" className="font-semibold text-xs h-9" onClick={handleSendWarning}>
                                Send Alert
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
