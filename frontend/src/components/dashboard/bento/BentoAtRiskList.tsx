"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { RiskBadge } from "@/components/ui/RiskBadge";
import type { StudentWithPrediction } from "@/lib/aggregates";

export function BentoAtRiskList({ students }: { students: StudentWithPrediction[] }) {
  return (
    <div className="flex h-full flex-col p-5 md:p-6">
      <header className="flex items-center gap-3">
        <Users className="h-4 w-4 text-rose-400" />
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Ranking en riesgo</h3>
          <p className="text-xs text-[var(--text-secondary)]">Top estudiantes por score</p>
        </div>
      </header>
      <ul className="mt-4 flex-1 space-y-2">
        {students.map((s, i) => {
          const pct = Math.min(100, s.prediction.score);
          return (
            <motion.li key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
              <div className="flex items-center gap-3">
                <span className="w-5 text-center text-xs font-bold text-[var(--text-muted)]">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {s.nombres} {s.apellidos}
                    </p>
                    <RiskBadge level={s.prediction.level} />
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-rose-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] tabular-nums text-[var(--text-muted)]">{Math.round(pct)} pts</p>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
