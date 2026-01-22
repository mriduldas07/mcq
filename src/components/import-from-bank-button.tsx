"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { ImportFromBankDialog } from "@/components/import-from-bank-dialog";

interface ImportFromBankButtonProps {
  examId: string;
}

export function ImportFromBankButton({ examId }: ImportFromBankButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setShowDialog(true)}
      >
        <BookOpen className="h-4 w-4" />
        From Bank
      </Button>

      <ImportFromBankDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        examId={examId}
      />
    </>
  );
}
