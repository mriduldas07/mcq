import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuestionBankClient } from "@/components/question-bank-client-mvp";

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string }>;
}) {
  const session = await verifySession();
  if (!session?.userId) {
    redirect("/login");
  }

  // Await searchParams in Next.js 15+
  const params = await searchParams;
  const currentFolderId = params.folderId || null;

  // Fetch folders for navigation
  const folders = await prisma.questionFolder.findMany({
    where: {
      teacherId: session.userId,
    },
    include: {
      _count: {
        select: {
          questions: true,
          subfolders: true,
        },
      },
    },
    orderBy: [
      { parentId: 'asc' },
      { name: 'asc' },
    ],
  });

  // Fetch personal question bank filtered by folder
  const questions = await prisma.questionBank.findMany({
    where: {
      teacherId: session.userId,
      folderId: currentFolderId, // null = root level, string = specific folder
    },
    include: {
      folder: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get current folder breadcrumb
  let folderPath: any[] = [];
  if (currentFolderId) {
    let folderId: string | null = currentFolderId;
    while (folderId) {
      const folder: { id: string; parentId: string | null } | null = await prisma.questionFolder.findUnique({
        where: { id: folderId },
      });
      if (folder) {
        folderPath.unshift(folder);
        folderId = folder.parentId;
      } else {
        break;
      }
    }
  }

  // Simple stats for MVP
  const totalQuestions = questions.length;
  const subjects = Array.from(new Set(questions.map((q) => q.subject).filter(Boolean))) as string[];
  const difficulties = {
    EASY: questions.filter((q) => q.difficulty === "EASY").length,
    MEDIUM: questions.filter((q) => q.difficulty === "MEDIUM").length,
    HARD: questions.filter((q) => q.difficulty === "HARD").length,
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Question Bank</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Your personal library of reusable questions • {totalQuestions} saved
          </p>
        </div>
      </div>

      {/* How to Use Guide */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base sm:text-lg text-blue-900 dark:text-blue-100 mb-3 sm:mb-4 flex items-center gap-2">
              <span>💡</span>
              <span>Quick Start Guide</span>
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                  <span className="text-sm sm:text-base font-bold text-blue-700 dark:text-blue-200">1</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base text-blue-900 dark:text-blue-100 font-semibold mb-1">
                    📂 Organize with Folders
                  </p>
                  <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    Create folders for subjects like Math or Science. Use the folder picker when saving questions!
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                  <span className="text-sm sm:text-base font-bold text-blue-700 dark:text-blue-200">2</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base text-blue-900 dark:text-blue-100 font-semibold mb-1">
                    🎯 Save Questions
                  </p>
                  <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    Click <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100">Save to Bank</span> when editing exams
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                  <span className="text-sm sm:text-base font-bold text-blue-700 dark:text-blue-200">3</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base text-blue-900 dark:text-blue-100 font-semibold mb-1">
                    ♻️ Reuse Anytime
                  </p>
                  <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    Import questions into new exams with one click. Save hours of work!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <QuestionBankClient
        questions={JSON.parse(JSON.stringify(questions))}
        folders={JSON.parse(JSON.stringify(folders))}
        currentFolderId={currentFolderId}
        folderPath={JSON.parse(JSON.stringify(folderPath))}
        totalQuestions={totalQuestions}
        subjects={subjects}
        difficulties={difficulties}
      />
    </div>
  );
}
