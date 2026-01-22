"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Clock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitExamAction, saveAnswerAction, getAttemptStatusAction, recordViolationAction, beginExamTimerAction } from "@/actions/student";
import { renderMathInElement } from "@/lib/math-renderer";

// Types
type Option = {
    id: string;
    text: string;
}

type Question = {
    id: string;
    text: string;
    options: Option[];
}

// EXAM STATE MACHINE
enum ExamState {
    WAITING = "WAITING",     // Not started, waiting for fullscreen
    RUNNING = "RUNNING",     // Timer active, exam in progress
    ENDED = "ENDED"          // Time expired or submitted
}

type ExamSessionProps = {
    examId: string;
    studentName: string;
    rollNumber: string;
    questions: Question[];
    durationMinutes: number;
    attemptId: string;
    startedAt: string | null; // ISO string from server (null if not started)
    endTime: string | null; // ISO string from server (null if not started)
    antiCheatEnabled: boolean;
    maxViolations: number;
}

export function ExamSession({ 
    examId, 
    studentName, 
    rollNumber, 
    questions, 
    durationMinutes,
    attemptId,
    startedAt: initialStartedAt,
    endTime: initialEndTime,
    antiCheatEnabled,
    maxViolations
}: ExamSessionProps) {
    const router = useRouter();
    
    // EXAM STATE MACHINE
    const [examState, setExamState] = useState<ExamState>(
        initialStartedAt ? ExamState.RUNNING : ExamState.WAITING
    );
    
    // Core exam data
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [endTime, setEndTime] = useState<string | null>(initialEndTime);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [violations, setViolations] = useState(0);
    
    // Refs to prevent duplicate actions
    const hasAutoSubmitted = useRef(false);
    
    // Offline safety
    const [isOnline, setIsOnline] = useState(true);
    const [pendingSaves, setPendingSaves] = useState<string[]>([]);
    const syncQueueRef = useRef<Array<{ questionId: string; answer: string }>>([]);
    
    // Ref for math rendering
    const questionRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<HTMLDivElement>(null);

    // Render math formulas when question changes
    useEffect(() => {
        if (questionRef.current) {
            renderMathInElement(questionRef.current);
        }
        if (optionsRef.current) {
            renderMathInElement(optionsRef.current);
        }
    }, [currentQuestionIndex]);

    // =================================================================
    // INITIALIZATION: Check if exam has already started (page refresh)
    // =================================================================
    useEffect(() => {
        const initializeExamState = async () => {
            if (initialStartedAt && initialEndTime) {
                // Exam already started - resume
                setExamState(ExamState.RUNNING);
                
                // Check if time has expired
                const now = new Date().getTime();
                const end = new Date(initialEndTime).getTime();
                const remaining = Math.floor((end - now) / 1000);
                
                if (remaining <= 0) {
                    setExamState(ExamState.ENDED);
                    if (!hasAutoSubmitted.current) {
                        hasAutoSubmitted.current = true;
                        handleSubmit(true);
                    }
                }
            } else {
                // Exam not started - show waiting screen
                setExamState(ExamState.WAITING);
            }
            
            // Try to restore saved state
            try {
                const result = await getAttemptStatusAction(attemptId);
                if (result.success && result.attempt) {
                    // Check if already submitted
                    if (result.attempt.submitted) {
                        router.push(`/exam/${examId}/result?attemptId=${attemptId}`);
                        return;
                    }
                    
                    // Restore answers
                    if (result.attempt.answers) {
                        setAnswers(result.attempt.answers);
                    }
                    
                    // Restore violations
                    if (result.attempt.violations) {
                        setViolations(result.attempt.violations);
                    }
                }
            } catch (e) {
                console.error("Failed to restore attempt state", e);
            }
        };
        
        initializeExamState();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attemptId, examId, initialStartedAt, initialEndTime]);

    // =================================================================
    // FULLSCREEN HANDLER: Start timer on FIRST fullscreen entry
    // =================================================================
    const handleEnterFullscreen = async () => {
        if (examState !== ExamState.WAITING) return;
        
        try {
            // Request fullscreen
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
            
            // Call backend to start timer (THIS IS THE CRITICAL MOMENT)
            console.log('🚀 Starting exam timer on server...');
            const result = await beginExamTimerAction(attemptId);
            
            if (result.success && result.startedAt && result.endTime) {
                // Timer started successfully
                setEndTime(result.endTime);
                setExamState(ExamState.RUNNING);
                
                console.log('✅ EXAM STARTED! Timer will end at:', result.endTime);
            } else {
                console.error('Failed to start timer:', result.error);
                alert('Failed to start exam timer. Please try again.');
            }
        } catch (err) {
            console.error("Failed to enter fullscreen:", err);
            alert("Please allow fullscreen mode to start the exam.");
        }
    };

    // =================================================================
    // TIMER: Server-controlled, NEVER pauses after starting
    // =================================================================
    useEffect(() => {
        // Only run timer if exam is RUNNING and we have an endTime
        if (examState !== ExamState.RUNNING || !endTime) {
            return;
        }

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const end = new Date(endTime).getTime();
            const diff = Math.floor((end - now) / 1000);
            return Math.max(0, diff);
        };

        // Set initial time
        setTimeLeft(calculateTimeLeft());

        // Update every second - NEVER PAUSES
        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(timer);
                setExamState(ExamState.ENDED);
                
                // Auto-submit when time expires
                if (!hasAutoSubmitted.current) {
                    console.log('⏰ TIME EXPIRED - Auto-submitting exam');
                    hasAutoSubmitted.current = true;
                    handleSubmit(true);
                }
            }
        }, 1000);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examState, endTime]);

    // =================================================================
    // OFFLINE DETECTION
    // =================================================================
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncPendingAnswers();
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // =================================================================
    // LOCAL STORAGE: Load and save answers
    // =================================================================
    useEffect(() => {
        const storageKey = `exam_${attemptId}_answers`;
        const savedAnswers = localStorage.getItem(storageKey);
        
        if (savedAnswers) {
            try {
                const parsed = JSON.parse(savedAnswers);
                setAnswers(parsed);
            } catch (e) {
                console.error('Failed to load saved answers', e);
            }
        }
    }, [attemptId]);

    useEffect(() => {
        if (Object.keys(answers).length > 0) {
            const storageKey = `exam_${attemptId}_answers`;
            localStorage.setItem(storageKey, JSON.stringify(answers));
        }
    }, [answers, attemptId]);

    // Sync pending answers when connection is restored
    const syncPendingAnswers = async () => {
        if (syncQueueRef.current.length === 0) return;

        const queue = [...syncQueueRef.current];
        syncQueueRef.current = [];

        for (const item of queue) {
            try {
                await saveAnswerAction(attemptId, item.questionId, item.answer);
                setPendingSaves(prev => prev.filter(id => id !== item.questionId));
            } catch (e) {
                // Re-add to queue if failed
                syncQueueRef.current.push(item);
                console.error('Failed to sync answer', e);
            }
        }
    };

    // =================================================================
    // ANTI-CHEAT: Tab switch detection (NEVER PAUSES TIMER)
    // =================================================================
    useEffect(() => {
        if (!antiCheatEnabled || examState !== ExamState.RUNNING) return;
        
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                // Tab switched away - record violation
                console.log(`⚠️ Tab switch detected`);
                
                try {
                    const result = await recordViolationAction(attemptId);
                    
                    if (result.success && result.violations !== undefined) {
                        setViolations(result.violations);
                        console.log(`Violation recorded. Count: ${result.violations}/${maxViolations}`);
                        
                        if (result.violations >= maxViolations && !hasAutoSubmitted.current) {
                            console.log(`🚨 TAB SWITCH - EXCEEDED LIMIT - AUTO-SUBMIT`);
                            hasAutoSubmitted.current = true;
                            handleSubmit(true);
                        }
                    }
                } catch (e) {
                    console.error("Failed to record violation", e);
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examState, antiCheatEnabled, attemptId, maxViolations]);

    // =================================================================
    // ANTI-CHEAT: Fullscreen exit detection (NEVER PAUSES TIMER)
    // =================================================================
    useEffect(() => {
        if (!antiCheatEnabled || examState !== ExamState.RUNNING) return;
        
        const handleFullscreenChange = async () => {
            if (!document.fullscreenElement) {
                // User exited fullscreen - record violation
                console.log(`⚠️ Fullscreen exit detected`);
                
                try {
                    const result = await recordViolationAction(attemptId);
                    
                    if (result.success && result.violations !== undefined) {
                        setViolations(result.violations);
                        console.log(`Violation recorded. Count: ${result.violations}/${maxViolations}`);
                        
                        if (result.violations >= maxViolations && !hasAutoSubmitted.current) {
                            console.log(`🚨 FULLSCREEN EXIT - EXCEEDED LIMIT - AUTO-SUBMIT`);
                            hasAutoSubmitted.current = true;
                            handleSubmit(true);
                        }
                    }
                } catch (e) {
                    console.error("Failed to record violation", e);
                }
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examState, antiCheatEnabled, attemptId, maxViolations]);

    // =================================================================
    // AUTO-SAVE: Save answers with offline support
    // =================================================================
    useEffect(() => {
        if (examState !== ExamState.RUNNING) return;
        
        const autoSave = async () => {
            if (Object.keys(answers).length === 0 || isSubmitting) return;

            const questionIds = Object.keys(answers);
            const lastQuestionId = questionIds[questionIds.length - 1];
            const lastAnswer = answers[lastQuestionId];

            if (lastQuestionId && lastAnswer) {
                // If offline, add to sync queue
                if (!isOnline) {
                    const existingIndex = syncQueueRef.current.findIndex(
                        item => item.questionId === lastQuestionId
                    );
                    
                    if (existingIndex >= 0) {
                        syncQueueRef.current[existingIndex].answer = lastAnswer;
                    } else {
                        syncQueueRef.current.push({ questionId: lastQuestionId, answer: lastAnswer });
                    }
                    
                    setPendingSaves(prev => {
                        if (!prev.includes(lastQuestionId)) {
                            return [...prev, lastQuestionId];
                        }
                        return prev;
                    });
                    return;
                }

                // If online, save to server
                try {
                    const result = await saveAnswerAction(attemptId, lastQuestionId, lastAnswer);
                    
                    if (result.success) {
                        setPendingSaves(prev => prev.filter(id => id !== lastQuestionId));
                    }
                } catch (e) {
                    console.error("Auto-save failed", e);
                    syncQueueRef.current.push({ questionId: lastQuestionId, answer: lastAnswer });
                    setPendingSaves(prev => {
                        if (!prev.includes(lastQuestionId)) {
                            return [...prev, lastQuestionId];
                        }
                        return prev;
                    });
                }
            }
        };

        const timeout = setTimeout(autoSave, 500);
        return () => clearTimeout(timeout);
    }, [answers, attemptId, isSubmitting, isOnline, examState]);

    // =================================================================
    // HANDLERS
    // =================================================================
    const handleOptionSelect = (questionId: string, optionId: string) => {
        // Only allow if exam is running
        if (examState !== ExamState.RUNNING) return;
        
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const handleSubmit = async (auto = false) => {
        if (isSubmitting) {
            console.log('⚠️ Already submitting, ignoring duplicate call');
            return;
        }

        console.log(auto ? '🤖 AUTO-SUBMITTING exam' : '✅ MANUAL submission');

        // Block submission if offline with pending saves
        if (!isOnline && pendingSaves.length > 0) {
            if (!auto) {
                alert("Cannot submit exam while offline. Please wait for connection to sync your answers.");
            }
            return;
        }

        setIsSubmitting(true);
        setExamState(ExamState.ENDED);

        try {
            // Save all current answers before submitting
            console.log('💾 Saving all answers before submission...');
            
            const answerEntries = Object.entries(answers);
            for (const [questionId, optionId] of answerEntries) {
                try {
                    await saveAnswerAction(attemptId, questionId, optionId);
                } catch (e) {
                    console.error(`Failed to save answer for question ${questionId}`, e);
                }
            }
            
            // Ensure all pending saves are synced
            if (pendingSaves.length > 0) {
                await syncPendingAnswers();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log('✅ All answers saved. Submitting exam...');
            const result = await submitExamAction(attemptId);
            
            if (result.success) {
                console.log('🎉 Exam submitted successfully');
                // Clear local storage
                const storageKey = `exam_${attemptId}_answers`;
                localStorage.removeItem(storageKey);
                
                router.replace(`/exam/${examId}/result?attemptId=${attemptId}`);
            } else {
                console.error('❌ Submission failed:', result.error);
                if (!auto) {
                    alert(result.error || "Submission failed");
                }
                setIsSubmitting(false);
                setExamState(ExamState.RUNNING); // Allow retry
            }
        } catch (e) {
            console.error("❌ Submit exception:", e);
            if (!auto) {
                alert("An error occurred during submission. Please try again.");
            }
            setIsSubmitting(false);
            setExamState(ExamState.RUNNING); // Allow retry
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const progress = ((Object.keys(answers).length) / questions.length) * 100;

    // =================================================================
    // RENDER: WAITING STATE
    // =================================================================
    if (examState === ExamState.WAITING) {
        return (
            <div className="flex flex-col min-h-screen bg-muted/20">
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-4">
                    <Card className="max-w-lg w-full mx-3">
                        <CardHeader className="px-4 sm:px-6">
                            <CardTitle className="text-center text-lg sm:text-xl md:text-2xl">
                                {antiCheatEnabled ? "🔒 Exam Ready" : "📝 Exam Ready"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                            <div className="text-center space-y-1.5 sm:space-y-2">
                                <p className="text-base sm:text-lg font-medium">{studentName}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">Roll: {rollNumber}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">Duration: {durationMinutes} minutes</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">Questions: {questions.length}</p>
                            </div>
                            
                            {antiCheatEnabled ? (
                                <div className="rounded-md bg-yellow-50 p-3 sm:p-4 text-xs sm:text-sm text-yellow-800 border border-yellow-200">
                                    <strong>⚠️ Important Rules:</strong>
                                    <ul className="list-disc pl-4 mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1">
                                        <li>Click below to enter fullscreen and START the exam timer</li>
                                        <li>Timer will NOT pause once started</li>
                                        <li>Exiting fullscreen or switching tabs = violation</li>
                                        <li>After {maxViolations} violations, exam will auto-submit</li>
                                        <li>You cannot gain extra time by delaying fullscreen entry</li>
                                    </ul>
                                </div>
                            ) : (
                                <div className="rounded-md bg-blue-50 p-3 sm:p-4 text-xs sm:text-sm text-blue-800 border border-blue-200">
                                    <p>Click below to start your exam. Your timer will begin immediately.</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="px-4 sm:px-6">
                            <Button 
                                onClick={handleEnterFullscreen}
                                className="w-full text-base sm:text-lg h-11 sm:h-12"
                                size="lg"
                            >
                                {antiCheatEnabled ? "Enter Fullscreen & Start Exam" : "Start Exam"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    // =================================================================
    // RENDER: RUNNING/ENDED STATE
    // =================================================================
    return (
        <div className="flex flex-col min-h-screen bg-muted/20">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background border-b shadow-sm p-3 sm:p-4">
                <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="font-semibold text-sm sm:text-base truncate">{studentName}</h1>
                        <p className="text-xs text-muted-foreground">Roll: {rollNumber}</p>
                        {!isOnline && (
                            <p className="text-xs text-orange-600 font-medium">⚠️ Offline - Changes saved locally</p>
                        )}
                        {isOnline && pendingSaves.length > 0 && (
                            <p className="text-xs text-blue-600 font-medium">🔄 Syncing {pendingSaves.length} answer{pendingSaves.length !== 1 ? 's' : ''}...</p>
                        )}
                    </div>
                    <div className={cn(
                        "flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg md:text-xl font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-md",
                        timeLeft < 60 ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
                    )}>
                        <Clock className="h-5 w-5" />
                        {formatTime(timeLeft)}
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleSubmit(false)}
                        disabled={isSubmitting || examState === ExamState.ENDED || (!isOnline && pendingSaves.length > 0)}
                        className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                    >
                        {isSubmitting ? "Submitting..." : "Finish"}
                    </Button>
                </div>
                {antiCheatEnabled && violations > 0 && (
                    <div className={`text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 text-center animate-pulse ${
                        violations >= maxViolations ? 'bg-red-100 text-red-700' :
                        violations >= maxViolations - 1 ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                        ⚠️ Warning: {violations} violation{violations !== 1 ? 's' : ''} (max: {maxViolations})
                        {violations >= maxViolations - 1 && violations < maxViolations && (
                            <span className="font-bold"> - One more will auto-submit!</span>
                        )}
                    </div>
                )}
                <div className="h-1 w-full bg-secondary mt-0">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto p-3 sm:p-4 md:p-6 lg:p-8 max-w-3xl">
                {questions.length > 0 ? (
                    <Card className="min-h-100 flex flex-col">
                        <CardHeader className="pb-4 sm:pb-5 px-4 sm:px-6">
                            <div className="flex justify-between items-center mb-3 sm:mb-5">
                                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                    Question {currentQuestionIndex + 1} of {questions.length}
                                </span>
                            </div>
                            <CardTitle 
                                ref={questionRef}
                                className="text-sm sm:text-base md:text-[17px] lg:text-[19px] font-medium leading-[1.65]"
                                dangerouslySetInnerHTML={{ __html: currentQuestion.text }}
                            />
                        </CardHeader>
                        <CardContent className="flex-1 pt-2 px-4 sm:px-6" ref={optionsRef}>
                            <RadioGroup
                                value={answers[currentQuestion.id] || ""}
                                onValueChange={(val: string) => handleOptionSelect(currentQuestion.id, val)}
                                disabled={examState === ExamState.ENDED}
                                className="space-y-2 sm:space-y-3"
                            >
                                {currentQuestion.options.map((opt) => (
                                    <div
                                        key={opt.id}
                                        className={cn(
                                            "flex items-center space-x-2 sm:space-x-3 border rounded-lg p-3 sm:p-4 transition-all min-h-[48px] sm:min-h-[52px]",
                                            examState === ExamState.RUNNING && "cursor-pointer hover:bg-accent",
                                            examState === ExamState.ENDED && "opacity-60",
                                            answers[currentQuestion.id] === opt.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-input"
                                        )}
                                        onClick={() => handleOptionSelect(currentQuestion.id, opt.id)}
                                    >
                                        <RadioGroupItem value={opt.id} id={opt.id} className="shrink-0" />
                                        <Label 
                                            htmlFor={opt.id} 
                                            className="flex-1 cursor-pointer font-normal text-sm sm:text-[15px] md:text-base leading-[1.6]"
                                            dangerouslySetInnerHTML={{ __html: opt.text }}
                                        />
                                    </div>
                                ))}
                            </RadioGroup>
                        </CardContent>
                        <CardFooter className="justify-between border-t p-4 sm:p-6 bg-muted/10 mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0 || examState === ExamState.ENDED}
                                className="text-sm sm:text-base h-9 sm:h-10"
                            >
                                Previous
                            </Button>

                            {isLastQuestion ? (
                                <Button 
                                    onClick={() => handleSubmit(false)} 
                                    disabled={isSubmitting || examState === ExamState.ENDED}
                                    className="text-sm sm:text-base h-9 sm:h-10"
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Exam"}
                                </Button>
                            ) : (
                                <Button 
                                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                    disabled={examState === ExamState.ENDED}
                                    className="text-sm sm:text-base h-9 sm:h-10"
                                >
                                    Next Question
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                        <AlertCircle className="mr-2 h-5 w-5" />
                        This exam has no questions.
                    </div>
                )}
            </main>
        </div>
    );
}
