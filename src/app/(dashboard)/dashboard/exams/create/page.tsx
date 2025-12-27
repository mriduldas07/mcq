import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createExamAction } from "@/actions/exam";
import Link from "next/link";
import { Shield, Clock, Settings, Lock, Target, Shuffle } from "lucide-react";

export default function CreateExamPage() {
    return (
        <div className="flex-1 space-y-6 p-4 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Create New Exam</h2>
                    <p className="text-muted-foreground mt-1">Configure your exam with advanced settings and controls</p>
                </div>
            </div>
            
            <form action={createExamAction} className="mx-auto max-w-4xl space-y-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Basic Information
                        </CardTitle>
                        <CardDescription>
                            Set the basic details for your exam
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Exam Title *</Label>
                            <Input id="title" name="title" placeholder="e.g. Physics Midterm 2024" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" placeholder="Brief description of the exam content and objectives" rows={3} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (minutes) *</Label>
                                <Input id="duration" name="duration" type="number" min="1" defaultValue="60" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priceMode">Monetization</Label>
                                <select
                                    id="priceMode"
                                    name="priceMode"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="FREE">Free (Subscription)</option>
                                    <option value="PAID_BY_TEACHER">Pay Per Exam</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Anti-Cheat Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Anti-Cheat Settings
                        </CardTitle>
                        <CardDescription>
                            Configure security and monitoring options
                        </CardDescription>
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
                            <Input id="maxViolations" name="maxViolations" type="number" min="1" max="10" defaultValue="3" />
                            <p className="text-xs text-muted-foreground">Number of violations allowed before exam is automatically submitted</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Grading & Results */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Grading & Results
                        </CardTitle>
                        <CardDescription>
                            Configure grading criteria and result display
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="passPercentage">Pass Percentage</Label>
                            <Input id="passPercentage" name="passPercentage" type="number" min="0" max="100" defaultValue="50" />
                            <p className="text-xs text-muted-foreground">Minimum percentage required to pass the exam</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="showResultsImmediately">Show Results Immediately</Label>
                                <p className="text-sm text-muted-foreground">Display scores and answers right after submission</p>
                            </div>
                            <input type="checkbox" id="showResultsImmediately" name="showResultsImmediately" value="true" defaultChecked className="h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>

                {/* Question Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shuffle className="h-5 w-5" />
                            Question Settings
                        </CardTitle>
                        <CardDescription>
                            Randomization options for questions and answers
                        </CardDescription>
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
                    </CardContent>
                </Card>

                {/* Access Control */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Access Control
                        </CardTitle>
                        <CardDescription>
                            Manage who can access and how many times
                        </CardDescription>
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
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxAttempts">Maximum Attempts per Student</Label>
                            <Input id="maxAttempts" name="maxAttempts" type="number" min="1" placeholder="Leave empty for unlimited" />
                            <p className="text-xs text-muted-foreground">Limit how many times a student can attempt this exam</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <Card>
                    <CardFooter className="flex justify-between pt-6">
                        <Link href="/dashboard/exams">
                            <Button variant="ghost" type="button">Cancel</Button>
                        </Link>
                        <Button type="submit" size="lg">
                            <Clock className="mr-2 h-4 w-4" />
                            Create Exam Draft
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
