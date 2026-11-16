import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function StatGridSkeleton({ count = 4, className }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-[104px] rounded-xl" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5, className }) {
  return (
    <div className={cn("space-y-2 p-4", className)}>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex items-center gap-4">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          {Array.from({ length: cols }).map((__, col) => (
            <Skeleton
              key={col}
              className={cn("h-4", col === 0 ? "w-[26%]" : "flex-1 opacity-80")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className, height = "h-44" }) {
  return <Skeleton className={cn("rounded-xl", height, className)} />;
}

export function PageSkeleton({ stats = 4, rows = 6, cols = 5 }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {stats > 0 && <StatGridSkeleton count={stats} />}
      <Skeleton className="h-[320px] rounded-xl" />
      <div className="rounded-xl border border-border/70 bg-card p-2">
        <TableSkeleton rows={rows} cols={cols} />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[212px] rounded-xl lg:col-span-2" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Skeleton className="h-[98px] rounded-xl" />
          <Skeleton className="h-[98px] rounded-xl" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[260px] rounded-xl" />
        <Skeleton className="h-[260px] rounded-xl" />
      </div>
    </div>
  );
}
