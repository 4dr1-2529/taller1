"use client";

import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { Bell } from "lucide-react";
import { RiskBadge } from "@/components/ui/RiskBadge";
import type { StudentWithPrediction } from "@/lib/aggregates";

type BentoAlertsPanelProps = {
  items: StudentWithPrediction[];
};

export function BentoAlertsPanel({ items }: BentoAlertsPanelProps) {
  const reduced = useReducedMotion();
  return (
    <div className="bento-queue flex h-full flex-col p-6 sm:p-7">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Alertas inteligentes
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">Cola de intervención</h3>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 ring-1 ring-rose-500/20">
          <Bell className="h-4 w-4 text-rose-400" />
        </span>
      </div>

      <ul className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <li className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-[var(--text-muted)]">
            Sin alertas activas en el cohorte
          </li>
        ) : (
          items.map((s, i) => (
            <motion.li
              key={s.id}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: reduced ? 0 : 0.2, delay: reduced ? 0 : i * 0.03 }}
              className="intervention-row"
            >
              <div
                className={clsx(
                  "intervention-avatar",
                  s.prediction.level === "alto" ? "text-[var(--risk-high)]" : "text-[var(--risk-medium)]",
                )}
              >
                {s.nombres.charAt(0)}{s.apellidos.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {s.nombres} {s.apellidos}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{s.nivel}</p>
              </div>
              <div className="intervention-score"><strong>{Math.round(s.prediction.score)}<small> pts</small></strong><RiskBadge level={s.prediction.level} /></div>
            </motion.li>
          ))
        )}
      </ul>
    </div>
  );
}
