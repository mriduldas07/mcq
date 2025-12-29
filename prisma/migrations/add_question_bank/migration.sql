-- Create QuestionBank table
CREATE TABLE "QuestionBank" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctOption" TEXT NOT NULL,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeLimit" INTEGER,
    "explanation" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "subject" TEXT,
    "topic" TEXT,
    "tags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better query performance
CREATE INDEX "QuestionBank_teacherId_idx" ON "QuestionBank"("teacherId");
CREATE INDEX "QuestionBank_subject_idx" ON "QuestionBank"("subject");
CREATE INDEX "QuestionBank_difficulty_idx" ON "QuestionBank"("difficulty");

-- Add foreign key constraint
ALTER TABLE "QuestionBank" ADD CONSTRAINT "QuestionBank_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
