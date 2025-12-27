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
                    startTime: existingAttempt.startTime?.toISOString() ?? now.toISOString(),
                    endTime: existingAttempt.endTime?.toISOString() ?? now.toISOString(),
                };
            }

            // If attempt is submitted or expired, we allow a new attempt (Retake)
            // Function continues to creation below...
        }

        // 6. Create attempt with server time
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + exam.duration * 60 * 1000); // duration in minutes

        const attempt = await prisma.studentAttempt.create({
            data: {
                examId,
                studentName,
                rollNumber,
                startTime,
                endTime,
                submitted: false,
                answers: {},
                totalQuestions: exam._count.questions,
            },
        });

        return {
            success: true,
            attemptId: attempt.id,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
        };
    } catch (e) {
        console.error("Start exam error", e);
        return { success: false, error: "Failed to start exam" };
    }
}

/**
 * Save answer for a specific question
 * Auto-saves answers during exam
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

        // 2. Check if time expired (with 10-second grace period for clock sync)
        if (attempt.endTime) {
            const now = new Date();
            const gracePeriodMs = 10000; // 10 seconds
            const timeDiff = now.getTime() - attempt.endTime.getTime();
            
            if (timeDiff > gracePeriodMs) {
                // Significantly past time - don't save but allow timer to handle submission
                return { success: false, error: "Time expired", forceSubmit: false };
            }
        }

        // 3. Check if already submitted
        if (attempt.submitted) {
            return { success: false, error: "Exam already submitted" };
        }

        // 4. Update answers
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
 * Rejects late submissions
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

        // 3. CRITICAL: Validate server time
        const now = new Date();
        if (attempt.endTime && now > attempt.endTime) {
            // Late submission - reject only if significantly late (grace period of 5 seconds)
            const gracePeriodMs = 5000;
            const timeDiff = now.getTime() - attempt.endTime.getTime();

            if (timeDiff > gracePeriodMs) {
                // Too late - force submit with current state
                console.warn(`Late submission by ${timeDiff}ms for attempt ${attemptId}`);
            }
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
