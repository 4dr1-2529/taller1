"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthProvider";
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
import { FILTER_HINTS } from "@/constants/blenkir";
import {
  notaEstado,
  parseGradoNumero,
  parseSeccionLetra,
  salónLabel,
  teachersForSelect,
} from "@/lib/student-filters";
import {
  type FieldErrors,
  firstError,
  sanitizeGradeInput,
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
  observacion?: string | null;
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
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    courseId: "",
    periodo: "2026-I",
    bimestre: "1",
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

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const displayRows = useMemo(() => {
    const ids = new Set(filteredStudents.map((s) => s.id));
    return items.filter((g) => {
      if (!ids.has(g.studentId)) return false;
      if (filters.courseId && g.courseId !== filters.courseId) return false;
      if (filters.bimestre && String(g.bimestre) !== filters.bimestre) return false;
      return true;
    });
  }, [items, filteredStudents, filters.courseId, filters.bimestre]);

  const summary = useMemo(() => {
    const notas = displayRows.map((r) => r.nota);
    const avg = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
    let aprob = 0;
    let riesgo = 0;
    let desap = 0;
    for (const s of filteredStudents) {
      const e = notaEstado(s.metrics.promedioGeneral);
      if (e === "Aprobado") aprob++;
      else if (e === "En riesgo") riesgo++;
      else desap++;
    }
    return {
      total: filteredStudents.length,
      registros: displayRows.length,
      promedio: avg.toFixed(1),
      aprob,
      riesgo,
      desap,
    };
  }, [displayRows, filteredStudents]);

  const load = useCallback(async () => {
    if (!api.hasToken) return;
    setLoading(true);
    try {
      const res = await api.getGrades();
      setItems(res.items as GradeRow[]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (!filters.seccionId && !form.studentId) {
      toast.error(FILTER_HINTS.selectSeccion);
      return;
    }
    const nextErrors = validateGradeForm(form);
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
        courseId: form.courseId,
        periodo: form.periodo,
        bimestre: Number(form.bimestre),
        nota,
        observacion: form.observacion || undefined,
      });
      toast.success("Nota registrada correctamente");
      setForm((p) => ({ ...p, nota: "", observacion: "" }));
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar nota");
    }
  }

  const coursesForForm = useMemo(() => {
    const sel = students.find((s) => s.id === form.studentId);
    if (!sel?.seccionId) return filteredCourses;
    return filteredCourses.filter((c) => !c.seccionId || c.seccionId === sel.seccionId);
  }, [form.studentId, filteredCourses, students]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-muted)] ring-1 ring-[var(--brand-orange)]/30">
          <GraduationCap className="h-5 w-5 text-[var(--brand-orange)]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Registro de notas</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Filtre por grado, sección y salón · escala vigente 0–20
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
        teachers={teachersForSelect(teachers)}
        show={{ grado: true, seccion: true, course: true, bimestre: true, search: true }}
      />

      <SummaryStatsRow
        stats={[
          { label: "Estudiantes (filtro)", value: summary.total, tone: "brand" },
          { label: "Registros notas", value: summary.registros },
          { label: "Promedio salón", value: summary.promedio },
          { label: "Aprobados", value: summary.aprob, tone: "success" },
          { label: "En riesgo", value: summary.riesgo, tone: "warning" },
          { label: "Desaprobados", value: summary.desap, tone: "danger" },
        ]}
      />

      {!filters.seccionId ? (
        <p className="rounded-lg border border-[var(--brand-navy)]/20 bg-[var(--accent-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          {FILTER_HINTS.selectSeccion} Los estudiantes del salón se cargan al elegir la sección.
        </p>
      ) : null}

      {filters.seccionId && filteredStudents.length === 0 ? (
        <EmptyState
          title="Sin estudiantes en este salón"
          description={FILTER_HINTS.noStudents}
        />
      ) : filteredStudents.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <PageSection
            variant="form"
            icon={ClipboardList}
            title="Registrar nota"
            description="Complete estudiante, curso y bimestre. El promedio se actualiza en el backend."
          >
            <form className="form-grid" onSubmit={(e) => void handleSubmit(e)}>
              <FormField label="Estudiante" className="form-grid-full" error={errors.studentId}>
                <select
                  className={INPUT_CLASS}
                  value={form.studentId}
                  onChange={(e) => {
                    setErrors((p) => clearFieldError(p, "studentId"));
                    setForm((p) => ({ ...p, studentId: e.target.value, courseId: "" }));
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
              <FormField label="Curso" className="form-grid-full" error={errors.courseId}>
                <select
                  className={INPUT_CLASS}
                  value={form.courseId}
                  onChange={(e) => {
                    setErrors((p) => clearFieldError(p, "courseId"));
                    setForm((p) => ({ ...p, courseId: e.target.value }));
                  }}
                  required
                  disabled={!form.studentId}
                >
                  <option value="">Seleccione curso</option>
                  {coursesForForm.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Bimestre">
                <select
                  className={INPUT_CLASS}
                  value={form.bimestre}
                  onChange={(e) => setForm((p) => ({ ...p, bimestre: e.target.value }))}
                >
                  {[1, 2, 3, 4].map((b) => (
                    <option key={b} value={b}>
                      Bimestre {b}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Nota (0–20)" error={errors.nota}>
                <input
                  className={INPUT_CLASS}
                  inputMode="decimal"
                  value={form.nota}
                  onChange={(e) => {
                    setErrors((p) => clearFieldError(p, "nota"));
                    setForm((p) => ({ ...p, nota: sanitizeGradeInput(e.target.value) }));
                  }}
                  required
                />
              </FormField>
              <button type="submit" className="btn-primary form-grid-full">
                Guardar nota
              </button>
            </form>
          </PageSection>

          <div className="xl:col-span-2">
            <DataTablePanel
              title="Notas por salón"
              description={loading ? "Cargando…" : `${displayRows.length} registro(s)`}
              isEmpty={!loading && displayRows.length === 0}
              emptyMessage={FILTER_HINTS.noGrades}
            >
              <TableWrap>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Estudiante</th>
                    <th>Grado</th>
                    <th>Sección</th>
                    <th>Salón</th>
                    <th>Curso</th>
                    <th>Bim.</th>
                    <th>Nota</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((g) => {
                    const st = studentMap.get(g.studentId);
                    const grado = st ? parseGradoNumero(st.nivel) : null;
                    const sec = st ? parseSeccionLetra(st.nivel) : "";
                    const estado = notaEstado(g.nota, st?.metrics.promedioGeneral);
                    return (
                      <tr key={g.id}>
                        <td className="font-mono text-xs">{g.student?.codigo ?? st?.codigo}</td>
                        <td>
                          {g.student
                            ? `${g.student.nombres} ${g.student.apellidos}`
                            : "—"}
                        </td>
                        <td>{grado ? `${grado}°` : "—"}</td>
                        <td>{sec || "—"}</td>
                        <td>{salónLabel(grado, sec)}</td>
                        <td>{g.course?.nombre ?? "—"}</td>
                        <td>{g.bimestre}</td>
                        <td className="font-semibold">{g.nota.toFixed(1)}</td>
                        <td>
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableWrap>
            </DataTablePanel>
          </div>
        </div>
      ) : null}
    </div>
  );
}
