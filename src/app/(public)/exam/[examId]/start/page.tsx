import { ExamSession } from "@/components/exam-session";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { startExamAction } from "@/actions/student";

type QuestionOption = {
    id: string;
    text: string;
};

type UIQuestion = {
    id: string;
    text: string;
    options: QuestionOption[];
};

type Exam = Prisma.ExamGetPayload<{}>;

export default async function ExamStartPage({
    params,
    searchParams,
}: {
    params: Promise<{ examId: string }>;
    searchParams: Promise<{ name?: string; roll?: string; password?: string }>;
}) {
    const { examId } = await params;
    const { name, roll, password } = await searchParams;

    if (!name || !roll) {
        redirect(`/exam/${examId}`);
    }

    // TASK 1: Start exam attempt with server-controlled timer
    const startResult = await startExamAction(examId, name, roll, password);

    if (!startResult.success) {
        // Handle errors - show message or redirect
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
                    <p className="text-gray-700">{startResult.error || "Failed to start exam"}</p>
                    <a href={`/exam/${examId}`} className="mt-4 inline-block text-blue-600 hover:underline">
                        Go Back
                    </a>
                </div>
            </div>
        );
    }
    
    // At this point, TypeScript knows success is true, so attemptId and endTime exist
    if (!startResult.attemptId || !startResult.endTime) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
                    <p className="text-gray-700">Invalid exam session. Please try again.</p>
                    <a href={`/exam/${examId}`} className="mt-4 inline-block text-blue-600 hover:underline">
                        Go Back
                    </a>
                </div>
            </div>
        );
    }

    let exam: Exam | null = null;
    let questions: UIQuestion[] = [];

    try {
        exam = await prisma.exam.findUnique({
            where: { id: examId },
        });
        
        if (!exam) return notFound();
        
        const qData = await prisma.question.findMany({
            where: { examId },
        });

        // Transform DB questions to UI format
        questions = qData.map((q) => {
            let parsedOptions: QuestionOption[] = [];
            try {
                // Handle both string and already parsed JSON
                const optionsData = typeof q.options === 'string' 
                    ? JSON.parse(q.options) 
                    : q.options;
                
                parsedOptions = Array.isArray(optionsData) 
                    ? optionsData 
                    : [];
            } catch (e) {
                console.error('Failed to parse question options', e);
            }
            
            return {
                id: q.id,
                text: q.text,
                options: parsedOptions
            };
        });

        // Apply shuffling based on exam settings
        if (exam.shuffleQuestions) {
            // Shuffle questions array
            questions = shuffleArray(questions);
        }

        if (exam.shuffleOptions) {
            // Shuffle options for each question
            questions = questions.map(q => ({
                ...q,
                options: shuffleArray(q.options)
            }));
        }

    } catch (e) {
        console.error("DB error in start page", e);
    }

    // Helper function to shuffle array (Fisher-Yates algorithm)
    function shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    if (!exam) return notFound();

    return (
        <ExamSession
            examId={examId}
            studentName={name}
            rollNumber={roll}
            questions={questions}
            durationMinutes={exam.duration}
            attemptId={startResult.attemptId}
            endTime={startResult.endTime}
            antiCheatEnabled={exam.antiCheatEnabled}
            maxViolations={exam.maxViolations}
        />
    );
}
