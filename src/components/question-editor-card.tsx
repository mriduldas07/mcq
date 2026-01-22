"use client";

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from './rich-text-editor';
import { useAutoSave } from '@/hooks/use-auto-save';
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Copy, 
  ChevronDown, 
  ChevronUp,
  GripVertical,
  BookOpen,
  X,
  Save,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateQuestionAction, deleteQuestionAction, duplicateQuestionAction } from '@/actions/exam';
import { SaveToBankButton } from './save-to-bank-button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import katex from 'katex';

interface QuestionOption {
  id: string;
  text: string;
}

interface QuestionEditorCardProps {
  examId: string;
  question: {
    id: string;
    text: string;
    options: QuestionOption[];
    correctOption: string;
    marks: number;
    explanation?: string | null;
    imageUrl?: string | null;
  };
  index: number;
  isPublished: boolean;
  isPro: boolean;
  bankStatus?: {
    inBank: boolean;
    folderId?: string;
    folderName?: string;
    questionBankId?: string;
  };
  dragHandleProps?: any;
}

export function QuestionEditorCard({
  examId,
  question,
  index,
  isPublished,
  isPro,
  bankStatus,
  dragHandleProps,
}: QuestionEditorCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Local state for editing
  const [questionText, setQuestionText] = useState(question.text);
  const [options, setOptions] = useState<QuestionOption[]>(question.options);
  const [correctOption, setCorrectOption] = useState(question.correctOption);
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [showExplanation, setShowExplanation] = useState(false);

  // Auto-save hook
  const autoSaveData = {
    questionText,
    options: JSON.stringify(options),
    correctOption,
    explanation,
  };

  useAutoSave({
    data: autoSaveData,
    onSave: async (data: typeof autoSaveData) => {
      if (!isEditing) return;
      
      setSaveStatus('saving');
      try {
        const formData = new FormData();
        formData.append('text', data.questionText);
        formData.append('correctOption', data.correctOption);
        formData.append('explanation', data.explanation);
        
        const opts = JSON.parse(data.options) as QuestionOption[];
        opts.forEach((opt, i) => {
          formData.append(`option${i}`, opt.text);
        });

        const result = await updateQuestionAction(question.id, examId, formData);
        
        if (result?.error) {
          setSaveStatus('idle');
          toast.error(result.error);
        } else {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
          router.refresh();
        }
      } catch (error) {
        setSaveStatus('idle');
      }
    },
    interval: 5000,
    enabled: isEditing,
  });

  const handleSave = () => {
    if (!questionText.trim()) {
      toast.error('Question text cannot be empty');
      return;
    }

    if (options.some(opt => !opt.text.trim())) {
      toast.error('All options must have text');
      return;
    }

    if (!correctOption) {
      toast.error('Please select a correct answer');
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('text', questionText);
        formData.append('correctOption', correctOption);
        formData.append('explanation', explanation);
        
        options.forEach((opt, i) => {
          formData.append(`option${i}`, opt.text);
        });

        const result = await updateQuestionAction(question.id, examId, formData);
        
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success('Question updated');
          setIsEditing(false);
          router.refresh();
        }
      } catch (error) {
        toast.error('Failed to update question');
      }
    });
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    startTransition(async () => {
      try {
        await deleteQuestionAction(question.id, examId);
        toast.success('Question deleted');
        router.refresh();
      } catch (error) {
        toast.error('Failed to delete question');
      }
    });
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      try {
        await duplicateQuestionAction(question.id, examId);
        toast.success('Question duplicated');
        router.refresh();
      } catch (error) {
        toast.error('Failed to duplicate question');
      }
    });
  };

  const addOption = () => {
    if (options.length >= 6) {
      toast.error('Maximum 6 options allowed');
      return;
    }
    setOptions([...options, { id: `opt-${Date.now()}`, text: '' }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) {
      toast.error('Minimum 2 options required');
      return;
    }
    setOptions(options.filter(opt => opt.id !== id));
    if (correctOption === id) {
      setCorrectOption('');
    }
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
  };

  // Render math formulas on mount and when content changes
  useEffect(() => {
    if (isEditing) return; // Don't render during editing
    
    const renderMath = () => {
      const elements = document.querySelectorAll('.math-rendered [data-latex]');
      elements.forEach((element) => {
        const latex = element.getAttribute('data-latex');
        // Only render if not already rendered
        if (latex && !element.querySelector('.katex')) {
          try {
            const html = katex.renderToString(latex, {
              throwOnError: false,
              displayMode: false,
            });
            element.innerHTML = html;
          } catch (e) {
            element.textContent = latex;
          }
        }
      });
    };

    // Render immediately and after a short delay to catch any DOM updates
    renderMath();
    const timer = setTimeout(renderMath, 50);
    return () => clearTimeout(timer);
  }, [questionText, isEditing]);

  if (isPublished && !isEditing) {
    // Read-only view for published exams
    return (
      <Card className="relative">
        <CardHeader className="p-4">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm">Q{index + 1}</span>
                <Badge variant="secondary" className="text-xs">{question.marks} mark{question.marks !== 1 ? 's' : ''}</Badge>
                {bankStatus?.inBank && bankStatus?.folderName && (
                  <Badge variant="outline" className="text-xs">
                    📁 {bankStatus.folderName}
                  </Badge>
                )}
              </div>
              <div 
                className="text-sm prose prose-sm max-w-none math-rendered"
                dangerouslySetInnerHTML={{ __html: questionText }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="space-y-2">
            {options.map((opt) => (
              <div
                key={opt.id}
                className={cn(
                  'p-3 rounded-md border text-sm',
                  opt.id === correctOption && 'bg-green-50 border-green-300 dark:bg-green-950/20'
                )}
              >
                {opt.text}
                {opt.id === correctOption && (
                  <span className="ml-2 text-xs text-green-600 font-medium">✓ Correct</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative">
      <CardHeader className="p-3 sm:p-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2">
            {!isPublished && (
              <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">Question {index + 1}</span>
                {bankStatus?.inBank && bankStatus?.folderName && (
                  <Badge variant="outline" className="text-xs">
                    📁 {bankStatus.folderName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {!isPublished && (
            <div className="flex items-center gap-2">
              {isEditing && saveStatus !== 'idle' && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {saveStatus === 'saving' && (
                    <>
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      Saving...
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <Check className="h-3 w-3 text-green-600" />
                      Saved
                    </>
                  )}
                </span>
              )}
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    disabled={isPending}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 space-y-4">
        {/* Question Text */}
        <div className="space-y-2">
          {isEditing ? (
            <RichTextEditor
              content={questionText}
              onChange={setQuestionText}
              placeholder="Enter your question..."
              className="min-h-25"
              showMath={true}
            />
          ) : (
            <div
              className="text-sm p-3 border rounded-md cursor-pointer hover:bg-muted/30 transition-colors prose prose-sm max-w-none math-rendered"
              onClick={() => setIsEditing(true)}
              dangerouslySetInnerHTML={{ __html: questionText }}
            />
          )}
        </div>

        {/* Options */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Options</label>
            {isEditing && options.length < 6 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addOption}
                className="h-auto p-1 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Option
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {options.map((opt, optIndex) => (
              <div key={opt.id} className="flex items-start gap-2">
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  checked={correctOption === opt.id}
                  onChange={() => setCorrectOption(opt.id)}
                  disabled={!isEditing || isPublished}
                  className="h-4 w-4 shrink-0 mt-3"
                />
                {isEditing ? (
                  <div className="flex-1">
                    <RichTextEditor
                      content={opt.text}
                      onChange={(value) => updateOption(opt.id, value)}
                      placeholder={`Option ${optIndex + 1}`}
                      className="min-h-[40px]"
                      minimal={true}
                      showMath={true}
                    />
                  </div>
                ) : (
                  <div 
                    className={cn(
                      'flex-1 p-2 rounded border text-sm cursor-pointer hover:bg-muted/30 math-rendered',
                      correctOption === opt.id && 'bg-green-50 border-green-300 dark:bg-green-950/20'
                    )}
                    onClick={() => setIsEditing(true)}
                    dangerouslySetInnerHTML={{ __html: opt.text }}
                  />
                )}
                {isEditing && options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(opt.id)}
                    className="h-8 px-2"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expandable Tools */}
        {isExpanded && !isPublished && (
          <div className="pt-3 border-t space-y-3">
            <div className="flex flex-wrap gap-2">
              {isPro && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="text-xs"
                >
                  {showExplanation ? 'Hide' : 'Add'} Explanation
                </Button>
              )}
              {!isPro && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  className="text-xs"
                >
                  🔒 Add Image (Pro)
                </Button>
              )}
              <SaveToBankButton
                examId={examId}
                questionId={question.id}
                variant="outline"
                size="sm"
                initialStatus={bankStatus}
                questionBankId={bankStatus?.questionBankId}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                disabled={isPending}
                className="text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Duplicate
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
                className="text-xs text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Explanation (Optional)</label>
                <RichTextEditor
                  content={explanation}
                  onChange={setExplanation}
                  placeholder="Add an explanation for the correct answer..."
                  className="min-h-20"
                  minimal
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
