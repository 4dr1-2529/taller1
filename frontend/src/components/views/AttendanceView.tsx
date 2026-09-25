"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthProvider";
import type { Course, Student, Teacher } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import { useAcademicFilters } from "@/hooks/useAcademicFilters";
import { AcademicFiltersBar } from "@/components/academic/AcademicFiltersBar";
import { SummaryStatsRow } from "@/components/academic/SummaryStatsRow";
import { FILTER_HINTS } from "@/constants/blenkir";
import { parseGradoNumero, parseSeccionLetra, salónLabel, teachersForSelect } from "@/lib/student-filters";
import { EmptyState } from "@/components/EmptyState";
import { PageSection } from "@/components/ui/PageSection";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { AttendanceStatusPicker } from "@/components/ui/AttendanceStatusPicker";
import {
  estadoBadgeClass,
  estadoLabel,
  estadoToFlags,
  flagsToEstado,
  type AttendanceEstado,
} from "@/lib/attendance-status";
import { CalendarCheck } from "lucide-react";
import { averageAttendance } from "@/lib/aggregates";

type AttendanceRow = {
  id: string;
  studentId: string;
  fecha: string;
  presente: boolean;
  justificado: boolean;
  tardanza: boolean;
  observacion?: string | null;
  student?: { codigo: string; nombres: string; apellidos: string };
};

type AttendanceViewProps = {
  students: Student[];
  courses?: Course[];
  teachers?: Teacher[];
  secciones?: SeccionOption[];
};

export function AttendanceView({
  students,
  courses = [],
  teachers = [],
  secciones = [],
}: AttendanceViewProps) {
  const { isAuthenticated, isDocente } = useAuth();
  const [items, setItems] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [bulkEstados, setBulkEstados] = useState<Record<string, AttendanceEstado>>({});
  const PAGE_SIZE = 50;

  const {
    filters,
    updateFilter,
    resetFilters,
    grados,
    seccionOptions,
    filteredStudents,
    filteredCourses,
  } = useAcademicFilters(students, courses, secciones, teachers);

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const load = useCallback(async () => {
    if (!api.hasToken) return;
    setLoading(true);
    try {
      const res = isDocente
        ? await api.getProfesorAttendance(undefined, filters.seccionId || undefined)
        : await api.getAttendance({
            seccionId: filters.seccionId || undefined,
            gradoId: filters.gradoId || undefined,
            q: filters.search.trim() || undefined,
            from: filters.fecha || undefined,
            to: filters.fecha || undefined,
            page,
            limit: PAGE_SIZE,
          });
      const rows = (res.items as AttendanceRow[]).map((a) => ({
        ...a,
        fecha: typeof a.fecha === "string" ? a.fecha : new Date(a.fecha).toISOString(),
      }));
      setItems(rows);
      setTotal((res as { total?: number }).total ?? rows.length);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar la asistencia");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters.seccionId, filters.gradoId, filters.search, filters.fecha, isDocente, page]);

  useEffect(() => {
    if (isAuthenticated) void load();
  }, [isAuthenticated, load]);

  useEffect(() => {
    const next: Record<string, AttendanceEstado> = {};
    const fecha = filters.fecha;
    for (const s of filteredStudents) {
      const existing = items.find(
        (a) => a.studentId === s.id && a.fecha.slice(0, 10) === fecha,
      );
      next[s.id] = existing ? flagsToEstado(existing) : "presente";
    }
    setBulkEstados(next);
  }, [filteredStudents, filters.fecha, items]);


  const summary = useMemo(() => {
    let presente = 0;
    let tardanza = 0;
    let falta = 0;
    let just = 0;
    for (const id of Object.keys(bulkEstados)) {
      const e = bulkEstados[id];
      if (e === "presente") presente++;
      else if (e === "tardanza") tardanza++;
      else if (e === "falta") falta++;
      else if (e === "falta_justificada") just++;
    }
    return {
      total: filteredStudents.length,
      presente,
      tardanza,
      falta,
      just,
    };
  }, [bulkEstados, filteredStudents.length]);

  const pct = averageAttendance(filteredStudents);

  async function saveBulk() {
    if (!filters.seccionId) {
      toast.error(FILTER_HINTS.selectSeccion);
      return;
    }
    if (!filters.fecha) {
      toast.error("Seleccione la fecha");
      return;
    }
    if (filteredStudents.length === 0) {
      toast.error(FILTER_HINTS.noStudents);
      return;
    }
    setSaving(true);
    try {
      const records = filteredStudents.map((s) => {
        const estado = bulkEstados[s.id] ?? "presente";
        const flags = estadoToFlags(estado);
        return { studentId: s.id, ...flags, observacion: undefined };
      });
      const res = await api.bulkAttendance({ fecha: filters.fecha, records });
      toast.success(`Asistencia guardada (${res.upserted} estudiantes)`);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Control de asistencia"
        description="Registre la asistencia diaria por salón: asistió, tardanza, falta o justificada."
        showLogin
      />
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="space-y-6">
      <AcademicFiltersBar
        filters={filters}
        onChange={(k, v) => { updateFilter(k, v); setPage(1); }}
        onReset={() => { resetFilters(); setPage(1); }}
        grados={grados}
        secciones={seccionOptions}
        courses={filteredCourses.map((c) => ({ id: c.id, nombre: c.nombre }))}
        teachers={teachersForSelect(teachers)}
        show={{ grado: true, seccion: true, fecha: true, search: true }}
      />
      <SummaryStatsRow
        stats={[
          { label: "Alumnos salón", value: summary.total, tone: "brand" },
          { label: "Asistieron (marca)", value: summary.presente, tone: "success" },
          { label: "Tardanzas", value: summary.tardanza, tone: "warning" },
          { label: "Faltas", value: summary.falta, tone: "danger" },
          { label: "Justificadas", value: summary.just },
          { label: "% asist. general", value: pct == null ? "—" : `${pct}%` },
        ]}
      />

      {!filters.seccionId ? (
        <p className="rounded-lg border border-[var(--brand-navy)]/20 bg-[var(--accent-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          {FILTER_HINTS.selectSeccion} Se mostrará la lista completa del salón para marcar asistencia masiva.
        </p>
      ) : null}

      {filters.seccionId && filteredStudents.length === 0 ? (
        <EmptyState
          title="Sin estudiantes en este salón"
          description={isDocente ? FILTER_HINTS.noStudentsProfesor : FILTER_HINTS.noStudents}
        />
      ) : filters.seccionId && isDocente ? (
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <PageSection
            variant="form"
            icon={CalendarCheck}
            title="Asistencia masiva del salón"
            description={`Fecha ${filters.fecha} · marque el estado de cada alumno y guarde en una sola operación.`}
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                className="btn-primary"
                disabled={saving}
                onClick={() => void saveBulk()}
              >
                {saving ? "Guardando…" : `Guardar asistencia (${filteredStudents.length})`}
              </button>
            </div>
            <TableWrap>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Estudiante</th>
                  <th>Estado del día</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs">{s.codigo}</td>
                    <td>
                      {s.nombres} {s.apellidos}
                    </td>
                    <td>
                      <AttendanceStatusPicker
                        value={bulkEstados[s.id] ?? "presente"}
                        onChange={(estado) =>
                          setBulkEstados((p) => ({ ...p, [s.id]: estado }))
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </PageSection>
        </motion.div>
      ) : null}

      <motion.div variants={cardVariants} initial="hidden" animate="visible">
        <DataTablePanel
          title="Historial de asistencia"
          description={loading ? "Cargando registros…" : `${total} ${total === 1 ? "registro" : "registros"}`}
          isEmpty={!loading && items.length === 0}
          emptyMessage={filters.search || filters.seccionId || filters.fecha ? "No existen registros para los filtros seleccionados." : "Sin registros de asistencia."}
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={total}
          onPageChange={setPage}
        >
          <TableWrap>
            <thead>
              <tr>
                <th>Código</th>
                <th>Estudiante</th>
                <th>Salón</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>% mensual</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => {
                const estado = flagsToEstado(a);
                const st = studentMap.get(a.studentId);
                const grado = st ? parseGradoNumero(st.nivel) : null;
                const sec = st ? parseSeccionLetra(st.nivel) : "";
                return (
                  <tr key={a.id}>
                    <td className="font-mono text-xs">{st?.codigo ?? "—"}</td>
                    <td>
                      {a.student
                        ? `${a.student.nombres} ${a.student.apellidos}`
                        : a.studentId}
                    </td>
                    <td>{salónLabel(grado, sec)}</td>
                    <td>{new Date(a.fecha).toLocaleDateString("es-PE")}</td>
                    <td>
                      <span className={estadoBadgeClass(estado)}>{estadoLabel(estado)}</span>
                    </td>
                    <td>{st?.hasAttendance ? `${st.metrics.asistenciaGeneral}%` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </DataTablePanel>
      </motion.div>
    </div>
  );
}
