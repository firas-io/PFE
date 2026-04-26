import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted/70", className)} />;
}

export function HabitRowSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <Skeleton className="h-11 w-11 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-3 w-14 rounded-full" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
      </div>
      {/* Weekly grid */}
      <div className="px-4 pb-4 space-y-1.5">
        <Skeleton className="h-2.5 w-24 rounded" />
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-7 rounded-lg" />
          ))}
        </div>
      </div>
      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-border/40 px-4 py-2.5">
        <Skeleton className="h-5 w-20 rounded-lg" />
        <div className="ml-auto flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-7 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HabitListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
      {Array.from({ length: rows }).map((_, i) => (
        <HabitRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="card-elevated p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
