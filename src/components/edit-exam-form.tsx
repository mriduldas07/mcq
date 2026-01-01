"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updateExamAction } from "@/actions/exam";
import { Edit2, Save, X, Loader2, Shield, Target, Shuffle, Lock, Calendar } from "lucide-react";

interface EditExamFormProps {
    examId: string;
    initialTitle: string;
    initialDescription: string | null;
    initialDuration: number;
    status: string;
    antiCheatEnabled?: boolean;
    maxViolations?: number;
    passPercentage?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    showResultsImmediately?: boolean;
    requirePassword?: boolean;
    examPassword?: string | null;
    maxAttempts?: number | null;
    scheduledStartTime?: Date | null;
    scheduledEndTime?: Date | null;
    allowLateSubmission?: boolean;
}

export function EditExamForm({ 
    examId, 
    initialTitle, 
    initialDescription, 
    initialDuration, 
    status,
    antiCheatEnabled = true,
    maxViolations = 3,
    passPercentage = 50,
    shuffleQuestions = false,
    shuffleOptions = false,
    showResultsImmediately = true,
    requirePassword = false,
    examPassword = null,
    maxAttempts = null,
    scheduledStartTime = null,
    scheduledEndTime = null,
    allowLateSubmission = false,
}: EditExamFormProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [showAdvanced, setShowAdvanced] = useState(false);

    if (status === "PUBLISHED") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Exam Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <p className="text-sm font-medium">Title</p>
                        <p className="text-sm text-muted-foreground break-words">{initialTitle}</p>
                    </div>
                    {initialDescription && (
                        <div>
                            <p className="text-sm font-medium">Description</p>
                            <p className="text-sm text-muted-foreground break-words">{initialDescription}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <p className="text-sm font-medium">Duration</p>
                            <p className="text-sm text-muted-foreground">{initialDuration} minutes</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Pass Percentage</p>
                            <p className="text-sm text-muted-foreground">{passPercentage}%</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <p className="text-sm font-medium">Anti-Cheat</p>
                            <p className="text-sm text-muted-foreground">{antiCheatEnabled ? "Enabled" : "Disabled"}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Max Attempts</p>
                            <p className="text-sm text-muted-foreground">{maxAttempts || "Unlimited"}</p>
                        </div>
                    </div>
                    <p className="text-xs text-orange-600 mt-2">⚠️ Published exams cannot be edited</p>
                </CardContent>
            </Card>
        );
    }

    if (!isEditing) {
        return (
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="space-y-1">
                        <CardTitle className="text-lg sm:text-xl">Exam Settings</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">View and edit exam configuration</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
                        <Edit2 className="h-4 w-4 mr-2" />
                        <span className="sm:inline">Edit Settings</span>
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Basic Info */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Shield className="h-4 w-4 flex-shrink-0" />
                            Basic Information
                        </h4>
                        <div className="grid gap-2 text-sm pl-0 sm:pl-6">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                <span className="text-muted-foreground text-xs sm:text-sm">Title:</span>
                                <span className="font-medium text-sm break-words sm:text-right">{initialTitle}</span>
                            </div>
                            {initialDescription && (
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                    <span className="text-muted-foreground text-xs sm:text-sm">Description:</span>
                                    <span className="font-medium text-sm break-words sm:max-w-xs sm:text-right">{initialDescription}</span>
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                <span className="text-muted-foreground text-xs sm:text-sm">Duration:</span>
                                <span className="font-medium text-sm">{initialDuration} minutes</span>
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Shield className="h-4 w-4 flex-shrink-0" />
                            Security & Anti-Cheat
                        </h4>
                        <div className="grid gap-2 text-sm pl-0 sm:pl-6">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                <span className="text-muted-foreground text-xs sm:text-sm">Anti-Cheat:</span>
                                <span className={`text-sm font-medium ${antiCheatEnabled ? "text-green-600" : "text-red-600"}`}>
                                    {antiCheatEnabled ? "Enabled" : "Disabled"}
                                </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                <span className="text-muted-foreground text-xs sm:text-sm">Max Violations:</span>
                                <span className="font-medium">{maxViolations}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Password Protected:</span>
                                <span className={requirePassword ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                    {requirePassword ? "Yes" : "No"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Grading */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Target className="h-4 w-4 flex-shrink-0" />
                            Grading & Results
                        </h4>
                        <div className="grid gap-2 text-sm pl-0 sm:pl-6">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                <span className="text-muted-foreground text-xs sm:text-sm">Pass Percentage:</span>
                                <span className="font-medium text-sm">{passPercentage}%</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                <span className="text-muted-foreground text-xs sm:text-sm">Show Results:</span>
                                <span className="font-medium text-sm">{showResultsImmediately ? "Immediately" : "Manual"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Randomization */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Shuffle className="h-4 w-4 flex-shrink-0" />
                            Randomization
                        </h4>
                        <div className="grid gap-2 text-sm pl-0 sm:pl-6">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                <span className="text-muted-foreground text-xs sm:text-sm">Shuffle Questions:</span>
                                <span className={`text-sm font-medium ${shuffleQuestions ? "text-blue-600" : "text-muted-foreground"}`}>
                                    {shuffleQuestions ? "Yes" : "No"}
                                </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                <span className="text-muted-foreground text-xs sm:text-sm">Shuffle Options:</span>
                                <span className={`text-sm font-medium ${shuffleOptions ? "text-blue-600" : "text-muted-foreground"}`}>
                                    {shuffleOptions ? "Yes" : "No"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Access Control */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Lock className="h-4 w-4 flex-shrink-0" />
                            Access Control
                        </h4>
                        <div className="grid gap-2 text-sm pl-0 sm:pl-6">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                <span className="text-muted-foreground text-xs sm:text-sm">Max Attempts:</span>
                                <span className="font-medium text-sm">{maxAttempts || "Unlimited"}</span>
                            </div>
                            {(scheduledStartTime || scheduledEndTime) && (
                                <>
                                    {scheduledStartTime && (
                                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                            <span className="text-muted-foreground text-xs sm:text-sm">Start Time:</span>
                                            <span className="font-medium text-sm break-words">{new Date(scheduledStartTime).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {scheduledEndTime && (
                                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                            <span className="text-muted-foreground text-xs sm:text-sm">End Time:</span>
                                            <span className="font-medium text-sm break-words">{new Date(scheduledEndTime).toLocaleString()}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await updateExamAction(examId, formData);
            
            if (result?.error) {
                alert(`Error: ${result.error}`);
            } else {
                setIsEditing(false);
            }
        });
    };

    const formatDateTimeLocal = (date: Date | null) => {
        if (!date) return "";
        const d = new Date(date);
        return d.toISOString().slice(0, 16);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Edit Exam Settings</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Modify exam configuration and advanced options</CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                    <form action={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                Basic Information
                            </h4>
                            <div className="space-y-2">
                                <Label htmlFor="title">Exam Title *</Label>
                                <Input 
                                    id="title" 
                                    name="title" 
                                    defaultValue={initialTitle}
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea 
                                    id="description" 
                                    name="description" 
                                    defaultValue={initialDescription || ""}
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (minutes) *</Label>
                                <Input 
                                    id="duration" 
                                    name="duration" 
                                    type="number"
                                    min="1"
                                    defaultValue={initialDuration}
                                    required 
                                />
                            </div>
                        </div>

                        {/* Advanced Settings Toggle */}
                        <Button 
                            type="button"
                            variant="outline"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full"
                        >
                            {showAdvanced ? "Hide" : "Show"} Advanced Settings
                        </Button>

                        {showAdvanced && (
                            <>
                                {/* Anti-Cheat Settings */}
                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Anti-Cheat Settings
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="antiCheatEnabled">Enable Anti-Cheat</Label>
                                        <input 
                                            type="checkbox" 
                                            id="antiCheatEnabled" 
                                            name="antiCheatEnabled" 
                                            value="true" 
                                            defaultChecked={antiCheatEnabled}
                                            className="h-4 w-4" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxViolations">Max Violations</Label>
                                        <Input 
                                            id="maxViolations" 
                                            name="maxViolations" 
                                            type="number" 
                                            min="1" 
                                            max="10"
                                            defaultValue={maxViolations}
                                        />
                                    </div>
                                </div>

                                {/* Grading Settings */}
                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <Target className="h-4 w-4" />
                                        Grading & Results
                                    </h4>
                                    <div className="space-y-2">
                                        <Label htmlFor="passPercentage">Pass Percentage</Label>
                                        <Input 
                                            id="passPercentage" 
                                            name="passPercentage" 
                                            type="number" 
                                            min="0" 
                                            max="100"
                                            defaultValue={passPercentage}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="showResultsImmediately">Show Results Immediately</Label>
                                        <input 
                                            type="checkbox" 
                                            id="showResultsImmediately" 
                                            name="showResultsImmediately" 
                                            value="true"
                                            defaultChecked={showResultsImmediately}
                                            className="h-4 w-4" 
                                        />
                                    </div>
                                </div>

                                {/* Randomization */}
                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <Shuffle className="h-4 w-4" />
                                        Randomization
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
                                        <input 
                                            type="checkbox" 
                                            id="shuffleQuestions" 
                                            name="shuffleQuestions" 
                                            value="true"
                                            defaultChecked={shuffleQuestions}
                                            className="h-4 w-4" 
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="shuffleOptions">Shuffle Answer Options</Label>
                                        <input 
                                            type="checkbox" 
                                            id="shuffleOptions" 
                                            name="shuffleOptions" 
                                            value="true"
                                            defaultChecked={shuffleOptions}
                                            className="h-4 w-4" 
                                        />
                                    </div>
                                </div>

                                {/* Access Control */}
                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        Access Control
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="requirePassword">Require Password</Label>
                                        <input 
                                            type="checkbox" 
                                            id="requirePassword" 
                                            name="requirePassword" 
                                            value="true"
                                            defaultChecked={requirePassword}
                                            className="h-4 w-4" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="examPassword">Exam Password</Label>
                                        <Input 
                                            id="examPassword" 
                                            name="examPassword" 
                                            type="text"
                                            defaultValue={examPassword || ""}
                                            placeholder="Leave empty if no password"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxAttempts">Max Attempts per Student</Label>
                                        <Input 
                                            id="maxAttempts" 
                                            name="maxAttempts" 
                                            type="number" 
                                            min="1"
                                            defaultValue={maxAttempts || ""}
                                            placeholder="Leave empty for unlimited"
                                        />
                                    </div>
                                </div>

                                {/* Scheduling */}
                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Scheduling
                                    </h4>
                                    <div className="space-y-2">
                                        <Label htmlFor="scheduledStartTime">Scheduled Start Time</Label>
                                        <Input 
                                            id="scheduledStartTime" 
                                            name="scheduledStartTime" 
                                            type="datetime-local"
                                            defaultValue={formatDateTimeLocal(scheduledStartTime)}
                                        />
                                        <p className="text-xs text-muted-foreground">When the exam becomes available</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="scheduledEndTime">Scheduled End Time</Label>
                                        <Input 
                                            id="scheduledEndTime" 
                                            name="scheduledEndTime" 
                                            type="datetime-local"
                                            defaultValue={formatDateTimeLocal(scheduledEndTime)}
                                        />
                                        <p className="text-xs text-muted-foreground">When the exam closes</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="allowLateSubmission">Allow Late Submission</Label>
                                        <input 
                                            type="checkbox" 
                                            id="allowLateSubmission" 
                                            name="allowLateSubmission" 
                                            value="true"
                                            defaultChecked={allowLateSubmission}
                                            className="h-4 w-4" 
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-4">
                            <Button type="submit" disabled={isPending} className="flex-1 w-full">
                                {isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                {isPending ? "Saving..." : "Save All Changes"}
                            </Button>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsEditing(false)}
                                disabled={isPending}
                                className="w-full sm:w-auto"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
