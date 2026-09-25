"use client";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { profesorService } from "@/services/profesorService";
import { estudianteService } from "@/services/estudianteService";
import { mapStudentFromApi } from "@/lib/api-mappers";
import { useAuth } from "@/contexts/AuthProvider";
import { INPUT_CLASS } from "@/lib/ui";
import { PageSection } from "@/components/ui/PageSection";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { KpiSkeleton } from "@/components/ui/Skeleton";
import { Activity } from "lucide-react";

const labels: Record<string, string> = {
  promedio_general: "Promedio general", cursos_desaprobados: "Cursos desaprobados", asistencia_general: "Asistencia (%)",
  frecuencia_acceso_lms: "Accesos por semana (últimos 28 días)", tiempo_interaccion_lms: "Horas de interacción observada (28 días)",
  actividades_realizadas: "Actividades completadas (28 días)", recursos_consultados: "Materiales distintos consultados (28 días)",
  dias_activos: "Días activos (28 días)", ultimo_acceso: "Última actividad", ventana_desde: "Desde", ventana_hasta: "Hasta",
};
export function ObservedProgressView() {
  const { isDocente, isEstudiante } = useAuth();
  const [students, setStudents] = useState<{ id: string; nombres: string; apellidos: string }[]>([]);
  const [id, setId] = useState("");
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    void (async () => {
      try {
        if (isEstudiante) {
          const r = await estudianteService.getLms();
          if (!active) return;
          setStudents([]);
          setValues(r.indicators as Record<string, unknown>);
        } else if (isDocente) {
          const r = await profesorService.getEstudiantes({ limit: 800 });
          if (!active) return;
          const list = r.items.map((s) => mapStudentFromApi(s as Parameters<typeof mapStudentFromApi>[0]));
          setStudents(list);
          setId(list[0]?.id ?? "");
        } else {
          const r = await api.getStudents(1, 800);
          if (!active) return;
          setStudents(r.items);
          setId(r.items[0]?.id ?? "");
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "No se pudo cargar");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isDocente, isEstudiante]);
  useEffect(() => {
    if (!id || isEstudiante) return;
    let active = true;
    setLoading(true); setError("");
    api.call<{ indicators: Record<string, unknown> }>(`/lms/students/${id}`).then(r => { if (active) setValues(r.indicators); }).catch(e => { if (active) setError(e instanceof Error ? e.message : "No se pudo cargar"); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, isEstudiante]);
  return (
    <PageSection
      icon={Activity}
      title="Seguimiento académico y LMS"
      description="Indicadores de interacción observados en los últimos 28 días."
    >
      {!isEstudiante ? (
        <label className="mb-4 block max-w-md">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Estudiante
          </span>
          <select className={INPUT_CLASS} value={id} onChange={(e) => setId(e.target.value)}>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombres} {s.apellidos}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {error ? (
        <ErrorState message={error} technicalDetail="GET /lms" />
      ) : loading ? (
        <KpiSkeleton count={6} />
      ) : !isEstudiante && !students.length ? (
        <EmptyState
          title="Sin estudiantes disponibles"
          description="No se encontraron estudiantes para mostrar su seguimiento."
        />
      ) : (
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(values).map(([key, value]) => (
            <div key={key} className="premium-card p-4">
              <dt className="text-xs text-[var(--text-secondary)]">{labels[key] ?? key}</dt>
              <dd className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                {value === null
                  ? "Sin registros"
                  : typeof value === "number"
                    ? value.toLocaleString("es-PE", { maximumFractionDigits: 2 })
                    : String(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </PageSection>
  );
}
