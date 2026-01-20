"use client";

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { QuestionEditorCard } from './question-editor-card';
import { DraggableQuestionsList } from './draggable-questions-list';
import { reorderQuestionsAction } from '@/actions/exam';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  text: string;
  options: any;
  correctOption: string;
  marks: number;
  explanation?: string | null;
  imageUrl?: string | null;
}

interface BankStatus {
  inBank: boolean;
  folderId?: string;
  folderName?: string;
  questionBankId?: string;
}

interface EnhancedQuestionsListProps {
  examId: string;
  questions: Question[];
  bankStatusMap: Map<string, BankStatus>;
  isPublished: boolean;
  isPro: boolean;
}

export function EnhancedQuestionsList({
  examId,
  questions,
  bankStatusMap,
  isPublished,
  isPro,
}: EnhancedQuestionsListProps) {
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
          No questions yet. Add one below to get started.
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
        const bankStatus = bankStatusMap.get(q.text);
        
        return (
          <QuestionEditorCard
            key={q.id}
            examId={examId}
            question={q}
            index={i}
            isPublished={isPublished}
            isPro={isPro}
            bankStatus={bankStatus}
            dragHandleProps={dragHandleProps}
          />
        );
      }}
    />
  );
}
