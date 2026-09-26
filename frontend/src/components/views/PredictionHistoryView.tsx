"use client";

import { useCallback, useEffect, useState } from "react";
import { History, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, type ApiPredictionHistoryItem } from "@/services/api";
import { profesorService } from "@/services/profesorService";
import { useAuth } from "@/contexts/AuthProvider";
import { useProfessorFilters } from "@/hooks/useProfessorFilters";
import { ProfessorFiltersBar } from "@/components/professor/ProfessorFiltersBar";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import type { Course } from "@/types/academic";
import { PROFESOR_HINTS } from "@/constants/blenkir";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import type { AcademicFilterState } from "@/lib/student-filters";
import {
  buildHistoryQuery,
  resolveHistorySearchFilters,
} from "@/lib/prediction-history-search";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import type { Student } from "@/types/academic";
import { SELECT_CLASS } from "@/lib/ui";
import { ExperimentalBadge } from "@/components/ui/ExperimentalBadge";

type PredictionHistoryViewProps = {
  students: Student[];
  secciones?: SeccionOption[];
  courses?: Course[];
  professorMode?: boolean;
};

export function PredictionHistoryView({
  students,
  secciones = [],
  courses = [],
  professorMode = false,
}: PredictionHistoryViewProps) {
  const { isAuthenticated, isDocente } = useAuth();
  const pf = useProfessorFilters(secciones, courses);
  const [items, setItems] = useState<ApiPredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");

  const load = useCallback(
    async (filtersSnapshot?: AcademicFilterState) => {
      if (!api.hasToken) return;
      setLoading(true);
      setError(null);
      // El snapshot llega desde `search()`; sin él (carga inicial o reintento)
      // se usan los filtros ya aplicados.
      const filters = filtersSnapshot ?? pf.applied;
      try {
        const res = professorMode || isDocente
          ? await profesorService.getHistorialPredicciones({
              ...buildHistoryQuery(filters),
              limit: 50,
            })
          : await api.getPredictions({
              studentId: studentId || undefined,
              limit: 50,
            });
        setItems(res.items as ApiPredictionHistoryItem[]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "No se pudo cargar el historial de predicciones.";
        toast.error(msg);
        setError(msg);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [studentId, professorMode, isDocente, pf.applied],
  );

  const search = useCallback(() => {
    if (professorMode || isDocente) {
      // Snapshot de los filtros VISIBLES: `pf.applied` se actualiza de forma
      // asíncrona y la primera búsqueda se haría con los filtros anteriores.
      const snapshot = resolveHistorySearchFilters(pf.draft);
      if (!pf.applySearch()) return;
      void load(snapshot);
      return;
    }
    void load();
  }, [professorMode, isDocente, pf, load]);

  useEffect(() => {
    if (isAuthenticated && !professorMode && !isDocente) void load();
  }, [isAuthenticated, load, professorMode, isDocente]);

  if (!isAuthenticated) {
    return <EmptyState title="Historial de predicciones" description="Inicie sesión." showLogin />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Trazabilidad del modelo"
        title="Registros del modelo"
        description="Cada registro conserva el puntaje, el nivel de riesgo, los indicadores utilizados, el modelo y la recomendación emitida."
        icon={History}
        actions={
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => search()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            Actualizar
          </button>
        }
      />

      {professorMode || isDocente ? (
        <ProfessorFiltersBar
          filters={pf.draft}
          onChange={pf.updateDraft}
          onSearch={search}
          onClear={() => {
            pf.clear();
            setItems([]);
          }}
          grados={pf.grados}
          secciones={pf.seccionOptions}
          courses={pf.courseOptions.map((c) => ({ id: c.id, nombre: c.nombre }))}
          loading={loading}
          show={{ grado: true, seccion: true, course: true, risk: true, search: true }}
        />
      ) : (
        <div className="premium-card rounded-2xl p-4">
          <label className="block text-sm">
            <span className="mb-1 text-[var(--text-muted)]">Filtrar por estudiante</span>
            <select className={SELECT_CLASS} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Todos (según su rol)</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.codigo} — {s.nombres} {s.apellidos}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {(professorMode || isDocente) && !pf.searched ? (
        <p className="text-sm text-[var(--text-muted)]">{PROFESOR_HINTS.pressSearch}</p>
      ) : null}

      {error && !loading ? (
        <ErrorState message={error} technicalDetail="GET /predictions" onRetry={() => void load()} />
      ) : null}

      {loading ? (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--card-shadow)]">
          <TableSkeleton rows={6} cols={7} />
        </div>
      ) : (
        <DataTablePanel
          title={`Registros (${items.length})`}
          description="Ordenados por fecha: las estimaciones más recientes primero."
          isEmpty={items.length === 0}
          emptyMessage="Sin predicciones. Ejecute una predicción en el módulo Predicción."
        >
          <TableWrap>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estudiante</th>
                <th className="col-num">Puntaje</th>
                <th className="col-num">Prob. deserción</th>
                <th>Nivel</th>
                <th>Modelo</th>
                <th>Datos</th>
                <th>Recomendación</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap text-xs">
                    {new Date(p.createdAt).toLocaleString("es-PE")}
                  </td>
                  <td>
                    {p.student
                      ? `${p.student.nombres} ${p.student.apellidos}`
                      : p.studentId.slice(0, 8)}
                  </td>
                  <td className="col-num font-semibold">{p.score.toFixed(1)}</td>
                  <td className="col-num">
                    {p.probability != null && Number.isFinite(p.probability)
                      ? `${(p.probability * 100).toFixed(1)}%`
                      : "—"}
                  </td>
                  <td>
                    <RiskBadge level={p.level} score={p.score} />
                  </td>
                  <td className="text-xs">{p.modelName}</td>
                  <td>
                    <ExperimentalBadge
                      dataMode={p.dataMode}
                      datasetVersion={p.datasetVersion}
                      compact
                    />
                  </td>
                  <td className="max-w-xs text-xs text-[var(--text-secondary)]">
                    {p.meta?.recommendation ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </DataTablePanel>
      )}
    </div>
  );
}
