"use server";

import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Add a question to the question bank
 */
/**
 * MVP: Add a question to personal bank (COPY, not reference)
 */
export async function addToQuestionBankAction(data: {
  questionText: string;
  options: any;
  correctOption: string;
  marks?: number;
  difficulty?: string;
  subject?: string;
  topic?: string;
  tags?: string[];
  folderId?: string | null;
}) {
  "use server";

  const session = await verifySession();
  if (!session?.userId) {
    throw new Error("Unauthorized");
  }

  try {
    const question = await prisma.questionBank.create({
      data: {
        teacherId: session.userId,
        text: data.questionText,
        options: data.options as any,
        correctOption: data.correctOption,
        marks: data.marks || 1,
        difficulty: data.difficulty || "MEDIUM",
        subject: data.subject,
        topic: data.topic,
        tags: data.tags || [],
        folderId: data.folderId || null,
      },
    });

    revalidatePath("/dashboard/question-bank");
    return { success: true, questionId: question.id };
  } catch (error: any) {
    console.error("Add to question bank error:", error);
    throw new Error(error.message || "Failed to add question to bank");
  }
}

/**
 * Update a question in the question bank
 */
/**
 * MVP: Update question in bank (does NOT affect past exams)
 */
export async function updateQuestionBankAction(
  questionId: string,
  data: Partial<{
    questionText: string;
    options: any;
    correctOption: string;
    marks: number;
    difficulty: string;
    subject: string | null;
    topic: string | null;
    tags: string[];
    folderId: string | null;
  }>
) {
  "use server";

  const session = await verifySession();
  if (!session?.userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify ownership
    const question = await prisma.questionBank.findUnique({
      where: { id: questionId },
      select: { teacherId: true },
    });

    if (!question) {
      throw new Error("Question not found");
    }

    if (question.teacherId !== session.userId) {
      throw new Error("Unauthorized");
    }

    await prisma.questionBank.update({
      where: { id: questionId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/question-bank");
    return { success: true };
  } catch (error: any) {
    console.error("Update question bank error:", error);
    throw new Error(error.message || "Failed to update question");
  }
}

/**
 * Delete questions from the question bank
 */
export async function deleteQuestionBankAction(questionIds: string[]) {
  "use server";

  const session = await verifySession();
  if (!session?.userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify ownership of all questions
    const questions = await prisma.questionBank.findMany({
      where: {
        id: { in: questionIds },
        teacherId: session.userId,
      },
    });

    if (questions.length !== questionIds.length) {
      throw new Error("Some questions not found or unauthorized");
    }

    await prisma.questionBank.deleteMany({
      where: {
        id: { in: questionIds },
        teacherId: session.userId,
      },
    });

    revalidatePath("/dashboard/question-bank");
    return { success: true, deleted: questionIds.length };
  } catch (error: any) {
    console.error("Delete question bank error:", error);
    throw new Error(error.message || "Failed to delete questions");
  }
}

/**
 * Add tags to questions
 */
export async function addTagsToQuestionsAction(
  questionIds: string[],
  tags: string[]
) {
  "use server";

  const session = await verifySession();
  if (!session?.userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Get existing questions
    const questions = await prisma.questionBank.findMany({
      where: {
        id: { in: questionIds },
        teacherId: session.userId,
      },
    });

    if (questions.length !== questionIds.length) {
      throw new Error("Some questions not found or unauthorized");
    }

    // Update each question with merged tags
    await Promise.all(
      questions.map((q) =>
        prisma.questionBank.update({
          where: { id: q.id },
          data: {
            tags: Array.from(new Set([...q.tags, ...tags])),
            updatedAt: new Date(),
          },
        })
      )
    );

    revalidatePath("/dashboard/question-bank");
    return { success: true, updated: questionIds.length };
  } catch (error: any) {
    console.error("Add tags error:", error);
    throw new Error(error.message || "Failed to add tags");
  }
}

/**
 * Duplicate questions in the question bank
 */
export async function duplicateQuestionsAction(questionIds: string[]) {
  "use server";

  const session = await verifySession();
  if (!session?.userId) {
    throw new Error("Unauthorized");
  }

  try {
    const questions = await prisma.questionBank.findMany({
      where: {
        id: { in: questionIds },
        teacherId: session.userId,
      },
    });

    if (questions.length !== questionIds.length) {
      throw new Error("Some questions not found or unauthorized");
    }

    const duplicates = await Promise.all(
      questions.map((q) =>
        prisma.questionBank.create({
          data: {
            teacherId: session.userId,
            text: `${q.text} (Copy)`,
            options: q.options as any,
            correctOption: q.correctOption,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
            timeLimit: q.timeLimit,
            explanation: q.explanation,
            difficulty: q.difficulty,
            subject: q.subject,
            topic: q.topic,
            tags: q.tags,
            folderId: q.folderId, // Keep in same folder
          },
        })
      )
    );

    revalidatePath("/dashboard/question-bank");
    return { success: true, duplicated: duplicates.length };
  } catch (error: any) {
    console.error("Duplicate questions error:", error);
    throw new Error(error.message || "Failed to duplicate questions");
  }
}

/**
 * MVP: Import questions from bank to exam (COPY, not reference)
 * Creates independent copies - no link between bank and exam
 */
export async function importFromQuestionBankAction(
  examId: string,
  questionIds: string[]
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
      throw new Error("Cannot add questions to published exam");
    }

    // Get questions from bank
    const bankQuestions = await prisma.questionBank.findMany({
      where: {
        id: { in: questionIds },
        teacherId: session.userId,
      },
    });

    if (bankQuestions.length !== questionIds.length) {
      throw new Error("Some questions not found");
    }

    // COPY questions to exam (no reference to bank)
    await prisma.$transaction([
      // Create independent copies in exam
      ...bankQuestions.map((q) =>
        prisma.question.create({
          data: {
            examId,
            text: q.text,
            options: q.options as any,
            correctOption: q.correctOption,
            marks: q.marks,
            difficulty: q.difficulty,
          },
        })
      ),
      // Track usage in bank for analytics
      ...bankQuestions.map((q) =>
        prisma.questionBank.update({
          where: { id: q.id },
          data: {
            usageCount: { increment: 1 },
            lastUsed: new Date(),
          },
        })
      ),
    ]);

    revalidatePath(`/dashboard/exams/${examId}`);
    revalidatePath("/dashboard/question-bank");
    return { success: true, imported: bankQuestions.length, message: `Added ${bankQuestions.length} question(s) to exam` };
  } catch (error: any) {
    console.error("Import from question bank error:", error);
    throw new Error(error.message || "Failed to import questions");
  }
}

/**
 * MVP: Save exam question to personal bank (COPY, not reference)
 * This creates an independent copy - editing bank won't affect past exams
 * Prevents duplicates by checking if question already exists
 */
export async function saveToQuestionBankAction(
  examId: string,
  questionId: string,
  folderId?: string | null
) {
  "use server";

  const session = await verifySession();
  if (!session?.userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Get the question and verify ownership
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        exam: {
          select: { teacherId: true },
        },
      },
    });

    if (!question) {
      throw new Error("Question not found");
    }

    if (question.exam.teacherId !== session.userId) {
      throw new Error("Unauthorized");
    }

    // Check if this exact question already exists in bank
    // Compare by text and correct option to avoid duplicates
    const existingQuestion = await prisma.questionBank.findFirst({
      where: {
        teacherId: session.userId,
        text: question.text,
        correctOption: question.correctOption,
      },
    });

    if (existingQuestion) {
      return { 
        success: false, 
        message: "This question is already in your bank!",
        alreadyExists: true 
      };
    }

    // COPY to question bank (MVP: simple copy, no reference)
    const savedQuestion = await prisma.questionBank.create({
      data: {
        teacherId: session.userId,
        text: question.text,
        options: question.options as any,
        correctOption: question.correctOption,
        marks: question.marks,
        difficulty: question.difficulty || "MEDIUM",
        tags: [],
        folderId: folderId || null,
      },
    });

    revalidatePath("/dashboard/question-bank");
    return { success: true, message: "Question saved to your bank!", questionId: savedQuestion.id };
  } catch (error: any) {
    console.error("Save to question bank error:", error);
    throw new Error(error.message || "Failed to save question to bank");
  }
}

/**
 * Check if a question from an exam is already in the question bank
 */
export async function checkQuestionInBank(examId: string, questionId: string) {
  try {
    const session = await verifySession();
    if (!session) {
      throw new Error("Unauthorized");
    }

    // Get the question from the exam
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        exam: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!question || question.exam.teacherId !== session.userId) {
      return { inBank: false };
    }

    // Check if a question with matching text exists in the question bank
    const existingQuestion = await prisma.questionBank.findFirst({
      where: {
        teacherId: session.userId,
        text: question.text,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (existingQuestion) {
      return {
        inBank: true,
        folderId: existingQuestion.folderId,
        folderName: existingQuestion.folder?.name,
      };
    }

    return { inBank: false };
  } catch (error: any) {
    console.error("Check question in bank error:", error);
    return { inBank: false };
  }
}
