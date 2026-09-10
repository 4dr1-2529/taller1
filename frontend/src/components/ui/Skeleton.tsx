import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "skeleton",
        className,
      )}
      aria-hidden
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6 min-h-36 shadow-[var(--card-shadow)]">
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return <div className="dashboard-skeleton" role="status" aria-label="Cargando resumen académico">
    <div className="space-y-3"><Skeleton className="h-3 w-32" /><Skeleton className="h-8 w-2/3" /><Skeleton className="h-3 w-1/2" /></div>
    <div className="dashboard-skeleton__focus"><Skeleton className="dashboard-skeleton__ring" /><div className="space-y-5"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-3/4" /></div></div>
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">{[0,1,2,3].map(i => <div key={i} className="space-y-3"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-7 w-1/2" /></div>)}</div>
  </div>;
}
