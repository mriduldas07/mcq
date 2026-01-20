"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SaveToBankButton } from "@/components/save-to-bank-button";
import { DeleteQuestionButton } from "@/components/delete-question-button";
import { DraggableQuestionsList } from "@/components/draggable-questions-list";
import { reorderQuestionsAction } from "@/actions/exam";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  text: string;
  options: any;
  correctOption: string;
  marks: number;
}

interface BankStatus {
  inBank: boolean;
  folderId?: string;
  folderName?: string;
  questionBankId?: string;
}

interface ExamQuestionsListProps {
  examId: string;
  questions: Question[];
  bankStatusMap: Map<string, BankStatus>;
  isPublished: boolean;
}

export function ExamQuestionsList({
  examId,
  questions,
  bankStatusMap,
  isPublished,
}: ExamQuestionsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleReorder = async (newOrder: Array<{ id: string; [key: string]: any }>) => {
    const questionIds = newOrder.map((q) => q.id);
    
    startTransition(async () => {
      try {
        await reorderQuestionsAction(examId, questionIds);
        router.refresh();
      } catch (error) {
        console.error("Failed to reorder questions:", error);
      }
    });
  };

  if (questions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex h-32 items-center justify-center text-muted-foreground text-sm">
          No questions yet. Add one below.
        </CardContent>
      </Card>
    );
  }

  return (
    <DraggableQuestionsList
      items={questions}
      onReorder={handleReorder}
      disabled={isPublished || isPending}
      renderItem={(q: Question, i: number, dragHandleProps: any) => {
        let options: Array<{ id: string; text: string }> = [];
        try {
          options = typeof q.options === "string"
            ? JSON.parse(q.options)
            : (q.options as Array<{ id: string; text: string }>);
        } catch (e) {
          console.error("Failed to parse options", e);
        }

        const bankStatus = bankStatusMap.get(q.text);

        return (
          <Card className="overflow-visible">
            <CardHeader className="p-3 sm:p-4">
              <div className="flex justify-between items-start gap-2 min-w-0">
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm shrink-0">Q{i + 1}</span>
                    {bankStatus?.inBank && bankStatus?.folderName && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <span>📁</span>
                        <span>{bankStatus.folderName}</span>
                      </Badge>
                    )}
                    {bankStatus?.inBank && !bankStatus?.folderName && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Saved (No folder)
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm sm:text-base wrap-break-word overflow-wrap-anywhere">
                    {q.text}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <SaveToBankButton
                    examId={examId}
                    questionId={q.id}
                    initialStatus={bankStatus || { inBank: false }}
                    questionBankId={bankStatus?.questionBankId}
                  />
                  {!isPublished && (
                    <DeleteQuestionButton questionId={q.id} examId={examId} />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3 sm:pb-4 px-3 sm:px-4">
              <div className="space-y-1 min-w-0">
                {options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded wrap-break-word overflow-wrap-anywhere ${
                      opt.id === q.correctOption
                        ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {opt.text} {opt.id === q.correctOption && "✓"}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      }}
    />
  );
}
