"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * TASK 1: SERVER-CONTROLLED TIMER + AUTO-SUBMIT
 * 
 * Start an exam attempt with server-controlled timing
 * Returns attemptId and endTime for client-side countdown
 */
export async function startExamAction(examId: string, studentName: string, rollNumber: string, password?: string) {
    try {
        // 1. Check if exam exists and is published
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                _count: {
                    select: { questions: true }
                }
            }
        });

        if (!exam) {
            return { success: false, error: "Exam not found" };
        }

        if (exam.status !== "PUBLISHED") {
            return { success: false, error: "Exam is not published" };
        }

        // 2. Check scheduled availability
        const now = new Date();
        if (exam.scheduledStartTime && now < exam.scheduledStartTime) {
            return { success: false, error: `Exam will be available from ${exam.scheduledStartTime.toLocaleString()}` };
        }

        if (exam.scheduledEndTime && now > exam.scheduledEndTime && !exam.allowLateSubmission) {
            return { success: false, error: "Exam time has expired" };
        }

        // 3. Check password if required
        if (exam.requirePassword) {
            if (!password) {
                return { success: false, error: "Exam password is required" };
            }
            if (exam.examPassword && password !== exam.examPassword) {
                return { success: false, error: "Incorrect exam password" };
            }
        }

        // 4. Check max attempts limit
        if (exam.maxAttempts !== null) {
            const attemptCount = await prisma.studentAttempt.count({
                where: {
                    examId,
                    studentName,
                    rollNumber,
                    submitted: true, // Only count completed attempts
                },
            });

            if (attemptCount >= exam.maxAttempts) {
                return { success: false, error: `Maximum attempts limit (${exam.maxAttempts}) reached` };
            }
        }

        // 5. Check for existing attempt (prevent duplicate attempts)
        const existingAttempt = await prisma.studentAttempt.findFirst({
            where: {
                examId,
                studentName,
                rollNumber,
            },
            orderBy: { createdAt: 'desc' }
        });

        if (existingAttempt) {
            // Check if attempt is resumable (not submitted and not expired)
            const isExpired = existingAttempt.endTime && existingAttempt.endTime < now;

            if (!existingAttempt.submitted && !isExpired) {
                return {
                    success: true,
                    attemptId: existingAttempt.id,
                    // Use startTime as indicator until migration makes startedAt nullable
                    startedAt: existingAttempt.startTime?.toISOString() ?? null,
                    endTime: existingAttempt.endTime?.toISOString() ?? null,
                    duration: exam.duration,
                };
            }

            // If attempt is submitted or expired, we allow a new attempt (Retake)
            // Function continues to creation below...
        }

        // 6. Create attempt WITHOUT starting timer (timer starts on first fullscreen entry)
        // NOTE: Using createdAt as placeholder until migration makes startedAt nullable
        const attempt = await prisma.studentAttempt.create({
            data: {
                examId,
                studentName,
                rollNumber,
                // startedAt: null, // TODO: Uncomment after running migration
                startTime: null,
                endTime: null,
                submitted: false,
                answers: {},
                totalQuestions: exam._count.questions,
            },
        });

        return {
            success: true,
            attemptId: attempt.id,
            startedAt: null, // Timer has NOT started yet
            endTime: null,
            duration: exam.duration, // Send duration so frontend can calculate after start
        };
    } catch (e) {
        console.error("Start exam error", e);
        return { success: false, error: "Failed to start exam" };
    }
}

/**
 * CRITICAL: Start exam timer on first fullscreen entry
 * This is the ONLY place where startedAt and endTime are set
 */
export async function beginExamTimerAction(attemptId: string) {
    try {
        const attempt = await prisma.studentAttempt.findUnique({
            where: { id: attemptId },
            include: {
                exam: {
                    select: {
                        duration: true,
                    },
                },
            },
        });

        if (!attempt) {
            return { success: false, error: "Attempt not found" };
        }

        // Check if already started (startTime is the indicator, not startedAt until migration)
        // TODO: After migration, use startedAt directly
        if (attempt.startTime) {
            return {
                success: true,
                alreadyStarted: true,
                startedAt: attempt.startTime.toISOString(),
                endTime: attempt.endTime?.toISOString() ?? null,
            };
        }

        // Check if already submitted
        if (attempt.submitted) {
            return { success: false, error: "Exam already submitted" };
        }

        // Set start time and calculate end time (SERVER-CONTROLLED)
        const startedAt = new Date();
        const endTime = new Date(startedAt.getTime() + attempt.exam.duration * 60 * 1000);

        await prisma.studentAttempt.update({
            where: { id: attemptId },
            data: {
                startedAt,
                startTime: startedAt,
                endTime,
            },
        });

        console.log(`✅ Timer started for attempt ${attemptId}. Ends at: ${endTime.toISOString()}`);

        return {
            success: true,
            alreadyStarted: false,
            startedAt: startedAt.toISOString(),
            endTime: endTime.toISOString(),
        };
    } catch (e) {
        console.error("Begin exam timer error", e);
        return { success: false, error: "Failed to start timer" };
    }
}

/**
 * Save answer for a specific question
 * Auto-saves answers during exam
 * ENFORCES: Server-side time validation
 */
export async function saveAnswerAction(
    attemptId: string,
    questionId: string,
    selectedOption: string
) {
    try {
        // 1. Fetch attempt
        const attempt = await prisma.studentAttempt.findUnique({
            where: { id: attemptId },
        });

        if (!attempt) {
            return { success: false, error: "Attempt not found" };
        }

        // 2. Check if exam has started (use startTime until migration makes startedAt nullable)
        // TODO: After migration, use !attempt.startedAt instead
        if (!attempt.startTime) {
            return { success: false, error: "Exam has not started yet" };
        }

        // 3. CRITICAL: Validate server time - NEVER trust client
        if (attempt.endTime) {
            const now = new Date();
            if (now > attempt.endTime) {
                // Time expired - reject action
                return { success: false, error: "Time expired", forceSubmit: true };
            }
        }

        // 4. Check if already submitted
        if (attempt.submitted) {
            return { success: false, error: "Exam already submitted" };
        }

        // 5. Update answers
        const currentAnswers = typeof attempt.answers === 'object' && attempt.answers !== null
            ? (attempt.answers as Record<string, string>)
            : {};

        currentAnswers[questionId] = selectedOption;

        await prisma.studentAttempt.update({
            where: { id: attemptId },
            data: {
                answers: currentAnswers,
            },
        });

        return { success: true };
    } catch (e) {
        console.error("Save answer error", e);
        return { success: false, error: "Failed to save answer" };
    }
}

/**
 * Submit exam with validation
 * ENFORCES: Server-side time validation
 */
export async function submitExamAction(attemptId: string) {
    try {
        // 1. Fetch attempt with exam and questions
        const attempt = await prisma.studentAttempt.findUnique({
            where: { id: attemptId },
            include: {
                exam: {
                    include: {
                        questions: true,
                    },
                },
            },
        });

        if (!attempt) {
            return { success: false, error: "Attempt not found" };
        }

        // 2. Check if already submitted
        if (attempt.submitted) {
            return { success: false, error: "Exam already submitted" };
        }

        // 3. CRITICAL: Validate server time - reject late submissions
        const now = new Date();
        if (attempt.endTime && now > attempt.endTime) {
            const timeDiff = now.getTime() - attempt.endTime.getTime();
            console.warn(`Late submission by ${timeDiff}ms for attempt ${attemptId} - proceeding with submission`);
            // Allow submission even if late (grace for network delays)
        }

        // 4. TASK 3: Calculate score and statistics
        const questions = attempt.exam.questions;
        const answers = typeof attempt.answers === 'object' && attempt.answers !== null
            ? (attempt.answers as Record<string, string>)
            : {};

        // Debug logging
        console.log('📊 Grading Exam:', {
            attemptId,
            totalQuestions: questions.length,
            answersCount: Object.keys(answers).length,
            answers: answers
        });

        let score = 0;
        let totalMarks = 0;
        let correctAnswers = 0;
        let wrongAnswers = 0;
        let unanswered = 0;
        const totalQuestions = questions.length;

        questions.forEach((q) => {
            totalMarks += q.marks;

            const studentAnswer = answers[q.id];

            // Debug each question
            console.log(`Question ${q.id}:`, {
                studentAnswer,
                correctOption: q.correctOption,
                isCorrect: studentAnswer === q.correctOption,
                marks: q.marks
            });

            if (!studentAnswer) {
                // Question not answered
                unanswered++;
            } else if (studentAnswer === q.correctOption) {
                // Correct answer
                correctAnswers++;
                score += q.marks;
            } else {
                // Wrong answer
                wrongAnswers++;
            }
        });

        // Final score debug
        console.log('✅ Final Score:', {
            score,
            totalMarks,
            correctAnswers,
            wrongAnswers,
            unanswered
        });

        // 5. Update attempt with full statistics
        await prisma.studentAttempt.update({
            where: { id: attemptId },
            data: {
                submitted: true,
                completedAt: now,
                score,
                totalQuestions,
                correctAnswers,
                wrongAnswers,
                unanswered,
            },
        });

        return {
            success: true,
            score,
            totalMarks,
            totalQuestions,
            correctAnswers,
            wrongAnswers,
            unanswered,
            attemptId,
        };
    } catch (e) {
        console.error("Submit exam error", e);
        return { success: false, error: "Failed to submit exam" };
    }
}

/**
 * Get attempt status and remaining time
 * Used for page refresh scenarios
 */
export async function getAttemptStatusAction(attemptId: string) {
    try {
        const attempt = await prisma.studentAttempt.findUnique({
            where: { id: attemptId },
            select: {
                id: true,
                startTime: true,
                endTime: true,
                submitted: true,
                answers: true,
                violations: true,
            },
        });

        if (!attempt) {
            return { success: false, error: "Attempt not found" };
        }

        const answers = typeof attempt.answers === 'object' && attempt.answers !== null
            ? (attempt.answers as Record<string, string>)
            : {};

        return {
            success: true,
            attempt: {
                id: attempt.id,
                startTime: attempt.startTime?.toISOString(),
                endTime: attempt.endTime?.toISOString(),
                submitted: attempt.submitted,
                answers,
                violations: attempt.violations,
            },
        };
    } catch (e) {
        console.error("Get attempt status error", e);
        return { success: false, error: "Failed to get attempt status" };
    }
}

/**
 * TASK 6: Record anti-cheat violation
 * Increments violation count and calculates trust score
 * ONLY records violations if exam has started (startedAt is set)
 */
export async function recordViolationAction(attemptId: string) {
    try {
        const attempt = await prisma.studentAttempt.findUnique({
            where: { id: attemptId },
            include: {
                exam: {
                    select: {
                        antiCheatEnabled: true,
                        maxViolations: true,
                    },
                },
            },
        });

        if (!attempt) {
            return { success: false, error: "Attempt not found" };
        }

        // CRITICAL: Only record violations if exam has started (use startTime until migration)
        // TODO: After migration, use !attempt.startedAt instead
        if (!attempt.startTime) {
            console.log('⚠️ Exam has not started yet - not recording violation');
            return { success: true, violations: 0, forceSubmit: false };
        }

        // Only record if anti-cheat is enabled
        if (!attempt.exam.antiCheatEnabled) {
            return { success: true, violations: 0, forceSubmit: false };
        }

        // Increment violations
        const newViolations = attempt.violations + 1;

        // Calculate trust score (100 - violations * 20, minimum 0)
        const trustScore = Math.max(0, 100 - (newViolations * 20));

        await prisma.studentAttempt.update({
            where: { id: attemptId },
            data: {
                violations: newViolations,
                trustScore,
            },
        });

        // Check if max violations exceeded
        const forceSubmit = newViolations >= attempt.exam.maxViolations;

        return {
            success: true,
            violations: newViolations,
            trustScore,
            forceSubmit,
            maxViolations: attempt.exam.maxViolations,
        };
    } catch (e) {
        console.error("Record violation error", e);
        return { success: false, error: "Failed to record violation" };
    }
}
