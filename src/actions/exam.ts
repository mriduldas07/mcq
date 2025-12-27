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

    let examId = "";

    try {
        const teacherId = session.userId;
        
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

export async function addQuestionAction(examId: string, formData: FormData) {
    // Ideally we check ownership here too
    const session = await verifySession();
    if (!session) return;

    const text = formData.get("text") as string;
    const correctOption = formData.get("correctOption") as string; // Will be the index 0-3
    // Options are passed as separate fields option0, option1, etc.

    const options = [];
    for (let i = 0; i < 4; i++) {
        options.push({
            id: `opt-${i}`,
            text: formData.get(`option${i}`) as string
        });
    }

    try {
        await prisma.question.create({
            data: {
                examId,
                text,
                options: JSON.stringify(options), // Storing as JSON
                correctOption: options[parseInt(correctOption)].id,
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

        // CHECK MONETIZATION
        // Rule: Deduct credit on publish if not PRO

        try {
            await PaymentService.deductCredits(userId);
        } catch (e: any) {
            return { error: e.message || "Insufficient credits. Please top up." };
        }

        // Proceed to publish
        await prisma.exam.update({
            where: { id: examId },
            data: { status: "PUBLISHED" }
        });

        revalidatePath(`/dashboard/exams/${examId}`);
        return { success: true };

    } catch (e) {
        console.error(e);
        return { error: "System error during publish" };
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
                status: "DRAFT",
                questions: {
                    create: exam.questions.map(q => ({
                        text: q.text,
                        options: q.options as any,
                        correctOption: q.correctOption,
                        marks: q.marks,
                        timeLimit: q.timeLimit,
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

        const options = [];
        for (let i = 0; i < 4; i++) {
            options.push({
                id: `opt-${i}`,
                text: formData.get(`option${i}`) as string
            });
        }

        await prisma.question.update({
            where: { id: questionId },
            data: {
                text,
                options: JSON.stringify(options),
                correctOption: options[parseInt(correctOption)].id,
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
