-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatusType" AS ENUM ('NONE', 'ACTIVE', 'CANCELED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ENDED');

-- CreateEnum
CREATE TYPE "ExamMode" AS ENUM ('FREE', 'PRO', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "PriceMode" AS ENUM ('FREE', 'PAID_BY_TEACHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('SUBSCRIPTION', 'ONE_TIME_EXAM', 'CREDIT_PURCHASE');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "IntegrityEventType" AS ENUM ('TAB_SWITCH', 'FULLSCREEN_EXIT', 'FOCUS_LOST', 'FOCUS_GAINED', 'COPY_ATTEMPT', 'PASTE_ATTEMPT', 'RIGHT_CLICK', 'CONSOLE_OPENED');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('PROCESSING', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "image" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "providerAccountId" TEXT,
    "planType" "PlanType" NOT NULL DEFAULT 'FREE',
    "freeExamsUsed" INTEGER NOT NULL DEFAULT 0,
    "oneTimeExamsRemaining" INTEGER NOT NULL DEFAULT 0,
    "paddleCustomerId" TEXT,
    "paddleSubscriptionId" TEXT,
    "subscriptionStatus" "SubscriptionStatusType" NOT NULL DEFAULT 'NONE',
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "teacherId" TEXT NOT NULL,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "examMode" "ExamMode" NOT NULL DEFAULT 'FREE',
    "priceMode" "PriceMode" NOT NULL DEFAULT 'FREE',
    "antiCheatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxViolations" INTEGER NOT NULL DEFAULT 3,
    "scheduledStartTime" TIMESTAMP(3),
    "scheduledEndTime" TIMESTAMP(3),
    "allowLateSubmission" BOOLEAN NOT NULL DEFAULT false,
    "passPercentage" INTEGER NOT NULL DEFAULT 50,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
    "showResultsImmediately" BOOLEAN NOT NULL DEFAULT true,
    "negativeMarking" BOOLEAN NOT NULL DEFAULT false,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requirePassword" BOOLEAN NOT NULL DEFAULT false,
    "examPassword" TEXT,
    "maxAttempts" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctOption" TEXT NOT NULL,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeLimit" INTEGER,
    "explanation" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAttempt" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "rollNumber" TEXT,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "submitted" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "wrongAnswers" INTEGER NOT NULL DEFAULT 0,
    "unanswered" INTEGER NOT NULL DEFAULT 0,
    "answers" JSONB NOT NULL,
    "violations" INTEGER NOT NULL DEFAULT 0,
    "trustScore" INTEGER NOT NULL DEFAULT 100,
    "integrityLevel" TEXT NOT NULL DEFAULT 'HIGH',
    "totalAwayTime" INTEGER NOT NULL DEFAULT 0,
    "questionTimings" JSONB,
    "answerRevisions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "type" "PaymentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "category" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionBank" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "folderId" TEXT,
    "text" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctOption" TEXT NOT NULL,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeLimit" INTEGER,
    "explanation" TEXT,
    "subject" TEXT,
    "topic" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "tags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'MONTHLY',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "paddleSubscriptionId" TEXT,
    "paddleCustomerId" TEXT,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrityEvent" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "eventType" "IntegrityEventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "questionId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "IntegrityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_paddleCustomerId_key" ON "User"("paddleCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_paddleSubscriptionId_key" ON "User"("paddleSubscriptionId");

-- CreateIndex
CREATE INDEX "User_provider_providerAccountId_idx" ON "User"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "User_paddleCustomerId_idx" ON "User"("paddleCustomerId");

-- CreateIndex
CREATE INDEX "User_subscriptionStatus_idx" ON "User"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "ExamTemplate_isPublic_isFeatured_idx" ON "ExamTemplate"("isPublic", "isFeatured");

-- CreateIndex
CREATE INDEX "ExamTemplate_category_idx" ON "ExamTemplate"("category");

-- CreateIndex
CREATE INDEX "QuestionBank_teacherId_idx" ON "QuestionBank"("teacherId");

-- CreateIndex
CREATE INDEX "QuestionBank_folderId_idx" ON "QuestionBank"("folderId");

-- CreateIndex
CREATE INDEX "QuestionBank_subject_idx" ON "QuestionBank"("subject");

-- CreateIndex
CREATE INDEX "QuestionBank_difficulty_idx" ON "QuestionBank"("difficulty");

-- CreateIndex
CREATE INDEX "QuestionFolder_teacherId_idx" ON "QuestionFolder"("teacherId");

-- CreateIndex
CREATE INDEX "QuestionFolder_parentId_idx" ON "QuestionFolder"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionFolder_teacherId_name_parentId_key" ON "QuestionFolder"("teacherId", "name", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_paddleSubscriptionId_key" ON "Subscription"("paddleSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE INDEX "Subscription_paddleSubscriptionId_idx" ON "Subscription"("paddleSubscriptionId");

-- CreateIndex
CREATE INDEX "IntegrityEvent_attemptId_idx" ON "IntegrityEvent"("attemptId");

-- CreateIndex
CREATE INDEX "IntegrityEvent_eventType_idx" ON "IntegrityEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_eventId_idx" ON "WebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_status_idx" ON "WebhookEvent"("status");

-- CreateIndex
CREATE INDEX "WebhookEvent_createdAt_idx" ON "WebhookEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttempt" ADD CONSTRAINT "StudentAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamTemplate" ADD CONSTRAINT "ExamTemplate_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBank" ADD CONSTRAINT "QuestionBank_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBank" ADD CONSTRAINT "QuestionBank_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "QuestionFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionFolder" ADD CONSTRAINT "QuestionFolder_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionFolder" ADD CONSTRAINT "QuestionFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "QuestionFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrityEvent" ADD CONSTRAINT "IntegrityEvent_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "StudentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
