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
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkEstados, setBulkEstados] = useState<Record<string, AttendanceEstado>>({});

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
      const res = await api.getAttendance();
      setItems(res.items as AttendanceRow[]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const scopeIds = new Set(filteredStudents.map((s) => s.id));
  const filtered = items.filter((a) => {
    if (!scopeIds.has(a.studentId)) return false;
    if (filters.fecha && a.fecha.slice(0, 10) !== filters.fecha) return false;
    if (filters.search) {
      const st = studentMap.get(a.studentId);
      const name = st
        ? `${st.nombres} ${st.apellidos} ${st.codigo}`.toLowerCase()
        : "";
      if (!name.includes(filters.search.toLowerCase())) return false;
    }
    return true;
  });

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

  const pct =
    summary.total > 0
      ? Math.round(
          (filteredStudents.reduce((s, st) => s + st.metrics.asistenciaGeneral, 0) /
            filteredStudents.length) *
            10,
        ) / 10
      : 0;

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
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="space-y-6">
      <AcademicFiltersBar
        filters={filters}
        onChange={updateFilter}
        onReset={resetFilters}
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
          { label: "% asist. general", value: `${pct}%` },
        ]}
      />

      {!filters.seccionId ? (
        <p className="rounded-lg border border-[var(--brand-navy)]/20 bg-[var(--accent-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          {FILTER_HINTS.selectSeccion} Se mostrará la lista completa del salón para marcar asistencia masiva.
        </p>
      ) : null}

      {filters.seccionId && filteredStudents.length === 0 ? (
        <EmptyState title="Sin estudiantes en este salón" description={FILTER_HINTS.noStudents} />
      ) : filters.seccionId ? (
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
          description={loading ? "Cargando registros…" : `${filtered.length} registro(s)`}
          isEmpty={!loading && filtered.length === 0}
          emptyMessage="Sin registros para el filtro actual."
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
              {filtered.map((a) => {
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
                    <td>{st ? `${st.metrics.asistenciaGeneral}%` : "—"}</td>
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
