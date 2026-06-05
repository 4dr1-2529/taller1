"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { mapStudentFromApi } from "@/lib/api-mappers";
import { profesorService } from "@/services/profesorService";
import { useProfessorFilters } from "@/hooks/useProfessorFilters";
import { ProfessorFiltersBar } from "@/components/professor/ProfessorFiltersBar";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { AttendanceStatusPicker } from "@/components/ui/AttendanceStatusPicker";
import { flagsToEstado, estadoToFlags, type AttendanceEstado } from "@/lib/attendance-status";
import { PROFESOR_HINTS } from "@/constants/blenkir";
import type { Course, Student } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import { parseGradoNumero, parseSeccionLetra, salónLabel } from "@/lib/student-filters";

type AttendanceRow = {
  id: string;
  studentId: string;
  fecha: string;
  presente: boolean;
  justificado: boolean;
  tardanza: boolean;
};

type ProfessorAttendanceViewProps = {
  courses: Course[];
  secciones: SeccionOption[];
};

export function ProfessorAttendanceView({ courses, secciones }: ProfessorAttendanceViewProps) {
  const pf = useProfessorFilters(secciones, courses);
  const [students, setStudents] = useState<Student[]>([]);
  const [bulkEstados, setBulkEstados] = useState<Record<string, AttendanceEstado>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const search = useCallback(async () => {
    if (!pf.applySearch()) return;
    setLoading(true);
    try {
      const [stRes, attRes] = await Promise.all([
        profesorService.getEstudiantes({
          gradoId: pf.draft.gradoId,
          seccionId: pf.draft.seccionId,
          search: pf.draft.search || undefined,
          limit: 800,
        }),
        profesorService.getAsistencia({
          gradoId: pf.draft.gradoId,
          seccionId: pf.draft.seccionId,
          fecha: pf.draft.fecha,
        }),
      ]);
      const st = stRes.items.map((r) => mapStudentFromApi(r as Parameters<typeof mapStudentFromApi>[0]));
      setStudents(st);
      const fecha = pf.draft.fecha;
      const next: Record<string, AttendanceEstado> = {};
      for (const s of st) {
        const ex = (attRes.items as AttendanceRow[]).find(
          (a) => a.studentId === s.id && a.fecha.slice(0, 10) === fecha,
        );
        next[s.id] = ex ? flagsToEstado(ex) : "presente";
      }
      setBulkEstados(next);
    } catch {
      setStudents([]);
      setBulkEstados({});
    } finally {
      setLoading(false);
    }
  }, [pf]);

  const fecha = pf.applied.fecha || pf.draft.fecha;

  async function saveBulk() {
    if (!students.length) return;
    setSaving(true);
    try {
      const records = students.map((s) => {
        const flags = estadoToFlags(bulkEstados[s.id] ?? "presente");
        return { studentId: s.id, ...flags };
      });
      await profesorService.bulkAsistencia({ fecha, records });
      toast.success("Asistencia guardada");
      void search();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <ProfessorFiltersBar
        filters={pf.draft}
        onChange={pf.updateDraft}
        onSearch={() => void search()}
        onClear={() => {
          pf.clear();
          setStudents([]);
          setBulkEstados({});
        }}
        grados={pf.grados}
        secciones={pf.seccionOptions}
        courses={pf.courseOptions.map((c) => ({ id: c.id, nombre: c.nombre }))}
        loading={loading}
        show={{ grado: true, seccion: true, course: true, fecha: true, search: true }}
      />

      {pf.searched && students.length > 0 ? (
        <>
          <div className="flex justify-end">
            <button type="button" className="btn-primary" disabled={saving} onClick={() => void saveBulk()}>
              {saving ? "Guardando…" : "Guardar asistencia masiva"}
            </button>
          </div>
          <DataTablePanel title={`Asistencia · ${fecha}`} isEmpty={false}>
            <TableWrap>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Estudiante</th>
                  <th>Salón</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const grado = parseGradoNumero(s.nivel);
                  const sec = parseSeccionLetra(s.nivel);
                  return (
                    <tr key={s.id}>
                      <td className="font-mono text-xs">{s.codigo}</td>
                      <td>
                        {s.nombres} {s.apellidos}
                      </td>
                      <td>{salónLabel(grado, sec)}</td>
                      <td>{fecha}</td>
                      <td>
                        <AttendanceStatusPicker
                          value={bulkEstados[s.id] ?? "presente"}
                          onChange={(v) => setBulkEstados((p) => ({ ...p, [s.id]: v }))}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </DataTablePanel>
        </>
      ) : pf.searched ? (
        <p className="text-sm text-[var(--text-muted)]">{PROFESOR_HINTS.noStudents}</p>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">{PROFESOR_HINTS.pressSearch}</p>
      )}
    </div>
  );
}
