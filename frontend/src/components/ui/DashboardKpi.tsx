"use client";

import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

type DashboardKpiProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  badge?: string;
  badgeTone?: "success" | "danger" | "neutral" | "warning";
  trend?: { value: string; up?: boolean };
};

export function DashboardKpi({
  label,
  value,
  icon: Icon,
  badge,
  badgeTone = "neutral",
  trend,
}: DashboardKpiProps) {
  const badgeClass = {
    success: "dash-badge-success",
    danger: "dash-badge-danger",
    warning: "dash-badge-warning",
    neutral: "dash-badge-neutral",
  }[badgeTone];

  return (
    <article className="dash-kpi-card">
      <div className="flex items-start justify-between gap-2">
        <div className="dash-kpi-icon">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        {badge ? <span className={clsx("dash-badge", badgeClass)}>{badge}</span> : null}
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-3xl font-bold tabular-nums tracking-tight text-[var(--text-primary)]">{value}</p>
        {trend ? (
          <span
            className={clsx(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              trend.up ? "text-emerald-500" : "text-rose-500",
            )}
          >
            {trend.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value}
          </span>
        ) : null}
      </div>
    </article>
  );
}
