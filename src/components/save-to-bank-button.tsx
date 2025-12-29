"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, Loader2 } from "lucide-react";
import { saveToQuestionBankAction } from "@/actions/question-bank";
import { useRouter } from "next/navigation";

interface SaveToBankButtonProps {
  examId: string;
  questionId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function SaveToBankButton({ examId, questionId, variant = "outline", size = "sm" }: SaveToBankButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveToQuestionBankAction(examId, questionId);
      
      if (result.alreadyExists) {
        // Question already in bank - show info message
        alert("ℹ️ " + result.message);
      } else if (result.success) {
        // Successfully saved - show success message
        alert("✅ " + result.message);
        router.refresh();
      } else {
        // Some other issue
        alert(result.message);
      }
    } catch (error: any) {
      alert("❌ " + (error.message || "Failed to save question"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleSave}
      disabled={isSaving}
      title="Save to Question Bank"
    >
      {isSaving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <BookmarkPlus className="h-4 w-4" />
      )}
    </Button>
  );
}
