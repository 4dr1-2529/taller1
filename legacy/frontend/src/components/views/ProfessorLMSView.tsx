"use client";

import { useCallback, useState } from "react";
import { lmsActivityTierFromLevel } from "@/lib/lms-engagement";
import { profesorService } from "@/services/profesorService";
import { useProfessorFilters } from "@/hooks/useProfessorFilters";
import { ProfessorFiltersBar } from "@/components/professor/ProfessorFiltersBar";
import { SummaryStatsRow } from "@/components/academic/SummaryStatsRow";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { PROFESOR_HINTS } from "@/constants/blenkir";
import type { Course } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";

type LmsRow = {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  accesosLms: number;
  tiempoPlataforma: number;
  tareasEntregadas: number;
  participacion: number;
  compromiso: string;
};

type ProfessorLMSViewProps = {
  courses: Course[];
  secciones: SeccionOption[];
};

export function ProfessorLMSView({ courses, secciones }: ProfessorLMSViewProps) {
  const pf = useProfessorFilters(secciones, courses);
  const [rows, setRows] = useState<LmsRow[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    if (!pf.applySearch()) return;
    setLoading(true);
    try {
      const lmsRes = await profesorService.getLms({
        gradoId: pf.draft.gradoId,
        seccionId: pf.draft.seccionId,
        cursoId: pf.draft.courseId || undefined,
        search: pf.draft.search || undefined,
      });
      setRows(lmsRes.items as LmsRow[]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [pf]);

  let alta = 0;
  let media = 0;
  let baja = 0;
  let sin = 0;
  for (const r of rows) {
    const t = lmsActivityTierFromLevel(r.compromiso);
    if (t === "alta") alta++;
    else if (t === "media") media++;
    else if (t === "baja") baja++;
    else sin++;
  }

  return (
    <div className="space-y-6">
      <ProfessorFiltersBar
        filters={pf.draft}
        onChange={pf.updateDraft}
        onSearch={() => void search()}
        onClear={() => {
          pf.clear();
          setRows([]);
        }}
        grados={pf.grados}
        secciones={pf.seccionOptions}
        courses={pf.courseOptions.map((c) => ({ id: c.id, nombre: c.nombre }))}
        loading={loading}
        show={{ grado: true, seccion: true, course: true, search: true }}
      />

      {pf.searched && rows.length > 0 ? (
        <>
          <SummaryStatsRow
            stats={[
              { label: "Total alumnos", value: rows.length, tone: "brand" },
              { label: "Alta actividad", value: alta, tone: "success" },
              { label: "Media", value: media, tone: "warning" },
              { label: "Baja", value: baja, tone: "danger" },
              { label: "Sin actividad", value: sin },
            ]}
          />
          <DataTablePanel title="Actividad LMS por alumno" isEmpty={false}>
            <TableWrap>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Estudiante</th>
                  <th>Accesos</th>
                  <th>Tiempo (h)</th>
                  <th>Tareas %</th>
                  <th>Participación</th>
                  <th>Compromiso</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.codigo}</td>
                    <td>
                      {r.nombres} {r.apellidos}
                    </td>
                    <td>{r.accesosLms}</td>
                    <td>{r.tiempoPlataforma}</td>
                    <td>{r.tareasEntregadas}%</td>
                    <td>{r.participacion}</td>
                    <td className="capitalize">{r.compromiso}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </DataTablePanel>
          {rows.every((r) => r.accesosLms === 0) ? (
            <p className="text-sm text-[var(--text-muted)]">{PROFESOR_HINTS.noLms}</p>
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
