"use client";

import clsx from "clsx";

type RiskLevel = "alto" | "medio" | "bajo" | string;

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const displayScore =
    score != null ? (level === "alto" ? `+${score.toFixed(1)}` : score.toFixed(1)) : null;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
        level === "alto" &&
          "bg-[var(--risk-high)]/12 text-[var(--risk-high)] ring-1 ring-[var(--risk-high)]/25",
        level === "medio" &&
          "bg-[var(--risk-medium)]/12 text-[var(--risk-medium)] ring-1 ring-[var(--risk-medium)]/25",
        level === "bajo" &&
          "bg-[var(--risk-low)]/12 text-[var(--risk-low)] ring-1 ring-[var(--risk-low)]/25",
        level !== "alto" && level !== "medio" && level !== "bajo" &&
          "bg-cyan-500/15 text-cyan-700 ring-1 ring-cyan-500/30 dark:text-cyan-300",
      )}
    >
      {displayScore ?? (
        <span className="capitalize font-semibold">{level}</span>
      )}
      {!displayScore ? null : (
        <span className="text-[10px] font-medium uppercase opacity-70">{level}</span>
      )}
    </span>
  );
}
