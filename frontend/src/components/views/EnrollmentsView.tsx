"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { FileUser, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { Student } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import { useAcademicFilters } from "@/hooks/useAcademicFilters";
import { AcademicFiltersBar } from "@/components/academic/AcademicFiltersBar";
import { SummaryStatsRow } from "@/components/academic/SummaryStatsRow";
import { PageSection } from "@/components/ui/PageSection";
import { FormField } from "@/components/ui/FormField";
import { DataTablePanel, TableWrap } from "@/components/ui/DataTablePanel";
import { INPUT_CLASS } from "@/lib/ui";
import { api, type MatriculaRow } from "@/services/api";
import { BLENKIR_COLORS } from "@/constants/blenkir";

export type NewEnrollmentForm = {
  estudianteId: string;
  seccionId: string;
  anioLectivoId: string;
};

type EnrollmentsViewProps = {
  students: Student[];
  secciones: SeccionOption[];
  matriculaStats: {
    matriculasInstitucionales: number;
    matriculasActivas: number;
    inscripcionesCurso: number;
  } | null;
  form: NewEnrollmentForm;
  setForm: (v: NewEnrollmentForm | ((p: NewEnrollmentForm) => NewEnrollmentForm)) => void;
  onAdd: (e: FormEvent<HTMLFormElement>) => void;
};

export function EnrollmentsView({
  students,
  secciones,
  matriculaStats,
  form,
  setForm,
  onAdd,
}: EnrollmentsViewProps) {
  const [items, setItems] = useState<MatriculaRow[]>([]);
  const [anios, setAnios] = useState<{ id: string; anio: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const { filters, updateFilter, resetFilters, grados, seccionOptions, filteredStudents } =
    useAcademicFilters(students, [], secciones);

  const load = useCallback(async () => {
    if (!api.hasToken) return;
    setLoading(true);
    try {
      const [mat, an] = await Promise.all([
        api.getMatriculas({
          seccionId: filters.seccionId || undefined,
          limit: 200,
        }),
        api.getAniosLectivos(),
      ]);
      setItems(mat.items);
      setAnios(an.items);
      if (!form.anioLectivoId && an.items[0]) {
        setForm((p) => ({ ...p, anioLectivoId: an.items.find((a) => a.activo)?.id ?? an.items[0].id }));
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters.seccionId, form.anioLectivoId, setForm]);

  useEffect(() => {
    void load();
  }, [load]);

  const studentsForForm = useMemo(() => {
    if (filters.seccionId) {
      return filteredStudents;
    }
    return students;
  }, [filters.seccionId, filteredStudents, students]);

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg ring-1"
              style={{ background: `${BLENKIR_COLORS.orange}22`, borderColor: `${BLENKIR_COLORS.orange}44` }}
            >
              <FileUser className="h-4 w-4" style={{ color: BLENKIR_COLORS.orange }} />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Matrículas institucionales</h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Una matrícula activa por estudiante y año: alumno + año lectivo + grado + sección.
          </p>
        </div>
      </motion.div>

      <SummaryStatsRow
        stats={[
          {
            label: "Matrículas activas",
            value: matriculaStats?.matriculasActivas ?? items.filter((m) => m.estado === "activa").length,
            tone: "brand",
          },
          {
            label: "Total matrículas",
            value: matriculaStats?.matriculasInstitucionales ?? items.length,
          },
          {
            label: "Inscripciones a curso (hist.)",
            value: matriculaStats?.inscripcionesCurso ?? "—",
            tone: "warning",
          },
          { label: "En pantalla", value: loading ? "…" : items.length },
        ]}
      />

      {matriculaStats && matriculaStats.inscripcionesCurso > 500 ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Se detectaron {matriculaStats.inscripcionesCurso.toLocaleString("es-PE")} inscripciones a curso
          (estudiante × cada materia). Eso no equivale a matrículas de salón. Las matrículas institucionales
          son {matriculaStats.matriculasInstitucionales.toLocaleString("es-PE")}.
        </p>
      ) : null}

      <AcademicFiltersBar
        filters={filters}
        onChange={updateFilter}
        onReset={resetFilters}
        grados={grados}
        secciones={seccionOptions}
        show={{ grado: true, seccion: true, search: true }}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <PageSection
            variant="form"
            icon={UserPlus}
            title="Nueva matrícula"
            description="Registre al estudiante en un salón para el año lectivo. No se permiten duplicados por año."
          >
            <form className="form-grid" onSubmit={onAdd}>
              <FormField label="Año lectivo" className="form-grid-full">
                <select
                  className={INPUT_CLASS}
                  value={form.anioLectivoId}
                  onChange={(e) => setForm((p) => ({ ...p, anioLectivoId: e.target.value }))}
                  required
                >
                  <option value="">Seleccione año</option>
                  {anios.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} ({a.anio})
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Estudiante" className="form-grid-full">
                <select
                  className={INPUT_CLASS}
                  value={form.estudianteId}
                  onChange={(e) => setForm((p) => ({ ...p, estudianteId: e.target.value }))}
                  required
                >
                  <option value="">Seleccione estudiante</option>
                  {studentsForForm.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.codigo} — {s.nombres} {s.apellidos}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Sección (salón)" className="form-grid-full">
                <select
                  className={INPUT_CLASS}
                  value={form.seccionId}
                  onChange={(e) => setForm((p) => ({ ...p, seccionId: e.target.value }))}
                  required
                >
                  <option value="">Seleccione sección</option>
                  {seccionOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <button type="submit" className="btn-primary form-grid-full">
                Registrar matrícula
              </button>
            </form>
          </PageSection>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <DataTablePanel
            title="Matrículas del periodo"
            description="Alumno + año + grado + sección"
            isEmpty={!loading && items.length === 0}
            emptyMessage="Sin matrículas para el filtro seleccionado."
          >
            <TableWrap>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Estudiante</th>
                  <th>Salón</th>
                  <th>Año</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id}>
                    <td className="font-mono text-xs">{m.codigo}</td>
                    <td>
                      {m.estudiante.nombres} {m.estudiante.apellidos}
                    </td>
                    <td>{m.seccion.label}</td>
                    <td>{m.anioLectivo.nombre}</td>
                    <td>
                      <span className="badge-info capitalize">{m.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </DataTablePanel>
        </motion.div>
      </div>
    </div>
  );
}
