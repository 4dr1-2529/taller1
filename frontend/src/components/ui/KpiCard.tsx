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
  rose: "from-rose-500/20 to-pink-500/10 border-rose-500/25 text-rose-300",
  amber: "from-amber-500/20 to-orange-500/10 border-amber-500/25 text-amber-300",
  emerald: "from-emerald-500/20 to-teal-500/10 border-emerald-500/25 text-emerald-300",
  cyan: "from-cyan-500/20 to-blue-500/10 border-cyan-500/25 text-cyan-300",
  indigo: "from-indigo-500/20 to-violet-500/10 border-indigo-500/25 text-indigo-300",
};

export function KpiCard({ label, value, icon: Icon, variant = "indigo", subtitle }: KpiCardProps) {
  return (
    <motion.article
      className={clsx(
        "premium-card border bg-gradient-to-br p-5",
        variants[variant],
      )}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 opacity-80" aria-hidden />
        <h3 className="text-sm font-semibold">{label}</h3>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)]">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-[var(--text-muted)]">{subtitle}</p> : null}
    </motion.article>
  );
}
