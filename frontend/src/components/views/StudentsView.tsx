"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { attachPredictions } from "@/lib/aggregates";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import type { LmsEngagement, Student, StudentStatus } from "@/types/academic";
import { PageSection } from "@/components/ui/PageSection";
import { FormField } from "@/components/ui/FormField";
import { DataTablePanel, useTableFilter } from "@/components/ui/DataTablePanel";
import { TableWrap } from "@/components/ui/DataTablePanel";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { INPUT_CLASS } from "@/lib/ui";

export type NewStudentForm = {
  codigo: string;
  nombres: string;
  apellidos: string;
  seccionId: string;
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
  const filtered = useTableFilter(
    withPred,
    search,
    (s) => `${s.codigo} ${s.nombres} ${s.apellidos} ${s.nivel}`,
  );

  return (
    <div className="grid gap-8 xl:grid-cols-2">
      <PageSection
        variant="form"
        icon={UserPlus}
        title="Registrar estudiante"
        description="Asigne grado y sección. Los indicadores alimentan el modelo ensemble de riesgo de deserción."
      >
        <form className="form-grid" onSubmit={onAddStudent}>
          <FormField label="Código">
            <input
              className={INPUT_CLASS}
              placeholder="Ej. 2024-001"
              value={newStudent.codigo}
              onChange={(e) => setNewStudent((p) => ({ ...p, codigo: e.target.value }))}
              required
            />
          </FormField>
          <FormField label="Nombres">
            <input
              className={INPUT_CLASS}
              value={newStudent.nombres}
              onChange={(e) => setNewStudent((p) => ({ ...p, nombres: e.target.value }))}
              required
            />
          </FormField>
          <FormField label="Apellidos" className="form-grid-full sm:col-span-2">
            <input
              className={INPUT_CLASS}
              value={newStudent.apellidos}
              onChange={(e) => setNewStudent((p) => ({ ...p, apellidos: e.target.value }))}
              required
            />
          </FormField>
          <FormField label="Sección" className="form-grid-full">
            <select
              className={INPUT_CLASS}
              value={newStudent.seccionId}
              onChange={(e) => setNewStudent((p) => ({ ...p, seccionId: e.target.value }))}
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
          <FormField label="Correo (opcional)">
            <input
              type="email"
              className={INPUT_CLASS}
              value={newStudent.correo}
              onChange={(e) => setNewStudent((p) => ({ ...p, correo: e.target.value }))}
            />
          </FormField>
          <FormField label="Teléfono">
            <input
              className={INPUT_CLASS}
              value={newStudent.telefono}
              onChange={(e) => setNewStudent((p) => ({ ...p, telefono: e.target.value }))}
            />
          </FormField>
          <FormField label="Promedio (0–20)">
            <input
              className={INPUT_CLASS}
              inputMode="decimal"
              value={newStudent.promedioGeneral}
              onChange={(e) => setNewStudent((p) => ({ ...p, promedioGeneral: e.target.value }))}
            />
          </FormField>
          <FormField label="Asistencia %">
            <input
              className={INPUT_CLASS}
              inputMode="numeric"
              value={newStudent.asistenciaGeneral}
              onChange={(e) => setNewStudent((p) => ({ ...p, asistenciaGeneral: e.target.value }))}
            />
          </FormField>
          <FormField label="Engagement LMS">
            <select
              className={INPUT_CLASS}
              value={newStudent.engagement}
              onChange={(e) =>
                setNewStudent((p) => ({ ...p, engagement: e.target.value as LmsEngagement }))
              }
            >
              <option value="alto">Alto</option>
              <option value="medio">Medio</option>
              <option value="bajo">Bajo</option>
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

      <DataTablePanel
        title="Estudiantes y riesgo"
        description="Score de deserción calculado por el ensemble."
        searchPlaceholder="Buscar por nombre o código…"
        searchValue={search}
        onSearch={setSearch}
        isEmpty={filtered.length === 0}
        emptyMessage="No hay estudiantes registrados."
      >
        <TableWrap>
          <thead>
            <tr>
              <th>Código</th>
              <th>Estudiante</th>
              <th>Sección</th>
              <th>Prom.</th>
              <th>Riesgo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((student) => (
              <tr key={student.id}>
                <td className="font-medium">{student.codigo}</td>
                <td>
                  {student.nombres} {student.apellidos}
                </td>
                <td className="text-xs text-[var(--text-secondary)]">{student.nivel}</td>
                <td>{student.metrics.promedioGeneral.toFixed(1)}</td>
                <td>
                  <RiskBadge level={student.prediction.level} score={student.prediction.score} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </DataTablePanel>
    </div>
  );
}
