import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

type Trend = {
  direction: "up" | "down" | "flat";
  label: string;
};

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: Trend;
  variant?: "default" | "success" | "warning" | "danger";
};

const variantRing: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "ring-slate-200/80",
  success: "ring-emerald-200/90",
  warning: "ring-amber-200/90",
  danger: "ring-rose-200/90",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  return (
    <article
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1",
        variantRing[variant],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
          {trend ? (
            <p
              className={clsx(
                "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                trend.direction === "up" && "bg-rose-50 text-rose-700",
                trend.direction === "down" && "bg-emerald-50 text-emerald-700",
                trend.direction === "flat" && "bg-slate-100 text-slate-600",
              )}
            >
              {trend.direction === "up" ? "▲" : trend.direction === "down" ? "▼" : "◆"}{" "}
              {trend.label}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-inner">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        ) : null}
      </div>
    </article>
  );
}
