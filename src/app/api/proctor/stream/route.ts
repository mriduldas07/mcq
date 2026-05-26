import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const session = await verifySession();
    if (!session || session.role !== "TEACHER") {
        return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId");

    if (!examId) {
        return new Response("Missing examId", { status: 400 });
    }

    // Verify exam ownership
    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        select: { teacherId: true }
    });

    if (!exam || exam.teacherId !== session.userId) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Set up SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (data: any) => {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                } catch (e) {
                    // Fail silently if controller is already closed
                }
            };

            // Loop to fetch active attempts and stream them
            const interval = setInterval(async () => {
                try {
                    const attempts = await prisma.studentAttempt.findMany({
                        where: {
                            examId,
                            startTime: { not: null }, // Exam actually started
                        },
                        select: {
                            id: true,
                            studentName: true,
                            rollNumber: true,
                            startTime: true,
                            endTime: true,
                            submitted: true,
                            score: true,
                            totalQuestions: true,
                            correctAnswers: true,
                            violations: true,
                            trustScore: true,
                            answers: true,
                            warningMessage: true,
                            completedAt: true,
                        },
                        orderBy: { studentName: "asc" }
                    });

                    // Format progress: how many questions answered
                    const formattedAttempts = attempts.map(attempt => {
                        const answers = typeof attempt.answers === 'object' && attempt.answers !== null
                            ? Object.keys(attempt.answers).length
                            : 0;

                        return {
                            id: attempt.id,
                            studentName: attempt.studentName,
                            rollNumber: attempt.rollNumber || "N/A",
                            startTime: attempt.startTime,
                            endTime: attempt.endTime,
                            submitted: attempt.submitted,
                            score: attempt.score,
                            totalQuestions: attempt.totalQuestions,
                            answeredCount: answers,
                            violations: attempt.violations,
                            trustScore: attempt.trustScore,
                            warningMessage: attempt.warningMessage,
                            completedAt: attempt.completedAt,
                        };
                    });

                    sendEvent(formattedAttempts);
                } catch (err) {
                    console.error("Proctor stream fetch error", err);
                    try {
                        controller.error(err);
                    } catch (e) {}
                    clearInterval(interval);
                }
            }, 2000);

            // Clean up when client disconnects
            request.signal.addEventListener("abort", () => {
                clearInterval(interval);
                try {
                    controller.close();
                } catch (e) {}
            });
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        }
    });
}
