"use client";

import clsx from "clsx";
import { CircleCheck, CircleAlert, TriangleAlert, CircleHelp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type RiskLevel = "alto" | "medio" | "bajo" | string;

/** Nivel → icono. El color nunca es el único portador del significado. */
const LEVEL_ICON: Record<string, LucideIcon> = {
  alto: TriangleAlert,
  medio: CircleAlert,
  bajo: CircleCheck,
};

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const displayScore =
    score != null ? (level === "alto" ? `+${score.toFixed(1)}` : score.toFixed(1)) : null;
  const Icon = LEVEL_ICON[level] ?? CircleHelp;

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
      title={`Nivel de riesgo: ${level}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {displayScore ? (
        <span className="text-xs font-medium uppercase">{displayScore} · {level}</span>
      ) : (
        <span className="capitalize font-semibold">{level}</span>
      )}
    </span>
  );
}
