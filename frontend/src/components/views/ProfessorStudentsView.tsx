"use client";

import { useCallback, useState } from "react";
import { attachPredictions } from "@/lib/aggregates";
import { mapStudentFromApi } from "@/lib/api-mappers";
import { profesorService } from "@/services/profesorService";
import { useProfessorFilters } from "@/hooks/useProfessorFilters";
import { ProfessorFiltersBar } from "@/components/professor/ProfessorFiltersBar";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { MiniProgressBar } from "@/components/ui/MiniProgressBar";
import { PROFESOR_HINTS } from "@/constants/blenkir";
import type { Course } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import type { Student } from "@/types/academic";
import { parseGradoNumero, parseSeccionLetra, salónLabel } from "@/lib/student-filters";

type ProfessorStudentsViewProps = {
  courses: Course[];
  secciones: SeccionOption[];
};

export function ProfessorStudentsView({ courses, secciones }: ProfessorStudentsViewProps) {
  const pf = useProfessorFilters(secciones, courses);
  const [rows, setRows] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    if (!pf.applySearch()) return;
    setLoading(true);
    try {
      const res = await profesorService.getEstudiantes({
        gradoId: pf.draft.gradoId,
        seccionId: pf.draft.seccionId,
        cursoId: pf.draft.courseId || undefined,
        search: pf.draft.search || undefined,
        limit: 800,
      });
      setRows(res.items.map((r) => mapStudentFromApi(r as Parameters<typeof mapStudentFromApi>[0])));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [pf]);

  const clear = () => {
    pf.clear();
    setRows([]);
  };

  const withPred = attachPredictions(rows);
  const courseName = (id: string) => courses.find((c) => c.id === id)?.nombre ?? "—";

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
        show={{ grado: true, seccion: true, course: true, search: true }}
      />

      <DataTablePanel
        title="Mis estudiantes"
        description={
          loading
            ? "Buscando…"
            : pf.searched
              ? `${withPred.length} resultado(s)`
              : PROFESOR_HINTS.pressSearch
        }
        isEmpty={pf.searched && !loading && withPred.length === 0}
        emptyMessage={PROFESOR_HINTS.noStudents}
      >
        <TableWrap>
          <thead>
            <tr>
              <th>Código</th>
              <th>Estudiante</th>
              <th>Salón</th>
              <th>Curso</th>
              <th>Promedio</th>
              <th>Asistencia</th>
              <th>Riesgo IA</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {withPred.map((s) => {
              const grado = parseGradoNumero(s.nivel);
              const sec = parseSeccionLetra(s.nivel);
              return (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.codigo}</td>
                  <td>
                    {s.nombres} {s.apellidos}
                  </td>
                  <td>{salónLabel(grado, sec)}</td>
                  <td>{pf.applied.courseId ? courseName(pf.applied.courseId) : "Todos"}</td>
                  <td>{s.metrics.promedioGeneral.toFixed(1)}</td>
                  <td>
                    <MiniProgressBar value={s.metrics.asistenciaGeneral} />
                  </td>
                  <td>
                    <RiskBadge level={s.prediction.level} score={s.prediction.score} />
                  </td>
                  <td>{s.estado}</td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </DataTablePanel>
    </div>
  );
}
