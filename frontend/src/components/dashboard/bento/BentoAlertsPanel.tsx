"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { Bell, ChevronRight } from "lucide-react";
import { RiskBadge } from "@/components/ui/RiskBadge";
import type { StudentWithPrediction } from "@/lib/aggregates";

type BentoAlertsPanelProps = {
  items: StudentWithPrediction[];
};

export function BentoAlertsPanel({ items }: BentoAlertsPanelProps) {
  return (
    <div className="flex h-full flex-col p-5 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Alertas inteligentes
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">Cola de intervención</h3>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 ring-1 ring-rose-500/20">
          <Bell className="h-4 w-4 text-rose-400" />
        </span>
      </div>

      <ul className="mt-5 flex-1 space-y-2 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <li className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-[var(--text-muted)]">
            Sin alertas activas en el cohorte
          </li>
        ) : (
          items.map((s, i) => (
            <motion.li
              key={s.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.05]"
            >
              <div
                className={clsx(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white",
                  s.prediction.level === "alto" ? "bg-rose-500/80" : "bg-amber-500/80",
                )}
              >
                {Math.round(s.prediction.score)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {s.nombres} {s.apellidos}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">{s.nivel}</p>
              </div>
              <RiskBadge level={s.prediction.level} />
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.li>
          ))
        )}
      </ul>
    </div>
  );
}
