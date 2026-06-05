"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { FormEvent } from "react";
import {
  type FieldErrors,
  firstError,
  validateMatriculaForm,
  clearFieldError,
} from "@/lib/validation";
import { motion } from "framer-motion";
import { FileUser, UserPlus } from "lucide-react";
import type { Student } from "@/types/academic";
import type { MatriculaStats } from "@/hooks/useAcademicData";
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

export type NewMatriculaForm = {
  estudianteId: string;
  seccionId: string;
  anioLectivoId: string;
};

type MatriculasViewProps = {
  students: Student[];
  secciones: SeccionOption[];
  matriculaStats: MatriculaStats | null;
  form: NewMatriculaForm;
  setForm: (v: NewMatriculaForm | ((p: NewMatriculaForm) => NewMatriculaForm)) => void;
  onAdd: (e: FormEvent<HTMLFormElement>) => void;
};

export function EnrollmentsView({
  students,
  secciones,
  matriculaStats,
  form,
  setForm,
  onAdd,
}: MatriculasViewProps) {
  const [items, setItems] = useState<MatriculaRow[]>([]);
  const [anios, setAnios] = useState<{ id: string; anio: number; nombre: string; activo: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const { filters, updateFilter, resetFilters, grados, seccionOptions, filteredStudents } =
    useAcademicFilters(students, [], secciones);

  const activas = matriculaStats?.matriculasActivas ?? items.filter((m) => m.estado === "activa").length;

  const load = useCallback(async () => {
    if (!api.hasToken) return;
    setLoading(true);
    try {
      const [mat, an] = await Promise.all([
        api.getMatriculas({
          seccionId: filters.seccionId || undefined,
          limit: 700,
        }),
        api.getAniosLectivos(),
      ]);
      setItems(mat.items);
      setAnios(an.items);
      if (!form.anioLectivoId && an.items[0]) {
        setForm((p) => ({
          ...p,
          anioLectivoId: an.items.find((a) => a.activo)?.id ?? an.items[0].id,
        }));
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

  const studentsForForm = filters.seccionId ? filteredStudents : students;

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg ring-1"
            style={{ background: `${BLENKIR_COLORS.orange}22`, borderColor: `${BLENKIR_COLORS.orange}44` }}
          >
            <FileUser className="h-4 w-4" style={{ color: BLENKIR_COLORS.orange }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Matrículas institucionales</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Estudiante + año lectivo + grado + sección · una matrícula activa por alumno y año
            </p>
          </div>
        </div>
      </motion.div>

      <SummaryStatsRow
        stats={[
          { label: "Matrículas activas", value: activas, tone: "brand" },
          {
            label: "Estudiantes activos",
            value: matriculaStats?.estudiantesActivos ?? students.length,
          },
          {
            label: "Año lectivo",
            value: matriculaStats?.anioLectivo ?? "2026",
          },
          { label: "En pantalla", value: loading ? "…" : items.length },
        ]}
      />

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
            description="Registre al estudiante en un salón. No se crean matrículas por curso."
          >
            <form
              className="form-grid"
              onSubmit={(e) => {
                e.preventDefault();
                const nextErrors = validateMatriculaForm(form);
                setErrors(nextErrors);
                const msg = firstError(nextErrors);
                if (msg) {
                  toast.error(msg);
                  return;
                }
                onAdd(e);
              }}
            >
              <FormField label="Año lectivo" className="form-grid-full" error={errors.anioLectivoId}>
                <select
                  className={INPUT_CLASS}
                  value={form.anioLectivoId}
                  onChange={(e) => {
                    setErrors((p) => clearFieldError(p, "anioLectivoId"));
                    setForm((p) => ({ ...p, anioLectivoId: e.target.value }));
                  }}
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
              <FormField label="Estudiante" className="form-grid-full" error={errors.estudianteId}>
                <select
                  className={INPUT_CLASS}
                  value={form.estudianteId}
                  onChange={(e) => {
                    setErrors((p) => clearFieldError(p, "estudianteId"));
                    setForm((p) => ({ ...p, estudianteId: e.target.value }));
                  }}
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
              <FormField label="Grado y sección (salón)" className="form-grid-full" error={errors.seccionId}>
                <select
                  className={INPUT_CLASS}
                  value={form.seccionId}
                  onChange={(e) => {
                    setErrors((p) => clearFieldError(p, "seccionId"));
                    setForm((p) => ({ ...p, seccionId: e.target.value }));
                  }}
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
            title={`Matrículas activas (${activas})`}
            description="Listado institucional por salón"
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
