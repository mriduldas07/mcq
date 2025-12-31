-- CreateTable
CREATE TABLE "QuestionFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "teacherId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionFolder_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "QuestionBank" ADD COLUMN "folderId" TEXT;

-- CreateIndex
CREATE INDEX "QuestionFolder_teacherId_idx" ON "QuestionFolder"("teacherId");

-- CreateIndex
CREATE INDEX "QuestionFolder_parentId_idx" ON "QuestionFolder"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionFolder_teacherId_name_parentId_key" ON "QuestionFolder"("teacherId", "name", "parentId");

-- CreateIndex
CREATE INDEX "QuestionBank_folderId_idx" ON "QuestionBank"("folderId");

-- AddForeignKey
ALTER TABLE "QuestionBank" ADD CONSTRAINT "QuestionBank_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "QuestionFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionFolder" ADD CONSTRAINT "QuestionFolder_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionFolder" ADD CONSTRAINT "QuestionFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "QuestionFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
