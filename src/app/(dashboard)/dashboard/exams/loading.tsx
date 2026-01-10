import { ExamCardSkeletonGrid } from "@/components/exam-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExamsLoading() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ExamCardSkeletonGrid />
      </div>
    </div>
  );
}
