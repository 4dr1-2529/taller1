"use client";

import { SectionHeading } from "@/components/ui/SectionHeading";
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
  onAdd: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
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
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("activa");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const PAGE_SIZE = 20;

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
          gradoId: filters.gradoId || undefined,
          q: query.trim() || undefined,
          estado: estado || undefined,
          page,
          limit: PAGE_SIZE,
        }),
        api.getAniosLectivos(),
      ]);
      setItems(mat.items);
      setTotal(mat.total);
      setAnios(an.items.filter(a => a.anio === 2026));
      if (!form.anioLectivoId && an.items[0]) {
        setForm((p) => ({
          ...p,
          anioLectivoId: an.items.find((a) => a.anio === 2026 && a.activo)?.id ?? "",
        }));
      }
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters.seccionId, filters.gradoId, form.anioLectivoId, setForm, query, estado, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeState(m: MatriculaRow, next: "retirada" | "trasladada") {
    const label = next === "retirada" ? "Retirar matrícula" : "Registrar traslado";
    if (!window.confirm(`${label} ${m.codigo} (${m.estudiante.nombres} ${m.estudiante.apellidos})? Esta acción conserva el historial.`)) return;
    setBusyId(m.id);
    try {
      await api.updateMatriculaState(m.id, next);
      toast.success(next === "retirada" ? "Matrícula retirada" : "Traslado registrado");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar la matrícula");
    } finally {
      setBusyId(null);
    }
  }

  const studentsForForm = filters.seccionId || filters.gradoId ? filteredStudents : students;
  const matriculadosIds = new Set(matriculaStats?.matriculadosIds ?? []);

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
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
            <SectionHeading title="Matrículas institucionales" />
            <p className="text-sm text-[var(--text-secondary)]">
              Estudiante + año lectivo + grado + sección · una matrícula por estudiante durante el año lectivo 2026.
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
        onChange={(k, v) => { updateFilter(k, v); setPage(1); }}
        onReset={() => { resetFilters(); setPage(1); }}
        grados={grados}
        secciones={seccionOptions}
        show={{ grado: true, seccion: true }}
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
                if (busyId !== null) return;
                const nextErrors = validateMatriculaForm(form);
                setErrors(nextErrors);
                const msg = firstError(nextErrors);
                if (msg) {
                  toast.error(msg);
                  return;
                }
                setBusyId("create");
                void Promise.resolve(onAdd(e)).catch(() => undefined).finally(() => setBusyId(null));
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
                  {studentsForForm.map((s) => {
                    const yaMatriculado = matriculadosIds.has(s.id);
                    return (
                      <option key={s.id} value={s.id} disabled={yaMatriculado}>
                      {s.codigo} — {s.nombres} {s.apellidos}{yaMatriculado ? " · Ya matriculado en 2026" : ""}
                      </option>
                    );
                  })}
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
              <button type="submit" className="btn-primary form-grid-full" disabled={busyId === "create"}>
                {busyId === "create" ? "Guardando…" : "Registrar matrícula"}
              </button>
            </form>
          </PageSection>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <DataTablePanel
            title={`Matrículas 2026 (${total})`}
            description="Listado institucional por salón"
            searchPlaceholder="Buscar por código, nombre o apellido…"
            searchValue={query}
            onSearch={(v) => { setQuery(v); setPage(1); }}
            isEmpty={!loading && items.length === 0}
            emptyMessage="Sin matrículas para el filtro seleccionado."
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={total}
            onPageChange={setPage}
            toolbar={(
              <select
                className={INPUT_CLASS}
                aria-label="Filtrar por estado"
                value={estado}
                onChange={(e) => { setEstado(e.target.value); setPage(1); }}
              >
                <option value="activa">Activas</option>
                <option value="retirada">Retiradas</option>
                <option value="trasladada">Trasladadas</option>
                <option value="">Todas</option>
              </select>
            )}
          >
            <TableWrap>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Estudiante</th>
                  <th>Salón</th>
                  <th>Año</th>
                  <th>Estado</th><th>Administrar</th>
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
                    <td>
                      {m.estado === "activa" ? (
                        <span className="flex flex-wrap gap-1">
                          <button type="button" className="btn-ghost text-xs" disabled={busyId === m.id} onClick={() => void changeState(m, "retirada")}>
                            Retirar
                          </button>
                          <button type="button" className="btn-ghost text-xs" disabled={busyId === m.id} onClick={() => void changeState(m, "trasladada")}>
                            Trasladar
                          </button>
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">—</span>
                      )}
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
