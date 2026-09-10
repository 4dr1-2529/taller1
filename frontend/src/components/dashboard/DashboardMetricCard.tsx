"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

export function DashboardMetricCard({ label, value, suffix = "", icon: Icon, tone = "brand", description, index = 0 }: {
  label: string; value: string | number; suffix?: string; icon: LucideIcon;
  tone?: "brand" | "neutral" | "success" | "warning" | "danger"; description?: string; index?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.article className={clsx("dashboard-metric", `dashboard-metric--${tone}`)}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.22, delay: reduced ? 0 : index * 0.035 }}
      whileHover={reduced ? undefined : { y: -2 }}>
      <div className="dashboard-metric__heading">
        <p>{label}</p>
        <span className="dashboard-metric__icon"><Icon className="h-5 w-5" aria-hidden /></span>
      </div>
      <p className="dashboard-metric__value">{value}<span>{suffix}</span></p>
      {description && <p className="dashboard-metric__description">{description}</p>}
    </motion.article>
  );
}
