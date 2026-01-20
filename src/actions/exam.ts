"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PaymentService } from "@/lib/payment-service";
import { verifySession } from "@/lib/session";

export async function createExamAction(formData: FormData) {
    const session = await verifySession();
    if (!session) {
        redirect("/login");
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const durationStr = formData.get("duration") as string;
    const priceMode = (formData.get("priceMode") as string) || "FREE";
    
    // Validate required fields
    if (!title || !durationStr) {
        throw new Error("Title and duration are required");
    }

    const duration = parseInt(durationStr);
    if (isNaN(duration) || duration <= 0) {
        throw new Error("Duration must be a positive number");
    }

    // Advanced settings with defaults
    const antiCheatEnabled = formData.get("antiCheatEnabled") === "true";
    const maxViolationsStr = formData.get("maxViolations") as string;
    const maxViolations = maxViolationsStr ? parseInt(maxViolationsStr) : 3;
    
    // Validate maxViolations
    if (isNaN(maxViolations) || maxViolations < 1) {
        throw new Error("Max violations must be a positive number");
    }
    
    const passPercentageStr = formData.get("passPercentage") as string;
    const passPercentage = passPercentageStr ? parseInt(passPercentageStr) : 50;
    
    // Validate passPercentage
    if (isNaN(passPercentage) || passPercentage < 0 || passPercentage > 100) {
        throw new Error("Pass percentage must be between 0 and 100");
    }
    
    const shuffleQuestions = formData.get("shuffleQuestions") === "true";
    const shuffleOptions = formData.get("shuffleOptions") === "true";
    // Checkbox sends "true" when checked, null when unchecked. Default to true for showResultsImmediately.
    const showResultsImmediately = formData.get("showResultsImmediately") === "true" || formData.get("showResultsImmediately") === null;
    const requirePassword = formData.get("requirePassword") === "true";
    const examPasswordRaw = formData.get("examPassword") as string | null;
    const examPassword = examPasswordRaw && examPasswordRaw.trim() !== "" ? examPasswordRaw : null;
    const maxAttemptsStr = formData.get("maxAttempts") as string;
    const maxAttempts = maxAttemptsStr && maxAttemptsStr.trim() !== "" ? parseInt(maxAttemptsStr) : null;
    
    // Validate maxAttempts if provided
    if (maxAttempts !== null && (isNaN(maxAttempts) || maxAttempts < 1)) {
        throw new Error("Max attempts must be a positive number");
    }
    
    // Scheduling settings
    const scheduledStartTimeStr = formData.get("scheduledStartTime") as string | null;
    const scheduledStartTime = scheduledStartTimeStr && scheduledStartTimeStr.trim() !== "" 
        ? new Date(scheduledStartTimeStr) 
        : null;
    
    const scheduledEndTimeStr = formData.get("scheduledEndTime") as string | null;
    const scheduledEndTime = scheduledEndTimeStr && scheduledEndTimeStr.trim() !== "" 
        ? new Date(scheduledEndTimeStr) 
        : null;
    
    const allowLateSubmission = formData.get("allowLateSubmission") === "true";
    
    // Validate scheduling times
    if (scheduledStartTime && scheduledEndTime && scheduledStartTime >= scheduledEndTime) {
        throw new Error("End time must be after start time");
    }
    
    // Negative marking settings
    const negativeMarking = formData.get("negativeMarking") === "true";
    const negativeMarksStr = formData.get("negativeMarks") as string;
    const negativeMarks = negativeMarksStr && negativeMarksStr.trim() !== "" 
        ? parseFloat(negativeMarksStr) 
        : 0;
    
    // Validate negative marks
    if (negativeMarks < 0 || negativeMarks > 5) {
        throw new Error("Negative marks must be between 0 and 5");
    }

    let examId = "";

    try {
        const teacherId = session.userId;
        
        // Verify the user exists in the database
        const user = await prisma.user.findUnique({
            where: { id: teacherId }
        });
        
        if (!user) {
            console.error("User not found in database. Session userId:", teacherId);
            throw new Error("Your account was not found. Please logout and login again. If you just registered, your account may not be properly created.");
        }
        
        // Log the data being sent to Prisma for debugging
        console.log("Creating exam with data:", {
            title,
            description,
            duration,
            priceMode,
            teacherId,
            antiCheatEnabled,
            maxViolations,
            passPercentage,
            shuffleQuestions,
            shuffleOptions,
            showResultsImmediately,
            requirePassword,
            examPassword: examPassword ? "[SET]" : null,
            maxAttempts,
            scheduledStartTime,
            scheduledEndTime,
            allowLateSubmission,
            negativeMarking,
            negativeMarks,
        });

        const exam = await prisma.exam.create({
            data: {
                title,
                description: description || null,
                duration,
                priceMode: priceMode as "FREE" | "PAID_BY_TEACHER",
                teacherId,
                antiCheatEnabled,
                maxViolations,
                passPercentage,
                shuffleQuestions,
                shuffleOptions,
                showResultsImmediately,
                requirePassword,
                examPassword: requirePassword && examPassword ? examPassword : null,
                maxAttempts,
                scheduledStartTime,
                scheduledEndTime,
                allowLateSubmission,
                negativeMarking,
                negativeMarks,
            },
        });
        examId = exam.id;
        console.log("Exam created successfully with ID:", examId);

    } catch (error) {
        console.error("Failed to create exam - Full error:", error);
        // Expose more detailed error information
        if (error instanceof Error) {
            throw new Error(`Failed to create exam: ${error.message}`);
        }
        throw new Error("Failed to create exam: Unknown error");
    }

    if (examId) {
        redirect(`/dashboard/exams/${examId}`);
    }
}

export async function bulkImportQuestionsAction(
    examId: string,
    questions: Array<{
        text: string;
        options: { id: string; text: string }[];
        correctOption: string;
        marks?: number;
        negativeMarks?: number;
        timeLimit?: number;
        explanation?: string;
        difficulty?: string;
    }>
) {
    "use server";

    const session = await verifySession();
    if (!session?.userId) {
        throw new Error("Unauthorized");
    }

    try {
        // Verify exam ownership
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            select: { teacherId: true, status: true },
        });

        if (!exam) {
            throw new Error("Exam not found");
        }

        if (exam.teacherId !== session.userId) {
            throw new Error("Unauthorized");
        }

        if (exam.status === "PUBLISHED") {
            throw new Error("Cannot add questions to a published exam");
        }

        // Validate questions
        if (!questions || questions.length === 0) {
            throw new Error("No questions to import");
        }

        if (questions.length > 100) {
            throw new Error("Cannot import more than 100 questions at once");
        }

        // Create all questions in a transaction
        const createdQuestions = await prisma.$transaction(
            questions.map((q) =>
                prisma.question.create({
                    data: {
                        examId,
                        text: q.text,
                        options: q.options,
                        correctOption: q.correctOption,
                        marks: q.marks || 1,
                        negativeMarks: q.negativeMarks || 0,
                        timeLimit: q.timeLimit || null,
                        explanation: q.explanation || null,
                        difficulty: q.difficulty || "MEDIUM",
                    },
                })
            )
        );

        revalidatePath(`/dashboard/exams/${examId}`);
        return {
            success: true,
            count: createdQuestions.length,
            message: `Successfully imported ${createdQuestions.length} question(s)`,
        };
    } catch (error: any) {
        console.error("Bulk import error:", error);
        throw new Error(error.message || "Failed to import questions");
    }
}

export async function addQuestionAction(examId: string, formData: FormData) {
    // Ideally we check ownership here too
    const session = await verifySession();
    if (!session) return;

    const text = formData.get("text") as string;
    const correctOption = formData.get("correctOption") as string; // Will be the index 0-3
    
    // Options are passed as separate fields option0, option1, etc.
    // Dynamically detect how many options were sent
    const options = [];
    let i = 0;
    while (formData.has(`option${i}`)) {
        options.push({
            id: `opt-${i}`,
            text: formData.get(`option${i}`) as string
        });
        i++;
    }

    // Fallback to 4 options if none detected
    if (options.length === 0) {
        for (let j = 0; j < 4; j++) {
            options.push({
                id: `opt-${j}`,
                text: formData.get(`option${j}`) as string
            });
        }
    }

    try {
        await prisma.question.create({
            data: {
                examId,
                text,
                options: JSON.stringify(options), // Storing as JSON
                correctOption: options[parseInt(correctOption)].id,
                marks: 1, // Default 1 mark per question
            }
        });
        revalidatePath(`/dashboard/exams/${examId}`);
    } catch (e) {
        console.error("Failed to add question", e);
    }
}

export async function publishExamAction(examId: string, formData: FormData) {
    try {
        const session = await verifySession();
        if (!session) return { error: "Unauthorized" };

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: { questions: true }
        });

        if (!exam) return { error: "Exam not found" };
        if (exam.teacherId !== session.userId) return { error: "Unauthorized" };
        if (exam.status === "PUBLISHED") return { error: "Already published" };
        if (exam.questions.length === 0) return { error: "Cannot publish empty exam" };

        const userId = session.userId;

        // NEW PRICING MODEL: Check if user can publish and determine exam mode
        const publishCheck = await PaymentService.canPublishExam(userId);
        
        if (!publishCheck.canPublish) {
            return { 
                error: publishCheck.reason || "Cannot publish exam",
                needsUpgrade: true,
                freeExamsRemaining: publishCheck.freeExamsRemaining,
                oneTimeExamsRemaining: publishCheck.oneTimeExamsRemaining
            };
        }

        // Consume quota and get exam mode
        const examMode = await PaymentService.consumeExamQuota(userId);

        // Publish exam with appropriate mode
        await prisma.exam.update({
            where: { id: examId },
            data: { 
                status: "PUBLISHED",
                examMode: examMode
            }
        });

        console.log(`✅ Exam ${examId} published in ${examMode} mode`);

        revalidatePath(`/dashboard/exams/${examId}`);
        revalidatePath('/dashboard');
        
        return { 
            success: true, 
            examMode,
            message: examMode === 'FREE' 
                ? `Exam published! ${publishCheck.freeExamsRemaining ? publishCheck.freeExamsRemaining - 1 : 0}/3 free exams remaining.`
                : examMode === 'ONE_TIME'
                ? 'Exam published with full integrity features!'
                : 'Exam published with Pro features!'
        };

    } catch (e: any) {
        console.error("Publish exam error:", e);
        return { error: e.message || "System error during publish" };
    }
}

export async function deleteQuestionAction(questionId: string, examId: string) {
    try {
        const session = await verifySession();
        if (!session) return { error: "Unauthorized" };

        // Verify the exam belongs to the user
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            select: { teacherId: true, status: true }
        });

        if (!exam) return { error: "Exam not found" };
        if (exam.teacherId !== session.userId) return { error: "Unauthorized" };
        if (exam.status === "PUBLISHED") return { error: "Cannot delete questions from published exam" };

        await prisma.question.delete({
            where: { id: questionId }
        });

        revalidatePath(`/dashboard/exams/${examId}`);
        return { success: true };

    } catch (e) {
        console.error(e);
        return { error: "Failed to delete question" };
    }
}

export async function deleteExamAction(examId: string) {
    try {
        const session = await verifySession();
        if (!session) return { error: "Unauthorized" };

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            select: { teacherId: true }
        });

        if (!exam) return { error: "Exam not found" };
        if (exam.teacherId !== session.userId) return { error: "Unauthorized" };

        await prisma.exam.delete({
            where: { id: examId }
        });

        revalidatePath('/dashboard/exams');
        return { success: true };

    } catch (e) {
        console.error(e);
        return { error: "Failed to delete exam" };
    }
}

export async function updateExamAction(examId: string, formData: FormData) {
    try {
        const session = await verifySession();
        if (!session) return { error: "Unauthorized" };

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            select: { teacherId: true, status: true }
        });

        if (!exam) return { error: "Exam not found" };
        if (exam.teacherId !== session.userId) return { error: "Unauthorized" };
        if (exam.status === "PUBLISHED") return { error: "Cannot edit published exam" };

        const title = formData.get("title") as string;
        const description = formData.get("description") as string | null;
        const duration = parseInt(formData.get("duration") as string);
        
        // Advanced settings
        const antiCheatEnabled = formData.get("antiCheatEnabled") === "true";
        const maxViolations = parseInt(formData.get("maxViolations") as string) || 3;
        const passPercentage = parseInt(formData.get("passPercentage") as string) || 50;
        const shuffleQuestions = formData.get("shuffleQuestions") === "true";
        const shuffleOptions = formData.get("shuffleOptions") === "true";
        const showResultsImmediately = formData.get("showResultsImmediately") !== "false";
        const requirePassword = formData.get("requirePassword") === "true";
        const examPassword = formData.get("examPassword") as string | null;
        const maxAttempts = formData.get("maxAttempts") ? parseInt(formData.get("maxAttempts") as string) : null;
        
        // Scheduling settings
        const scheduledStartTime = formData.get("scheduledStartTime") ? new Date(formData.get("scheduledStartTime") as string) : null;
        const scheduledEndTime = formData.get("scheduledEndTime") ? new Date(formData.get("scheduledEndTime") as string) : null;
        const allowLateSubmission = formData.get("allowLateSubmission") === "true";
        
        // Negative marking settings
        const negativeMarking = formData.get("negativeMarking") === "true";
        const negativeMarks = formData.get("negativeMarks") ? parseFloat(formData.get("negativeMarks") as string) : 0;

        await prisma.exam.update({
            where: { id: examId },
            data: {
                title,
                description: description || null,
                duration,
                antiCheatEnabled,
                maxViolations,
                passPercentage,
                shuffleQuestions,
                shuffleOptions,
                showResultsImmediately,
                requirePassword,
                examPassword: requirePassword ? examPassword : null,
                maxAttempts,
                scheduledStartTime,
                scheduledEndTime,
                allowLateSubmission,
                negativeMarking,
                negativeMarks,
            }
        });

        revalidatePath(`/dashboard/exams/${examId}`);
        return { success: true };

    } catch (e) {
        console.error(e);
        return { error: "Failed to update exam" };
    }
}

export async function duplicateExamAction(examId: string) {
    try {
        const session = await verifySession();
        if (!session) return { error: "Unauthorized" };

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: { questions: true }
        });

        if (!exam) return { error: "Exam not found" };
        if (exam.teacherId !== session.userId) return { error: "Unauthorized" };

        // Create a duplicate exam with all questions
        const newExam = await prisma.exam.create({
            data: {
                title: `${exam.title} (Copy)`,
                description: exam.description,
                duration: exam.duration,
                priceMode: exam.priceMode,
                teacherId: session.userId,
                antiCheatEnabled: exam.antiCheatEnabled,
                maxViolations: exam.maxViolations,
                passPercentage: exam.passPercentage,
                shuffleQuestions: exam.shuffleQuestions,
                shuffleOptions: exam.shuffleOptions,
                showResultsImmediately: exam.showResultsImmediately,
                requirePassword: exam.requirePassword,
                examPassword: exam.examPassword,
                maxAttempts: exam.maxAttempts,
                scheduledStartTime: exam.scheduledStartTime,
                scheduledEndTime: exam.scheduledEndTime,
                allowLateSubmission: exam.allowLateSubmission,
                negativeMarking: exam.negativeMarking,
                negativeMarks: exam.negativeMarks,
                status: "DRAFT",
                questions: {
                    create: exam.questions.map(q => ({
                        text: q.text,
                        options: q.options as any,
                        correctOption: q.correctOption,
                        marks: q.marks,
                        negativeMarks: q.negativeMarks,
                        timeLimit: q.timeLimit,
                        explanation: q.explanation,
                        difficulty: q.difficulty,
                    }))
                }
            }
        });

        revalidatePath('/dashboard/exams');
        return { success: true, examId: newExam.id };

    } catch (e) {
        console.error(e);
        return { error: "Failed to duplicate exam" };
    }
}

export async function updateQuestionAction(questionId: string, examId: string, formData: FormData) {
    try {
        const session = await verifySession();
        if (!session) return { error: "Unauthorized" };

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            select: { teacherId: true, status: true }
        });

        if (!exam) return { error: "Exam not found" };
        if (exam.teacherId !== session.userId) return { error: "Unauthorized" };
        if (exam.status === "PUBLISHED") return { error: "Cannot edit questions in published exam" };

        const text = formData.get("text") as string;
        const correctOption = formData.get("correctOption") as string;

        // Dynamically detect how many options were sent
        const options = [];
        let i = 0;
        while (formData.has(`option${i}`)) {
            options.push({
                id: `opt-${i}`,
                text: formData.get(`option${i}`) as string
            });
            i++;
        }

        // Fallback to 4 options if none detected
        if (options.length === 0) {
            for (let j = 0; j < 4; j++) {
                const optText = formData.get(`option${j}`) as string;
                if (optText) {
                    options.push({
                        id: `opt-${j}`,
                        text: optText
                    });
                }
            }
        }

        // correctOption can be either an ID (like "opt-0") or an index (like "0")
        // If it's already an ID, use it directly; otherwise, convert index to ID
        let correctOptionId = correctOption;
        if (!correctOption.startsWith('opt-')) {
            const correctOptionIndex = parseInt(correctOption);
            if (isNaN(correctOptionIndex) || correctOptionIndex < 0 || correctOptionIndex >= options.length) {
                return { error: "Invalid correct option index" };
            }
            correctOptionId = options[correctOptionIndex].id;
        }

        await prisma.question.update({
            where: { id: questionId },
            data: {
                text,
                options: JSON.stringify(options),
                correctOption: correctOptionId,
            }
        });

        revalidatePath(`/dashboard/exams/${examId}`);
        return { success: true };

    } catch (e) {
        console.error(e);
        return { error: "Failed to update question" };
    }
}

export async function unpublishExamAction(examId: string) {
    try {
        const session = await verifySession();
        if (!session) return { error: "Unauthorized" };

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            select: { teacherId: true, status: true }
        });

        if (!exam) return { error: "Exam not found" };
        if (exam.teacherId !== session.userId) return { error: "Unauthorized" };
        if (exam.status !== "PUBLISHED") return { error: "Exam is not published" };

        await prisma.exam.update({
            where: { id: examId },
            data: { status: "DRAFT" }
        });

        revalidatePath(`/dashboard/exams/${examId}`);
        revalidatePath('/dashboard/exams');
        return { success: true };

    } catch (e) {
        console.error(e);
        return { error: "Failed to unpublish exam" };
    }
}

export async function archiveExamAction(examId: string) {
    try {
        const session = await verifySession();
        if (!session) return { error: "Unauthorized" };

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            select: { teacherId: true }
        });

        if (!exam) return { error: "Exam not found" };
        if (exam.teacherId !== session.userId) return { error: "Unauthorized" };

        await prisma.exam.update({
            where: { id: examId },
            data: { status: "ENDED" }
        });

        revalidatePath(`/dashboard/exams/${examId}`);
        revalidatePath('/dashboard/exams');
        return { success: true };

    } catch (e) {
        console.error(e);
        return { error: "Failed to archive exam" };
    }
}

/**
 * Reorder questions in an exam by updating their order in the database
 */
export async function reorderQuestionsAction(examId: string, questionIds: string[]) {
    "use server";
    
    const session = await verifySession();
    if (!session) {
        throw new Error("Unauthorized");
    }

    // Verify exam ownership
    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        select: { 
            teacherId: true,
            status: true 
        }
    });

    if (!exam || exam.teacherId !== session.userId) {
        throw new Error("Unauthorized or exam not found");
    }

    if (exam.status === "PUBLISHED") {
        throw new Error("Cannot reorder questions in a published exam");
    }

    // Delete all questions and re-create them in the new order
    // This is a simple approach - in production you might want to add an 'order' field
    const questions = await prisma.question.findMany({
        where: { 
            examId,
            id: { in: questionIds }
        }
    });

    // Create a map of id to question data
    const questionMap = new Map(questions.map(q => [q.id, q]));

    // Delete existing questions
    await prisma.question.deleteMany({
        where: { examId }
    });

    // Re-create questions in new order
    for (const questionId of questionIds) {
        const questionData = questionMap.get(questionId);
        if (questionData) {
            await prisma.question.create({
                data: {
                    examId,
                    text: questionData.text,
                    options: questionData.options as any,
                    correctOption: questionData.correctOption,
                    marks: questionData.marks,
                    negativeMarks: questionData.negativeMarks,
                    timeLimit: questionData.timeLimit,
                    explanation: questionData.explanation,
                }
            });
        }
    }

    revalidatePath(`/dashboard/exams/${examId}`);
    return { success: true };
}

export async function duplicateQuestionAction(questionId: string, examId: string) {
    try {
        const session = await verifySession();
        if (!session) return { error: "Unauthorized" };

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            select: { teacherId: true, status: true }
        });

        if (!exam) return { error: "Exam not found" };
        if (exam.teacherId !== session.userId) return { error: "Unauthorized" };
        if (exam.status === "PUBLISHED") return { error: "Cannot duplicate questions in published exam" };

        const question = await prisma.question.findUnique({
            where: { id: questionId }
        });

        if (!question) return { error: "Question not found" };

        await prisma.question.create({
            data: {
                examId,
                text: question.text,
                options: question.options as any,
                correctOption: question.correctOption,
                marks: question.marks,
                negativeMarks: question.negativeMarks,
                timeLimit: question.timeLimit,
                explanation: question.explanation,
            }
        });

        revalidatePath(`/dashboard/exams/${examId}`);
        return { success: true };

    } catch (e) {
        console.error(e);
        return { error: "Failed to duplicate question" };
    }
}
