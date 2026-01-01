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
    userCredits: number;
    isPro: boolean;
    questionCount: number;
};

export function PublishButton({ examId, userCredits, isPro, questionCount }: PublishButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [showDialog, setShowDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // TASK 5: Check if user can publish
    const canPublish = isPro || userCredits > 0;
    const hasQuestions = questionCount > 0;

    const handlePublish = () => {
        if (!hasQuestions) {
            setErrorMessage("Cannot publish an exam without questions. Add at least one question first.");
            setShowDialog(true);
            return;
        }

        if (!canPublish) {
            setErrorMessage("You don't have enough credits to publish this exam. Please purchase credits or upgrade to Pro.");
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
                disabled={isPending || !hasQuestions}
                variant="default"
                size="sm"
                className={`relative transition-all ${
                    isPending 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : ''
                }`}
            >
                {!canPublish && <Lock className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />}
                {isPending && <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
                <span className="text-xs sm:text-sm">
                    {isPending ? "Publishing..." : "Publish"}
                </span>
                {!isPro && canPublish && !isPending && (
                    <span className="ml-1 text-[10px] sm:text-xs opacity-75 hidden sm:inline">(-1 credit)</span>
                )}
            </Button>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
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
