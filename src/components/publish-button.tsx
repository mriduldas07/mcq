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
                className="relative"
            >
                {!canPublish && <Lock className="mr-2 h-4 w-4" />}
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? "Publishing..." : "Publish Exam"}
                {!isPro && canPublish && (
                    <span className="ml-2 text-xs opacity-75">(-1 credit)</span>
                )}
            </Button>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            Cannot Publish Exam
                        </DialogTitle>
                        <DialogDescription className="pt-4">
                            {errorMessage}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        {!canPublish && (
                            <Link href="/dashboard/billing">
                                <Button>Go to Billing</Button>
                            </Link>
                        )}
                        <Button variant="outline" onClick={() => setShowDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
