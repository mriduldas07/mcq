"use client";

import { useState, useMemo, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  BookOpen,
  BarChart3,
  Tag as TagIcon,
  Download,
  Upload,
  Loader2
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { 
  deleteQuestionBankAction, 
  duplicateQuestionsAction,
  addTagsToQuestionsAction 
} from "@/actions/question-bank";

interface QuestionBankItem {
  id: string;
  text: string;
  options: any;
  correctOption: string;
  marks: number;
  negativeMarks: number;
  timeLimit?: number | null;
  explanation?: string | null;
  difficulty: string;
  subject?: string | null;
  topic?: string | null;
  tags: string[];
  usageCount: number;
  lastUsed?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface QuestionBankClientProps {
  questions: QuestionBankItem[];
  stats: {
    total: number;
    byDifficulty: Record<string, number>;
    bySubject: Record<string, number>;
    totalUsage: number;
  };
  subjects: string[];
  tags: string[];
}

export function QuestionBankClient({ questions, stats, subjects, tags }: QuestionBankClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Filter questions based on search and filters
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Search filter
      if (searchQuery && !q.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== "ALL" && q.difficulty !== selectedDifficulty) {
        return false;
      }

      // Subject filter
      if (selectedSubject !== "ALL" && q.subject !== selectedSubject) {
        return false;
      }

      // Tags filter
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every((tag) => q.tags.includes(tag));
        if (!hasAllTags) return false;
      }

      return true;
    });
  }, [questions, searchQuery, selectedDifficulty, selectedSubject, selectedTags]);

  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const selectAll = () => {
    setSelectedQuestions(filteredQuestions.map((q) => q.id));
  };

  const deselectAll = () => {
    setSelectedQuestions([]);
  };

  const handleDelete = async (questionIds: string[]) => {
    if (!confirm(`Delete ${questionIds.length} question(s)? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteQuestionBankAction(questionIds);
        setSelectedQuestions([]);
        router.refresh();
      } catch (error: any) {
        alert(error.message || "Failed to delete questions");
      }
    });
  };

  const handleDuplicate = async (questionIds: string[]) => {
    startTransition(async () => {
      try {
        await duplicateQuestionsAction(questionIds);
        setSelectedQuestions([]);
        router.refresh();
      } catch (error: any) {
        alert(error.message || "Failed to duplicate questions");
      }
    });
  };

  const handleAddTags = async (questionIds: string[]) => {
    const tagsInput = prompt("Enter tags (comma-separated):");
    if (!tagsInput) return;

    const newTags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    if (newTags.length === 0) return;

    startTransition(async () => {
      try {
        await addTagsToQuestionsAction(questionIds, newTags);
        setSelectedQuestions([]);
        router.refresh();
      } catch (error: any) {
        alert(error.message || "Failed to add tags");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              In your question bank
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              Times questions used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <TagIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.bySubject).length}</div>
            <p className="text-xs text-muted-foreground">
              Different subjects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Difficulty Split</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="success" className="text-xs">E: {stats.byDifficulty.EASY || 0}</Badge>
              <Badge variant="info" className="text-xs">M: {stats.byDifficulty.MEDIUM || 0}</Badge>
              <Badge variant="destructive" className="text-xs">H: {stats.byDifficulty.HARD || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions Bar */}
      <Card>
        <CardContent className="pt-6">
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant={selectedDifficulty === "ALL" ? "default" : "outline"}
                      onClick={() => setSelectedDifficulty("ALL")}
                    >
                      All
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedDifficulty === "EASY" ? "success" : "outline"}
                      onClick={() => setSelectedDifficulty("EASY")}
                    >
                      Easy
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedDifficulty === "MEDIUM" ? "info" : "outline"}
                      onClick={() => setSelectedDifficulty("MEDIUM")}
                    >
                      Medium
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedDifficulty === "HARD" ? "destructive" : "outline"}
                      onClick={() => setSelectedDifficulty("HARD")}
                    >
                      Hard
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="ALL">All Subjects</option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-1 flex-wrap">
                    {tags.slice(0, 5).map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTagFilter(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 5 && (
                      <Badge variant="outline">+{tags.length - 5} more</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 text-sm text-muted-foreground">
                <span>Showing {filteredQuestions.length} of {questions.length} questions</span>
                {(searchQuery || selectedDifficulty !== "ALL" || selectedSubject !== "ALL" || selectedTags.length > 0) && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedDifficulty("ALL");
                      setSelectedSubject("ALL");
                      setSelectedTags([]);
                    }}
                    className="h-auto p-0"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedQuestions.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {selectedQuestions.length} question(s) selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onClick={deselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleAddTags(selectedQuestions)}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TagIcon className="h-4 w-4 mr-2" />}
                  Add Tags
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDuplicate(selectedQuestions)}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Copy className="h-4 w-4 mr-2" />}
                  Duplicate
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleDelete(selectedQuestions)}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No questions found</h3>
              <p className="text-muted-foreground mb-4">
                {questions.length === 0
                  ? "Start building your question bank by adding questions."
                  : "Try adjusting your filters or search query."}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Question
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredQuestions.map((question) => (
            <Card
              key={question.id}
              className={`transition-all ${
                selectedQuestions.includes(question.id)
                  ? "border-primary bg-primary/5"
                  : ""
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(question.id)}
                    onChange={() => toggleQuestionSelection(question.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-base">{question.text}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => alert("Edit functionality coming soon!")}
                          disabled={isPending}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDuplicate([question.id])}
                          disabled={isPending}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDelete([question.id])}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap text-sm">
                      {Array.isArray(question.options) &&
                        question.options.map((opt: any) => (
                          <Badge
                            key={opt.id}
                            variant={
                              opt.id === question.correctOption
                                ? "success"
                                : "secondary"
                            }
                          >
                            {opt.text}
                          </Badge>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                      {question.subject && (
                        <span className="flex items-center gap-1">
                          <TagIcon className="h-3 w-3" />
                          {question.subject}
                        </span>
                      )}
                      {question.topic && <span>• {question.topic}</span>}
                      <span>• Marks: {question.marks}</span>
                      {question.negativeMarks > 0 && (
                        <span>• Negative: -{question.negativeMarks}</span>
                      )}
                      {question.timeLimit && (
                        <span>• {question.timeLimit}s</span>
                      )}
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

                    {question.explanation && (
                      <div className="p-3 bg-muted rounded-md text-sm">
                        <p className="text-muted-foreground">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
