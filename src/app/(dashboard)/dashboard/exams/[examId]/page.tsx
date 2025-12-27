import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, AlertCircle } from "lucide-react";
import { addQuestionAction } from "@/actions/exam";
import { CopyLinkButton } from "@/components/copy-link-button";
import { PublishButton } from "@/components/publish-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DeleteQuestionButton } from "@/components/delete-question-button";
import { DeleteExamButton } from "@/components/delete-exam-button";
import { EditExamForm } from "@/components/edit-exam-form";
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
            select: { credits: true, planType: true },
        });
    } catch (e) {
        console.log("DB Error fetching exam", e);
    }

    if (!exam) return notFound();

    const userCredits = user?.credits || 0;
    const isPro = user?.planType === "PRO";

    return (
        <div className="flex-1 space-y-4 p-4 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">{exam.title}</h2>
                <div className="flex items-center gap-2">
                    {exam.status === 'PUBLISHED' && <CopyLinkButton examId={examId} />}
                    <span className="text-sm text-muted-foreground uppercase font-semibold">{exam.status}</span>
                    {exam.status !== 'PUBLISHED' && (
                        <PublishButton 
                            examId={examId} 
                            userCredits={userCredits}
                            isPro={isPro}
                            questionCount={exam.questions.length}
                        />
                    )}
                    {exam.status !== 'PUBLISHED' && (
                        <DeleteExamButton examId={examId} />
                    )}
                </div>
            </div>

            {/* TASK 5: Payment Warning Banner */}
            {!isPro && userCredits === 0 && exam.status !== 'PUBLISHED' && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-orange-900">No Credits Available</h3>
                                <p className="text-sm text-orange-700 mt-1">
                                    You need credits to publish exams. Purchase credits or upgrade to Pro for unlimited exams.
                                </p>
                                <Link href="/dashboard/billing">
                                    <Button variant="outline" size="sm" className="mt-3 border-orange-600 text-orange-700 hover:bg-orange-100">
                                        Go to Billing
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!isPro && userCredits > 0 && userCredits <= 2 && exam.status !== 'PUBLISHED' && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-yellow-900">Low Credits</h3>
                                <p className="text-sm text-yellow-700 mt-1">
                                    You have {userCredits} credit{userCredits !== 1 ? 's' : ''} remaining. Consider topping up or upgrading to Pro.
                                </p>
                                <Link href="/dashboard/billing">
                                    <Button variant="outline" size="sm" className="mt-3 border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                                        Manage Billing
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-[1fr_350px]">
                <div className="space-y-4">
                    {/* Question List */}
                    {exam.questions.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
                                No questions yet. Add one below.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {exam.questions.map((q, i: number) => {
                                let options: Array<{ id: string; text: string }> = [];
                                try {
                                    options = typeof q.options === 'string' 
                                        ? JSON.parse(q.options) 
                                        : q.options as Array<{ id: string; text: string }>;
                                } catch (e) {
                                    console.error('Failed to parse options', e);
                                }
                                
                                return (
                                    <Card key={q.id}>
                                        <CardHeader className="p-4">
                                            <div className="flex justify-between items-start">
                                                <span className="font-semibold text-sm">Q{i + 1}</span>
                                                {exam.status !== 'PUBLISHED' && (
                                                    <DeleteQuestionButton questionId={q.id} examId={examId} />
                                                )}
                                            </div>
                                            <p className="mt-2">{q.text}</p>
                                        </CardHeader>
                                        <CardContent className="pt-0 pb-4">
                                            <div className="space-y-1">
                                                {options.map((opt) => (
                                                    <div 
                                                        key={opt.id} 
                                                        className={`text-sm px-3 py-1.5 rounded ${
                                                            opt.id === q.correctOption 
                                                                ? 'bg-green-50 text-green-700 font-medium' 
                                                                : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        {opt.text} {opt.id === q.correctOption && '✓'}
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Add Question Form */}
                    {exam.status !== 'PUBLISHED' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Add New Question</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form action={addQuestionAction.bind(null, examId)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Question Text</Label>
                                        <Textarea name="text" placeholder="What is the capital of France?" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Options (select the correct answer)</Label>
                                        {[0, 1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <input type="radio" name="correctOption" value={i} required className="h-4 w-4" defaultChecked={i === 0} />
                                                <Input name={`option${i}`} placeholder={`Option ${i + 1}`} required />
                                            </div>
                                        ))}
                                    </div>
                                    <Button type="submit" className="w-full">
                                        <Plus className="mr-2 h-4 w-4" /> Add Question
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar settings */}
                <div className="space-y-4">
                    {/* TASK 5: Account Status Card */}
                    <Card className={isPro ? "border-primary/20 bg-primary/5" : ""}>
                        <CardHeader>
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
                                        <span className="text-sm text-muted-foreground">Credits</span>
                                        <span className={`text-2xl font-bold ${
                                            userCredits === 0 ? 'text-red-600' : 
                                            userCredits <= 2 ? 'text-yellow-600' : 
                                            'text-green-600'
                                        }`}>
                                            {userCredits}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        1 credit = 1 exam publish
                                    </p>
                                    <Link href="/dashboard/billing">
                                        <Button variant="default" size="sm" className="w-full">
                                            Buy Credits or Upgrade
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

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
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Monetization</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Mode: <span className="font-medium text-foreground">
                                    {exam.priceMode === 'FREE' ? 'Free (Subscription)' : 'Pay Per Exam'}
                                </span>
                            </p>
                        </CardContent>
                    </Card>

                    {/* TASK 6: Anti-Cheat Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Anti-Cheat Protection</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <span className={`text-sm font-medium ${exam.antiCheatEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                                    {exam.antiCheatEnabled ? '✓ Enabled' : '✗ Disabled'}
                                </span>
                            </div>
                            {exam.antiCheatEnabled && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Max Violations</span>
                                    <span className="text-sm font-medium">{exam.maxViolations}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t text-xs text-muted-foreground">
                                {exam.antiCheatEnabled ? (
                                    <ul className="space-y-1">
                                        <li>• Detects tab switching</li>
                                        <li>• Detects window blur</li>
                                        <li>• Detects fullscreen exit</li>
                                        <li>• Auto-submits after {exam.maxViolations} violations</li>
                                    </ul>
                                ) : (
                                    <p>Anti-cheat is disabled for this exam.</p>
                                )}
                            </div>
                            {exam.status !== 'PUBLISHED' && (
                                <p className="text-xs text-muted-foreground italic">
                                    Configure before publishing
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Questions</span>
                                <span className="text-sm font-medium">{exam.questions.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Duration</span>
                                <span className="text-sm font-medium">{exam.duration} mins</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
