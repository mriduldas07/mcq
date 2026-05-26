import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { ProctorLiveGrid } from "@/components/proctor-live-grid";

export const dynamic = "force-dynamic";

export default async function ExamProctorPage({
    params,
}: {
    params: Promise<{ examId: string }>;
}) {
    const { examId } = await params;
    const session = await verifySession();
    if (!session || session.role !== "TEACHER") {
        return redirect("/login");
    }

    // Verify exam ownership and existence
    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        select: {
            id: true,
            title: true,
            teacherId: true,
            duration: true,
            antiCheatEnabled: true,
            maxViolations: true,
        }
    });

    if (!exam) return notFound();
    if (exam.teacherId !== session.userId) {
        return redirect("/dashboard");
    }

    return (
        <div className="flex-1 space-y-6">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <Link href={`/dashboard/exams/${examId}`}>
                    <Button variant="ghost" size="sm" className="gap-1.5 font-semibold text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" /> Back to Editor
                    </Button>
                </Link>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>PROCTOR ACTIVE</span>
                </div>
            </div>

            {/* Dashboard Header */}
            <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
                    <ShieldAlert className="h-6 w-6 text-indigo-600 sm:h-7 sm:w-7" /> Live Proctor Dashboard
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground font-medium">
                    Monitoring: <span className="font-semibold text-foreground">{exam.title}</span> • {exam.duration} Minutes
                </p>
            </div>

            {/* Live streaming control grid */}
            <ProctorLiveGrid 
                examId={examId} 
                examTitle={exam.title}
                antiCheatEnabled={exam.antiCheatEnabled}
                maxViolations={exam.maxViolations}
            />
        </div>
    );
}
