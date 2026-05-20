"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

type KpiCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "rose" | "amber" | "emerald" | "cyan" | "indigo";
  subtitle?: string;
};

const variants = {
  rose: "from-rose-500/15 to-pink-500/8 border-rose-500/20 text-rose-300 shadow-rose-500/5",
  amber: "from-amber-500/15 to-orange-500/8 border-amber-500/20 text-amber-300 shadow-amber-500/5",
  emerald: "from-emerald-500/15 to-teal-500/8 border-emerald-500/20 text-emerald-300 shadow-emerald-500/5",
  cyan: "from-cyan-500/15 to-blue-500/8 border-cyan-500/20 text-cyan-300 shadow-cyan-500/5",
  indigo: "from-violet-500/15 to-indigo-500/8 border-violet-500/20 text-violet-300 shadow-violet-500/5",
};

export function KpiCard({ label, value, icon: Icon, variant = "indigo", subtitle }: KpiCardProps) {
  return (
    <motion.article
      className={clsx(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 backdrop-blur-xl transition-all duration-300",
        "hover:shadow-lg hover:border-opacity-40",
        variants[variant],
      )}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg",
            variant === "rose" && "from-rose-500/30 to-pink-500/20 shadow-rose-500/20",
            variant === "amber" && "from-amber-500/30 to-orange-500/20 shadow-amber-500/20",
            variant === "emerald" && "from-emerald-500/30 to-teal-500/20 shadow-emerald-500/20",
            variant === "cyan" && "from-cyan-500/30 to-blue-500/20 shadow-cyan-500/20",
            variant === "indigo" && "from-violet-500/30 to-indigo-500/20 shadow-violet-500/20",
          )}>
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <h3 className="text-sm font-semibold tracking-wide uppercase opacity-80">{label}</h3>
        </div>
        <p className="mt-4 text-4xl font-bold tracking-tight text-[var(--text-primary)]">{value}</p>
        {subtitle ? <p className="mt-2 text-xs font-medium text-[var(--text-muted)]">{subtitle}</p> : null}
      </div>
    </motion.article>
  );
}
