"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { attachPredictions } from "@/lib/aggregates";
import { recommendationsForFactor } from "@/lib/recommendations";
import { api, type ApiAlert } from "@/services/api";
import type { FactorKey, Student } from "@/types/academic";

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
  useApi?: boolean;
};

export function AlertsView({ students, useApi = false }: AlertsViewProps) {
  const [apiAlerts, setApiAlerts] = useState<ApiAlert[]>([]);

  const loadApi = useCallback(async () => {
    if (!useApi) return;
    try {
      const res = await api.getAlerts();
      setApiAlerts(res.items);
    } catch {
      setApiAlerts([]);
    }
  }, [useApi]);

  useEffect(() => {
    void loadApi();
  }, [loadApi]);

  const localItems = useMemo(() => {
    return attachPredictions(students)
      .filter((s) => s.prediction.level !== "bajo")
      .sort((a, b) => b.prediction.score - a.prediction.score);
  }, [students]);

  const criticalCount = useApi
    ? apiAlerts.filter((a) => a.level === "alto").length
    : localItems.filter((s) => s.prediction.level === "alto").length;

  const listCount = useApi ? apiAlerts.length : localItems.length;

  async function updateStatus(id: string, status: "en_seguimiento" | "resuelta") {
    try {
      await api.updateAlertStatus(id, status);
      toast.success(status === "resuelta" ? "Alerta resuelta" : "En seguimiento");
      void loadApi();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="glass-card border-rose-200/80 bg-rose-50/60 p-5 dark:bg-rose-950/30">
          <div className="flex items-center gap-2 text-rose-900 dark:text-rose-100">
            <ShieldAlert className="h-5 w-5" aria-hidden />
            <h3 className="text-sm font-semibold">Riesgo alto</h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-rose-950 dark:text-rose-50">{criticalCount}</p>
        </article>
        <article className="glass-card border-amber-200/80 bg-amber-50/60 p-5 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-amber-950 dark:text-amber-100">
            <AlertTriangle className="h-5 w-5" aria-hidden />
            <h3 className="text-sm font-semibold">Alertas activas</h3>
          </div>
          <p className="mt-2 text-3xl font-bold">{listCount}</p>
        </article>
        <article className="glass-card border-emerald-200/80 bg-emerald-50/60 p-5 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-100">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            <h3 className="text-sm font-semibold">Fuente</h3>
          </div>
          <p className="mt-2 text-sm font-medium">{useApi ? "Base de datos + IA" : "Modelo local"}</p>
        </article>
      </section>

      <section className="glass-card rounded-2xl p-5">
        <h3 className="text-base font-semibold">Alertas inteligentes</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {useApi
            ? "Alertas persistidas generadas por predicciones en el servidor."
            : "Priorización en tiempo real según el ensemble simulado."}
        </p>

        <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {useApi ? (
            apiAlerts.length === 0 ? (
              <li className="py-8 text-center text-sm text-slate-500">
                Sin alertas abiertas. Ejecute predicciones desde el módulo correspondiente.
              </li>
            ) : (
              apiAlerts.map((a) => {
                const recs = recommendationsForFactor((a.factorKey ?? "bajo_promedio") as FactorKey);
                return (
                  <li key={a.id} className="flex flex-col gap-3 py-4 md:flex-row md:justify-between">
                    <div>
                      <p className="font-semibold">
                        {a.student.nombres} {a.student.apellidos}
                      </p>
                      <p className="text-sm text-slate-600">{a.titulo}</p>
                      <p className="mt-1 text-xs text-slate-500">{a.descripcion}</p>
                      <span className={clsx("mt-2 inline-block", badgeClasses(a.level))}>
                        {a.level} · {a.status}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 md:items-end">
                      <ul className="list-disc pl-4 text-sm text-slate-700 dark:text-slate-300">
                        {recs.slice(0, 2).map((r) => (
                          <li key={r.titulo}>{r.titulo}</li>
                        ))}
                      </ul>
                      {a.status !== "resuelta" ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void updateStatus(a.id, "en_seguimiento")}
                            className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900"
                          >
                            En seguimiento
                          </button>
                          <button
                            type="button"
                            onClick={() => void updateStatus(a.id, "resuelta")}
                            className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900"
                          >
                            Resolver
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })
            )
          ) : localItems.length === 0 ? (
            <li className="py-8 text-center text-sm text-slate-500">No hay estudiantes en alerta.</li>
          ) : (
            localItems.map((s) => {
              const top = s.prediction.factors[0];
              const recs = recommendationsForFactor(top.key);
              return (
                <li key={s.id} className="flex flex-col gap-3 py-4 md:flex-row md:justify-between">
                  <div>
                    <p className="font-semibold">
                      {s.nombres} {s.apellidos}
                    </p>
                    <span className={badgeClasses(s.prediction.level)}>{s.prediction.level}</span>
                    <p className="mt-1 text-sm text-slate-600">
                      {top.label} · {Math.round(top.contribution)} pts
                    </p>
                  </div>
                  <ul className="list-disc pl-4 text-sm md:max-w-md">
                    {recs.map((r) => (
                      <li key={r.titulo}>
                        <strong>{r.titulo}:</strong> {r.detalle}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
