import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuestionBankClient } from "@/components/question-bank-client-mvp";

export default async function QuestionBankPage() {
  const session = await verifySession();
  if (!session?.userId) {
    redirect("/login");
  }

  // Fetch personal question bank (MVP: no sharing, just personal)
  const questions = await prisma.questionBank.findMany({
    where: {
      teacherId: session.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Simple stats for MVP
  const totalQuestions = questions.length;
  const subjects = Array.from(new Set(questions.map((q) => q.subject).filter(Boolean))) as string[];
  const difficulties = {
    EASY: questions.filter((q) => q.difficulty === "EASY").length,
    MEDIUM: questions.filter((q) => q.difficulty === "MEDIUM").length,
    HARD: questions.filter((q) => q.difficulty === "HARD").length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Question Bank</h1>
          <p className="text-muted-foreground mt-1">
            Your personal library of reusable questions • {totalQuestions} saved
          </p>
        </div>
      </div>

      <QuestionBankClient
        questions={JSON.parse(JSON.stringify(questions))}
        totalQuestions={totalQuestions}
        subjects={subjects}
        difficulties={difficulties}
      />
    </div>
  );
}
