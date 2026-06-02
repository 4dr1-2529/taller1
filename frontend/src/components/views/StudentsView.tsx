"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { MiniProgressBar } from "@/components/ui/MiniProgressBar";
import { attachPredictions } from "@/lib/aggregates";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import type { LmsEngagement, Student, StudentStatus } from "@/types/academic";
import { PageSection } from "@/components/ui/PageSection";
import { FormField } from "@/components/ui/FormField";
import { DataTablePanel, useTableFilter } from "@/components/ui/DataTablePanel";
import { TableWrap } from "@/components/ui/DataTablePanel";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { INPUT_CLASS } from "@/lib/ui";
import {
  DNI_LENGTH,
  PHONE_MAX_DIGITS,
  type FieldErrors,
  firstError,
  onlyDigits,
  sanitizeCodigo,
  sanitizeGradeInput,
  sanitizePercentInput,
  sanitizePersonName,
  validateStudentForm,
  clearFieldError,
} from "@/lib/validation";

export type NewStudentForm = {
  codigo: string;
  nombres: string;
  apellidos: string;
  seccionId: string;
  dni: string;
  correo: string;
  telefono: string;
  estado: StudentStatus;
  promedioGeneral: string;
  asistenciaGeneral: string;
  engagement: LmsEngagement;
};

export const defaultStudentForm: NewStudentForm = {
  codigo: "",
  nombres: "",
  apellidos: "",
  seccionId: "",
  dni: "",
  correo: "",
  telefono: "",
  estado: "activo",
  promedioGeneral: "",
  asistenciaGeneral: "",
  engagement: "medio",
};

type StudentsViewProps = {
  students: Student[];
  secciones: SeccionOption[];
  newStudent: NewStudentForm;
  setNewStudent: (v: NewStudentForm | ((p: NewStudentForm) => NewStudentForm)) => void;
  onAddStudent: (e: FormEvent<HTMLFormElement>) => void;
};

export function StudentsView({
  students,
  secciones,
  newStudent,
  setNewStudent,
  onAddStudent,
}: StudentsViewProps) {
  const withPred = attachPredictions(students);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const filtered = useTableFilter(
    withPred,
    search,
    (s) => `${s.codigo} ${s.nombres} ${s.apellidos} ${s.nivel}`,
  );

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Registration Form */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <PageSection
            variant="form"
            icon={UserPlus}
            title="Registrar estudiante"
            description="Asigne grado y sección. Los indicadores alimentan el modelo de riesgo de deserción."
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
              <FormField label="Código" error={errors.codigo} hint="Letras, números, - y _">
                <input
                  className={INPUT_CLASS}
                  placeholder="Ej. 2024-001"
                  value={newStudent.codigo}
                  onChange={(e) => {
                    setErrors((p) => clearFieldError(p, "codigo"));
                    setNewStudent((p) => ({ ...p, codigo: sanitizeCodigo(e.target.value) }));
                  }}
                  required
                />
              </FormField>
              <FormField label="DNI" error={errors.dni} hint={`${DNI_LENGTH} dígitos numéricos (Perú)`}>
                <input
                  className={INPUT_CLASS}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="12345678"
                  maxLength={DNI_LENGTH}
                  value={newStudent.dni}
                  onChange={(e) => {
                    setErrors((p) => clearFieldError(p, "dni"));
                    setNewStudent((p) => ({ ...p, dni: onlyDigits(e.target.value, DNI_LENGTH) }));
                  }}
                />
              </FormField>
              <FormField label="Nombres" error={errors.nombres}>
                <input
                  className={INPUT_CLASS}
                  value={newStudent.nombres}
                  onChange={(e) => {
                    setErrors((p) => clearFieldError(p, "nombres"));
                    setNewStudent((p) => ({ ...p, nombres: sanitizePersonName(e.target.value) }));
                  }}
                  required
                />
              </FormField>
              <FormField label="Apellidos" className="form-grid-full sm:col-span-2" error={errors.apellidos}>
                <input
                  className={INPUT_CLASS}
                  value={newStudent.apellidos}
                  onChange={(e) => {
                    setErrors((p) => clearFieldError(p, "apellidos"));
                    setNewStudent((p) => ({ ...p, apellidos: sanitizePersonName(e.target.value) }));
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
                <p className="form-grid-full text-xs text-amber-400">
                  Ejecute `npm run db:seed` para cargar niveles, grados y secciones.
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
                hint={`${PHONE_MAX_DIGITS} dígitos, solo números`}
              >
                <input
                  className={INPUT_CLASS}
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="987654321"
                  maxLength={PHONE_MAX_DIGITS}
                  value={newStudent.telefono}
                  onChange={(e) => {
                    setErrors((p) => clearFieldError(p, "telefono"));
                    setNewStudent((p) => ({
                      ...p,
                      telefono: onlyDigits(e.target.value, PHONE_MAX_DIGITS),
                    }));
                  }}
                />
              </FormField>
              <FormField label="Promedio (0–20)" error={errors.promedioGeneral} hint="Solo números">
                <input
                  className={INPUT_CLASS}
                  inputMode="decimal"
                  placeholder="0–20"
                  value={newStudent.promedioGeneral}
                  onChange={(e) => {
                    setErrors((p) => clearFieldError(p, "promedioGeneral"));
                    setNewStudent((p) => ({
                      ...p,
                      promedioGeneral: sanitizeGradeInput(e.target.value),
                    }));
                  }}
                />
              </FormField>
              <FormField label="Asistencia %" error={errors.asistenciaGeneral} hint="0–100, solo números">
                <input
                  className={INPUT_CLASS}
                  inputMode="numeric"
                  placeholder="0–100"
                  value={newStudent.asistenciaGeneral}
                  onChange={(e) => {
                    setErrors((p) => clearFieldError(p, "asistenciaGeneral"));
                    setNewStudent((p) => ({
                      ...p,
                      asistenciaGeneral: sanitizePercentInput(e.target.value),
                    }));
                  }}
                />
              </FormField>
              <FormField label="Compromiso en plataforma">
                <select
                  className={INPUT_CLASS}
                  value={newStudent.engagement}
                  onChange={(e) =>
                    setNewStudent((p) => ({ ...p, engagement: e.target.value as LmsEngagement }))
                  }
                >
                  <option value="alto">Compromiso alto</option>
                  <option value="medio">Compromiso medio</option>
                  <option value="bajo">Compromiso bajo</option>
                </select>
              </FormField>
              <FormField label="Estado">
                <select
                  className={INPUT_CLASS}
                  value={newStudent.estado}
                  onChange={(e) =>
                    setNewStudent((p) => ({ ...p, estado: e.target.value as StudentStatus }))
                  }
                >
                  <option value="activo">Activo</option>
                  <option value="en riesgo">En riesgo</option>
                  <option value="retirado">Retirado</option>
                </select>
              </FormField>
              <button type="submit" className="btn-primary form-grid-full">
                Agregar estudiante
              </button>
            </form>
          </PageSection>
        </motion.div>

        {/* Students Table */}
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
                      <RiskBadge level={student.prediction.level} score={student.prediction.score} />
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
