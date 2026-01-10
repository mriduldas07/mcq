import { ExamCardSkeletonGrid } from "@/components/exam-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex-1 space-y-6">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Exams Grid Skeleton */}
      <div>
        <Skeleton className="h-7 w-48 mb-4" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ExamCardSkeletonGrid />
        </div>
      </div>
    </div>
  );
}
