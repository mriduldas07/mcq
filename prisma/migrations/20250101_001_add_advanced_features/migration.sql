-- Add negative marking fields to Exam
ALTER TABLE "Exam" ADD COLUMN "negativeMarking" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Exam" ADD COLUMN "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Add advanced question fields
ALTER TABLE "Question" ADD COLUMN "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Question" ADD COLUMN "explanation" TEXT;
ALTER TABLE "Question" ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM';

-- Create ExamTemplate table for reusable exam configurations
CREATE TABLE "ExamTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teacherId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "antiCheatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxViolations" INTEGER NOT NULL DEFAULT 3,
    "passPercentage" INTEGER NOT NULL DEFAULT 50,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
    "showResultsImmediately" BOOLEAN NOT NULL DEFAULT true,
    "negativeMarking" BOOLEAN NOT NULL DEFAULT false,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requirePassword" BOOLEAN NOT NULL DEFAULT false,
    "maxAttempts" INTEGER,
    "allowLateSubmission" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamTemplate_pkey" PRIMARY KEY ("id")
);

-- Add foreign key for ExamTemplate
ALTER TABLE "ExamTemplate" ADD CONSTRAINT "ExamTemplate_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
