"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { attachPredictions } from "@/lib/aggregates";
import { api, type Alert as ApiAlert } from "@/services/api";
import type { Student, Teacher } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import { useAcademicFilters } from "@/hooks/useAcademicFilters";
import { AcademicFiltersBar } from "@/components/academic/AcademicFiltersBar";
import { SummaryStatsRow } from "@/components/academic/SummaryStatsRow";
import { salonShortFromSeccion, teachersForSelect } from "@/lib/student-filters";
import { PageSection } from "@/components/ui/PageSection";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { useAuth } from "@/contexts/AuthProvider";

const STATUS_LABEL: Record<string, string> = {
  nueva: "Nueva",
  en_seguimiento: "En seguimiento",
  resuelta: "Resuelta",
};

type AlertsViewProps = {
  students: Student[];
  teachers?: Teacher[];
  secciones?: SeccionOption[];
  useApi?: boolean;
};

export function AlertsView({
  students,
  teachers = [],
  secciones = [],
  useApi = false,
}: AlertsViewProps) {
  const { isDocente } = useAuth();
  const [apiAlerts, setApiAlerts] = useState<ApiAlert[]>([]);
  const [salonSummary, setSalonSummary] = useState<{ salon: string; count: number }[]>([]);
  const [viewSalon, setViewSalon] = useState<string | "all">("all");
  const [includeResolved, setIncludeResolved] = useState(false);

  const { filters, updateFilter, resetFilters, grados, seccionOptions } = useAcademicFilters(
    students,
    [],
    secciones,
    teachers,
  );

  const loadApi = useCallback(async () => {
    if (!useApi) return;
    try {
      const alertParams = {
        seccionId: filters.seccionId || undefined,
        gradoId: filters.gradoId || undefined,
        status: filters.alertStatus || undefined,
        riskLevel: filters.riskLevel || undefined,
        all: includeResolved,
      };
      const res = isDocente
        ? await api.getProfesorAlertas(alertParams)
        : await api.getAlerts({
            ...alertParams,
            profesorId: filters.profesorId || undefined,
          });
      setApiAlerts(res.items);
      setSalonSummary(res.salonSummary ?? []);
    } catch {
      setApiAlerts([]);
      setSalonSummary([]);
    }
  }, [
    useApi,
    filters.seccionId,
    filters.gradoId,
    filters.profesorId,
    isDocente,
    filters.alertStatus,
    filters.riskLevel,
    includeResolved,
  ]);

  useEffect(() => {
    void loadApi();
  }, [loadApi]);

  const localItems = useMemo(() => {
    return attachPredictions(students)
      .filter((s) => s.prediction.level !== "bajo")
      .sort((a, b) => b.prediction.score - a.prediction.score);
  }, [students]);

  const displayedAlerts = useMemo(() => {
    if (!useApi) return [];
    if (viewSalon === "all") return apiAlerts;
    return apiAlerts.filter((a) => {
      const st = students.find((s) => s.id === a.student.id);
      if (!st?.seccionId) return false;
      const sec = secciones.find((x) => x.id === st.seccionId);
      return sec ? salonShortFromSeccion(sec) === viewSalon : false;
    });
  }, [useApi, apiAlerts, viewSalon, students, secciones]);

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
    <div className="space-y-6">
      <AcademicFiltersBar
        filters={filters}
        onChange={updateFilter}
        onReset={resetFilters}
        grados={grados}
        secciones={seccionOptions}
        teachers={teachersForSelect(teachers)}
        show={{
          grado: true,
          seccion: true,
          profesor: !isDocente,
          alertStatus: true,
          risk: true,
        }}
      />

      {useApi ? (
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={includeResolved}
            onChange={(e) => setIncludeResolved(e.target.checked)}
          />
          Incluir alertas resueltas
        </label>
      ) : null}

      {useApi && salonSummary.length > 0 ? (
        <SummaryStatsRow
          stats={[
            { label: "Alertas (filtro)", value: apiAlerts.length, tone: "brand" },
            ...salonSummary.slice(0, 5).map((s) => ({
              label: s.salon,
              value: s.count,
              tone: "warning" as const,
            })),
          ]}
        />
      ) : null}

      {useApi && salonSummary.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={viewSalon === "all" ? "btn-primary text-xs" : "btn-secondary text-xs"}
            onClick={() => setViewSalon("all")}
          >
            Ver todas ({apiAlerts.length})
          </button>
          {salonSummary.map((s) => (
            <button
              key={s.salon}
              type="button"
              className={viewSalon === s.salon ? "btn-primary text-xs" : "btn-secondary text-xs"}
              onClick={() => setViewSalon(s.salon)}
            >
              {s.salon} = {s.count} alertas
            </button>
          ))}
        </div>
      ) : null}

      <PageSection
        icon={AlertTriangle}
        title="Alertas tempranas"
        description="Generadas cuando el modelo detecta riesgo medio o alto de deserción."
      >
        <ul className="space-y-4">
          {useApi ? (
            displayedAlerts.length === 0 ? (
              <li className="py-12 text-center text-sm text-[var(--text-muted)]">
                Sin alertas para este filtro. Ejecute predicciones desde el módulo correspondiente.
              </li>
            ) : (
              displayedAlerts.map((a) => {
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
                        <span className="badge-info">
                          {a.estado_label ?? STATUS_LABEL[a.status] ?? a.status}
                        </span>
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
                        <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                          Factores de riesgo
                        </p>
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
                      <p className="rounded-lg border border-[var(--brand-orange)]/25 bg-[var(--accent-muted)] p-3 text-sm">
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
                <li
                  key={s.id}
                  className="alert-feed-card flex flex-col gap-4 p-5 md:flex-row md:justify-between"
                >
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
    </div>
  );
}
