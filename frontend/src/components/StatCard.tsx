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

const variantConfig: Record<NonNullable<StatCardProps["variant"]>, {
  cardBorder: string;
  cardBg: string;
  cardHover: string;
  glowColor: string;
  iconBg: string;
  iconText: string;
  trendBg: string;
  trendText: string;
  blobColor: string;
  numberText: string;
}> = {
  default: {
    cardBorder: "border-indigo-500/10 group-hover:border-indigo-500/30",
    cardBg: "bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-indigo-950/40",
    cardHover: "group-hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]",
    glowColor: "shadow-indigo-500/20",
    iconBg: "from-indigo-500/20 to-violet-600/20",
    iconText: "text-indigo-400",
    trendBg: "bg-indigo-500/10 border-indigo-500/20",
    trendText: "text-indigo-400",
    blobColor: "bg-indigo-500/30",
    numberText: "text-white",
  },
  success: {
    cardBorder: "border-emerald-500/10 group-hover:border-emerald-500/30",
    cardBg: "bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-emerald-950/40",
    cardHover: "group-hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]",
    glowColor: "shadow-emerald-500/20",
    iconBg: "from-emerald-500/20 to-teal-600/20",
    iconText: "text-emerald-400",
    trendBg: "bg-emerald-500/10 border-emerald-500/20",
    trendText: "text-emerald-400",
    blobColor: "bg-emerald-500/30",
    numberText: "text-white",
  },
  warning: {
    cardBorder: "border-amber-500/10 group-hover:border-amber-500/30",
    cardBg: "bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-amber-950/40",
    cardHover: "group-hover:shadow-[0_0_40px_-10px_rgba(245,158,11,0.3)]",
    glowColor: "shadow-amber-500/20",
    iconBg: "from-amber-500/20 to-orange-600/20",
    iconText: "text-amber-400",
    trendBg: "bg-amber-500/10 border-amber-500/20",
    trendText: "text-amber-400",
    blobColor: "bg-amber-500/30",
    numberText: "text-white",
  },
  danger: {
    cardBorder: "border-rose-500/10 group-hover:border-rose-500/30",
    cardBg: "bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-rose-950/40",
    cardHover: "group-hover:shadow-[0_0_40px_-10px_rgba(244,63,94,0.3)]",
    glowColor: "shadow-rose-500/20",
    iconBg: "from-rose-500/20 to-pink-600/20",
    iconText: "text-rose-400",
    trendBg: "bg-rose-500/10 border-rose-500/20",
    trendText: "text-rose-400",
    blobColor: "bg-rose-500/30",
    numberText: "text-white",
  },
  cyan: {
    cardBorder: "border-cyan-500/10 group-hover:border-cyan-500/30",
    cardBg: "bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-cyan-950/40",
    cardHover: "group-hover:shadow-[0_0_40px_-10px_rgba(6,182,212,0.3)]",
    glowColor: "shadow-cyan-500/20",
    iconBg: "from-cyan-500/20 to-blue-600/20",
    iconText: "text-cyan-400",
    trendBg: "bg-cyan-500/10 border-cyan-500/20",
    trendText: "text-cyan-400",
    blobColor: "bg-cyan-500/30",
    numberText: "text-white",
  },
  purple: {
    cardBorder: "border-purple-500/10 group-hover:border-purple-500/30",
    cardBg: "bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-purple-950/40",
    cardHover: "group-hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]",
    glowColor: "shadow-purple-500/20",
    iconBg: "from-purple-500/20 to-fuchsia-600/20",
    iconText: "text-purple-400",
    trendBg: "bg-purple-500/10 border-purple-500/20",
    trendText: "text-purple-400",
    blobColor: "bg-purple-500/30",
    numberText: "text-white",
  },
};

function keepNumericChars(value: string): string {
  let out = "";
  for (const ch of value) {
    if ((ch >= "0" && ch <= "9") || ch === "." || ch === "-") out += ch;
  }
  return out;
}

function parseNumeric(value: string | number): number | null {
  if (typeof value === "number") return value;
  const n = Number.parseFloat(keepNumericChars(value));
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
  const cfg = variantConfig[variant];
  const numeric = parseNumeric(value);
  const suffix =
    typeof value === "string"
      ? value
          .split("")
          .filter((ch) => {
            const isDigit = ch >= "0" && ch <= "9";
            const isSep = ch === "." || ch === "," || ch === " " || ch === "-";
            return !isDigit && !isSep;
          })
          .join("")
      : "";

  const trendIcon = trend?.direction === "up" ? (
    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
      <path d="M6 2L10 7H2L6 2Z" fill="currentColor" />
    </svg>
  ) : trend?.direction === "down" ? (
    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
      <path d="M6 10L2 5H10L6 10Z" fill="currentColor" />
    </svg>
  ) : (
    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="5" width="10" height="2" rx="1" fill="currentColor" />
    </svg>
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={clsx(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 shadow-lg backdrop-blur-xl transition-all duration-500",
        cfg.cardBorder,
        cfg.cardBg,
        cfg.cardHover,
        cfg.glowColor,
      )}
    >
      <div
        className={clsx(
          "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-70",
          cfg.blobColor,
        )}
        aria-hidden
      />

      <div
        className={clsx(
          "pointer-events-none absolute -bottom-12 -left-12 h-24 w-24 rounded-full blur-2xl opacity-30",
          cfg.blobColor,
        )}
        aria-hidden
      />

      <div className="relative z-10">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div
                className={clsx(
                  "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br backdrop-blur-sm",
                  cfg.iconBg,
                )}
              >
                <Icon className={clsx("h-6 w-6", cfg.iconText)} aria-hidden />
              </div>
            )}
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {title}
            </h3>
          </div>

          {trend && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                cfg.trendBg,
                cfg.trendText,
              )}
            >
              {trendIcon}
              <span>{trend.label}</span>
            </motion.div>
          )}
        </div>

        <motion.p
          className={clsx(
            "text-4xl font-bold tracking-tight md:text-5xl",
            cfg.numberText,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {animateValue && numeric != null ? (
            <AnimatedNumber value={numeric} suffix={suffix} />
          ) : (
            value
          )}
        </motion.p>

        {subtitle && (
          <motion.p
            className="mt-2 text-sm text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      <div
        className={clsx(
          "pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100",
          "bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]",
          "bg-[size:24px_24px]",
        )}
        aria-hidden
      />
    </motion.article>
  );
}
