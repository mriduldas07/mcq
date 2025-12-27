"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteExamAction } from "@/actions/exam";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeleteExamButton({ examId }: { examId: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleDelete = () => {
        if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) return;
        
        startTransition(async () => {
            const result = await deleteExamAction(examId);
            
            if (result?.error) {
                alert(`Error: ${result.error}`);
            } else {
                router.push('/dashboard/exams');
            }
        });
    };

    return (
        <Button 
            variant="destructive" 
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
        >
            {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="mr-2 h-4 w-4" />
            )}
            {isPending ? "Deleting..." : "Delete Exam"}
        </Button>
    );
}
