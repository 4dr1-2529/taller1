"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { mapStudentFromApi } from "@/lib/api-mappers";
import { profesorService } from "@/services/profesorService";
import { useProfessorFilters } from "@/hooks/useProfessorFilters";
import { ProfessorFiltersBar } from "@/components/professor/ProfessorFiltersBar";
import { PredictionView } from "@/components/views/PredictionView";
import { PROFESOR_HINTS } from "@/constants/blenkir";
import type { Course, Student } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import { SELECT_CLASS } from "@/lib/ui";

type ProfessorPredictionViewProps = {
  courses: Course[];
  secciones: SeccionOption[];
};

export function ProfessorPredictionView({ courses, secciones }: ProfessorPredictionViewProps) {
  const pf = useProfessorFilters(secciones, courses);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!pf.applySearch()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await profesorService.getEstudiantes({
        gradoId: pf.draft.gradoId,
        seccionId: pf.draft.seccionId,
        cursoId: pf.draft.courseId || undefined,
        search: pf.draft.search.trim() || undefined,
        limit: 800,
      });
      const list = res.items.map((r) =>
        mapStudentFromApi(r as Parameters<typeof mapStudentFromApi>[0]),
      );
      setStudents(list);
      setStudentId(list[0]?.id ?? "");
      if (!list.length) {
        toast.info(PROFESOR_HINTS.noResults);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al buscar estudiantes";
      setError(msg);
      setStudents([]);
      setStudentId("");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [pf]);

  const clear = useCallback(() => {
    pf.clear();
    setStudents([]);
    setStudentId("");
    setError(null);
  }, [pf]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === studentId) ?? students[0],
    [students, studentId],
  );

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
        resultCount={pf.searched ? students.length : undefined}
        show={{ grado: true, seccion: true, course: true, search: true }}
      />

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Buscando estudiantes…</p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {!pf.searched && !loading ? (
        <p className="text-sm text-[var(--text-muted)]">{PROFESOR_HINTS.selectGradoSeccion}</p>
      ) : null}

      {pf.searched && !loading && students.length === 0 && !error ? (
        <p className="text-sm text-[var(--text-muted)]">{PROFESOR_HINTS.noResults}</p>
      ) : null}

      {pf.searched && students.length > 0 ? (
        <>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            {students.length} estudiante(s) encontrado(s). Seleccione uno para generar predicción.
          </p>
          <label className="block max-w-md text-sm">
            <span className="mb-1 text-[var(--text-muted)]">Estudiante</span>
            <select
              className={SELECT_CLASS}
              value={selectedStudent?.id ?? ""}
              onChange={(e) => setStudentId(e.target.value)}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.codigo} — {s.nombres} {s.apellidos}
                </option>
              ))}
            </select>
          </label>

          {selectedStudent ? (
            <PredictionView
              students={[selectedStudent]}
              secciones={secciones}
              useApi
              studentsPreFiltered
              hideAcademicFilters
            />
          ) : (
            <p className="text-sm text-[var(--text-muted)]">{PROFESOR_HINTS.selectStudentPredict}</p>
          )}
        </>
      ) : null}
    </div>
  );
}
