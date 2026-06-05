"use client";

import { useCallback, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { type Alert as ApiAlert } from "@/services/api";
import { profesorService } from "@/services/profesorService";
import { useProfessorFilters } from "@/hooks/useProfessorFilters";
import { ProfessorFiltersBar } from "@/components/professor/ProfessorFiltersBar";
import { SummaryStatsRow } from "@/components/academic/SummaryStatsRow";
import { PageSection } from "@/components/ui/PageSection";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { PROFESOR_HINTS } from "@/constants/blenkir";
import type { Course } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import type { AcademicFilterState } from "@/lib/student-filters";

const STATUS_LABEL: Record<string, string> = {
  nueva: "Nueva",
  en_seguimiento: "En seguimiento",
  resuelta: "Resuelta",
};

type ProfessorAlertsViewProps = {
  courses: Course[];
  secciones: SeccionOption[];
};

function salonLabel(a: ApiAlert): string | null {
  const sec = a.student as ApiAlert["student"] & {
    seccion?: { nombre?: string; grado?: { numero?: number } };
  };
  const g = sec.seccion?.grado?.numero;
  const n = sec.seccion?.nombre;
  return g && n ? `${g}°${n}` : null;
}

export function ProfessorAlertsView({ courses, secciones }: ProfessorAlertsViewProps) {
  const pf = useProfessorFilters(secciones, courses);
  const [apiAlerts, setApiAlerts] = useState<ApiAlert[]>([]);
  const [salonSummary, setSalonSummary] = useState<{ salon: string; count: number }[]>([]);
  const [viewSalon, setViewSalon] = useState<string | "all">("all");
  const [includeResolved, setIncludeResolved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAllMode, setShowAllMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(
    async (opts: { skipFilters?: boolean; applied: AcademicFilterState }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await profesorService.getAlertas({
          gradoId: opts.skipFilters ? undefined : opts.applied.gradoId || undefined,
          seccionId: opts.skipFilters ? undefined : opts.applied.seccionId || undefined,
          cursoId: opts.skipFilters ? undefined : opts.applied.courseId || undefined,
          status: opts.applied.alertStatus || undefined,
          riskLevel: opts.applied.riskLevel || undefined,
          search: opts.applied.search.trim() || undefined,
          all: includeResolved,
        });
        setApiAlerts(res.items);
        setSalonSummary(res.salonSummary ?? []);
        return res.items.length;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al cargar alertas";
        setError(msg);
        setApiAlerts([]);
        setSalonSummary([]);
        toast.error(msg);
        return 0;
      } finally {
        setLoading(false);
      }
    },
    [includeResolved],
  );

  const search = useCallback(async () => {
    const applied = { ...pf.draft };
    pf.applyFilters();
    setShowAllMode(false);
    const count = await fetchAlerts({ applied });
    if (count === 0) toast.info(PROFESOR_HINTS.noAlerts);
    else toast.success(`${count} alerta(s) encontrada(s)`);
  }, [pf, fetchAlerts]);

  const loadAll = useCallback(async () => {
    pf.setSearched(true);
    setShowAllMode(true);
    const count = await fetchAlerts({ skipFilters: true, applied: pf.draft });
    toast.info(
      count > 0 ? `${PROFESOR_HINTS.allAlerts} (${count})` : PROFESOR_HINTS.noAlerts,
    );
  }, [pf, fetchAlerts]);

  const clear = useCallback(() => {
    pf.clear();
    setApiAlerts([]);
    setSalonSummary([]);
    setViewSalon("all");
    setShowAllMode(false);
    setError(null);
  }, [pf]);

  const displayedAlerts =
    viewSalon === "all"
      ? apiAlerts
      : apiAlerts.filter((a) => salonLabel(a) === viewSalon);

  async function updateStatus(id: string, status: "en_seguimiento" | "resuelta") {
    try {
      await profesorService.patchAlertaEstado(id, status);
      toast.success(status === "resuelta" ? "Alerta resuelta" : "Marcada en seguimiento");
      if (showAllMode) await loadAll();
      else await search();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div className="space-y-6">
      <ProfessorFiltersBar
        filters={pf.draft}
        onChange={pf.updateDraft}
        onSearch={() => void search()}
        onClear={clear}
        grados={pf.grados}
        secciones={pf.seccionOptions}
        courses={pf.courseOptions.map((c) => ({ id: c.id, nombre: c.nombre }))}
        loading={loading}
        resultCount={pf.searched ? apiAlerts.length : undefined}
        requireSalonMessage={false}
        show={{ grado: true, seccion: true, course: true, risk: true, alertStatus: true, search: true }}
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary text-sm" onClick={() => void loadAll()} disabled={loading}>
          Ver todas mis alertas
        </button>
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={includeResolved}
            onChange={(e) => setIncludeResolved(e.target.checked)}
          />
          Incluir resueltas
        </label>
      </div>

      {showAllMode ? (
        <p className="text-xs text-[var(--text-muted)]">{PROFESOR_HINTS.allAlerts}</p>
      ) : !pf.searched ? (
        <p className="text-xs text-[var(--text-muted)]">{PROFESOR_HINTS.pressSearch}</p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {salonSummary.length > 0 ? (
        <>
          <SummaryStatsRow
            stats={[
              { label: "Alertas encontradas", value: apiAlerts.length, tone: "brand" },
              ...salonSummary.slice(0, 5).map((s) => ({
                label: s.salon,
                value: s.count,
                tone: "warning" as const,
              })),
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={viewSalon === "all" ? "btn-primary text-xs" : "btn-secondary text-xs"}
              onClick={() => setViewSalon("all")}
            >
              Todas ({apiAlerts.length})
            </button>
            {salonSummary.map((s) => (
              <button
                key={s.salon}
                type="button"
                className={viewSalon === s.salon ? "btn-primary text-xs" : "btn-secondary text-xs"}
                onClick={() => setViewSalon(s.salon)}
              >
                {s.salon} = {s.count}
              </button>
            ))}
          </div>
        </>
      ) : null}

      <PageSection
        icon={AlertTriangle}
        title="Alertas tempranas"
        description="Solo alertas de sus estudiantes asignados."
      >
        <ul className="space-y-4">
          {!pf.searched && !showAllMode ? (
            <li className="py-8 text-center text-sm text-[var(--text-muted)]">{PROFESOR_HINTS.pressSearch}</li>
          ) : displayedAlerts.length === 0 ? (
            <li className="py-8 text-center text-sm text-[var(--text-muted)]">{PROFESOR_HINTS.noAlerts}</li>
          ) : (
            displayedAlerts.map((a) => {
              const prob = a.probability != null ? `${(a.probability * 100).toFixed(1)}%` : "—";
              const salon = salonLabel(a);
              return (
                <li key={a.id} className="alert-feed-card space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {a.student.nombres} {a.student.apellidos}
                      </p>
                      <p className="font-mono text-xs text-[var(--text-muted)]">{a.student.codigo}</p>
                      {salon ? (
                        <p className="text-xs text-[var(--text-muted)]">Salón: {salon}</p>
                      ) : null}
                      <p className="text-sm text-[var(--text-secondary)]">{a.titulo}</p>
                      {a.curso?.nombre ? (
                        <p className="text-xs text-[var(--text-muted)]">Curso: {a.curso.nombre}</p>
                      ) : null}
                      {a.profesor ? (
                        <p className="text-xs text-[var(--text-muted)]">Profesor: {a.profesor}</p>
                      ) : null}
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
                      <dt className="text-[var(--text-muted)]">Riesgo</dt>
                      <dd className="font-medium capitalize">{a.nivel_riesgo ?? a.level}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--text-muted)]">Probabilidad</dt>
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
                  {a.recommendation ? (
                    <p className="rounded-lg border border-[var(--brand-orange)]/25 bg-[var(--accent-muted)] p-3 text-sm">
                      <strong>Recomendación:</strong> {a.recommendation}
                    </p>
                  ) : null}
                  {a.status !== "resuelta" ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        onClick={() => void updateStatus(a.id, "en_seguimiento")}
                      >
                        En seguimiento
                      </button>
                      <button
                        type="button"
                        className="btn-primary text-xs py-2"
                        onClick={() => void updateStatus(a.id, "resuelta")}
                      >
                        Resolver
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      </PageSection>
    </div>
  );
}
