"use client";

import { useCallback, useMemo, useState } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { mapStudentFromApi } from "@/lib/api-mappers";
import { profesorService } from "@/services/profesorService";
import { useProfessorFilters } from "@/hooks/useProfessorFilters";
import { ProfessorFiltersBar } from "@/components/professor/ProfessorFiltersBar";
import { SummaryStatsRow } from "@/components/academic/SummaryStatsRow";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { GradeInput } from "@/components/ui/ValidatedInputs";
import { parseGrade } from "@/lib/validation";
import { PROFESOR_HINTS } from "@/constants/blenkir";
import { notaEstado, parseGradoNumero, parseSeccionLetra, salónLabel } from "@/lib/student-filters";
import type { Course, Student } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";

type GradeRow = {
  studentId: string;
  courseId: string;
  bimestre: number;
  nota: number;
};

type ProfessorGradesViewProps = {
  courses: Course[];
  secciones: SeccionOption[];
};

export function ProfessorGradesView({ courses, secciones }: ProfessorGradesViewProps) {
  const pf = useProfessorFilters(secciones, courses);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [draftNotas, setDraftNotas] = useState<Record<string, string>>({});

  const search = useCallback(async () => {
    if (!pf.applySearch() || !pf.validateSalon(true)) return;
    if (!pf.draft.bimestre) {
      toast.error("Seleccione bimestre");
      return;
    }
    setLoading(true);
    try {
      const [stRes, grRes] = await Promise.all([
        profesorService.getEstudiantes({
          gradoId: pf.draft.gradoId,
          seccionId: pf.draft.seccionId,
          cursoId: pf.draft.courseId,
          search: pf.draft.search || undefined,
          limit: 800,
        }),
        profesorService.getNotas({
          gradoId: pf.draft.gradoId,
          seccionId: pf.draft.seccionId,
          cursoId: pf.draft.courseId,
          bimestre: pf.draft.bimestre,
        }),
      ]);
      setStudents(stRes.items.map((r) => mapStudentFromApi(r as Parameters<typeof mapStudentFromApi>[0])));
      setGrades(
        (grRes.items as { studentId: string; courseId: string; bimestre: number; nota: number }[]).map((g) => ({
          studentId: g.studentId,
          courseId: g.courseId,
          bimestre: g.bimestre,
          nota: Number(g.nota),
        })),
      );
      setDraftNotas({});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar");
      setStudents([]);
      setGrades([]);
    } finally {
      setLoading(false);
    }
  }, [pf]);

  const gradeMap = useMemo(() => {
    const m = new Map<string, GradeRow>();
    for (const g of grades) {
      if (String(g.bimestre) === pf.applied.bimestre) m.set(g.studentId, g);
    }
    return m;
  }, [grades, pf.applied.bimestre]);

  const courseName = courses.find((c) => c.id === pf.applied.courseId)?.nombre ?? "—";

  async function saveNota(studentId: string) {
    const raw = draftNotas[studentId];
    const nota = parseGrade(raw ?? "");
    if (nota === null) {
      toast.error("Nota entre 0 y 20");
      return;
    }
    try {
      await profesorService.createNota({
        studentId,
        courseId: pf.applied.courseId,
        periodo: "2026-I",
        bimestre: Number(pf.applied.bimestre),
        nota,
      });
      toast.success("Nota guardada");
      void search();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-6 w-6 text-[var(--brand-orange)]" />
        <div>
          <h2 className="text-xl font-bold">Registro de notas</h2>
          <p className="text-sm text-[var(--text-secondary)]">Grado → sección → curso → bimestre → Buscar</p>
        </div>
      </div>

      <ProfessorFiltersBar
        filters={pf.draft}
        onChange={pf.updateDraft}
        onSearch={() => void search()}
        onClear={() => {
          pf.clear();
          setStudents([]);
          setGrades([]);
        }}
        grados={pf.grados}
        secciones={pf.seccionOptions}
        courses={pf.courseOptions.map((c) => ({ id: c.id, nombre: c.nombre }))}
        loading={loading}
        show={{ grado: true, seccion: true, course: true, bimestre: true, search: true }}
      />

      {pf.searched && students.length > 0 ? (
        <>
          <SummaryStatsRow
            stats={[
              { label: "Alumnos", value: students.length, tone: "brand" },
              { label: "Con nota", value: gradeMap.size },
              { label: "Curso", value: courseName },
              { label: "Bimestre", value: pf.applied.bimestre || "—" },
            ]}
          />
          <DataTablePanel title="Alumnos del salón" description={loading ? "…" : undefined} isEmpty={false}>
            <TableWrap>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Estudiante</th>
                  <th>Salón</th>
                  <th>Curso</th>
                  <th>Bim.</th>
                  <th>Nota actual</th>
                  <th>Estado</th>
                  <th>Nueva nota</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const g = gradeMap.get(s.id);
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
                      <td>{courseName}</td>
                      <td>{pf.applied.bimestre}</td>
                      <td>{ref != null ? ref.toFixed(1) : "—"}</td>
                      <td>{estado}</td>
                      <td>
                        <GradeInput
                          placeholder="0–20"
                          value={draftNotas[s.id] ?? (ref != null ? String(ref) : "")}
                          onValueChange={(v) =>
                            setDraftNotas((p) => ({
                              ...p,
                              [s.id]: v,
                            }))
                          }
                        />
                      </td>
                      <td>
                        <button type="button" className="btn-primary text-xs" onClick={() => void saveNota(s.id)}>
                          Guardar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </DataTablePanel>
          {gradeMap.size === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">{PROFESOR_HINTS.noGrades}</p>
          ) : null}
        </>
      ) : pf.searched ? (
        <p className="text-sm text-[var(--text-muted)]">{PROFESOR_HINTS.noStudents}</p>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">{PROFESOR_HINTS.pressSearch}</p>
      )}
    </div>
  );
}
