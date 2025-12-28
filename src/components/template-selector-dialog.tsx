"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, Target, Shuffle, Lock, Save, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ExamTemplateData {
  id?: string;
  name: string;
  description?: string;
  duration: number;
  antiCheatEnabled: boolean;
  maxViolations: number;
  passPercentage: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultsImmediately: boolean;
  negativeMarking: boolean;
  negativeMarks: number;
  requirePassword: boolean;
  maxAttempts?: number;
  allowLateSubmission: boolean;
}

interface TemplateSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ExamTemplateData[];
  onSelectTemplate: (template: ExamTemplateData) => void;
  onSaveAsTemplate: (templateData: { name: string; description?: string }) => void;
  currentExamData?: Partial<ExamTemplateData>;
}

export function TemplateSelectorDialog({
  open,
  onOpenChange,
  templates,
  onSelectTemplate,
  onSaveAsTemplate,
  currentExamData,
}: TemplateSelectorDialogProps) {
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    
    onSaveAsTemplate({
      name: templateName,
      description: templateDescription || undefined,
    });
    
    setTemplateName("");
    setTemplateDescription("");
    setShowSaveForm(false);
  };

  const renderTemplateCard = (template: ExamTemplateData) => (
    <Card
      key={template.id || template.name}
      className="hover:border-primary/50 transition-all cursor-pointer"
      onClick={() => {
        onSelectTemplate(template);
        onOpenChange(false);
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{template.name}</CardTitle>
        {template.description && (
          <CardDescription className="text-sm">{template.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {template.duration} min
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Target className="h-3 w-3 mr-1" />
            {template.passPercentage}% pass
          </Badge>
          {template.antiCheatEnabled && (
            <Badge variant="destructive" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Anti-Cheat
            </Badge>
          )}
          {template.negativeMarking && (
            <Badge variant="warning" className="text-xs">
              Negative: -{template.negativeMarks}
            </Badge>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
          {template.shuffleQuestions && <span>• Shuffle Q</span>}
          {template.shuffleOptions && <span>• Shuffle Opts</span>}
          {template.showResultsImmediately && <span>• Instant Results</span>}
          {template.requirePassword && <span>• Password</span>}
          {template.maxAttempts && <span>• Max {template.maxAttempts} attempts</span>}
          {template.allowLateSubmission && <span>• Late OK</span>}
        </div>
      </CardContent>
    </Card>
  );

  // Predefined templates
  const predefinedTemplates: ExamTemplateData[] = [
    {
      name: "Quick Quiz",
      description: "Simple quiz with instant results, no anti-cheat",
      duration: 15,
      antiCheatEnabled: false,
      maxViolations: 3,
      passPercentage: 50,
      shuffleQuestions: false,
      shuffleOptions: false,
      showResultsImmediately: true,
      negativeMarking: false,
      negativeMarks: 0,
      requirePassword: false,
      allowLateSubmission: true,
    },
    {
      name: "Secure Exam",
      description: "High-security exam with anti-cheat and strict settings",
      duration: 60,
      antiCheatEnabled: true,
      maxViolations: 3,
      passPercentage: 60,
      shuffleQuestions: true,
      shuffleOptions: true,
      showResultsImmediately: false,
      negativeMarking: true,
      negativeMarks: 0.25,
      requirePassword: true,
      maxAttempts: 1,
      allowLateSubmission: false,
    },
    {
      name: "Practice Test",
      description: "Multiple attempts allowed, instant feedback",
      duration: 30,
      antiCheatEnabled: false,
      maxViolations: 5,
      passPercentage: 40,
      shuffleQuestions: true,
      shuffleOptions: true,
      showResultsImmediately: true,
      negativeMarking: false,
      negativeMarks: 0,
      requirePassword: false,
      maxAttempts: 3,
      allowLateSubmission: true,
    },
    {
      name: "Competitive Exam",
      description: "Timed, negative marking, shuffled questions",
      duration: 120,
      antiCheatEnabled: true,
      maxViolations: 2,
      passPercentage: 70,
      shuffleQuestions: true,
      shuffleOptions: true,
      showResultsImmediately: false,
      negativeMarking: true,
      negativeMarks: 0.33,
      requirePassword: false,
      maxAttempts: 1,
      allowLateSubmission: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Exam Templates
          </DialogTitle>
          <DialogDescription>
            Choose a template to quickly set up your exam, or save current settings as a template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Save Current as Template */}
          {currentExamData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Save Current Settings</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveForm(!showSaveForm)}
                >
                  {showSaveForm ? "Cancel" : "Save as Template"}
                </Button>
              </div>
              
              {showSaveForm && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="templateName">Template Name *</Label>
                      <Input
                        id="templateName"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g., My Custom Exam Template"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="templateDescription">Description</Label>
                      <Textarea
                        id="templateDescription"
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        placeholder="Brief description of when to use this template"
                        rows={2}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleSaveTemplate}
                      disabled={!templateName.trim()}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Template
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* User Templates */}
          {templates.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Your Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map(renderTemplateCard)}
              </div>
            </div>
          )}

          {/* Predefined Templates */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Predefined Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {predefinedTemplates.map(renderTemplateCard)}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
