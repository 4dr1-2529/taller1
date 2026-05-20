"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { Grid3X3 } from "lucide-react";
import { attachPredictions } from "@/lib/aggregates";
import type { Student } from "@/types/academic";

function cellColor(score: number) {
  if (score >= 66) return "bg-rose-500/85 shadow-[0_0_16px_rgba(244,63,94,0.45)]";
  if (score >= 41) return "bg-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.35)]";
  return "bg-emerald-500/75 shadow-[0_0_12px_rgba(16,185,129,0.3)]";
}

type RiskHeatmapProps = {
  students: Student[];
};

export function RiskHeatmap({ students }: RiskHeatmapProps) {
  const rows = attachPredictions(students).slice(0, 48);
  const cols = 8;

  return (
    <motion.article
      className="premium-card p-5 md:p-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-fuchsia-500/15 ring-1 ring-white/10">
          <Grid3X3 className="h-5 w-5 text-violet-300" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Mapa de calor de riesgo</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Vista rápida del cohorte — verde bajo, ámbar medio, rojo alto
          </p>
        </div>
      </div>

      <div
        className="mt-5 grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {rows.map((s, i) => (
          <motion.div
            key={s.id}
            title={`${s.nombres} ${s.apellidos} — ${Math.round(s.prediction.score)} pts`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.015, duration: 0.25 }}
            className={clsx("heatmap-cell aspect-square", cellColor(s.prediction.score))}
          />
        ))}
        {rows.length === 0 &&
          Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-white/[0.03] ring-1 ring-white/5" />
          ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-emerald-500/80" /> Bajo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-amber-500/80" /> Medio
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-rose-500/80" /> Alto
        </span>
      </div>
    </motion.article>
  );
}
