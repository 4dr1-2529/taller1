"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

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
  variant?: "default" | "success" | "warning" | "danger" | "cyan" | "purple";
  animateValue?: boolean;
};

const variantStyles: Record<NonNullable<StatCardProps["variant"]>, { ring: string; glow: string; icon: string }> = {
  default: {
    ring: "from-indigo-500/20 to-cyan-500/10",
    glow: "shadow-indigo-500/10",
    icon: "from-indigo-500 to-violet-600",
  },
  success: {
    ring: "from-emerald-500/25 to-teal-500/10",
    glow: "shadow-emerald-500/15",
    icon: "from-emerald-500 to-teal-600",
  },
  warning: {
    ring: "from-amber-500/25 to-orange-500/10",
    glow: "shadow-amber-500/15",
    icon: "from-amber-500 to-orange-600",
  },
  danger: {
    ring: "from-rose-500/25 to-pink-500/10",
    glow: "shadow-rose-500/15",
    icon: "from-rose-500 to-pink-600",
  },
  cyan: {
    ring: "from-cyan-500/25 to-blue-500/10",
    glow: "shadow-cyan-500/15",
    icon: "from-cyan-500 to-blue-600",
  },
  purple: {
    ring: "from-purple-500/25 to-fuchsia-500/10",
    glow: "shadow-purple-500/15",
    icon: "from-purple-500 to-fuchsia-600",
  },
};

function parseNumeric(value: string | number): number | null {
  if (typeof value === "number") return value;
  const n = parseFloat(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  animateValue = true,
}: StatCardProps) {
  const styles = variantStyles[variant];
  const numeric = parseNumeric(value);
  const suffix = typeof value === "string" ? value.replace(/[\d.,\s-]+/g, "") : "";

  return (
    <motion.article
      className={clsx("premium-card group p-5 md:p-6", styles.glow)}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <motion.div
        className={clsx(
          "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-40 blur-2xl transition-opacity group-hover:opacity-70",
          styles.ring,
        )}
        aria-hidden
      />

      <motion.div
        className="flex items-start justify-between gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
            {animateValue && numeric != null ? (
              <AnimatedNumber value={numeric} suffix={suffix} />
            ) : (
              value
            )}
          </p>
          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{subtitle}</p>
          ) : null}
          {trend ? (
            <p
              className={clsx(
                "mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                trend.direction === "up" && "badge-danger",
                trend.direction === "down" && "badge-success",
                trend.direction === "flat" && "badge-info",
              )}
            >
              {trend.direction === "up" ? "▲" : trend.direction === "down" ? "▼" : "◆"} {trend.label}
            </p>
          ) : null}
        </div>

        {Icon ? (
          <span
            className={clsx(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
              styles.icon,
            )}
          >
            <Icon className="h-5 w-5 opacity-90" aria-hidden />
          </span>
        ) : null}
      </motion.div>
    </motion.article>
  );
}
