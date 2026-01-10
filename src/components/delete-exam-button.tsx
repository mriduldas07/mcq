"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteExamAction } from "@/actions/exam";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function DeleteExamButton({ examId }: { examId: string }) {
    const [isPending, startTransition] = useTransition();
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteExamAction(examId);
            
            if (result?.error) {
                toast.error("Failed to delete exam", {
                    description: result.error
                });
            } else {
                toast.success("Exam deleted successfully", {
                    description: "The exam has been permanently deleted."
                });
                router.push('/dashboard/exams');
            }
        });
    };

    return (
        <>
            <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowConfirm(true)}
                disabled={isPending}
            >
                {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                )}
                {isPending ? "Deleting..." : "Delete Exam"}
            </Button>

            <ConfirmDialog
                open={showConfirm}
                onOpenChange={setShowConfirm}
                onConfirm={handleDelete}
                title="Delete Exam"
                description="Are you sure you want to delete this exam? This action cannot be undone. All questions and student attempts will be permanently deleted."
                confirmText="Delete Exam"
                cancelText="Cancel"
                variant="destructive"
            />
        </>
    );
}
