"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { addQuestionAction } from "@/actions/exam";
import { useRouter } from "next/navigation";

interface BulkPasteDialogProps {
  examId: string;
}

interface ParsedQuestion {
  text: string;
  options: string[];
  correctOption: number;
}

export function BulkPasteDialog({ examId }: BulkPasteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseQuestions = (text: string): ParsedQuestion[] => {
    const questions: ParsedQuestion[] = [];
    
    // Split by question numbers (Q1, Q2, etc. or 1., 2., etc.)
    const questionBlocks = text.split(/(?:^|\n)(?:Q\.?\s*\d+\.?|^\d+\.)/gim).filter(Boolean);

    for (const block of questionBlocks) {
      try {
        // Extract question text (everything before options)
        const optionsMatch = block.match(/[A-F][\.\)]\s*.+/gim);
        if (!optionsMatch || optionsMatch.length < 2) continue;

        const questionText = block.substring(0, block.indexOf(optionsMatch[0])).trim();
        if (!questionText) continue;

        // Extract options
        const options: string[] = [];
        for (const opt of optionsMatch) {
          const optText = opt.replace(/^[A-F][\.\)]\s*/i, '').trim();
          if (optText) options.push(optText);
        }

        if (options.length < 2) continue;

        // Find correct answer
        const answerMatch = block.match(/(?:Answer|Correct|Ans):\s*([A-F])/i);
        let correctOption = 0;

        if (answerMatch) {
          const answerLetter = answerMatch[1].toUpperCase();
          correctOption = answerLetter.charCodeAt(0) - 65; // A=0, B=1, etc.
          correctOption = Math.max(0, Math.min(correctOption, options.length - 1));
        }

        questions.push({
          text: questionText,
          options,
          correctOption,
        });
      } catch (e) {
        console.error('Error parsing question block:', e);
      }
    }

    return questions;
  };

  const handleParse = () => {
    if (!pastedText.trim()) {
      toast.error('Please paste some text');
      return;
    }

    const parsed = parseQuestions(pastedText);
    
    if (parsed.length === 0) {
      toast.error('No valid questions found. Check the format.');
      return;
    }

    setParsedQuestions(parsed);
    toast.success(`Found ${parsed.length} question(s)`);
  };

  const handleImport = async () => {
    if (parsedQuestions.length === 0) return;

    setIsProcessing(true);

    try {
      for (const q of parsedQuestions) {
        const formData = new FormData();
        formData.append('text', q.text);
        formData.append('correctOption', q.correctOption.toString());
        formData.append('marks', '1');
        
        q.options.forEach((opt, i) => {
          formData.append(`option${i}`, opt);
        });

        await addQuestionAction(examId, formData);
      }

      toast.success(`Imported ${parsedQuestions.length} question(s)`);
      setOpen(false);
      setPastedText('');
      setParsedQuestions([]);
      router.refresh();
    } catch (error) {
      toast.error('Failed to import questions');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setOpen(true)}>
        <FileText className="h-4 w-4" />
        Quick Paste
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Paste Questions</DialogTitle>
          <DialogDescription>
            Paste multiple questions at once. We'll automatically parse them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format Guide */}
          <div className="text-xs bg-muted p-3 rounded-md space-y-2">
            <p className="font-medium">Supported formats:</p>
            <pre className="text-xs overflow-x-auto">
{`Q1. What is 2 + 2?
A. 3
B. 4
C. 5
D. 6
Answer: B

Q2. Capital of France?
A. Berlin
B. Madrid
C. Paris
D. Rome
Answer: C`}
            </pre>
          </div>

          {/* Text Input */}
          <div className="space-y-2">
            <Label>Paste your questions here</Label>
            <Textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste questions in the format shown above..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <Button onClick={handleParse} variant="secondary" className="w-full">
            Parse Questions
          </Button>

          {/* Preview */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium text-sm">
                Preview ({parsedQuestions.length} questions)
              </h4>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {parsedQuestions.map((q, idx) => (
                  <div key={idx} className="border rounded-md p-3 bg-muted/50">
                    <p className="font-medium text-sm mb-2">Q{idx + 1}. {q.text}</p>
                    <div className="space-y-1 ml-4">
                      {q.options.map((opt, optIdx) => (
                        <p
                          key={optIdx}
                          className={`text-xs ${
                            optIdx === q.correctOption
                              ? 'text-green-600 font-medium'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}. {opt}
                          {optIdx === q.correctOption && ' ✓'}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setPastedText('');
                setParsedQuestions([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={parsedQuestions.length === 0 || isProcessing}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isProcessing ? 'Importing...' : `Import ${parsedQuestions.length} Question(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
