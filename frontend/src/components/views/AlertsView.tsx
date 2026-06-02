"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { attachPredictions } from "@/lib/aggregates";
import { api, type Alert as ApiAlert } from "@/services/api";
import type { Student } from "@/types/academic";
import { PageSection } from "@/components/ui/PageSection";
import { RiskBadge } from "@/components/ui/RiskBadge";

const STATUS_LABEL: Record<string, string> = {
  nueva: "Nueva",
  en_seguimiento: "En seguimiento",
  resuelta: "Resuelta",
};

type AlertsViewProps = {
  students: Student[];
  useApi?: boolean;
};

export function AlertsView({ students, useApi = false }: AlertsViewProps) {
  const [apiAlerts, setApiAlerts] = useState<ApiAlert[]>([]);
  const [showAll, setShowAll] = useState(false);

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

  async function updateStatus(id: string, status: "en_seguimiento" | "resuelta") {
    try {
      await api.updateAlertStatus(id, status);
      toast.success(status === "resuelta" ? "Alerta resuelta" : "Marcada en seguimiento");
      void loadApi();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <PageSection
      icon={AlertTriangle}
      title="Alertas tempranas"
      description="Generadas automáticamente cuando el modelo detecta riesgo medio o alto de deserción."
    >
      {useApi && (
        <label className="mb-4 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          Incluir alertas resueltas
        </label>
      )}

      <ul className="space-y-4">
        {useApi ? (
          apiAlerts.length === 0 ? (
            <li className="py-12 text-center text-sm text-[var(--text-muted)]">
              Sin alertas activas. Ejecute predicciones desde el módulo correspondiente.
            </li>
          ) : (
            apiAlerts.map((a) => {
              const factores = a.factores_riesgo ?? [];
              const prob = a.probability != null ? `${(a.probability * 100).toFixed(1)}%` : "—";
              return (
                <li key={a.id} className="alert-feed-card space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {a.student.nombres} {a.student.apellidos}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">{a.titulo}</p>
                      {(a.curso || a.profesor) && (
                        <p className="text-xs text-[var(--text-muted)]">
                          {a.curso?.nombre}
                          {a.profesor ? ` · Prof. ${a.profesor}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <RiskBadge level={a.level} score={a.score ?? undefined} />
                      <span className="badge-info">{a.estado_label ?? STATUS_LABEL[a.status] ?? a.status}</span>
                    </div>
                  </div>

                  <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-[var(--text-muted)]">Nivel de riesgo</dt>
                      <dd className="font-medium capitalize">{a.nivel_riesgo ?? a.level}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-muted)]">Probabilidad abandono</dt>
                      <dd className="font-medium">{prob}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-muted)]">Score</dt>
                      <dd className="font-medium">{a.score != null ? `${a.score}/100` : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-muted)]">Fecha</dt>
                      <dd className="font-medium">
                        {new Date(a.fecha ?? a.createdAt).toLocaleString("es-PE")}
                      </dd>
                    </div>
                  </dl>

                  {factores.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Factores de riesgo</p>
                      <ul className="mt-1 flex flex-wrap gap-2">
                        {factores.map((f) => (
                          <li
                            key={f.key}
                            className="rounded-lg bg-white/5 px-2 py-1 text-xs text-[var(--text-secondary)]"
                          >
                            {f.label} ({Math.round(f.contribution)} pts)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {a.recommendation && (
                    <p className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 text-sm text-violet-100/90">
                      <strong>Recomendación:</strong> {a.recommendation}
                    </p>
                  )}

                  {a.status !== "resuelta" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void updateStatus(a.id, "en_seguimiento")}
                        className="btn-secondary text-xs"
                      >
                        En seguimiento
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateStatus(a.id, "resuelta")}
                        className="btn-primary text-xs py-2"
                      >
                        Resuelta
                      </button>
                    </div>
                  )}
                </li>
              );
            })
          )
        ) : localItems.length === 0 ? (
          <li className="py-12 text-center text-sm text-[var(--text-muted)]">No hay estudiantes en alerta.</li>
        ) : (
          localItems.map((s) => {
            const top = s.prediction.factors[0];
            return (
              <li key={s.id} className="alert-feed-card flex flex-col gap-4 p-5 md:flex-row md:justify-between">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {s.nombres} {s.apellidos}
                  </p>
                  <RiskBadge level={s.prediction.level} score={s.prediction.score} />
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {top?.label} · {Math.round(top?.contribution ?? 0)} pts
                  </p>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </PageSection>
  );
}
