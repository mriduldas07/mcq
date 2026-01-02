"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitExamAction, saveAnswerAction, getAttemptStatusAction, recordViolationAction } from "@/actions/student";

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

type ExamSessionProps = {
    examId: string;
    studentName: string;
    rollNumber: string;
    questions: Question[];
    durationMinutes: number;
    attemptId: string;
    endTime: string; // ISO string from server
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
    endTime,
    antiCheatEnabled,
    maxViolations
}: ExamSessionProps) {
    const router = useRouter();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [violations, setViolations] = useState(0);
    const hasAutoSubmitted = useRef(false);
    const hasEnteredFullscreen = useRef(false); // Track if user entered fullscreen at least once
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
    
    // TASK 8: Offline safety
    const [isOnline, setIsOnline] = useState(true);
    const [pendingSaves, setPendingSaves] = useState<string[]>([]);
    const syncQueueRef = useRef<Array<{ questionId: string; answer: string }>>([]);

    // TASK: Fullscreen enforcement - Check fullscreen status on mount
    useEffect(() => {
        if (!antiCheatEnabled) {
            setIsFullscreen(true); // Skip fullscreen check if anti-cheat disabled
            setShowFullscreenPrompt(false);
            return;
        }

        // Check if already in fullscreen
        if (document.fullscreenElement) {
            setIsFullscreen(true);
            setShowFullscreenPrompt(false);
        } else {
            // Show prompt - user must click to enter fullscreen (browser security requirement)
            setShowFullscreenPrompt(true);
        }
    }, [antiCheatEnabled]);

    // TASK 8: Offline detection
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Sync pending saves when back online
            syncPendingAnswers();
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Set initial state
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // TASK 8: Load answers from local storage on mount
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

    // TASK 8: Save answers to local storage whenever they change
    useEffect(() => {
        if (Object.keys(answers).length > 0) {
            const storageKey = `exam_${attemptId}_answers`;
            localStorage.setItem(storageKey, JSON.stringify(answers));
        }
    }, [answers, attemptId]);

    // TASK 8: Sync pending answers when connection is restored
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

    // TASK 1: SERVER-CONTROLLED TIMER - Only start when user enters fullscreen
    useEffect(() => {
        // Don't start timer if anti-cheat is enabled and user hasn't entered fullscreen
        if (antiCheatEnabled && !hasEnteredFullscreen.current) {
            console.log('⏸️ Timer paused - waiting for user to enter fullscreen');
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
        console.log('✅ Timer started!');

        // Update every second ONLY when in fullscreen (or anti-cheat disabled)
        const timer = setInterval(() => {
            // Pause timer if user exits fullscreen
            if (antiCheatEnabled && !document.fullscreenElement) {
                console.log('⏸️ Timer paused - user exited fullscreen');
                return;
            }

            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [endTime, antiCheatEnabled, isFullscreen]);

    // Handle page refresh - restore attempt state (ONE TIME ONLY)
    useEffect(() => {
        let isMounted = true;
        
        const restoreAttemptState = async () => {
            try {
                const result = await getAttemptStatusAction(attemptId);
                if (result.success && result.attempt && isMounted) {
                    // If already submitted, redirect to results
                    if (result.attempt.submitted) {
                        router.push(`/exam/${examId}/result?attemptId=${attemptId}`);
                        return;
                    }
                    // Restore answers
                    if (result.attempt.answers) {
                        setAnswers(result.attempt.answers);
                    }
                }
            } catch (e) {
                console.error("Failed to restore attempt state", e);
            }
        };

        restoreAttemptState();
        
        return () => {
            isMounted = false;
        };
    }, [attemptId, examId, router]);

    // Auto-submit when time expires (with protection against premature triggers)
    useEffect(() => {
        // Only auto-submit if:
        // 1. Timer actually reached 0
        // 2. Not already submitting
        // 3. Haven't already auto-submitted
        // 4. User has started the exam (entered fullscreen)
        if (timeLeft === 0 && !isSubmitting && !hasAutoSubmitted.current && hasEnteredFullscreen.current) {
            console.log('⏰ Timer expired - auto-submitting exam');
            hasAutoSubmitted.current = true;
            handleSubmit(true);
        }
    }, [timeLeft, isSubmitting]);

    // TASK 6: Anti-Cheat with proper violation-based auto-submit
    useEffect(() => {
        if (!antiCheatEnabled) return; // Skip if anti-cheat is disabled
        
        const handleVisibilityChange = async () => {
            if (!document.hidden) {
                // Page became visible - do nothing
                console.log('✅ Tab is now visible');
            } else {
                // CRITICAL: Only track violations if user has started the exam (entered fullscreen)
                if (!hasEnteredFullscreen.current) {
                    console.log('User has not started exam yet - not recording tab switch violation');
                    return;
                }
                
                // Track tab switches for anti-cheat
                console.log(`⚠️ Tab switch detected while in exam.`);
                
                // Record violation on server - ONLY increment based on server response
                try {
                    const result = await recordViolationAction(attemptId);
                    
                    if (result.success && result.violations !== undefined) {
                        // Update violations from server (source of truth)
                        setViolations(result.violations);
                        console.log(`Server recorded violation. Count: ${result.violations}/${maxViolations}`);
                        
                        // Check if should auto-submit
                        console.log(`🔍 Checking auto-submit: violations=${result.violations}, max=${maxViolations}, hasAutoSubmitted=${hasAutoSubmitted.current}`);
                        
                        if (result.violations >= maxViolations && !hasAutoSubmitted.current) {
                            console.log(`🚨🚨🚨 TAB SWITCH - EXCEEDED LIMIT (${result.violations}/${maxViolations}) - FORCE AUTO-SUBMIT NOW! 🚨🚨🚨`);
                            hasAutoSubmitted.current = true;
                            
                            // Submit immediately - no delay needed
                            handleSubmit(true);
                        } else if (result.violations >= maxViolations) {
                            console.log(`⚠️ Already flagged for auto-submit, waiting...`);
                        }
                    }
                } catch (e) {
                    console.error("Failed to record violation", e);
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [endTime, isSubmitting, attemptId, antiCheatEnabled, maxViolations]);

    // TASK 6: Window blur detection - DISABLED (causes false positives)
    // Commenting out because blur fires on normal page interactions
    /*
    useEffect(() => {
        if (!antiCheatEnabled) return;
        
        const handleBlur = async () => {
            setViolations(v => v + 1);
            
            // Record violation on server
            try {
                const result = await recordViolationAction(attemptId);
                if (result.success && result.forceSubmit && !hasAutoSubmitted.current) {
                    hasAutoSubmitted.current = true;
                    alert(`Too many violations detected (${result.violations}/${result.maxViolations}). Exam will be auto-submitted.`);
                    await handleSubmit(true);
                }
            } catch (e) {
                console.error("Failed to record violation", e);
            }
        };

        window.addEventListener("blur", handleBlur);
        return () => window.removeEventListener("blur", handleBlur);
    }, [attemptId, antiCheatEnabled]);
    */

    // TASK 6: Fullscreen exit detection with proper auto-submit
    useEffect(() => {
        if (!antiCheatEnabled) return; // Skip if anti-cheat is disabled
        
        const handleFullscreenChange = async () => {
            if (!document.fullscreenElement) {
                // User exited fullscreen
                setIsFullscreen(false);
                
                console.log(`⚠️ Fullscreen exit detected.`);
                
                // Show re-enter fullscreen prompt
                setShowFullscreenPrompt(true);
                
                // CRITICAL: Only record violation if user has entered fullscreen at least once
                // This prevents recording a violation on page load when user hasn't entered fullscreen yet
                if (!hasEnteredFullscreen.current) {
                    console.log('User has not entered fullscreen yet - not recording violation');
                    return;
                }
                
                // Record violation on server - ONLY increment based on server response
                try {
                    const result = await recordViolationAction(attemptId);
                    
                    if (result.success && result.violations !== undefined) {
                        // Update violations from server (source of truth)
                        setViolations(result.violations);
                        console.log(`Server recorded violation. Count: ${result.violations}/${maxViolations}`);
                        
                        // Check if should auto-submit
                        console.log(`🔍 Checking auto-submit: violations=${result.violations}, max=${maxViolations}, hasAutoSubmitted=${hasAutoSubmitted.current}`);
                        
                        if (result.violations >= maxViolations && !hasAutoSubmitted.current) {
                            console.log(`🚨🚨🚨 FULLSCREEN EXIT - EXCEEDED LIMIT (${result.violations}/${maxViolations}) - FORCE AUTO-SUBMIT NOW! 🚨🚨🚨`);
                            hasAutoSubmitted.current = true;
                            
                            // Submit immediately - no delay needed
                            handleSubmit(true);
                        } else if (result.violations >= maxViolations) {
                            console.log(`⚠️ Already flagged for auto-submit, waiting...`);
                        }
                    }
                } catch (e) {
                    console.error("Failed to record violation", e);
                }
            } else {
                // User entered fullscreen
                const wasFirstEntry = !hasEnteredFullscreen.current;
                
                setIsFullscreen(true);
                setShowFullscreenPrompt(false);
                
                // Mark that user has entered fullscreen
                if (wasFirstEntry) {
                    hasEnteredFullscreen.current = true;
                    console.log('✅ User entered fullscreen for the first time - timer will start now!');
                } else {
                    console.log('✅ User re-entered fullscreen - timer resuming');
                }
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, [attemptId, antiCheatEnabled, maxViolations]);

    // TASK 8: Enhanced auto-save with offline support
    useEffect(() => {
        const autoSave = async () => {
            // Don't save if no answers yet or already submitting
            if (Object.keys(answers).length === 0 || isSubmitting) return;

            // Get the last answered question
            const questionIds = Object.keys(answers);
            const lastQuestionId = questionIds[questionIds.length - 1];
            const lastAnswer = answers[lastQuestionId];

            if (lastQuestionId && lastAnswer) {
                // If offline, add to sync queue
                if (!isOnline) {
                    // Check if not already in queue
                    const existingIndex = syncQueueRef.current.findIndex(
                        item => item.questionId === lastQuestionId
                    );
                    
                    if (existingIndex >= 0) {
                        // Update existing item
                        syncQueueRef.current[existingIndex].answer = lastAnswer;
                    } else {
                        // Add new item
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
                    
                    // Remove from pending if successful
                    if (result.success) {
                        setPendingSaves(prev => prev.filter(id => id !== lastQuestionId));
                    }
                    
                    // DON'T force submit on auto-save - let the timer handle it
                    // The forceSubmit from saveAnswer was causing premature submissions
                    // Only the timer (timeLeft === 0) should trigger auto-submit
                } catch (e) {
                    console.error("Auto-save failed", e);
                    // Add to queue for retry
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

        // Debounce auto-save
        const timeout = setTimeout(autoSave, 500);
        return () => clearTimeout(timeout);
    }, [answers, attemptId, isSubmitting, isOnline]);

    const handleOptionSelect = (questionId: string, optionId: string) => {
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

        console.log(auto ? '🤖 AUTO-SUBMITTING exam (violations or timer)' : '✅ MANUAL submission by user');

        // TASK 8: Block submission if offline with pending saves
        if (!isOnline && pendingSaves.length > 0) {
            if (!auto) {
                alert("Cannot submit exam while offline. Please wait for connection to sync your answers.");
            }
            return;
        }

        setIsSubmitting(true);

        try {
            // CRITICAL FIX: Save all current answers before submitting (especially for auto-submit)
            console.log('💾 Saving all answers before submission...', { answerCount: Object.keys(answers).length, auto });
            
            // Save each answer to ensure server has latest data
            const answerEntries = Object.entries(answers);
            for (const [questionId, optionId] of answerEntries) {
                try {
                    await saveAnswerAction(attemptId, questionId, optionId);
                } catch (e) {
                    console.error(`Failed to save answer for question ${questionId}`, e);
                }
            }
            
            // TASK 8: Ensure all pending saves are synced before submission
            if (pendingSaves.length > 0) {
                await syncPendingAnswers();
                // Wait a moment for sync to complete
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log('✅ All answers saved. Submitting exam...');
            const result = await submitExamAction(attemptId);
            
            if (result.success) {
                console.log('🎉 Exam submitted successfully - redirecting to results');
                // TASK 8: Clear local storage after successful submission
                const storageKey = `exam_${attemptId}_answers`;
                localStorage.removeItem(storageKey);
                
                // Use replace instead of push for smoother transition (no back button issues)
                router.replace(`/exam/${examId}/result?attemptId=${attemptId}`);
            } else {
                console.error('❌ Submission failed:', result.error);
                if (!auto) {
                    alert(result.error || "Submission failed");
                }
                setIsSubmitting(false);
            }
        } catch (e) {
            console.error("❌ Submit exception:", e);
            if (!auto) {
                alert("An error occurred during submission. Please try again.");
            }
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    // Progress bar
    const progress = ((Object.keys(answers).length) / questions.length) * 100;

    // Handler to re-enter fullscreen
    const handleEnterFullscreen = async () => {
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
                setShowFullscreenPrompt(false);
            }
        } catch (err) {
            console.error("Failed to enter fullscreen:", err);
            alert("Please allow fullscreen mode to continue the exam.");
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-muted/20">
            {/* Fullscreen Prompt Overlay */}
            {antiCheatEnabled && showFullscreenPrompt && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <CardTitle className="text-center text-2xl">🔒 Fullscreen Required</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-center text-muted-foreground">
                                This exam requires fullscreen mode for security purposes.
                            </p>
                            <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800 border border-yellow-200">
                                <strong>⚠️ Important:</strong>
                                <ul className="list-disc pl-4 mt-2 space-y-1">
                                    <li>You must stay in fullscreen mode</li>
                                    <li>Exiting fullscreen will count as a violation</li>
                                    <li>After {maxViolations} violations, exam will auto-submit</li>
                                </ul>
                            </div>
                            {violations > 0 && (
                                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                                    <strong>Current violations: {violations}/{maxViolations}</strong>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button 
                                onClick={handleEnterFullscreen}
                                className="w-full text-lg h-12"
                            >
                                Enter Fullscreen & Continue
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
            {/* Header / Top Bar */}
            <header className="sticky top-0 z-10 bg-background border-b shadow-sm p-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="font-semibold">{studentName}</h1>
                        <p className="text-xs text-muted-foreground">Roll: {rollNumber}</p>
                        {/* TASK 8: Offline indicator */}
                        {!isOnline && (
                            <p className="text-xs text-orange-600 font-medium">⚠️ Offline - Changes saved locally</p>
                        )}
                        {isOnline && pendingSaves.length > 0 && (
                            <p className="text-xs text-blue-600 font-medium">🔄 Syncing {pendingSaves.length} answer{pendingSaves.length !== 1 ? 's' : ''}...</p>
                        )}
                    </div>
                    <div className={cn(
                        "flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-md",
                        timeLeft < 60 ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
                    )}>
                        <Clock className="h-5 w-5" />
                        {formatTime(timeLeft)}
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleSubmit(false)}
                        disabled={isSubmitting || (!isOnline && pendingSaves.length > 0)}
                        title={!isOnline && pendingSaves.length > 0 ? "Cannot submit while offline with pending changes" : ""}
                    >
                        {isSubmitting ? "Submitting..." : "Finish Exam"}
                    </Button>
                </div>
                {antiCheatEnabled && violations > 0 && (
                    <div className={`text-sm px-4 py-2 text-center animate-pulse ${
                        violations >= maxViolations ? 'bg-red-100 text-red-700' :
                        violations >= maxViolations - 1 ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                        ⚠️ Warning: You have {violations} violation{violations !== 1 ? 's' : ''} (max: {maxViolations}).
                        {violations >= maxViolations - 1 && violations < maxViolations && (
                            <span className="font-bold"> One more will auto-submit your exam!</span>
                        )}
                        {violations >= maxViolations && (
                            <span className="font-bold"> Exam will be submitted!</span>
                        )}
                    </div>
                )}
                {/* Progress Bar */}
                <div className="h-1 w-full bg-secondary mt-0">
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto p-4 md:p-8 max-w-3xl">
                {questions.length > 0 ? (
                    <Card className="min-h-100 flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-medium text-muted-foreground">
                                    Question {currentQuestionIndex + 1} of {questions.length}
                                </span>
                            </div>
                            <CardTitle className="text-xl md:text-2xl leading-relaxed">
                                {currentQuestion.text}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <RadioGroup
                                value={answers[currentQuestion.id] || ""}
                                onValueChange={(val: string) => handleOptionSelect(currentQuestion.id, val)}
                                className="space-y-3"
                            >
                                {currentQuestion.options.map((opt) => (
                                    <div
                                        key={opt.id}
                                        className={cn(
                                            "flex items-center space-x-2 border rounded-lg p-4 transition-all cursor-pointer hover:bg-accent",
                                            answers[currentQuestion.id] === opt.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-input"
                                        )}
                                        onClick={() => handleOptionSelect(currentQuestion.id, opt.id)}
                                    >
                                        <RadioGroupItem value={opt.id} id={opt.id} />
                                        <Label htmlFor={opt.id} className="flex-1 cursor-pointer font-normal text-base">
                                            {opt.text}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </CardContent>
                        <CardFooter className="justify-between border-t p-6 bg-muted/10">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                            >
                                Previous
                            </Button>

                            {isLastQuestion ? (
                                <Button onClick={() => handleSubmit(false)} disabled={isSubmitting}>
                                    {isSubmitting ? "Submitting..." : "Submit Exam"}
                                </Button>
                            ) : (
                                <Button onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}>
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
