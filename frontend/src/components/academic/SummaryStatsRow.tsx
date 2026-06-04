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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className={clsx(
            "premium-card rounded-xl px-4 py-3",
            s.tone === "brand" && "border-l-4 border-l-[var(--brand-orange)]",
            s.tone === "success" && "border-l-4 border-l-emerald-500",
            s.tone === "warning" && "border-l-4 border-l-amber-500",
            s.tone === "danger" && "border-l-4 border-l-rose-500",
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {s.label}
          </p>
          <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{s.value}</p>
          {s.hint ? <p className="mt-0.5 text-[10px] text-[var(--text-secondary)]">{s.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
