"use client";

import { api } from "@/services/api";
import { useState } from "react";
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
  const filtered = useTableFilter(
    withPred,
    search,
    (s) => `${s.codigo} ${s.nombres} ${s.apellidos} ${s.nivel}`,
  );

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
            title="Estudiantes y riesgo"
            description="Puntaje de deserción calculado por el modelo conjunto."
            searchPlaceholder="Buscar por nombre o código…"
            searchValue={search}
            onSearch={setSearch}
            isEmpty={filtered.length === 0}
            emptyMessage="No hay estudiantes registrados."
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
                {filtered.map((student) => (
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
                    {canEdit && <td><button type="button" className="text-rose-500" onClick={async () => {
                      try { await api.call('/students/' + student.id, { method: 'DELETE' }); toast.success('Estudiante desactivado'); onRefresh?.(); }
                      catch(e) { toast.error(e instanceof Error ? e.message : 'No se pudo desactivar'); }
                    }}>Desactivar</button></td>}
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
