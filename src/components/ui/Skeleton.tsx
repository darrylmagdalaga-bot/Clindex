import { cn } from "@/lib/utils";

interface SkeletonProps { className?: string; }

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-gray-100", className)} />;
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-50">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}