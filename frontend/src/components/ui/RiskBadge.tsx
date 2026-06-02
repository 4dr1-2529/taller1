"use client";

import clsx from "clsx";

type RiskLevel = "alto" | "medio" | "bajo" | string;

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const displayScore =
    score != null ? (level === "alto" ? `+${score.toFixed(1)}` : score.toFixed(1)) : null;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums",
        level === "alto" &&
          "bg-rose-500/15 text-rose-600 ring-1 ring-rose-500/30 dark:text-rose-300",
        level === "medio" &&
          "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300",
        level === "bajo" &&
          "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300",
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
