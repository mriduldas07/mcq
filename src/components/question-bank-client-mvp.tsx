"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Trash2, Plus, Folder, FolderOpen, ChevronRight, Home, FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteQuestionBankAction } from "@/actions/question-bank";
import { createFolder, deleteFolder } from "@/actions/folder";
import Link from "next/link";

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
  folderId?: string | null;
  folder?: {
    id: string;
    name: string;
    color?: string | null;
    icon?: string | null;
  } | null;
}

interface FolderItem {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  parentId?: string | null;
  _count?: {
    questions: number;
    subfolders: number;
  };
}

interface QuestionBankClientProps {
  questions: QuestionBankItem[];
  folders: FolderItem[];
  currentFolderId: string | null;
  folderPath: FolderItem[];
  totalQuestions: number;
  subjects: string[];
  difficulties: { EASY: number; MEDIUM: number; HARD: number };
}

export function QuestionBankClient({
  questions,
  folders,
  currentFolderId,
  folderPath,
  totalQuestions,
  subjects,
  difficulties,
}: QuestionBankClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Get subfolders of current folder
  const subfolders = useMemo(() => {
    return folders.filter(f => f.parentId === currentFolderId);
  }, [folders, currentFolderId]);

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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert("Please enter a folder name");
      return;
    }

    setCreatingFolder(true);
    try {
      await createFolder({ 
        name: newFolderName.trim(), 
        parentId: currentFolderId 
      });
      setNewFolderName("");
      setIsCreatingFolder(false);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Delete this folder? Questions inside will be moved to root.")) {
      return;
    }

    try {
      await deleteFolder(folderId);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to delete folder");
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Card>
        <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-wrap">
            <Link 
              href="/dashboard/question-bank"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Home className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">All Questions</span>
              <span className="sm:hidden">All</span>
            </Link>
            
            {folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-1 sm:gap-2">
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <Link
                  href={`/dashboard/question-bank?folderId=${folder.id}`}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  {folder.icon && <span className="text-sm sm:text-base">{folder.icon}</span>}
                  <Folder className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="truncate max-w-[100px] sm:max-w-none">{folder.name}</span>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Folders Section */}
      {subfolders.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base sm:text-lg">Folders</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreatingFolder(true)}
                className="text-xs sm:text-sm"
              >
                <FolderPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">New Folder</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {subfolders.map((folder) => (
                <div
                  key={folder.id}
                  className="group relative border rounded-lg p-3 sm:p-4 hover:bg-accent transition-colors"
                >
                  <Link
                    href={`/dashboard/question-bank?folderId=${folder.id}`}
                    className="flex flex-col items-center gap-1 sm:gap-2"
                  >
                    {folder.icon ? (
                      <span className="text-2xl sm:text-3xl">{folder.icon}</span>
                    ) : (
                      <Folder className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600 dark:text-yellow-500" />
                    )}
                    <div className="text-center w-full">
                      <p className="font-medium text-xs sm:text-sm truncate">
                        {folder.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {folder._count?.questions || 0} questions
                      </p>
                    </div>
                  </Link>
                  
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                    title="Delete folder"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create New Folder Form */}
      {isCreatingFolder && (
        <Card className="border-2 border-primary">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <FolderPlus className="w-5 h-5 text-muted-foreground hidden sm:block" />
              <Input
                placeholder="Enter folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") {
                    setIsCreatingFolder(false);
                    setNewFolderName("");
                  }
                }}
                autoFocus
                className="flex-1"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateFolder} 
                  disabled={creatingFolder || !newFolderName.trim()}
                  className="flex-1 sm:flex-none"
                >
                  {creatingFolder ? "Creating..." : "Create"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName("");
                  }}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Create Folder Button (when no subfolders) */}
      {subfolders.length === 0 && !isCreatingFolder && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsCreatingFolder(true)}
            className="gap-2"
          >
            <FolderPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Create Your First Folder</span>
          </Button>
        </div>
      )}

      {/* Simple Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{totalQuestions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{subjects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Most Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">
              {questions.length > 0 ? Math.max(...questions.map((q) => q.usageCount)) : 0}x
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 sm:gap-2 flex-wrap">
              <Badge variant="success" className="text-xs">E:{difficulties.EASY}</Badge>
              <Badge variant="info" className="text-xs">M:{difficulties.MEDIUM}</Badge>
              <Badge variant="destructive" className="text-xs">H:{difficulties.HARD}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
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
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
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
                  className="h-auto p-0 text-xs sm:text-sm"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
              <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">
                {totalQuestions === 0 ? "No questions saved yet" : "No questions match your filters"}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                {totalQuestions === 0
                  ? "Start building your question bank by saving questions from your exams."
                  : "Try adjusting your search or filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredQuestions.map((question) => (
            <Card key={question.id}>
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-sm sm:text-base flex-1">{question.text}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(question.id)}
                      className="shrink-0"
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
                          className="text-xs"
                        >
                          {opt.text}
                        </Badge>
                      ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
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
                    {question.subject && <span>Subject: {question.subject}</span>}
                    {question.topic && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span>Topic: {question.topic}</span>
                      </>
                    )}
                    <span className="hidden sm:inline">•</span>
                    <span>{question.marks} mark{question.marks !== 1 ? "s" : ""}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Used {question.usageCount}x</span>
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
