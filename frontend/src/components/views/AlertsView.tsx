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
import { PageHeader } from "@/components/ui/PageHeader";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/contexts/AuthProvider";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const STATUS_LABEL: Record<string, string> = {
  nueva: "Nueva",
  en_seguimiento: "En seguimiento",
  resuelta: "Resuelta",
};

/** Orden de severidad para priorizar la lectura del listado. */
const SEVERITY_ORDER: Record<string, number> = { alto: 0, medio: 1, bajo: 2 };

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
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const ALERTS_PAGE_SIZE = 20;

  const { filters, updateFilter, resetFilters, grados, seccionOptions } = useAcademicFilters(
    students,
    [],
    secciones,
    teachers,
  );

  // Debounce SOLO de la búsqueda textual: los selects siguen reaccionando ya.
  const searchQuery = useDebouncedValue(filters.search, 320);

  const loadApi = useCallback(async () => {
    if (!useApi) return;
    try {
      const alertParams = {
        seccionId: filters.seccionId || undefined,
        gradoId: filters.gradoId || undefined,
        status: filters.alertStatus || undefined,
        riskLevel: filters.riskLevel || undefined,
        all: includeResolved,
        search: searchQuery.trim() || undefined,
        page,
        limit: ALERTS_PAGE_SIZE,
      };
      const res = isDocente
        ? await api.getProfesorAlertas(alertParams)
        : await api.getAlerts({
            ...alertParams,
            profesorId: filters.profesorId || undefined,
          });
      setApiAlerts(res.items);
      setSalonSummary(res.salonSummary ?? []);
      setTotal(res.total ?? res.items.length);
      setError(null);
    } catch (e) {
      // Un fallo de API no es "sin alertas": se avisa en lugar de mostrar un
      // listado vacío como si fuera un resultado real.
      const msg = e instanceof Error ? e.message : "No se pudieron cargar las alertas.";
      toast.error(msg);
      setError(msg);
      setApiAlerts([]);
      setSalonSummary([]);
      setTotal(0);
    }
  }, [
    useApi,
    filters.seccionId,
    filters.gradoId,
    filters.profesorId,
    isDocente,
    filters.alertStatus,
    filters.riskLevel,
    searchQuery,
    includeResolved,
    page,
  ]);

  useEffect(() => {
    void loadApi();
  }, [loadApi]);

  const localItems = useMemo(() => {
    return attachPredictions(students)
      .filter((s) => s.prediction.level !== "bajo")
      .sort((a, b) => b.prediction.score - a.prediction.score);
  }, [students]);

  /** Severidad primero (alto → medio → bajo) y, dentro de cada nivel, más recientes. */
  const displayedAlerts = useMemo(() => {
    if (!useApi) return [];
    const filtered =
      viewSalon === "all"
        ? apiAlerts
        : apiAlerts.filter((a) => {
            const st = students.find((s) => s.id === a.student.id);
            if (!st?.seccionId) return false;
            const sec = secciones.find((x) => x.id === st.seccionId);
            return sec ? salonShortFromSeccion(sec) === viewSalon : false;
          });
    return [...filtered].sort((a, b) => {
      const lv = (SEVERITY_ORDER[a.level] ?? 3) - (SEVERITY_ORDER[b.level] ?? 3);
      if (lv !== 0) return lv;
      const sa = a.score ?? 0;
      const sb = b.score ?? 0;
      if (sb !== sa) return sb - sa;
      return (
        Date.parse(b.fecha ?? b.createdAt ?? "") - Date.parse(a.fecha ?? a.createdAt ?? "")
      );
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
      <PageHeader
        icon={AlertTriangle}
        eyebrow="Seguimiento temprano"
        title="Alertas que requieren acción"
        description="Señales de riesgo ordenadas por severidad. Atienda primero los casos de riesgo alto y registre el seguimiento de cada uno."
      />

      <AcademicFiltersBar
        filters={filters}
        onChange={(k, v) => { updateFilter(k, v); setPage(1); }}
        onReset={() => { resetFilters(); setPage(1); setViewSalon("all"); }}
        grados={grados}
        secciones={seccionOptions}
        teachers={teachersForSelect(teachers)}
        show={{
          grado: true,
          seccion: true,
          profesor: !isDocente,
          alertStatus: true,
          risk: true,
          search: true,
        }}
      />

      {useApi && salonSummary.length > 0 ? (
        <SummaryStatsRow
          stats={[
            { label: "Alertas (filtro)", value: total, tone: "brand" },
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
            Ver todas ({total})
          </button>
          {salonSummary.map((s) => (
            <button
              key={s.salon}
              type="button"
              className={viewSalon === s.salon ? "btn-primary text-xs" : "btn-secondary text-xs"}
              onClick={() => setViewSalon(s.salon)}
            >
              {s.salon} = {s.count} {s.count === 1 ? "alerta" : "alertas"}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <ErrorState
          message={error}
          technicalDetail="GET /alerts"
          onRetry={() => void loadApi()}
          retryLabel="Reintentar"
        />
      ) : null}

      <PageSection
        icon={AlertTriangle}
        title="Listado de alertas"
        description="Ordenadas de mayor a menor severidad. Actualice el estado de cada caso según su seguimiento."
        action={
          useApi ? (
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={includeResolved}
                onChange={(e) => {
                  setIncludeResolved(e.target.checked);
                  // Sin reset, la página conservada puede quedar fuera del nuevo
                  // total y mostrar una tabla vacía que parece "sin alertas".
                  setPage(1);
                }}
              />
              <span>Incluir resueltas</span>
            </label>
          ) : undefined
        }
      >
        <ul className="space-y-4">
          {useApi ? (
            error ? (
              <li className="py-8 text-center text-sm text-[var(--text-muted)]">
                No fue posible cargar el listado.
              </li>
            ) : displayedAlerts.length === 0 ? (
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
                        <StatusBadge
                          status={a.status}
                          label={a.estado_label ?? STATUS_LABEL[a.status] ?? a.status}
                        />
                      </div>
                    </div>

                    <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <dt className="text-[var(--text-muted)]">Nivel de riesgo</dt>
                        <dd className="font-medium capitalize">{a.nivel_riesgo ?? a.level}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--text-muted)]">Probabilidad de deserción</dt>
                        <dd className="font-medium">{prob}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--text-muted)]">Puntaje</dt>
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
                          Indicadores asociados
                        </p>
                        <ul className="mt-1 flex flex-wrap gap-2">
                          {factores.map((f) => (
                            <li
                              key={f.key}
                              className="rounded-lg bg-[var(--surface-muted)] px-2 py-1 text-xs text-[var(--text-secondary)]"
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
        {useApi && total > ALERTS_PAGE_SIZE ? (
          <div className="flex items-center justify-between gap-2 px-1 pt-4 text-xs text-[var(--text-muted)]">
            <span>
              {total} {total === 1 ? "alerta" : "alertas"}
            </span>
            <span className="flex gap-2">
              <button type="button" className="btn-ghost py-1.5 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((v) => Math.max(1, v - 1))}>
                Anterior
              </button>
              <button type="button" className="btn-ghost py-1.5 disabled:opacity-40" disabled={page >= Math.ceil(total / ALERTS_PAGE_SIZE)} onClick={() => setPage((v) => v + 1)}>
                Siguiente
              </button>
            </span>
          </div>
        ) : null}
      </PageSection>
    </div>
  );
}
