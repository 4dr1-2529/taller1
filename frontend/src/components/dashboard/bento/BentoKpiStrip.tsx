"use client";

import { motion } from "framer-motion";
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
  return (
    <div className="grid h-full grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] md:grid-cols-4">
      {items.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.04 }}
          className="flex flex-col justify-between bg-[var(--surface)]/60 p-4 md:p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
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
          {kpi.hint ? <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{kpi.hint}</p> : null}
        </motion.div>
      ))}
    </div>
  );
}
