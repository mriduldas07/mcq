import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { FormattedDate } from "@/components/formatted-date";
import { verifySession } from "@/lib/session";

/**
 * TASK 2: Proper Student Attempt Flow
 * This is the exam landing page where students enter their details
 */
async function startExamAction(formData: FormData) {
    "use server";
    const examId = formData.get("examId") as string;
    const name = formData.get("name") as string;
    const roll = formData.get("roll") as string;
    const password = formData.get("password") as string;

    // Validate inputs
    if (!name || !roll) {
        return;
    }

    // Redirect to start page which will create the attempt (password will be validated there)
    const params = new URLSearchParams({
        name,
        roll,
    });
    
    if (password) {
        params.append("password", password);
    }
    
    redirect(`/exam/${examId}/start?${params.toString()}`);
}

export default async function ExamLandingPage({
    params,
}: {
    params: Promise<{ examId: string }>;
}) {
    const { examId } = await params;

    // Fetch exam with question count
    let exam = null;
    let questionCount = 0;

    if (examId === "mock-exam-id" || examId === "mock-id") {
        exam = {
            id: examId,
            title: "Mock Exam Title",
            duration: 60,
            questions: [],
            status: "PUBLISHED",
            teacher: { name: "Mr. Smith" },
            requirePassword: false,
            scheduledStartTime: null,
            scheduledEndTime: null,
            allowLateSubmission: false,
            accessMode: "PUBLIC",
            whitelistEmails: [] as string[],
        };
    } else {
        try {
            exam = await prisma.exam.findUnique({
                where: { id: examId },
                include: { 
                    teacher: true,
                    _count: {
                        select: { questions: true }
                    }
                },
            });

            if (exam) {
                questionCount = exam._count.questions;
            }
        } catch (e) {
            console.error("Error fetching exam", e);
        }
    }

    if (!exam) return notFound();

    const session = await verifySession();

    // Check closed whitelist access
    const isRestricted = exam.accessMode === "RESTRICTED";
    if (isRestricted) {
        if (!session || session.role !== "STUDENT") {
            redirect(`/login?callbackUrl=/exam/${examId}`);
        }
    }
    const isWhitelisted = isRestricted && session ? exam.whitelistEmails.includes(session.email.toLowerCase().trim()) : true;

    // Check if exam is published
    const isPublished = exam.status === "PUBLISHED";
    const isDraft = exam.status === "DRAFT";
    const isEnded = exam.status === "ENDED";
    
    // Check scheduled availability
    const now = new Date();
    const isScheduled = exam.scheduledStartTime !== null || exam.scheduledEndTime !== null;
    const isBeforeStart = exam.scheduledStartTime && now < new Date(exam.scheduledStartTime);
    const isAfterEnd = exam.scheduledEndTime && now > new Date(exam.scheduledEndTime);
    const canAccess = isPublished && !isBeforeStart && (!isAfterEnd || exam.allowLateSubmission);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10 p-3 sm:p-4 md:p-6">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center space-y-3 pb-4 px-4 sm:px-6">
                    <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-2xl sm:text-3xl">📝</span>
                    </div>
                    <CardTitle className="text-xl sm:text-2xl">{exam.title}</CardTitle>
                    <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <span>⏱️</span>
                            <span>{exam.duration} mins</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>❓</span>
                            <span>{questionCount} questions</span>
                        </div>
                    </div>
                    {exam.teacher?.name && (
                        <p className="text-xs text-muted-foreground">By {exam.teacher.name}</p>
                    )}
                </CardHeader>
                <CardContent className="px-4 sm:px-6 space-y-4">
                    {/* Show status warnings */}
                    {isDraft && (
                        <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800 border border-yellow-200 mb-6">
                            <strong>⚠️ Exam Not Published</strong>
                            <p className="mt-2">This exam is still in draft mode. Please contact your teacher.</p>
                        </div>
                    )}

                    {isEnded && (
                        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 border border-red-200 mb-6">
                            <strong>🚫 Exam Ended</strong>
                            <p className="mt-2">This exam has ended and is no longer accepting submissions.</p>
                        </div>
                    )}

                    {isBeforeStart && (
                        <div className="rounded-md bg-orange-50 p-4 text-sm text-orange-800 border border-orange-200 mb-6">
                            <strong>⏰ Exam Not Yet Available</strong>
                            <p className="mt-2">This exam will be available from: <strong><FormattedDate date={exam.scheduledStartTime!} /></strong></p>
                        </div>
                    )}

                    {isAfterEnd && !exam.allowLateSubmission && (
                        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 border border-red-200 mb-6">
                            <strong>⏱️ Exam Time Expired</strong>
                            <p className="mt-2">This exam closed on: <strong><FormattedDate date={exam.scheduledEndTime!} /></strong></p>
                        </div>
                    )}

                    {canAccess && !isWhitelisted && (
                        <div className="rounded-md bg-red-50 p-5 text-center border border-red-200 mb-6">
                            <span className="text-4xl">🔒</span>
                            <h3 className="font-bold text-lg text-red-800 mt-3 font-semibold">Access Denied</h3>
                            <p className="mt-2 text-sm text-red-700 leading-relaxed">
                                Your student account (<strong>{session?.email}</strong>) is not authorized to take this exam.
                                Please contact your instructor if you believe this is an error.
                            </p>
                            <a href="/api/auth/signout" className="mt-4 inline-block">
                                <Button variant="outline" size="sm" className="text-xs">
                                    Switch Account / Logout
                                </Button>
                            </a>
                        </div>
                    )}

                    {canAccess && isWhitelisted && (
                        <>
                            {isRestricted && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md p-4 text-xs sm:text-sm mb-4 sm:mb-6">
                                    <strong>✓ Identity Verified</strong>
                                    <p className="mt-1">Logged in as: <strong>{session?.email}</strong></p>
                                </div>
                            )}

                            <div className="rounded-md bg-blue-50 p-3 sm:p-4 text-xs sm:text-sm text-blue-800 border border-blue-200 mb-4 sm:mb-6">
                                <strong>📋 Instructions:</strong>
                                <ul className="list-disc pl-4 mt-2 space-y-1">
                                    <li>You must enter <strong>fullscreen mode</strong> to start the exam.</li>
                                    <li>The timer starts immediately after you click Start.</li>
                                    <li>Your answers are auto-saved.</li>
                                    <li>The exam will auto-submit when time is up.</li>
                                    {exam.antiCheatEnabled && (
                                        <>
                                            <li>Switching tabs or exiting fullscreen counts as a violation.</li>
                                            <li>After <strong>{exam.maxViolations} violations</strong>, your exam will be auto-submitted.</li>
                                        </>
                                    )}
                                </ul>
                            </div>

                            <form action={startExamAction} className="mt-4">
                                <input type="hidden" name="examId" value={examId} />
                                <div className="space-y-4 sm:space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm sm:text-base font-medium">Full Name</Label>
                                        <Input 
                                            id="name"
                                            name="name" 
                                            required 
                                            readOnly={!!isRestricted}
                                            defaultValue={session?.name || ""}
                                            placeholder="Enter your name"
                                            minLength={2}
                                            className={`h-11 sm:h-12 text-sm sm:text-base ${isRestricted ? "bg-muted cursor-not-allowed" : ""}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="roll" className="text-sm sm:text-base font-medium">Roll Number / ID</Label>
                                        <Input 
                                            id="roll"
                                            name="roll" 
                                            required 
                                            placeholder="e.g. 12345"
                                            minLength={1}
                                            className="h-11 sm:h-12 text-sm sm:text-base"
                                        />
                                    </div>
                                    {exam.requirePassword && (
                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="text-sm sm:text-base font-medium">Exam Password 🔒</Label>
                                            <Input 
                                                id="password"
                                                name="password" 
                                                type="password"
                                                required 
                                                placeholder="Enter exam password"
                                                className="h-11 sm:h-12 text-sm sm:text-base"
                                            />
                                            <p className="text-xs text-muted-foreground">This exam requires a password to access</p>
                                        </div>
                                    )}
                                    <Button type="submit" className="w-full text-base sm:text-lg h-12 sm:h-14 font-semibold shadow-lg hover:shadow-xl transition-all">
                                        🚀 Start Exam
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}

                    {!canAccess && (
                        <Link href="/">
                            <Button variant="outline" className="w-full">
                                Go Back
                            </Button>
                        </Link>
                    )}
                </CardContent>
                <CardFooter className="text-center justify-center text-xs text-muted-foreground">
                    MCQ Platform • Anti-Cheat Enabled
                </CardFooter>
            </Card>
        </div>
    );
}
