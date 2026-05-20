"use client";

import clsx from "clsx";

type RiskLevel = "alto" | "medio" | "bajo" | string;

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  return (
    <span
      className={clsx(
        "badge capitalize",
        level === "alto" && "badge-danger",
        level === "medio" && "badge-warning",
        level === "bajo" && "badge-success",
        level !== "alto" && level !== "medio" && level !== "bajo" && "badge-info",
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          level === "alto" && "bg-rose-400",
          level === "medio" && "bg-amber-400",
          level === "bajo" && "bg-emerald-400",
        )}
      />
      {level}
      {score != null ? ` · ${Math.round(score)}` : null}
    </span>
  );
}
