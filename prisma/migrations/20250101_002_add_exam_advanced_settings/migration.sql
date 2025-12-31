-- Add advanced exam settings fields that were missing

-- Scheduling settings
ALTER TABLE "Exam" ADD COLUMN "scheduledStartTime" TIMESTAMP(3),
ADD COLUMN "scheduledEndTime" TIMESTAMP(3),
ADD COLUMN "allowLateSubmission" BOOLEAN NOT NULL DEFAULT false;

-- Grading settings
ALTER TABLE "Exam" ADD COLUMN "passPercentage" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "showResultsImmediately" BOOLEAN NOT NULL DEFAULT true;

-- Access control
ALTER TABLE "Exam" ADD COLUMN "requirePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "examPassword" TEXT,
ADD COLUMN "maxAttempts" INTEGER;
