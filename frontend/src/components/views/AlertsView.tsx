"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { attachPredictions } from "@/lib/aggregates";
import { recommendationsForFactor } from "@/lib/recommendations";
import { api, type Alert as ApiAlert } from "@/services/api";
import type { FactorKey, Student } from "@/types/academic";
import { PageSection } from "@/components/ui/PageSection";
import { RiskBadge } from "@/components/ui/RiskBadge";

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
    <PageSection
        icon={AlertTriangle}
        title="Alertas inteligentes"
        description={
          useApi
            ? "Alertas persistidas generadas por predicciones en el servidor."
            : "Priorización en tiempo real según el modelo simulado."
        }
      >
        <ul className="space-y-3">
          {useApi ? (
            apiAlerts.length === 0 ? (
              <li className="py-12 text-center text-sm text-[var(--text-muted)]">
                Sin alertas abiertas. Ejecute predicciones desde el módulo correspondiente.
              </li>
            ) : (
              apiAlerts.map((a) => {
                const recs = recommendationsForFactor((a.factorKey ?? "bajo_promedio") as FactorKey);
                return (
                  <li
                    key={a.id}
                    className="alert-feed-card flex flex-col gap-4 md:flex-row md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {a.student.nombres} {a.student.apellidos}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">{a.titulo}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{a.descripcion}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <RiskBadge level={a.level} />
                        <span className="badge-info">{a.status}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 md:items-end">
                      <ul className="list-disc pl-4 text-sm text-[var(--text-secondary)]">
                        {recs.slice(0, 2).map((r) => (
                          <li key={r.titulo}>{r.titulo}</li>
                        ))}
                      </ul>
                      {a.status !== "resuelta" ? (
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
            <li className="py-12 text-center text-sm text-[var(--text-muted)]">
              No hay estudiantes en alerta.
            </li>
          ) : (
            localItems.map((s) => {
              const top = s.prediction.factors[0];
              const recs = recommendationsForFactor(top.key);
              return (
                <li
                  key={s.id}
                  className="alert-feed-card flex flex-col gap-4 md:flex-row md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {s.nombres} {s.apellidos}
                    </p>
                    <div className="mt-2">
                      <RiskBadge level={s.prediction.level} score={s.prediction.score} />
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {top.label} · {Math.round(top.contribution)} pts
                    </p>
                  </div>
                  <ul className="list-disc pl-4 text-sm text-[var(--text-secondary)] md:max-w-md">
                    {recs.map((r) => (
                      <li key={r.titulo}>
                        <strong className="text-[var(--text-primary)]">{r.titulo}:</strong> {r.detalle}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })
          )}
        </ul>
    </PageSection>
  );
}
