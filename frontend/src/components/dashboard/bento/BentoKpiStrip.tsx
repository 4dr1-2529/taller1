"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export type KpiItem = {
  label: string;
  value: number | string;
  suffix?: string;
  icon: LucideIcon;
  hint?: string;
};

export function BentoKpiStrip({ items }: { items: KpiItem[] }) {
  const reduced = useReducedMotion();
  return (
    <div className="institution-pulse">
      {items.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: reduced ? 0 : i * 0.04 }}
          className="institution-pulse__item"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {kpi.label}
            </p>
            <kpi.icon className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-[var(--text-primary)] md:text-3xl">
            {typeof kpi.value === "number" ? (
              <>
                <AnimatedNumber value={kpi.value} suffix={kpi.suffix} />
              </>
            ) : (
              <>
                {kpi.value}
                {kpi.suffix}
              </>
            )}
          </p>
          {kpi.hint ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{kpi.hint}</p> : null}
        </motion.div>
      ))}
    </div>
  );
}
