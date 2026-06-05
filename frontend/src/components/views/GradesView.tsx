"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthProvider";
import { FILTER_HINTS } from "@/constants/blenkir";
import type { Course, Student, Teacher } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import { useAcademicFilters } from "@/hooks/useAcademicFilters";
import { AcademicFiltersBar } from "@/components/academic/AcademicFiltersBar";
import { SummaryStatsRow } from "@/components/academic/SummaryStatsRow";
import { EmptyState } from "@/components/EmptyState";
import { PageSection } from "@/components/ui/PageSection";
import { FormField } from "@/components/ui/FormField";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { INPUT_CLASS } from "@/lib/ui";
import { notaEstado, parseGradoNumero, parseSeccionLetra, salónLabel } from "@/lib/student-filters";
import { GradeInput, ObservacionInput } from "@/components/ui/ValidatedInputs";
import {
  type FieldErrors,
  firstError,
  validateGradeForm,
  parseGrade,
  clearFieldError,
} from "@/lib/validation";

type GradeRow = {
  id: string;
  studentId: string;
  courseId: string;
  periodo: string;
  bimestre: number;
  nota: number;
  student?: { codigo: string; nombres: string; apellidos: string };
  course?: { codigo: string; nombre: string };
};

type GradesViewProps = {
  students: Student[];
  courses: Course[];
  teachers: Teacher[];
  secciones: SeccionOption[];
};

export function GradesView({ students, courses, teachers, secciones }: GradesViewProps) {
  const { isAuthenticated, isDocente } = useAuth();
  const [items, setItems] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    nota: "",
    observacion: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const {
    filters,
    updateFilter,
    resetFilters,
    grados,
    seccionOptions,
    filteredStudents,
    filteredCourses,
  } = useAcademicFilters(students, courses, secciones, teachers);

  const filtersReady = Boolean(
    filters.gradoId && filters.seccionId && filters.courseId && filters.bimestre,
  );

  useEffect(() => {
    if (filters.bimestre) {
      setForm((p) => ({ ...p, studentId: "" }));
    }
  }, [filters.seccionId, filters.courseId, filters.bimestre]);

  const gradeByStudent = useMemo(() => {
    const map = new Map<string, GradeRow>();
    for (const g of items) {
      if (filters.courseId && g.courseId !== filters.courseId) continue;
      if (filters.bimestre && String(g.bimestre) !== filters.bimestre) continue;
      map.set(g.studentId, g);
    }
    return map;
  }, [items, filters.courseId, filters.bimestre]);

  const summary = useMemo(() => {
    let aprob = 0;
    let riesgo = 0;
    let desap = 0;
    for (const s of filteredStudents) {
      const g = gradeByStudent.get(s.id);
      const ref = g?.nota ?? s.metrics.promedioGeneral;
      const e = notaEstado(ref);
      if (e === "Aprobado") aprob++;
      else if (e === "En riesgo") riesgo++;
      else desap++;
    }
    const notas = [...gradeByStudent.values()].map((g) => g.nota);
    const avg = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
    return {
      total: filteredStudents.length,
      conNota: notas.length,
      promedio: avg.toFixed(1),
      aprob,
      riesgo,
      desap,
    };
  }, [filteredStudents, gradeByStudent]);

  const load = useCallback(async () => {
    if (!api.hasToken) return;
    setLoading(true);
    try {
      const res = isDocente
        ? await api.getProfesorGrades(undefined, filters.courseId || undefined)
        : await api.getGrades(undefined, filters.courseId || undefined);
      setItems(res.items as GradeRow[]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters.courseId, isDocente]);

  useEffect(() => {
    if (isAuthenticated) void load();
  }, [isAuthenticated, load]);

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Registro de notas"
        description="Inicie sesión para registrar calificaciones por bimestre (escala 0–20, Perú)."
        showLogin
      />
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!filtersReady) {
      toast.error("Seleccione grado, sección, curso y bimestre");
      return;
    }
    const payload = {
      studentId: form.studentId,
      courseId: filters.courseId,
      periodo: "2026-I",
      bimestre: filters.bimestre,
      nota: form.nota,
      observacion: form.observacion,
    };
    const nextErrors = validateGradeForm(payload);
    setErrors(nextErrors);
    const msg = firstError(nextErrors);
    if (msg) {
      toast.error(msg);
      return;
    }
    const nota = parseGrade(form.nota);
    if (nota === null) {
      toast.error("Nota fuera de rango (0–20)");
      return;
    }
    try {
      await api.createGrade({
        studentId: form.studentId,
        courseId: filters.courseId,
        periodo: payload.periodo,
        bimestre: Number(filters.bimestre),
        nota,
        observacion: form.observacion || undefined,
      });
      toast.success("Nota registrada");
      setForm((p) => ({ ...p, nota: "", observacion: "" }));
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar nota");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-muted)] ring-1 ring-[var(--brand-orange)]/30">
          <GraduationCap className="h-5 w-5 text-[var(--brand-orange)]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Registro de notas</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Grado → sección → curso → bimestre → alumnos del salón
          </p>
        </div>
      </div>

      <AcademicFiltersBar
        filters={filters}
        onChange={updateFilter}
        onReset={resetFilters}
        grados={grados}
        secciones={seccionOptions}
        courses={filteredCourses.map((c) => ({ id: c.id, nombre: c.nombre }))}
        teachers={[]}
        show={{ grado: true, seccion: true, course: true, bimestre: true, search: true }}
      />

      <SummaryStatsRow
        stats={[
          { label: "Alumnos salón", value: summary.total, tone: "brand" },
          { label: "Con nota (bimestre)", value: summary.conNota },
          { label: "Promedio curso", value: summary.promedio },
          { label: "Aprobados", value: summary.aprob, tone: "success" },
          { label: "En riesgo", value: summary.riesgo, tone: "warning" },
          { label: "Desaprobados", value: summary.desap, tone: "danger" },
        ]}
      />

      {!filtersReady ? (
        <p className="rounded-lg border border-[var(--brand-navy)]/20 bg-[var(--accent-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          Seleccione grado, sección, curso y bimestre para listar a los alumnos matriculados en el
          salón.
        </p>
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          title="Sin estudiantes en este salón"
          description={isDocente ? FILTER_HINTS.noStudentsProfesor : FILTER_HINTS.noStudents}
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          <PageSection
            variant="form"
            icon={ClipboardList}
            title="Registrar nota"
            description={`${filteredCourses.find((c) => c.id === filters.courseId)?.nombre ?? "Curso"} · Bimestre ${filters.bimestre}`}
          >
            <form className="form-grid" onSubmit={(e) => void handleSubmit(e)}>
              <FormField label="Estudiante" className="form-grid-full" error={errors.studentId}>
                <select
                  className={INPUT_CLASS}
                  value={form.studentId}
                  onChange={(e) => {
                    setErrors((p) => clearFieldError(p, "studentId"));
                    setForm((p) => ({ ...p, studentId: e.target.value }));
                  }}
                  required
                >
                  <option value="">Seleccione</option>
                  {filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.codigo} — {s.nombres} {s.apellidos}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Nota (0–20)" error={errors.nota}>
                <GradeInput
                  value={form.nota}
                  onValueChange={(nota) => {
                    setErrors((p) => clearFieldError(p, "nota"));
                    setForm((p) => ({ ...p, nota }));
                  }}
                  required
                />
              </FormField>
              <FormField label="Observación (opcional)" className="form-grid-full" error={errors.observacion}>
                <ObservacionInput
                  placeholder="Solo letras, sin números"
                  value={form.observacion}
                  onValueChange={(observacion) => {
                    setErrors((p) => clearFieldError(p, "observacion"));
                    setForm((p) => ({ ...p, observacion }));
                  }}
                />
              </FormField>
              <button type="submit" className="btn-primary form-grid-full">
                Guardar nota
              </button>
            </form>
          </PageSection>

          <div className="xl:col-span-2">
            <DataTablePanel
              title="Alumnos del salón"
              description={loading ? "Cargando…" : `${filteredStudents.length} estudiante(s)`}
              isEmpty={false}
            >
              <TableWrap>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Estudiante</th>
                    <th>Salón</th>
                    <th>Nota bimestre</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => {
                    const g = gradeByStudent.get(s.id);
                    const grado = parseGradoNumero(s.nivel);
                    const sec = parseSeccionLetra(s.nivel);
                    const ref = g?.nota ?? null;
                    const estado = ref != null ? notaEstado(ref) : "—";
                    return (
                      <tr key={s.id}>
                        <td className="font-mono text-xs">{s.codigo}</td>
                        <td>
                          {s.nombres} {s.apellidos}
                        </td>
                        <td>{salónLabel(grado, sec)}</td>
                        <td className="font-semibold">{ref != null ? ref.toFixed(1) : "—"}</td>
                        <td>
                          {estado !== "—" ? (
                            <span
                              className={
                                estado === "Aprobado"
                                  ? "text-emerald-600"
                                  : estado === "En riesgo"
                                    ? "text-amber-600"
                                    : "text-rose-600"
                              }
                            >
                              {estado}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableWrap>
            </DataTablePanel>
          </div>
        </div>
      )}
    </div>
  );
}
