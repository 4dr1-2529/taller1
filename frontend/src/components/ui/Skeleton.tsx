import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-lg bg-gradient-to-r from-white/5 via-white/10 to-white/5",
        className,
      )}
      aria-hidden
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-6 backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 opacity-30" />
      <div className="relative z-10 space-y-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}
