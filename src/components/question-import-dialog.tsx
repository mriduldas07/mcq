"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

interface QuestionImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (questions: QuestionImportData[]) => void;
}

export function QuestionImportDialog({ open, onOpenChange, onImport }: QuestionImportDialogProps) {
  const [importText, setImportText] = useState("");
  const [importFormat, setImportFormat] = useState<"json" | "csv" | "pdf" | "docx" | "text">("json");
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<QuestionImportData[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setParseError(null);
    setParsedQuestions(null);

    try {
      // Auto-detect format
      if (file.name.endsWith('.pdf')) {
        setImportFormat("pdf");
        await handlePDFUpload(file);
      } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        setImportFormat("docx");
        await handleDOCXUpload(file);
      } else if (file.name.endsWith('.json')) {
        setImportFormat("json");
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setImportText(content);
          setIsProcessing(false);
        };
        reader.readAsText(file);
      } else if (file.name.endsWith('.csv')) {
        setImportFormat("csv");
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setImportText(content);
          setIsProcessing(false);
        };
        reader.readAsText(file);
      } else {
        throw new Error("Unsupported file format. Please use PDF, DOCX, JSON, or CSV.");
      }
    } catch (error: any) {
      setParseError(error.message || "Failed to process file");
      setIsProcessing(false);
    }
  };

  const handlePDFUpload = async (file: File) => {
    try {
      const { parsePDF, validateQuestions } = await import('@/lib/document-parser');
      
      console.log('=== PDF Upload Started ===');
      console.log('File name:', file.name);
      console.log('File size:', file.size, 'bytes');
      
      const questions = await parsePDF(file);
      
      const validation = validateQuestions(questions);
      if (!validation.valid) {
        throw new Error(`Validation errors:\n${validation.errors.join('\n')}`);
      }
      
      setParsedQuestions(questions);
      setIsProcessing(false);
    } catch (error: any) {
      console.error('=== PDF Upload Failed ===');
      console.error('Error:', error);
      setParseError(error.message || "Failed to parse PDF");
      setIsProcessing(false);
    }
  };

  const handleDOCXUpload = async (file: File) => {
    try {
      const { parseDOCX, validateQuestions } = await import('@/lib/document-parser');
      const questions = await parseDOCX(file);
      
      const validation = validateQuestions(questions);
      if (!validation.valid) {
        throw new Error(`Validation errors:\n${validation.errors.join('\n')}`);
      }
      
      setParsedQuestions(questions);
      setIsProcessing(false);
    } catch (error: any) {
      setParseError(error.message || "Failed to parse DOCX");
      setIsProcessing(false);
    }
  };

  const parseJSON = (text: string): QuestionImportData[] => {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) {
      throw new Error("JSON must be an array of questions");
    }
    
    return data.map((q, index) => {
      if (!q.text || !q.options || !q.correctOption) {
        throw new Error(`Question ${index + 1} is missing required fields (text, options, correctOption)`);
      }
      
      // Ensure options have proper structure
      const options = Array.isArray(q.options) 
        ? q.options.map((opt: any, i: number) => ({
            id: opt.id || `opt_${i}`,
            text: typeof opt === 'string' ? opt : opt.text
          }))
        : [];
      
      return {
        text: q.text,
        options,
        correctOption: q.correctOption,
        marks: q.marks || 1,
        negativeMarks: q.negativeMarks || 0,
        timeLimit: q.timeLimit,
        explanation: q.explanation,
        difficulty: q.difficulty || "MEDIUM",
      };
    });
  };

  const parseCSV = (text: string): QuestionImportData[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header row and one question");
    }

    // Expected format: Question,Option1,Option2,Option3,Option4,CorrectOption,Marks,Difficulty
    const headers = lines[0].split(',').map(h => h.trim());
    const questions: QuestionImportData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 6) continue; // Skip incomplete rows

      const options = [
        { id: "opt_1", text: values[1] || "" },
        { id: "opt_2", text: values[2] || "" },
        { id: "opt_3", text: values[3] || "" },
        { id: "opt_4", text: values[4] || "" },
      ].filter(opt => opt.text);

      // CorrectOption should be 1-4
      const correctIndex = parseInt(values[5]) - 1;
      if (correctIndex < 0 || correctIndex >= options.length) {
        throw new Error(`Question ${i}: Invalid correct option index`);
      }

      questions.push({
        text: values[0],
        options,
        correctOption: options[correctIndex].id,
        marks: parseInt(values[6]) || 1,
        negativeMarks: parseFloat(values[7]) || 0,
        timeLimit: values[8] ? parseInt(values[8]) : undefined,
        explanation: values[9],
        difficulty: (values[10] as any) || "MEDIUM",
      });
    }

    return questions;
  };

  const parseText = async (text: string): Promise<QuestionImportData[]> => {
    const { parseQuestionText } = await import('@/lib/document-parser');
    return parseQuestionText(text);
  };

  const handlePreview = async () => {
    setParseError(null);
    setParsedQuestions(null);

    try {
      let questions: QuestionImportData[];
      
      if (importFormat === "json") {
        questions = parseJSON(importText);
      } else if (importFormat === "csv") {
        questions = parseCSV(importText);
      } else if (importFormat === "text") {
        // Use the document parser for text format
        const { validateQuestions } = await import('@/lib/document-parser');
        questions = await parseText(importText);
        
        const validation = validateQuestions(questions);
        if (!validation.valid) {
          throw new Error(`Validation errors:\n${validation.errors.join('\n')}`);
        }
      } else {
        questions = parseCSV(importText);
      }

      setParsedQuestions(questions);
    } catch (error: any) {
      setParseError(error.message || "Failed to parse import data");
    }
  };

  const handleImport = () => {
    if (parsedQuestions) {
      onImport(parsedQuestions);
      onOpenChange(false);
      setImportText("");
      setParsedQuestions(null);
      setParseError(null);
    }
  };

  const downloadTemplate = (format: "json" | "csv") => {
    let content = "";
    let filename = "";

    if (format === "json") {
      const template = [
        {
          text: "What is 2 + 2?",
          options: [
            { id: "opt_1", text: "3" },
            { id: "opt_2", text: "4" },
            { id: "opt_3", text: "5" },
            { id: "opt_4", text: "6" }
          ],
          correctOption: "opt_2",
          marks: 1,
          negativeMarks: 0.25,
          timeLimit: 60,
          explanation: "2 + 2 equals 4",
          difficulty: "EASY"
        }
      ];
      content = JSON.stringify(template, null, 2);
      filename = "questions_template.json";
    } else {
      content = "Question,Option1,Option2,Option3,Option4,CorrectOption,Marks,NegativeMarks,TimeLimit,Explanation,Difficulty\n";
      content += "What is 2 + 2?,3,4,5,6,2,1,0.25,60,2 + 2 equals 4,EASY\n";
      filename = "questions_template.csv";
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Questions
          </DialogTitle>
          <DialogDescription>
            Upload questions in bulk using JSON or CSV format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format Selection */}
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant={importFormat === "pdf" ? "default" : "outline"}
              onClick={() => setImportFormat("pdf")}
              size="sm"
            >
              📄 PDF
            </Button>
            <Button
              type="button"
              variant={importFormat === "docx" ? "default" : "outline"}
              onClick={() => setImportFormat("docx")}
              size="sm"
            >
              📝 DOCX
            </Button>
            <Button
              type="button"
              variant={importFormat === "text" ? "default" : "outline"}
              onClick={() => setImportFormat("text" as any)}
              size="sm"
            >
              📝 Text
            </Button>
            <Button
              type="button"
              variant={importFormat === "json" ? "default" : "outline"}
              onClick={() => setImportFormat("json")}
              size="sm"
            >
              JSON
            </Button>
            <Button
              type="button"
              variant={importFormat === "csv" ? "default" : "outline"}
              onClick={() => setImportFormat("csv")}
              size="sm"
            >
              CSV
            </Button>
            {(importFormat === "json" || importFormat === "csv") && (
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadTemplate(importFormat as "json" | "csv")}
                size="sm"
                className="ml-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="fileUpload">Upload File</Label>
            <input
              id="fileUpload"
              type="file"
              accept=".pdf,.docx,.doc,.json,.csv"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, DOCX, JSON, CSV
            </p>
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                Processing document...
              </div>
            )}
          </div>

          {/* Text Input - Only for JSON/CSV/TEXT */}
          {(importFormat === "json" || importFormat === "csv" || importFormat === "text") && (
            <>
              <div className="space-y-2">
                <Label htmlFor="importText">Or Paste {importFormat.toUpperCase()} Content</Label>
                <Textarea
                  id="importText"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={
                    importFormat === "json"
                      ? 'Paste JSON array of questions...\n[\n  {\n    "text": "Question text",\n    "options": [{"id": "opt_1", "text": "Option 1"}, ...],\n    "correctOption": "opt_1",\n    "marks": 1\n  }\n]'
                      : importFormat === "csv"
                      ? 'Paste CSV content...\nQuestion,Option1,Option2,Option3,Option4,CorrectOption,Marks,NegativeMarks,TimeLimit,Explanation,Difficulty\nWhat is 2+2?,3,4,5,6,2,1,0.25,60,Explanation,EASY'
                      : 'Paste your questions in this format:\n\nQ1. What is the capital of France?\nA) London\nB) Paris\nC) Berlin\nD) Madrid\nAnswer: B\nMarks: 2\nNegative: 0.5\nTime: 60\nDifficulty: MEDIUM\nExplanation: Paris is the capital city of France.\n\nQ2. Next question...'
                  }
                  className="font-mono text-xs min-h-[200px]"
                />
              </div>

              {/* Preview Button */}
              <Button
                type="button"
                onClick={handlePreview}
                disabled={!importText.trim()}
                variant="secondary"
              >
                <FileText className="h-4 w-4 mr-2" />
                Preview Questions
              </Button>
            </>
          )}

          {/* Format Instructions for PDF/DOCX */}
          {(importFormat === "pdf" || importFormat === "docx") && !parsedQuestions && !parseError && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-2">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium mb-2">Expected Format:</p>
                  <div className="bg-white dark:bg-slate-900 rounded p-3 font-mono text-xs space-y-1">
                    <div>Q1. What is the capital of France?</div>
                    <div>A) London</div>
                    <div>B) Paris</div>
                    <div>C) Berlin</div>
                    <div>D) Madrid</div>
                    <div>Answer: B</div>
                    <div className="text-muted-foreground">Marks: 2 (optional)</div>
                    <div className="text-muted-foreground">Negative: 0.5 (optional)</div>
                    <div className="text-muted-foreground">Time: 60 (optional)</div>
                    <div className="text-muted-foreground">Difficulty: MEDIUM (optional)</div>
                    <div className="text-muted-foreground">Explanation: Paris is the capital... (optional)</div>
                  </div>
                  <p className="mt-2 text-blue-800 dark:text-blue-200">
                    Upload a {importFormat.toUpperCase()} file with questions in this format.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {parseError && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div className="text-sm text-red-900 dark:text-red-100">
                  <p className="font-medium">Parse Error:</p>
                  <p className="text-red-800 dark:text-red-200">{parseError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Preview */}
          {parsedQuestions && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="font-medium text-green-900 dark:text-green-100">
                  Successfully parsed {parsedQuestions.length} question(s)
                </p>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {parsedQuestions.slice(0, 3).map((q, index) => (
                  <div key={index} className="bg-white dark:bg-slate-900 rounded p-3 text-sm">
                    <p className="font-medium mb-1">{index + 1}. {q.text}</p>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {q.options.map((opt) => (
                        <Badge
                          key={opt.id}
                          variant={opt.id === q.correctOption ? "success" : "secondary"}
                        >
                          {opt.text}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>Marks: {q.marks}</span>
                      {(q.negativeMarks ?? 0) > 0 && <span>Negative: -{q.negativeMarks}</span>}
                      {q.timeLimit && <span>Time: {q.timeLimit}s</span>}
                      <Badge variant="outline" className="text-xs">{q.difficulty}</Badge>
                    </div>
                  </div>
                ))}
                {parsedQuestions.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    ... and {parsedQuestions.length - 3} more question(s)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!parsedQuestions}
          >
            Import {parsedQuestions?.length || 0} Questions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
