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

/** Skeleton de fila de tabla: mantiene la geometría para evitar saltos de layout. */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div role="status" aria-label="Cargando tabla" className="space-y-3 p-4 sm:p-6">
      <div className="flex gap-4">
        {Array.from({ length: cols }, (_, c) => (
          <Skeleton key={c} className={clsx("h-3", c === 0 ? "w-40" : "flex-1")} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className={clsx("h-4", c === 0 ? "w-40" : "flex-1")} />
          ))}
        </div>
      ))}
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

/** Skeleton en rejilla de KPIs (4 tarjetas). */
export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-label="Cargando indicadores" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-8 w-20" />
          <Skeleton className="mt-3 h-3 w-32" />
        </div>
      ))}
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

/** Skeleton del resultado de predicción (gauge + métricas + indicadores). */
export function PredictionResultSkeleton() {
  return (
    <div role="status" aria-label="Calculando predicción" className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6 lg:col-span-1">
        <Skeleton className="h-3 w-28" />
        <div className="mt-6 flex justify-center">
          <Skeleton className="h-40 w-40 rounded-full" />
        </div>
        <Skeleton className="mx-auto mt-6 h-4 w-32" />
      </div>
      <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6 lg:col-span-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-2/3" />
        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      <span className="sr-only">Cargando…</span>
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
