"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { publishExamAction } from "@/actions/exam";
import { Loader2, AlertCircle, Lock } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

type PublishButtonProps = {
    examId: string;
    canPublish: boolean;
    isPro: boolean;
    questionCount: number;
    questions?: Array<{
        id: string;
        text: string;
        options: any;
        correctOption: string;
    }>;
};

export function PublishButton({ examId, canPublish, isPro, questionCount, questions = [] }: PublishButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [showDialog, setShowDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const hasQuestions = questionCount > 0;

    // Validate questions
    const invalidQuestions = questions.filter(q => {
        if (!q.text || !q.text.trim()) return true;
        if (!q.correctOption) return true;
        const options = Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]');
        if (options.length < 2) return true;
        if (options.some((opt: any) => !opt.text || !opt.text.trim())) return true;
        return false;
    });

    const hasValidationErrors = invalidQuestions.length > 0;

    const handlePublish = () => {
        if (!hasQuestions) {
            setErrorMessage("Cannot publish an exam without questions. Add at least one question first.");
            setShowDialog(true);
            return;
        }

        if (hasValidationErrors) {
            setErrorMessage(`Found ${invalidQuestions.length} incomplete question(s). Please ensure all questions have:\n• Question text\n• At least 2 options\n• All option fields filled\n• A correct answer selected`);
            setShowDialog(true);
            return;
        }

        if (!canPublish) {
            setErrorMessage("You don't have enough quota to publish this exam. Please purchase a one-time exam or upgrade to Pro.");
            setShowDialog(true);
            return;
        }

        startTransition(async () => {
            const dummyFormData = new FormData();
            const result = await publishExamAction(examId, dummyFormData);

            if (result?.error) {
                setErrorMessage(result.error);
                setShowDialog(true);
            } else {
                // Success handled by revalidatePath on server
            }
        });
    };

    return (
        <>
            <Button
                onClick={handlePublish}
                disabled={isPending || !hasQuestions || hasValidationErrors}
                variant="default"
                size="sm"
                className={`relative transition-all ${
                    isPending 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : ''
                }`}
                title={hasValidationErrors ? `${invalidQuestions.length} incomplete question(s)` : undefined}
            >
                {!canPublish && <Lock className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />}
                {isPending && <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
                <span className="text-xs sm:text-sm">
                    {isPending ? "Publishing..." : "Publish"}
                </span>
            </Button>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                            <span>Cannot Publish Exam</span>
                        </DialogTitle>
                        <DialogDescription className="pt-3 text-sm">
                            {errorMessage}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        {!canPublish && (
                            <Link href="/dashboard/billing" className="w-full sm:w-auto">
                                <Button className="w-full">Go to Billing</Button>
                            </Link>
                        )}
                        <Button 
                            variant="outline" 
                            onClick={() => setShowDialog(false)}
                            className="w-full sm:w-auto"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
