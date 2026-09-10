"use client";

import clsx from "clsx";

export type SummaryStat = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "brand";
};

export function SummaryStatsRow({ stats }: { stats: SummaryStat[] }) {
  return (
    <div className="summary-stats">
      {stats.map((s) => (
        <div
          key={s.label}
          className={clsx(
            "summary-stat",
            s.tone === "brand" && "border-l-4 border-l-[var(--brand-orange)]",
            s.tone === "success" && "border-l-4 border-l-emerald-500",
            s.tone === "warning" && "border-l-4 border-l-amber-500",
            s.tone === "danger" && "border-l-4 border-l-rose-500",
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {s.label}
          </p>
          <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{s.value}</p>
          {s.hint ? <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{s.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
