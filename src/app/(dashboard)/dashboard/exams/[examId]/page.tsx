import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { CopyLinkButton } from "@/components/copy-link-button";
import { PublishButton } from "@/components/publish-button";
import { DeleteExamButton } from "@/components/delete-exam-button";
import { EditExamForm } from "@/components/edit-exam-form";
import { BulkImportButton } from "@/components/bulk-import-button";
import { ImportFromBankButton } from "@/components/import-from-bank-button";
import { EnhancedQuestionsList } from "@/components/enhanced-questions-list";
import { ExamBlueprint } from "@/components/exam-blueprint";
import { AddQuestionForm } from "@/components/add-question-form";
import { BulkPasteDialog } from "@/components/bulk-paste-dialog";
import { verifySession } from "@/lib/session";
import { Prisma } from "@prisma/client";
import Link from "next/link";

type ExamWithQuestions = Prisma.ExamGetPayload<{
    include: {
        questions: true;
    }
}>;

// This is a server component
export default async function ExamEditorPage({
    params,
}: {
    params: Promise<{ examId: string }>;
}) {
    const { examId } = await params;

    // TASK 5: Verify session and fetch user data for payment enforcement
    const session = await verifySession();
    if (!session) return redirect("/login");

    let exam: ExamWithQuestions | null = null;
    let user = null;

    try {
        exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: { questions: true },
        });

        user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { planType: true, freeExamsUsed: true, oneTimeExamsRemaining: true },
        });
    } catch (e) {
        console.log("DB Error fetching exam", e);
    }

    if (!exam) return notFound();

    // Batch check all questions' bank status in ONE query
    const questionTexts = exam.questions.map(q => q.text);
    const questionsInBank = await prisma.questionBank.findMany({
        where: {
            teacherId: session.userId,
            text: { in: questionTexts },
        },
        select: {
            id: true,
            text: true,
            folderId: true,
            folder: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    // Create a map for O(1) lookup
    const bankStatusMap = new Map(
        questionsInBank.map(q => [q.text, { 
            inBank: true, 
            folderId: q.folderId || undefined, 
            folderName: q.folder?.name,
            questionBankId: q.id
        }])
    );

    const isPro = user?.planType === "PRO";
    const freeExamsRemaining = user ? Math.max(0, 3 - (user.freeExamsUsed || 0)) : 0;
    const oneTimeExamsRemaining = user?.oneTimeExamsRemaining || 0;
    const canPublish = isPro || freeExamsRemaining > 0 || oneTimeExamsRemaining > 0;

    const totalMarks = exam.questions.length; // 1 mark per question

    // Parse JSON options for each question
    const questionsWithParsedOptions = exam.questions.map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));

    return (
        <div className="flex-1 space-y-4 sm:space-y-6 overflow-hidden w-full max-w-full px-3 sm:px-0">
            {/* Top Bar with Exam Info & Blueprint */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Left: Exam Title & Meta */}
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{exam.title}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-medium">{exam.questions.length} Questions</span>
                        <span>•</span>
                        <span className="font-medium">{totalMarks} Marks</span>
                        <span>•</span>
                        <span>{exam.duration} Minutes</span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2">
                    {exam.status === 'PUBLISHED' && <CopyLinkButton examId={examId} />}
                    <Badge variant={exam.status === 'PUBLISHED' ? 'default' : 'secondary'} className="uppercase text-xs">
                        {exam.status}
                    </Badge>
                    {exam.status !== 'PUBLISHED' && (
                        <PublishButton 
                            examId={examId} 
                            canPublish={canPublish}
                            isPro={isPro}
                            questionCount={exam.questions.length}
                            questions={questionsWithParsedOptions}
                        />
                    )}
                    {exam.status !== 'PUBLISHED' && (
                        <DeleteExamButton examId={examId} />
                    )}
                </div>
            </div>

            {/* Payment Warning Banner */}
            {!isPro && freeExamsRemaining === 0 && oneTimeExamsRemaining === 0 && exam.status !== 'PUBLISHED' && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
                    <CardContent className="p-4 sm:pt-6">
                        <div className="flex flex-col sm:flex-row items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <h3 className="font-semibold text-orange-900 dark:text-orange-300 text-sm sm:text-base">No Exams Available</h3>
                                <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-400">
                                    You've used all 3 free exams. Purchase a one-time exam or upgrade to Pro for unlimited exams.
                                </p>
                                <Link href="/dashboard/billing">
                                    <Button variant="outline" size="sm" className="mt-2 border-orange-600 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950 w-full sm:w-auto">
                                        Go to Billing
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!isPro && (freeExamsRemaining === 1 || (freeExamsRemaining === 0 && oneTimeExamsRemaining > 0)) && exam.status !== 'PUBLISHED' && (
                <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
                    <CardContent className="p-4 sm:pt-6">
                        <div className="flex flex-col sm:flex-row items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 text-sm sm:text-base">Running Low</h3>
                                <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-400">
                                    {freeExamsRemaining > 0 
                                        ? `Only ${freeExamsRemaining} free exam${freeExamsRemaining !== 1 ? 's' : ''} left. Consider upgrading to Pro.`
                                        : `You have ${oneTimeExamsRemaining} purchased exam${oneTimeExamsRemaining !== 1 ? 's' : ''}. Upgrade to Pro for unlimited.`
                                    }
                                </p>
                                <Link href="/dashboard/billing">
                                    <Button variant="outline" size="sm" className="mt-2 border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-950 w-full sm:w-auto">
                                        Manage Billing
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Content Grid: Questions + Sidebar */}
            <div className="grid gap-6 lg:grid-cols-[1fr_380px] overflow-hidden">
                {/* Main Area: Question Cards + Add Question */}
                <div className="space-y-4 min-w-0">
                    <EnhancedQuestionsList
                        examId={examId}
                        questions={questionsWithParsedOptions}
                        bankStatusMap={bankStatusMap}
                        isPublished={exam.status === 'PUBLISHED'}
                        isPro={isPro}
                    />

                    {/* Add New Question Form */}
                    {exam.status !== 'PUBLISHED' && (
                        <Card className="border-primary/30 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <CardTitle className="text-lg">Add New Question</CardTitle>
                                    <div className="flex gap-2">
                                        <BulkPasteDialog examId={examId} />
                                        <BulkImportButton examId={examId} />
                                        <ImportFromBankButton examId={examId} />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <AddQuestionForm examId={examId} isPro={isPro} />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Sidebar: Advanced Settings */}
                {exam.status !== 'PUBLISHED' && (
                    <div className="space-y-4 min-w-0">
                        <EditExamForm 
                            examId={examId}
                            initialTitle={exam.title}
                            initialDescription={exam.description}
                            initialDuration={exam.duration}
                            status={exam.status}
                            antiCheatEnabled={exam.antiCheatEnabled}
                            maxViolations={exam.maxViolations}
                            passPercentage={exam.passPercentage}
                            shuffleQuestions={exam.shuffleQuestions}
                            shuffleOptions={exam.shuffleOptions}
                            showResultsImmediately={exam.showResultsImmediately}
                            requirePassword={exam.requirePassword}
                            examPassword={exam.examPassword}
                            maxAttempts={exam.maxAttempts}
                            scheduledStartTime={exam.scheduledStartTime}
                            scheduledEndTime={exam.scheduledEndTime}
                            allowLateSubmission={exam.allowLateSubmission}
                        />

                        {/* Account Status */}
                        <Card className={isPro ? "border-primary/20 bg-primary/5" : ""}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    {isPro ? "Pro Account" : "Free Account"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {isPro ? (
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            ✨ Unlimited exam publishing
                                        </p>
                                        <Link href="/dashboard/billing">
                                            <Button variant="outline" size="sm" className="w-full mt-3">
                                                Manage Subscription
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-muted-foreground">Exams Remaining</span>
                                            <div className="text-right">
                                                <span className={`text-2xl font-bold ${
                                                    freeExamsRemaining === 0 && oneTimeExamsRemaining === 0 ? 'text-red-600' : 
                                                    freeExamsRemaining <= 1 ? 'text-yellow-600' : 
                                                    'text-green-600'
                                                }`}>
                                                    {freeExamsRemaining + oneTimeExamsRemaining}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-3">
                                            {freeExamsRemaining} free + {oneTimeExamsRemaining} purchased
                                        </p>
                                        <Link href="/dashboard/billing">
                                            <Button variant="default" size="sm" className="w-full">
                                                Buy More or Upgrade
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
