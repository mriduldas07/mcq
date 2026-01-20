"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { addQuestionAction } from "@/actions/exam";
import { toast } from "sonner";

interface AddQuestionFormProps {
    examId: string;
    isPro?: boolean;
}

export function AddQuestionForm({ examId, isPro = false }: AddQuestionFormProps) {
    const [questionText, setQuestionText] = useState("");
    const [options, setOptions] = useState(["", "", "", ""]);
    const [correctOption, setCorrectOption] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddOption = () => {
        if (options.length < 6) {
            setOptions([...options, ""]);
        }
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
            // Adjust correct option if needed
            if (correctOption === index) {
                setCorrectOption(0);
            } else if (correctOption > index) {
                setCorrectOption(correctOption - 1);
            }
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!questionText.trim()) {
            toast.error("Question text is required");
            return;
        }

        if (options.some(opt => !opt.trim())) {
            toast.error("All options must be filled");
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("text", questionText);
            formData.append("correctOption", correctOption.toString());
            options.forEach((opt, i) => {
                formData.append(`option${i}`, opt);
            });

            await addQuestionAction(examId, formData);

            toast.success("Question added successfully");
            // Reset form
            setQuestionText("");
            setOptions(["", "", "", ""]);
            setCorrectOption(0);
        } catch (error) {
            toast.error("Failed to add question");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label className="text-sm font-medium">Question Text</Label>
                <RichTextEditor
                    content={questionText}
                    onChange={setQuestionText}
                    placeholder="Type your question here..."
                    showMath={isPro}
                />
                {!isPro && (
                    <p className="text-xs text-muted-foreground">
                        ✨ Upgrade to Pro to add math formulas
                    </p>
                )}
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Options</Label>
                    {options.length < 6 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleAddOption}
                            className="text-xs h-7"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                        </Button>
                    )}
                </div>

                {options.map((option, i) => (
                    <div key={i} className="flex items-start gap-2 min-w-0">
                        <input
                            type="radio"
                            name="correctOption"
                            checked={correctOption === i}
                            onChange={() => setCorrectOption(i)}
                            required
                            className="h-4 w-4 shrink-0 mt-2.5 cursor-pointer"
                            title="Mark as correct answer"
                        />
                        <div className="flex-1 min-w-0">
                            <Input
                                value={option}
                                onChange={(e) => handleOptionChange(i, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                required
                                className="text-sm"
                            />
                        </div>
                        {options.length > 2 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveOption(i)}
                                className="shrink-0 h-9 w-9 p-0"
                                title="Remove option"
                            >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                {isSubmitting ? "Adding..." : "Add Question"}
            </Button>
        </form>
    );
}
