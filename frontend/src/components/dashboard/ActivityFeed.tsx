"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { Activity, AlertTriangle, BookOpen, Brain, Clock } from "lucide-react";
import { attachPredictions } from "@/lib/aggregates";
import type { Student } from "@/types/academic";

type ActivityFeedProps = {
  students: Student[];
};

export function ActivityFeed({ students }: ActivityFeedProps) {
  const withPred = attachPredictions(students);
  const high = withPred
    .filter((s) => s.prediction.level === "alto")
    .slice(0, 4)
    .map((s) => ({
      id: s.id,
      title: `${s.nombres} ${s.apellidos}`,
      detail: `Score ${Math.round(s.prediction.score)} — intervención sugerida`,
      icon: AlertTriangle,
      tone: "text-rose-400 bg-rose-500/10 ring-rose-500/20",
    }));

  const lmsLow = withPred
    .filter((s) => (s.metrics.lms.actividadSemanalPct.at(-1) ?? 0) < 50)
    .slice(0, 3)
    .map((s) => ({
      id: `lms-${s.id}`,
      title: `LMS bajo: ${s.nombres}`,
      detail: `Actividad ${s.metrics.lms.actividadSemanalPct.at(-1) ?? 0}% esta semana`,
      icon: Activity,
      tone: "text-cyan-400 bg-cyan-500/10 ring-cyan-500/20",
    }));

  const items = [
    ...high,
    ...lmsLow,
    {
      id: "ai",
      title: "Modelo ensemble actualizado",
      detail: "Random Forest + XGBoost + stacking calibrado",
      icon: Brain,
      tone: "text-violet-400 bg-violet-500/10 ring-violet-500/20",
    },
    {
      id: "courses",
      title: "Revisión curricular",
      detail: "Comparar riesgo promedio entre cursos matriculados",
      icon: BookOpen,
      tone: "text-amber-400 bg-amber-500/10 ring-amber-500/20",
    },
  ].slice(0, 6);

  return (
    <motion.article
      className="premium-card flex h-full flex-col p-5 md:p-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08 }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Actividad reciente</h3>
          <p className="text-xs text-[var(--text-secondary)]">Alertas, LMS e insights de IA</p>
        </div>
        <span className="badge badge-info">
          <Clock className="h-3 w-3" /> En vivo
        </span>
      </div>

      <ul className="mt-5 flex-1 space-y-2.5">
        {items.map((item, i) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]"
          >
            <span
              className={clsx(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                item.tone,
              )}
            >
              <item.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
              <p className="text-xs text-[var(--text-muted)]">{item.detail}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.article>
  );
}
