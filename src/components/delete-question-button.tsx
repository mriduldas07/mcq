"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteQuestionAction } from "@/actions/exam";
import { Trash, Loader2 } from "lucide-react";

export function DeleteQuestionButton({ questionId, examId }: { questionId: string; examId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (!confirm("Are you sure you want to delete this question?")) return;
        
        startTransition(async () => {
            const result = await deleteQuestionAction(questionId, examId);
            
            if (result?.error) {
                alert(`Error: ${result.error}`);
            }
        });
    };

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={handleDelete}
            disabled={isPending}
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Trash className="h-4 w-4" />
            )}
        </Button>
    );
}
