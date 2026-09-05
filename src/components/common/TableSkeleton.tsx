import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 8, cols = 6 }: TableSkeletonProps) {
  return (
    <div className="rounded-2xl border overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3.5" style={{ width: `${60 + (i % 3) * 30}px` }} />
        ))}
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-4" style={{ width: `${50 + (j % 4) * 25}px` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
