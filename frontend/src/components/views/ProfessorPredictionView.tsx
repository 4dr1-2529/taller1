"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { mapStudentFromApi } from "@/lib/api-mappers";
import { profesorService } from "@/services/profesorService";
import { useProfessorFilters } from "@/hooks/useProfessorFilters";
import { ProfessorFiltersBar } from "@/components/professor/ProfessorFiltersBar";
import { PredictionView } from "@/components/views/PredictionView";
import { ErrorState } from "@/components/ui/ErrorState";
import { PROFESOR_HINTS } from "@/constants/blenkir";
import type { Course, Student } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";

type ProfessorPredictionViewProps = {
  courses: Course[];
  secciones: SeccionOption[];
};

export function ProfessorPredictionView({ courses, secciones }: ProfessorPredictionViewProps) {
  const pf = useProfessorFilters(secciones, courses);
  const [students, setStudents] = useState<Student[]>([]);
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
      if (!list.length) {
        toast.info(PROFESOR_HINTS.noResults);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al buscar estudiantes";
      setError(msg);
      setStudents([]);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [pf]);

  const clear = useCallback(() => {
    pf.clear();
    setStudents([]);
    setError(null);
  }, [pf]);

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
        <p
          role="status"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Buscando estudiantes…
        </p>
      ) : null}

      {error ? (
        <ErrorState
          message={error}
          technicalDetail="GET /profesor/estudiantes"
          onRetry={() => void search()}
          retryLabel="Volver a buscar"
        />
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
            {students.length === 1
              ? "1 estudiante disponible. Seleccione uno para generar la estimación."
              : `${students.length} estudiantes disponibles. Seleccione uno para generar la estimación.`}
          </p>

          <PredictionView
            students={students}
            secciones={secciones}
            useApi
            studentsPreFiltered
            hideAcademicFilters
          />
        </>
      ) : null}
    </div>
  );
}
