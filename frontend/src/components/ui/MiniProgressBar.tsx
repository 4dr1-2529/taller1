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
    cyan: "bg-gradient-to-r from-cyan-600 to-teal-400",
    emerald: "bg-gradient-to-r from-emerald-600 to-teal-400",
    amber: "bg-gradient-to-r from-amber-500 to-orange-400",
    rose: "bg-gradient-to-r from-rose-500 to-pink-400",
  }[variant];
  return (
    <div className="flex min-w-[88px] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border-subtle)]">
        <div className={clsx("h-full rounded-full transition-all", fill)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-medium tabular-nums text-[var(--text-secondary)]">
        {Math.round(pct)}%
      </span>
    </div>
  );
}
