"use client";

import clsx from "clsx";

type RiskLevel = "alto" | "medio" | "bajo" | string;

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide capitalize backdrop-blur-sm transition-all duration-200",
        level === "alto" && "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30 shadow-sm shadow-rose-500/10 hover:bg-rose-500/25",
        level === "medio" && "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30 shadow-sm shadow-amber-500/10 hover:bg-amber-500/25",
        level === "bajo" && "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30 shadow-sm shadow-emerald-500/10 hover:bg-emerald-500/25",
        level !== "alto" && level !== "medio" && level !== "bajo" && "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30 shadow-sm shadow-cyan-500/10 hover:bg-cyan-500/25",
      )}
    >
      <span
        className={clsx(
          "h-2 w-2 rounded-full shadow-lg",
          level === "alto" && "bg-rose-400 shadow-rose-400/50",
          level === "medio" && "bg-amber-400 shadow-amber-400/50",
          level === "bajo" && "bg-emerald-400 shadow-emerald-400/50",
        )}
      />
      {level}
      {score != null ? <span className="opacity-60">· {Math.round(score)}</span> : null}
    </span>
  );
}
