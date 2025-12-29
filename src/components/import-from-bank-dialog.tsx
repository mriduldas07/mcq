"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Loader2, CheckCircle2 } from "lucide-react";
import { importFromQuestionBankAction } from "@/actions/question-bank";
import { useRouter } from "next/navigation";

interface QuestionBankItem {
  id: string;
  text: string;
  options: any;
  correctOption: string;
  marks: number;
  difficulty: string;
  subject?: string | null;
  tags: string[];
  usageCount: number;
}

interface ImportFromBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
}

export function ImportFromBankDialog({ open, onOpenChange, examId }: ImportFromBankDialogProps) {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionBankItem[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      loadQuestions();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredQuestions(
        questions.filter((q) =>
          q.text.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredQuestions(questions);
    }
  }, [searchQuery, questions]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/question-bank");
      const data = await response.json();
      setQuestions(data.questions || []);
      setFilteredQuestions(data.questions || []);
    } catch (error) {
      console.error("Failed to load questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleQuestion = (id: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  const handleImport = async () => {
    if (selectedQuestions.length === 0) return;

    setIsImporting(true);
    try {
      const result = await importFromQuestionBankAction(examId, selectedQuestions);
      alert(result.message || `Imported ${selectedQuestions.length} question(s)`);
      onOpenChange(false);
      setSelectedQuestions([]);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to import questions");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Import from Question Bank
          </DialogTitle>
          <DialogDescription>
            Select questions from your question bank to add to this exam
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Count */}
          {selectedQuestions.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                {selectedQuestions.length} question(s) selected
              </p>
            </div>
          )}

          {/* Questions List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {questions.length === 0
                  ? "No questions in your bank yet"
                  : "No questions match your search"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedQuestions.includes(question.id)
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => toggleQuestion(question.id)}
                >
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(question.id)}
                      onChange={() => toggleQuestion(question.id)}
                      className="mt-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 space-y-2">
                      <p className="font-medium">{question.text}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge
                          variant={
                            question.difficulty === "EASY"
                              ? "success"
                              : question.difficulty === "HARD"
                              ? "destructive"
                              : "info"
                          }
                          className="text-xs"
                        >
                          {question.difficulty}
                        </Badge>
                        {question.subject && (
                          <Badge variant="outline" className="text-xs">
                            {question.subject}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {question.marks} marks
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Used {question.usageCount}x
                        </Badge>
                      </div>
                      {question.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {question.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={selectedQuestions.length === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Import {selectedQuestions.length} Question(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
