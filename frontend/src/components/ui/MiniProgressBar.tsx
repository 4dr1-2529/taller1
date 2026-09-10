"use client";

import clsx from "clsx";

export function MiniProgressBar({
  value,
  max = 100,
  variant = "cyan",
}: {
  value: number;
  max?: number;
  variant?: "cyan" | "emerald" | "amber" | "rose";
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const fill = {
    cyan: "bg-[var(--chart-secondary)]",
    emerald: "bg-[var(--risk-low)]",
    amber: "bg-[var(--risk-medium)]",
    rose: "bg-[var(--risk-high)]",
  }[variant];
  return (
    <div className="flex min-w-[88px] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border-subtle)]">
        <div className={clsx("h-full rounded-full transition-all duration-250 motion-reduce:transition-none", fill)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-medium tabular-nums text-[var(--text-secondary)]">
        {Math.round(pct)}%
      </span>
    </div>
  );
}
