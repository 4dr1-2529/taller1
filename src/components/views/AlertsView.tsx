"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { attachPredictions } from "@/lib/aggregates";
import { recommendationsForFactor } from "@/lib/recommendations";
import type { Student } from "@/types/academic";

function badgeClasses(level: string) {
  return clsx(
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
    level === "alto" && "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
    level === "medio" && "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
    level === "bajo" && "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200",
  );
}

type AlertsViewProps = {
  students: Student[];
};

export function AlertsView({ students }: AlertsViewProps) {
  const items = useMemo(() => {
    return attachPredictions(students)
      .filter((s) => s.prediction.level !== "bajo")
      .sort((a, b) => b.prediction.score - a.prediction.score);
  }, [students]);

  const critical = items.filter((s) => s.prediction.level === "alto");

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-rose-900">
            <ShieldAlert className="h-5 w-5" aria-hidden />
            <h3 className="text-sm font-semibold">Riesgo alto</h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-rose-950">{critical.length}</p>
          <p className="mt-1 text-sm text-rose-800/90">Requieren intervención prioritaria.</p>
        </article>
        <article className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-950">
            <AlertTriangle className="h-5 w-5" aria-hidden />
            <h3 className="text-sm font-semibold">Lista priorizada</h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-950">{items.length}</p>
          <p className="mt-1 text-sm text-amber-900/90">Medio + alto, ordenados por score.</p>
        </article>
        <article className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-950">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            <h3 className="text-sm font-semibold">Estables</h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-950">
            {students.length - items.length}
          </p>
          <p className="mt-1 text-sm text-emerald-900/90">Riesgo bajo según el modelo actual.</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Alertas inteligentes</h3>
        <p className="text-sm text-slate-600">
          Cada ítem incluye el factor dominante y recomendaciones automáticas alineadas al plan de tutoría.
        </p>

        <ul className="mt-4 divide-y divide-slate-100">
          {items.length === 0 ? (
            <li className="py-8 text-center text-sm text-slate-500">
              No hay estudiantes en alerta con el umbral actual.
            </li>
          ) : (
            items.map((s) => {
              const top = s.prediction.factors[0];
              const recs = recommendationsForFactor(top.key);
              return (
                <li key={s.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {s.nombres} {s.apellidos}
                      </p>
                      <span className={badgeClasses(s.prediction.level)}>
                        {s.prediction.level === "alto" ? "🔴" : "🟡"} {s.prediction.level}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        Score {Math.round(s.prediction.score)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      Factor principal: <strong>{top.label}</strong> · Contribución{" "}
                      {Math.round(top.contribution)} pts
                    </p>
                  </div>
                  <div className="md:max-w-md">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Recomendaciones
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
                      {recs.map((r) => (
                        <li key={r.titulo}>
                          <span className="font-medium text-slate-900">{r.titulo}:</span> {r.detalle}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
