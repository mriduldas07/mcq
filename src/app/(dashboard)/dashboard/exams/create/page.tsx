"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createExamAction } from "@/actions/exam";
import Link from "next/link";
import { Shield, Clock, Settings, Lock, Target, Shuffle, Calendar, Info, Eye, Bookmark, Save, Sparkles } from "lucide-react";
import { ExamPreviewDialog } from "@/components/exam-preview-dialog";
import { TemplateSelectorDialog } from "@/components/template-selector-dialog";
import { ProgressIndicator } from "@/components/progress-indicator";

const STEPS = [
    { id: "basic", label: "Basic Info", description: "Title & duration" },
    { id: "settings", label: "Settings", description: "Configure options" },
    { id: "review", label: "Review", description: "Preview & create" },
];

export default function CreateExamPage() {
    const [showPreview, setShowPreview] = useState(false);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        
        // Validate basic info first
        if (currentStep === 0) {
            const title = data.get("title") as string;
            const duration = data.get("duration") as string;
            if (title && duration) {
                setCompletedSteps([...completedSteps, 0]);
                setCurrentStep(1);
            }
            return;
        }

        // Move to review step
        if (currentStep === 1) {
            setCompletedSteps([...completedSteps, 1]);
            setCurrentStep(2);
            return;
        }
        
        // Final submission - show preview
        const previewData = {
            title: data.get("title") as string,
            description: data.get("description") as string,
            duration: parseInt(data.get("duration") as string),
            passPercentage: parseInt(data.get("passPercentage") as string),
            antiCheatEnabled: data.get("antiCheatEnabled") === "true",
            maxViolations: parseInt(data.get("maxViolations") as string),
            shuffleQuestions: data.get("shuffleQuestions") === "true",
            shuffleOptions: data.get("shuffleOptions") === "true",
            showResultsImmediately: data.get("showResultsImmediately") === "true",
            requirePassword: data.get("requirePassword") === "true",
            examPassword: data.get("examPassword") as string,
            maxAttempts: data.get("maxAttempts") ? parseInt(data.get("maxAttempts") as string) : undefined,
            scheduledStartTime: data.get("scheduledStartTime") as string,
            scheduledEndTime: data.get("scheduledEndTime") as string,
            allowLateSubmission: data.get("allowLateSubmission") === "true",
            negativeMarking: data.get("negativeMarking") === "true",
            negativeMarks: parseFloat(data.get("negativeMarks") as string) || 0,
            priceMode: data.get("priceMode") as string,
        };
        
        setFormData(data);
        setShowPreview(true);
    };

    const handleConfirmCreate = async () => {
        if (!formData) return;
        
        setIsSubmitting(true);
        try {
            await createExamAction(formData);
        } catch (error) {
            console.error("Error creating exam:", error);
            setIsSubmitting(false);
        }
    };

    const handleSaveAsDraft = async () => {
        const form = document.getElementById("createExamForm") as HTMLFormElement;
        if (!form) return;
        
        const data = new FormData(form);
        
        setIsSubmitting(true);
        try {
            await createExamAction(data);
        } catch (error) {
            console.error("Error creating exam:", error);
            setIsSubmitting(false);
        }
    };

    const handleTemplateSelect = (template: any) => {
        // Apply template values to form
        const form = document.getElementById("createExamForm") as HTMLFormElement;
        if (!form) return;

        (form.elements.namedItem("duration") as HTMLInputElement).value = template.duration.toString();
        (form.elements.namedItem("passPercentage") as HTMLInputElement).value = template.passPercentage.toString();
        (form.elements.namedItem("antiCheatEnabled") as HTMLInputElement).checked = template.antiCheatEnabled;
        (form.elements.namedItem("maxViolations") as HTMLInputElement).value = template.maxViolations.toString();
        (form.elements.namedItem("shuffleQuestions") as HTMLInputElement).checked = template.shuffleQuestions;
        (form.elements.namedItem("shuffleOptions") as HTMLInputElement).checked = template.shuffleOptions;
        (form.elements.namedItem("showResultsImmediately") as HTMLInputElement).checked = template.showResultsImmediately;
        (form.elements.namedItem("requirePassword") as HTMLInputElement).checked = template.requirePassword;
        (form.elements.namedItem("allowLateSubmission") as HTMLInputElement).checked = template.allowLateSubmission;
        (form.elements.namedItem("negativeMarking") as HTMLInputElement).checked = template.negativeMarking;
        (form.elements.namedItem("negativeMarks") as HTMLInputElement).value = template.negativeMarks.toString();
        
        if (template.maxAttempts) {
            (form.elements.namedItem("maxAttempts") as HTMLInputElement).value = template.maxAttempts.toString();
        }
    };

    return (
        <div className="flex-1 space-y-8 p-6 pt-8 pb-16 max-w-7xl mx-auto">
            {/* Professional Header */}
            <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                        <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">
                            Create New Exam
                        </h1>
                        <p className="text-muted-foreground text-[14px] leading-relaxed max-w-2xl">
                            Design professional assessments with advanced controls and anti-cheat features
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="border-primary/20 hover:bg-primary/5 hover:border-primary/30 shrink-0"
                        onClick={() => setShowTemplateSelector(true)}
                    >
                        <Bookmark className="h-4 w-4 mr-2" />
                        Load Template
                    </Button>
                </div>
                <div className="h-px bg-linear-to-r from-transparent via-border to-transparent" />
            </div>

            {/* Progress Indicator */}
            <div className="max-w-5xl mx-auto">
                <ProgressIndicator
                    steps={STEPS}
                    currentStep={currentStep}
                    completedSteps={completedSteps}
                    onStepClick={(stepIdx) => {
                        if (stepIdx < currentStep) {
                            setCurrentStep(stepIdx);
                        }
                    }}
                />
            </div>
            
            <form id="createExamForm" onSubmit={handleFormSubmit} className="space-y-6">
                {/* Step 0: Basic Information */}
                <div style={{ display: currentStep === 0 ? 'block' : 'none' }} className="space-y-6">
                    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardHeader className="border-b bg-muted/30 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Settings className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-semibold tracking-tight">
                                        Basic Information
                                    </CardTitle>
                                    <CardDescription className="text-[13px] mt-1 leading-relaxed">
                                        Set the fundamental details for your exam
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-6">
                            <div className="space-y-2.5">
                                <Label htmlFor="title" className="text-[13px] font-medium">Exam Title *</Label>
                                <Input id="title" name="title" placeholder="e.g. Physics Midterm 2024" required className="text-[15px]" />
                            </div>
                            <div className="space-y-2.5">
                                <Label htmlFor="description" className="text-[13px] font-medium">Description</Label>
                                <Textarea id="description" name="description" placeholder="Brief description of the exam content and objectives" rows={3} className="text-[15px] leading-relaxed" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2.5">
                                    <Label htmlFor="duration" className="text-[13px] font-medium">Duration (minutes) *</Label>
                                    <Input id="duration" name="duration" type="number" min="1" defaultValue="60" required className="text-[15px]" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="priceMode" className="text-[13px] font-medium">Monetization</Label>
                                    <select
                                        id="priceMode"
                                        name="priceMode"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-[15px] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="FREE">Free (Subscription)</option>
                                        <option value="PAID_BY_TEACHER">Pay Per Exam</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t bg-muted/20 pt-5 pb-5">
                            <Link href="/dashboard/exams">
                                <Button variant="ghost" type="button" className="h-10">Cancel</Button>
                            </Link>
                            <div className="flex items-center gap-2.5">
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={handleSaveAsDraft}
                                    disabled={isSubmitting}
                                    className="h-10"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save as Draft
                                </Button>
                                <Button type="submit" className="h-10">
                                    Next: Configure Settings
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                {/* Step 1: All Settings */}
                <div style={{ display: currentStep === 1 ? 'block' : 'none' }} className="space-y-6">

                {/* Anti-Cheat Settings */}
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">
                                    Anti-Cheat Settings
                                </CardTitle>
                                <CardDescription className="text-sm mt-0.5">
                                    Configure security and monitoring options to prevent cheating
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="antiCheatEnabled">Enable Anti-Cheat Protection</Label>
                                <p className="text-sm text-muted-foreground">Monitor tab switches, window blur, and suspicious activity</p>
                            </div>
                            <input type="checkbox" id="antiCheatEnabled" name="antiCheatEnabled" value="true" defaultChecked className="h-4 w-4" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxViolations">Max Violations Before Auto-Submit</Label>
                            <div className="flex items-center gap-2">
                                <Input id="maxViolations" name="maxViolations" type="number" min="1" max="10" defaultValue="3" className="max-w-30" />
                                <span className="text-sm text-muted-foreground">violations</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Number of violations allowed before exam is automatically submitted</p>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex gap-2">
                                <Shield className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                <div className="text-sm text-red-900 dark:text-red-100">
                                    <p className="font-medium mb-1">Anti-Cheat Monitors:</p>
                                    <ul className="list-disc list-inside space-y-1 text-red-800 dark:text-red-200">
                                        <li>Tab switching or leaving the exam window</li>
                                        <li>Window blur or focus loss events</li>
                                        <li>All violations are logged with timestamps</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Grading & Results */}
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Target className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">
                                    Grading & Results
                                </CardTitle>
                                <CardDescription className="text-sm mt-0.5">
                                    Configure grading criteria and result display options
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="passPercentage">Pass Percentage</Label>
                            <div className="flex items-center gap-2">
                                <Input id="passPercentage" name="passPercentage" type="number" min="0" max="100" defaultValue="50" className="max-w-30" />
                                <span className="text-sm text-muted-foreground">%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Minimum percentage required to pass the exam</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="showResultsImmediately">Show Results Immediately</Label>
                                <p className="text-sm text-muted-foreground">Display scores and answers right after submission</p>
                            </div>
                            <input type="checkbox" id="showResultsImmediately" name="showResultsImmediately" value="true" defaultChecked className="h-4 w-4" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="negativeMarking">Enable Negative Marking</Label>
                                <p className="text-sm text-muted-foreground">Deduct marks for wrong answers</p>
                            </div>
                            <input type="checkbox" id="negativeMarking" name="negativeMarking" value="true" className="h-4 w-4" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="negativeMarks">Marks to Deduct (per wrong answer)</Label>
                            <div className="flex items-center gap-2">
                                <Input id="negativeMarks" name="negativeMarks" type="number" min="0" max="5" step="0.25" defaultValue="0" className="max-w-30" />
                                <span className="text-sm text-muted-foreground">marks</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Common values: 0.25, 0.33, 0.5, or 1</p>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <div className="flex gap-2">
                                <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-900 dark:text-amber-100">
                                    <p className="font-medium mb-1">Grading Tips:</p>
                                    <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-200">
                                        <li>Common pass percentages: 40% (pass), 50% (credit), 70% (distinction)</li>
                                        <li>Disable immediate results to prevent answer sharing during exam window</li>
                                        <li>You can always view individual student results in the dashboard</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Question Settings */}
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                                <Shuffle className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">
                                    Question Settings
                                </CardTitle>
                                <CardDescription className="text-sm mt-0.5">
                                    Randomization options for questions and answers
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
                                <p className="text-sm text-muted-foreground">Randomize the order of questions for each student</p>
                            </div>
                            <input type="checkbox" id="shuffleQuestions" name="shuffleQuestions" value="true" className="h-4 w-4" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="shuffleOptions">Shuffle Answer Options</Label>
                                <p className="text-sm text-muted-foreground">Randomize the order of answer choices</p>
                            </div>
                            <input type="checkbox" id="shuffleOptions" name="shuffleOptions" value="true" className="h-4 w-4" />
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex gap-2">
                                <Shuffle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                <div className="text-sm text-green-900 dark:text-green-100">
                                    <p className="font-medium mb-1">Why Randomize?</p>
                                    <ul className="list-disc list-inside space-y-1 text-green-800 dark:text-green-200">
                                        <li>Reduces cheating in online environments</li>
                                        <li>Each student gets a unique exam experience</li>
                                        <li>Recommended for large classes or remote exams</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Scheduling */}
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">
                                    Scheduling
                                </CardTitle>
                                <CardDescription className="text-sm mt-0.5">
                                    Control when the exam is available to students
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="scheduledStartTime">Start Date & Time</Label>
                                <Input 
                                    id="scheduledStartTime" 
                                    name="scheduledStartTime" 
                                    type="datetime-local"
                                />
                                <p className="text-xs text-muted-foreground">Leave empty for immediate availability</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="scheduledEndTime">End Date & Time</Label>
                                <Input 
                                    id="scheduledEndTime" 
                                    name="scheduledEndTime" 
                                    type="datetime-local"
                                />
                                <p className="text-xs text-muted-foreground">Leave empty for no deadline</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="allowLateSubmission">Allow Late Submission</Label>
                                <p className="text-sm text-muted-foreground">Students can submit after the end time</p>
                            </div>
                            <input type="checkbox" id="allowLateSubmission" name="allowLateSubmission" value="true" className="h-4 w-4" />
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex gap-2">
                                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-900 dark:text-blue-100">
                                    <p className="font-medium mb-1">Scheduling Tips:</p>
                                    <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                                        <li>Set both start and end times for timed windows</li>
                                        <li>Leave both empty for always-available exams</li>
                                        <li>Enable late submission for flexibility with penalties</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Access Control */}
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                <Lock className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-semibold">
                                    Access Control
                                </CardTitle>
                                <CardDescription className="text-sm mt-0.5">
                                    Manage who can access and how many times
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="requirePassword">Require Password</Label>
                                <p className="text-sm text-muted-foreground">Students need a password to access the exam</p>
                            </div>
                            <input type="checkbox" id="requirePassword" name="requirePassword" value="true" className="h-4 w-4" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="examPassword">Exam Password</Label>
                            <Input id="examPassword" name="examPassword" type="text" placeholder="Leave empty if no password required" />
                            <p className="text-xs text-muted-foreground">Share this password with your students to grant access</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxAttempts">Maximum Attempts per Student</Label>
                            <div className="flex items-center gap-2">
                                <Input id="maxAttempts" name="maxAttempts" type="number" min="1" placeholder="Unlimited" className="max-w-50" />
                                <span className="text-sm text-muted-foreground">attempts</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Limit how many times a student can attempt this exam</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Access Control Tips */}
                <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30">
                    <CardContent className="pt-6">
                        <div className="flex gap-3">
                            <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-purple-900 dark:text-purple-100">
                                <p className="font-medium mb-1">Access Control Tips:</p>
                                <ul className="list-disc list-inside space-y-1 text-purple-800 dark:text-purple-200">
                                    <li>Use passwords for private or proctored exams</li>
                                    <li>Allow 2-3 attempts for practice exams</li>
                                    <li>Limit to 1 attempt for final assessments</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Navigation Buttons for Step 1 */}
                <Card className="border-2">
                    <CardFooter className="flex justify-between items-center bg-muted/30 pt-6 pb-6">
                        <Button 
                            variant="outline" 
                            size="lg"
                            type="button"
                            onClick={() => setCurrentStep(0)}
                            className="border-2 h-11"
                        >
                            Back to Basic Info
                        </Button>
                        <div className="flex items-center gap-2.5">
                            <Button 
                                type="button" 
                                variant="outline"
                                size="lg"
                                onClick={handleSaveAsDraft}
                                disabled={isSubmitting}
                                className="h-11"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Save as Draft
                            </Button>
                            <Button type="submit" size="lg" className="h-11">
                                Next: Review
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
                </div>

                {/* Step 2: Review */}
                <div style={{ display: currentStep === 2 ? 'block' : 'none' }} className="space-y-6">
                        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="border-b bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                                        <Eye className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-semibold">
                                            Review Your Exam
                                        </CardTitle>
                                        <CardDescription className="text-sm mt-0.5">
                                            Check all settings before creating the exam
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-xl border-2 p-6 space-y-4 bg-linear-to-br from-muted/30 to-muted/50">
                                    <h4 className="font-bold text-xl flex items-center gap-2">
                                        <Info className="h-5 w-5 text-primary" />
                                        Exam Summary
                                    </h4>
                                    <div className="grid gap-3 text-sm">
                                        <div className="flex justify-between items-center p-3 rounded-lg bg-background/80">
                                            <span className="text-muted-foreground font-medium">Title:</span>
                                            <span className="font-semibold">Review after preview</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 rounded-lg bg-background/80">
                                            <span className="text-muted-foreground font-medium">Duration:</span>
                                            <span className="font-semibold">Set in form</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative overflow-hidden p-6 bg-linear-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
                                    <div className="relative flex gap-3">
                                        <div className="p-2 rounded-lg bg-linear-to-br from-blue-500 to-purple-500 shadow-lg h-fit">
                                            <Sparkles className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-base mb-2 text-foreground">Ready to Preview</p>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Click "Preview & Create" to see a detailed preview of your exam configuration before final submission. You'll be able to review all settings, questions, and options.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <Card className="border-2">
                            <CardFooter className="flex justify-between items-center bg-muted/30 pt-6 pb-6">
                                <Button 
                                    variant="outline"
                                    size="lg"
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="border-2 h-11"
                                >
                                    Back to Settings
                                </Button>
                                <div className="flex items-center gap-2.5">
                                    <Button 
                                        type="button" 
                                        variant="outline"
                                        size="lg"
                                        onClick={handleSaveAsDraft}
                                        disabled={isSubmitting}
                                        className="border-2 h-11"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save as Draft
                                    </Button>
                                    <Button type="submit" size="lg" className="h-11 bg-linear-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all">
                                        <Eye className="mr-2 h-5 w-5" />
                                        Preview & Create
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                </div>
            </form>
            {/* Preview Dialog */}
            {formData && (
                <ExamPreviewDialog
                    open={showPreview}
                    onOpenChange={setShowPreview}
                    data={{
                        title: formData.get("title") as string,
                        description: formData.get("description") as string,
                        duration: parseInt(formData.get("duration") as string),
                        passPercentage: parseInt(formData.get("passPercentage") as string),
                        antiCheatEnabled: formData.get("antiCheatEnabled") === "true",
                        maxViolations: parseInt(formData.get("maxViolations") as string),
                        shuffleQuestions: formData.get("shuffleQuestions") === "true",
                        shuffleOptions: formData.get("shuffleOptions") === "true",
                        showResultsImmediately: formData.get("showResultsImmediately") === "true",
                        requirePassword: formData.get("requirePassword") === "true",
                        examPassword: formData.get("examPassword") as string,
                        maxAttempts: formData.get("maxAttempts") ? parseInt(formData.get("maxAttempts") as string) : undefined,
                        scheduledStartTime: formData.get("scheduledStartTime") as string,
                        scheduledEndTime: formData.get("scheduledEndTime") as string,
                        allowLateSubmission: formData.get("allowLateSubmission") === "true",
                        negativeMarking: formData.get("negativeMarking") === "true",
                        negativeMarks: parseFloat(formData.get("negativeMarks") as string) || 0,
                        priceMode: formData.get("priceMode") as string,
                    }}
                    onConfirm={handleConfirmCreate}
                    isSubmitting={isSubmitting}
                />
            )}

            {/* Template Selector Dialog */}
            <TemplateSelectorDialog
                open={showTemplateSelector}
                onOpenChange={setShowTemplateSelector}
                templates={[]}
                onSelectTemplate={handleTemplateSelect}
                onSaveAsTemplate={(data) => {
                    console.log("Save template:", data);
                    // TODO: Implement template saving
                }}
            />
        </div>
    );
}
