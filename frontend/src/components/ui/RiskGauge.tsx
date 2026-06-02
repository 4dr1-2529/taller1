"use client";

import clsx from "clsx";

export function RiskGauge({ score, level }: { score: number; level: string }) {
  const pct = Math.min(100, Math.max(0, score));
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const stroke =
    level === "alto"
      ? "#fb7185"
      : level === "medio"
        ? "#fbbf24"
        : "#34d399";

  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
      <svg className="-rotate-90" width="176" height="176" viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums text-[var(--text-primary)]">{Math.round(pct)}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">% riesgo</span>
        <span
          className={clsx(
            "mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
            level === "alto" && "bg-rose-500/15 text-rose-500",
            level === "medio" && "bg-amber-500/15 text-amber-600",
            level === "bajo" && "bg-emerald-500/15 text-emerald-600",
          )}
        >
          {level}
        </span>
      </div>
    </div>
  );
}
