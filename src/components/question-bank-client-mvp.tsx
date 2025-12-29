"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteQuestionBankAction } from "@/actions/question-bank";

interface QuestionBankItem {
  id: string;
  text: string;
  options: any;
  correctOption: string;
  marks: number;
  subject?: string | null;
  topic?: string | null;
  difficulty: string;
  tags: string[];
  usageCount: number;
  createdAt: Date;
}

interface QuestionBankClientProps {
  questions: QuestionBankItem[];
  totalQuestions: number;
  subjects: string[];
  difficulties: { EASY: number; MEDIUM: number; HARD: number };
}

export function QuestionBankClient({
  questions,
  totalQuestions,
  subjects,
  difficulties,
}: QuestionBankClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");

  // Filter questions based on search and filters
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Search filter
      if (searchQuery && !q.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Subject filter
      if (selectedSubject !== "ALL" && q.subject !== selectedSubject) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== "ALL" && q.difficulty !== selectedDifficulty) {
        return false;
      }

      return true;
    });
  }, [questions, searchQuery, selectedSubject, selectedDifficulty]);

  const handleDelete = async (questionId: string) => {
    if (!confirm("Delete this question? This cannot be undone.")) {
      return;
    }

    try {
      await deleteQuestionBankAction([questionId]);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to delete question");
    }
  };

  return (
    <div className="space-y-6">
      {/* Simple Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalQuestions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{subjects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Most Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {questions.length > 0 ? Math.max(...questions.map((q) => q.usageCount)) : 0}x
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="success" className="text-xs">E:{difficulties.EASY}</Badge>
              <Badge variant="info" className="text-xs">M:{difficulties.MEDIUM}</Badge>
              <Badge variant="destructive" className="text-xs">H:{difficulties.HARD}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="ALL">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="ALL">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {filteredQuestions.length} of {totalQuestions} questions
              </span>
              {(searchQuery || selectedSubject !== "ALL" || selectedDifficulty !== "ALL") && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSubject("ALL");
                    setSelectedDifficulty("ALL");
                  }}
                  className="h-auto p-0"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {totalQuestions === 0 ? "No questions saved yet" : "No questions match your filters"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {totalQuestions === 0
                  ? "Start building your question bank by saving questions from your exams."
                  : "Try adjusting your search or filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredQuestions.map((question) => (
            <Card key={question.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-medium text-base flex-1">{question.text}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {Array.isArray(question.options) &&
                      question.options.map((opt: any) => (
                        <Badge
                          key={opt.id}
                          variant={opt.id === question.correctOption ? "success" : "secondary"}
                        >
                          {opt.text}
                        </Badge>
                      ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge
                      variant={
                        question.difficulty === "EASY"
                          ? "success"
                          : question.difficulty === "HARD"
                          ? "destructive"
                          : "info"
                      }
                    >
                      {question.difficulty}
                    </Badge>
                    {question.subject && <span>Subject: {question.subject}</span>}
                    {question.topic && <span>• Topic: {question.topic}</span>}
                    <span>• {question.marks} mark{question.marks !== 1 ? "s" : ""}</span>
                    <span>• Used {question.usageCount}x</span>
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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
