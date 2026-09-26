"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TriangleAlert } from "lucide-react";
import { RiskBadge } from "@/components/ui/RiskBadge";
import type { StudentWithPrediction } from "@/lib/aggregates";

/** Acción sugerida por nivel — misma semántica que la recomendación del backend. */
const ACTION: Record<string, string> = {
  alto: "Intervención prioritaria",
  medio: "Seguimiento preventivo",
  bajo: "Monitoreo rutinario",
};

const BAR_COLOR: Record<string, string> = {
  alto: "var(--risk-high)",
  medio: "var(--risk-medium)",
  bajo: "var(--risk-low)",
};

export function BentoAtRiskList({ students }: { students: StudentWithPrediction[] }) {
  const reduced = useReducedMotion();
  return (
    <div className="flex h-full flex-col p-6 sm:p-7">
      <header className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--risk-high)]/12 text-[var(--risk-high)]">
          <TriangleAlert className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Priorizados para intervención
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Grado, sección, probabilidad y acción sugerida
          </p>
        </div>
      </header>
      <ul className="mt-4 flex-1 space-y-5">
        {students.length === 0 ? (
          <li className="py-6 text-center text-sm text-[var(--text-muted)]">
            Sin datos de riesgo disponibles
          </li>
        ) : (
          students.map((s, i) => {
            const pct = Math.min(100, s.prediction.score);
            const level = s.prediction.level;
            const prob =
              s.prediction.probability != null && Number.isFinite(s.prediction.probability)
                ? s.prediction.probability
                : pct / 100;
            return (
              <motion.li
                key={s.id}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-bold text-[var(--text-muted)]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="break-words text-sm font-medium text-[var(--text-primary)]">
                        {s.nombres} {s.apellidos}
                      </p>
                      <RiskBadge level={level} score={pct} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-secondary)]">
                      <span className="font-medium">{s.nivel || "Sección sin asignar"}</span>
                      <span aria-hidden>·</span>
                      <span className="tabular-nums">
                        Prob. {(prob * 100).toFixed(1)}%
                      </span>
                      <span aria-hidden>·</span>
                      <span className="font-medium text-[var(--text-muted)]">
                        {ACTION[level] ?? "Revisión manual"}
                      </span>
                    </div>
                    <div
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]"
                      role="img"
                      aria-label={`Puntaje de riesgo ${Math.round(pct)} de 100, nivel ${level}`}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: BAR_COLOR[level] ?? "var(--risk-high)" }}
                        initial={reduced ? false : { width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{
                          duration: reduced ? 0 : 0.25,
                          delay: reduced ? 0 : i * 0.035,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs tabular-nums text-[var(--text-muted)]">
                      {Math.round(pct)} pts
                    </p>
                  </div>
                </div>
              </motion.li>
            );
          })
        )}
      </ul>
    </div>
  );
}
