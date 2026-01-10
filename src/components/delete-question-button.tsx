"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteQuestionAction } from "@/actions/exam";
import { Trash, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function DeleteQuestionButton({ questionId, examId }: { questionId: string; examId: string }) {
    const [isPending, startTransition] = useTransition();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteQuestionAction(questionId, examId);
            
            if (result?.error) {
                toast.error("Failed to delete question", {
                    description: result.error
                });
            } else {
                toast.success("Question deleted", {
                    description: "The question has been removed from the exam."
                });
            }
        });
    };

    return (
        <>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => setShowConfirm(true)}
                disabled={isPending}
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Trash className="h-4 w-4" />
                )}
            </Button>

            <ConfirmDialog
                open={showConfirm}
                onOpenChange={setShowConfirm}
                onConfirm={handleDelete}
                title="Delete Question"
                description="Are you sure you want to delete this question? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />
        </>
    );
}
