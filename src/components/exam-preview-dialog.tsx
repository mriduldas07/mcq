"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, Target, Shuffle, Lock, Calendar, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface ExamPreviewData {
  title: string;
  description: string;
  duration: number;
  passPercentage: number;
  antiCheatEnabled: boolean;
  maxViolations: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultsImmediately: boolean;
  requirePassword: boolean;
  examPassword?: string;
  maxAttempts?: number;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  allowLateSubmission: boolean;
  negativeMarking: boolean;
  negativeMarks: number;
  priceMode: string;
}

interface ExamPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExamPreviewData;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function ExamPreviewDialog({ open, onOpenChange, data, onConfirm, isSubmitting }: ExamPreviewDialogProps) {
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Review Your Exam</DialogTitle>
          <DialogDescription>
            Please review all settings before creating the exam
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Basic Information
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Title:</span>
                <p className="text-base font-semibold">{data.title}</p>
              </div>
              {data.description && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Description:</span>
                  <p className="text-sm">{data.description}</p>
                </div>
              )}
              <div className="flex gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Duration:</span>
                  <p className="text-base font-semibold">{data.duration} minutes</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Price Mode:</span>
                  <Badge variant={data.priceMode === "FREE" ? "success" : "secondary"}>
                    {data.priceMode === "FREE" ? "Free" : "Paid by Teacher"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Scheduling */}
          {(data.scheduledStartTime || data.scheduledEndTime) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Scheduling
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Start Time:</span>
                    <p className="text-sm">{formatDateTime(data.scheduledStartTime)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">End Time:</span>
                    <p className="text-sm">{formatDateTime(data.scheduledEndTime)}</p>
                  </div>
                </div>
                {data.allowLateSubmission && (
                  <div className="pt-2">
                    <Badge variant="warning">Late submission allowed</Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grading */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-600" />
              Grading & Results
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex gap-4 flex-wrap">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Pass Percentage:</span>
                  <p className="text-base font-semibold">{data.passPercentage}%</p>
                </div>
                <div>
                  <Badge variant={data.showResultsImmediately ? "info" : "secondary"}>
                    {data.showResultsImmediately ? "Immediate Results" : "Manual Results"}
                  </Badge>
                </div>
              </div>
              {data.negativeMarking && (
                <div className="pt-2">
                  <Badge variant="destructive">Negative Marking: -{data.negativeMarks} per wrong answer</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Anti-Cheat */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Security Settings
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex gap-2 flex-wrap">
                {data.antiCheatEnabled ? (
                  <Badge variant="destructive">
                    Anti-Cheat Enabled (Max {data.maxViolations} violations)
                  </Badge>
                ) : (
                  <Badge variant="secondary">Anti-Cheat Disabled</Badge>
                )}
                {data.shuffleQuestions && <Badge variant="info">Questions Shuffled</Badge>}
                {data.shuffleOptions && <Badge variant="info">Options Shuffled</Badge>}
              </div>
            </div>
          </div>

          {/* Access Control */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-600" />
              Access Control
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex gap-2 flex-wrap">
                {data.requirePassword && data.examPassword && (
                  <Badge variant="warning">
                    Password Protected: {data.examPassword}
                  </Badge>
                )}
                {data.maxAttempts && (
                  <Badge variant="secondary">
                    Max {data.maxAttempts} {data.maxAttempts === 1 ? "attempt" : "attempts"}
                  </Badge>
                )}
                {!data.requirePassword && !data.maxAttempts && (
                  <Badge variant="secondary">Open Access</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 dark:text-amber-100">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-200">
                  <li>The exam will be created in DRAFT status</li>
                  <li>You can add questions after creation</li>
                  <li>Publish the exam when ready for students</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Go Back
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Exam"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
