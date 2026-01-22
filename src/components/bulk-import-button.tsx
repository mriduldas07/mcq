"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { QuestionImportDialog } from "@/components/question-import-dialog";
import { FileUp, Loader2 } from "lucide-react";
import { bulkImportQuestionsAction } from "@/actions/exam";
import { useRouter } from "next/navigation";

interface BulkImportButtonProps {
  examId: string;
  disabled?: boolean;
}

interface QuestionImportData {
  text: string;
  options: { id: string; text: string }[];
  correctOption: string;
  marks?: number;
  negativeMarks?: number;
  timeLimit?: number;
  explanation?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
}

export function BulkImportButton({ examId, disabled }: BulkImportButtonProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleImport = async (questions: QuestionImportData[]) => {
    startTransition(async () => {
      try {
        await bulkImportQuestionsAction(examId, questions);
        setShowImportDialog(false);
        router.refresh(); // Refresh to show new questions
      } catch (error) {
        console.error("Failed to import questions:", error);
        alert("Failed to import questions. Please try again.");
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setShowImportDialog(true)}
        disabled={disabled || isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <FileUp className="h-4 w-4" />
            Bulk Import
          </>
        )}
      </Button>

      <QuestionImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImport}
      />
    </>
  );
}
