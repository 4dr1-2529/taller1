"use client";

import { api } from "@/services/api";
import { mapStudentFromApi } from "@/lib/api-mappers";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { MiniProgressBar } from "@/components/ui/MiniProgressBar";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import type { Student } from "@/types/academic";
import { PageSection } from "@/components/ui/PageSection";
import { FormField } from "@/components/ui/FormField";
import { DataTablePanel, useTableFilter } from "@/components/ui/DataTablePanel";
import { TableWrap } from "@/components/ui/DataTablePanel";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { INPUT_CLASS } from "@/lib/ui";
import {
  DniInput,
  PersonNameInput,
  PhoneInput,
} from "@/components/ui/ValidatedInputs";
import {
  type FieldErrors,
  firstError,
  validateDni,
  validateEmail,
  validatePersonName,
  validatePhone,
  validateStudentForm,
  clearFieldError,
} from "@/lib/validation";

export type NewStudentForm = {
  nombres: string;
  apellidos: string;
  seccionId: string;
  dni: string;
  correo: string;
  telefono: string;
};

export const defaultStudentForm: NewStudentForm = {
  nombres: "",
  apellidos: "",
  seccionId: "",
  dni: "",
  correo: "",
  telefono: "",
};

type StudentsViewProps = {
  students: Student[];
  secciones: SeccionOption[];
  newStudent: NewStudentForm;
  setNewStudent: (v: NewStudentForm | ((p: NewStudentForm) => NewStudentForm)) => void;
  onAddStudent: (e: FormEvent<HTMLFormElement>) => void;
  canEdit?: boolean;
  onRefresh?: () => void;
};

export function StudentsView({
  students,
  secciones,
  newStudent,
  setNewStudent,
  onAddStudent,
  canEdit = true,
  onRefresh,
}: StudentsViewProps) {
  const withPred = students;
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(students.length);
  const [serverRows, setServerRows] = useState<Student[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ nombres: "", apellidos: "", dni: "", correo: "", telefono: "" });
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setTotal((t) => (serverRows ? t : students.length));
  }, [students.length, serverRows]);

  useEffect(() => {
    if (!api.hasToken) {
      setServerRows(null);
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await api.getStudents(page, PAGE_SIZE, search.trim());
          setServerRows(
            res.items.map((r) => mapStudentFromApi(r as Parameters<typeof mapStudentFromApi>[0])),
          );
          setTotal(res.total);
        } catch {
          setServerRows(null);
        }
      })();
    }, 350);
    return () => clearTimeout(timer);
  }, [page, search, reloadKey]);

  const filtered = useTableFilter(
    withPred,
    serverRows ? "" : search,
    (s) => `${s.codigo} ${s.nombres} ${s.apellidos} ${s.nivel}`,
  );
  const rows = serverRows ?? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalItems = serverRows ? total : filtered.length;

  function startEdit(s: Student) {
    setEditing(s);
    setEditForm({
      nombres: s.nombres,
      apellidos: s.apellidos,
      dni: s.dni ?? "",
      correo: s.correo ?? "",
      telefono: s.telefono ?? "",
    });
    setEditErrors({});
  }

  async function submitEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing || busy) return;
    const nextErrors: FieldErrors = {};
    const vN = validatePersonName(editForm.nombres, "Nombres");
    if (vN) nextErrors.nombres = vN;
    const vA = validatePersonName(editForm.apellidos, "Apellidos");
    if (vA) nextErrors.apellidos = vA;
    const vD = validateDni(editForm.dni, true);
    if (vD) nextErrors.dni = vD;
    const vC = validateEmail(editForm.correo, false);
    if (vC) nextErrors.correo = vC;
    const vT = validatePhone(editForm.telefono, false);
    if (vT) nextErrors.telefono = vT;
    setEditErrors(nextErrors);
    const msg = firstError(nextErrors);
    if (msg) {
      toast.error(msg);
      return;
    }
    setBusy("edit");
    try {
      await api.updateStudent(editing.id, {
        nombres: editForm.nombres.trim(),
        apellidos: editForm.apellidos.trim(),
        dni: editForm.dni.trim(),
        correo: editForm.correo.trim() || undefined,
        telefono: editForm.telefono.trim() || null,
      });
      toast.success("Estudiante actualizado");
      setEditing(null);
      onRefresh?.();
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar");
    } finally {
      setBusy(null);
    }
  }

  async function deactivate(s: Student) {
    if (busy) return;
    if (!window.confirm(`Desactivar a ${s.nombres} ${s.apellidos} (${s.codigo})? Se conserva su historial.`)) return;
    setBusy(s.id);
    try {
      await api.call('/students/' + s.id, { method: 'DELETE' });
      toast.success('Estudiante desactivado');
      onRefresh?.();
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo desactivar');
    } finally {
      setBusy(null);
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
  };


  return (
    <div className="space-y-6">
      <div className={canEdit ? "grid gap-6 xl:grid-cols-2" : ""}>
        {canEdit && (
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <PageSection
            variant="form"
            icon={UserPlus}
            title="Registrar estudiante 2026"
            description="Asigne grado y sección. La matrícula y la cuenta se crean al registrar."
          >
            <form
              className="form-grid"
              onSubmit={(e) => {
                e.preventDefault();
                const nextErrors = validateStudentForm(newStudent);
                setErrors(nextErrors);
                const msg = firstError(nextErrors);
                if (msg) {
                  toast.error(msg);
                  return;
                }
                onAddStudent(e);
              }}
            >
              <FormField label="Código automático"><input className={INPUT_CLASS} value="EST-… (asignado al registrar)" readOnly /></FormField>
              <FormField label="DNI" error={errors.dni} hint="8 dígitos obligatorios">
                <DniInput
                  autoComplete="off"
                  placeholder="12345678"
                  value={newStudent.dni}
                  onValueChange={(dni) => {
                    setErrors((p) => clearFieldError(p, "dni"));
                    setNewStudent((p) => ({ ...p, dni }));
                  }}
                />
              </FormField>
              <FormField label="Nombres" error={errors.nombres}>
                <PersonNameInput
                  value={newStudent.nombres}
                  onValueChange={(nombres) => {
                    setErrors((p) => clearFieldError(p, "nombres"));
                    setNewStudent((p) => ({ ...p, nombres }));
                  }}
                  required
                />
              </FormField>
              <FormField label="Apellidos" className="form-grid-full sm:col-span-2" error={errors.apellidos}>
                <PersonNameInput
                  value={newStudent.apellidos}
                  onValueChange={(apellidos) => {
                    setErrors((p) => clearFieldError(p, "apellidos"));
                    setNewStudent((p) => ({ ...p, apellidos }));
                  }}
                  required
                />
              </FormField>
              <FormField label="Sección" className="form-grid-full" error={errors.seccionId}>
                <select
                  className={INPUT_CLASS}
                  value={newStudent.seccionId}
                  onChange={(e) => {
                    setErrors((p) => clearFieldError(p, "seccionId"));
                    setNewStudent((p) => ({ ...p, seccionId: e.target.value }));
                  }}
                  required
                >
                  <option value="">Seleccione sección (grado · salón)</option>
                  {secciones.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </FormField>
              {secciones.length === 0 ? (
                <p className="form-grid-full text-xs text-[var(--risk-medium)]">
                  No hay secciones disponibles. Configure la estructura académica.
                </p>
              ) : null}
              <FormField label="Correo (opcional)" error={errors.correo}>
                <input
                  type="email"
                  className={INPUT_CLASS}
                  value={newStudent.correo}
                  onChange={(e) => {
                    setErrors((p) => clearFieldError(p, "correo"));
                    setNewStudent((p) => ({ ...p, correo: e.target.value }));
                  }}
                />
              </FormField>
              <FormField
                label="Teléfono"
                error={errors.telefono}
                hint="9 dígitos, solo números"
              >
                <PhoneInput
                  autoComplete="tel"
                  placeholder="987654321"
                  value={newStudent.telefono}
                  onValueChange={(telefono) => {
                    setErrors((p) => clearFieldError(p, "telefono"));
                    setNewStudent((p) => ({ ...p, telefono }));
                  }}
                />
              </FormField>
              <button type="submit" className="btn-primary form-grid-full">
                Agregar estudiante
              </button>
            </form>
          </PageSection>
        </motion.div>
        )}

        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <DataTablePanel
            title={`Estudiantes (${total})`}
            description="Puntaje de deserción calculado por el modelo conjunto."
            searchPlaceholder="Buscar por nombre o código…"
            searchValue={search}
            onSearch={(v) => { setSearch(v); setPage(1); }}
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={totalItems}
            onPageChange={setPage}
            isEmpty={rows.length === 0}
            emptyMessage={search ? "No existen registros para los filtros seleccionados." : "No hay estudiantes registrados."}
          >
            <TableWrap>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Sección</th>
                  <th>Promedio</th>
                  <th>Asistencia</th>
                  <th>Riesgo (IA)</th>
                  {canEdit && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="avatar-chip">
                          {student.nombres.charAt(0)}
                          {student.apellidos.charAt(0)}
                        </span>
                        <div>
                          <p className="font-medium">
                            {student.nombres} {student.apellidos}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">{student.codigo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-[var(--text-secondary)]">{student.nivel}</td>
                    <td>
                      <span className="font-semibold tabular-nums">
                        {student.metrics.promedioGeneral.toFixed(1)}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]"> / 20</span>
                    </td>
                    <td>
                      <MiniProgressBar
                        value={student.metrics.asistenciaGeneral}
                        variant={
                          student.metrics.asistenciaGeneral >= 85
                            ? "emerald"
                            : student.metrics.asistenciaGeneral >= 70
                              ? "amber"
                              : "rose"
                        }
                      />
                    </td>
                    <td>
                      {student.storedPrediction ? <RiskBadge level={student.storedPrediction.level} score={student.storedPrediction.score} /> : <span>Sin predicción</span>}
                    </td>
                    {canEdit && <td><span className="flex flex-wrap gap-1">
                      <button type="button" className="btn-ghost text-xs" disabled={busy !== null} onClick={() => startEdit(student)}>Editar</button>
                      <button type="button" className="text-rose-500 disabled:opacity-40" disabled={busy !== null} onClick={() => void deactivate(student)}>Desactivar</button>
                    </span></td>}
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </DataTablePanel>
        </motion.div>
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Editar estudiante">
          <form
            className="form-grid w-full max-w-lg rounded-2xl bg-[var(--surface-elevated)] p-6"
            onSubmit={(e) => void submitEdit(e)}
          >
            <h3 className="form-grid-full text-lg font-semibold">Editar estudiante {editing.codigo}</h3>
            <FormField label="Nombres" error={editErrors.nombres}>
              <PersonNameInput value={editForm.nombres} onValueChange={(nombres) => { setEditErrors((p) => clearFieldError(p, "nombres")); setEditForm((p) => ({ ...p, nombres })); }} required />
            </FormField>
            <FormField label="Apellidos" error={editErrors.apellidos}>
              <PersonNameInput value={editForm.apellidos} onValueChange={(apellidos) => { setEditErrors((p) => clearFieldError(p, "apellidos")); setEditForm((p) => ({ ...p, apellidos })); }} required />
            </FormField>
            <FormField label="DNI" error={editErrors.dni}>
              <DniInput value={editForm.dni} onValueChange={(dni) => { setEditErrors((p) => clearFieldError(p, "dni")); setEditForm((p) => ({ ...p, dni })); }} required />
            </FormField>
            <FormField label="Correo (opcional)" error={editErrors.correo}>
              <input type="email" className={INPUT_CLASS} value={editForm.correo} onChange={(e) => { setEditErrors((p) => clearFieldError(p, "correo")); setEditForm((p) => ({ ...p, correo: e.target.value })); }} />
            </FormField>
            <FormField label="Teléfono" error={editErrors.telefono}>
              <PhoneInput value={editForm.telefono} onValueChange={(telefono) => { setEditErrors((p) => clearFieldError(p, "telefono")); setEditForm((p) => ({ ...p, telefono })); }} />
            </FormField>
            <div className="form-grid-full flex justify-end gap-2">
              <button type="button" className="btn-ghost" disabled={busy !== null} onClick={() => setEditing(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={busy !== null}>{busy === "edit" ? "Guardando…" : "Guardar cambios"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
