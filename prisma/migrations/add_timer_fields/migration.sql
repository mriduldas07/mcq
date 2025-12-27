-- AlterTable for TASK 1, TASK 3 & TASK 6
ALTER TABLE "StudentAttempt" ADD COLUMN     "startTime" TIMESTAMP(3),
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "submitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalQuestions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "correctAnswers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wrongAnswers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unanswered" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "violations" INTEGER NOT NULL DEFAULT 0;

-- AlterTable for TASK 6: Anti-cheat settings
ALTER TABLE "Exam" ADD COLUMN "antiCheatEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "maxViolations" INTEGER NOT NULL DEFAULT 3;
