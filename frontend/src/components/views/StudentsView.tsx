"use client";

import clsx from "clsx";
import type { FormEvent } from "react";
import { attachPredictions } from "@/lib/aggregates";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import type { LmsEngagement, Student, StudentStatus } from "@/types/academic";

function riskDot(level: string) {
  return clsx(
    "inline-block h-2.5 w-2.5 rounded-full",
    level === "alto" && "bg-rose-500",
    level === "medio" && "bg-amber-500",
    level === "bajo" && "bg-emerald-500",
  );
}

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

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <article className="glass-card p-5">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Registrar estudiante</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Asigne grado y sección según el modelo educativo peruano. Los indicadores académicos alimentan el modelo
          ensemble de riesgo de deserción.
        </p>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onAddStudent}>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            placeholder="Código"
            value={newStudent.codigo}
            onChange={(e) => setNewStudent((p) => ({ ...p, codigo: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            placeholder="Nombres"
            value={newStudent.nombres}
            onChange={(e) => setNewStudent((p) => ({ ...p, nombres: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2 dark:border-slate-600 dark:bg-slate-900"
            placeholder="Apellidos"
            value={newStudent.apellidos}
            onChange={(e) => setNewStudent((p) => ({ ...p, apellidos: e.target.value }))}
            required
          />
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2 dark:border-slate-600 dark:bg-slate-900"
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
          {secciones.length === 0 ? (
            <p className="text-xs text-amber-700 dark:text-amber-300 sm:col-span-2">
              Ejecute `npm run db:seed` para cargar niveles, grados y secciones del colegio.
            </p>
          ) : null}
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            placeholder="Correo (opcional)"
            type="email"
            value={newStudent.correo}
            onChange={(e) => setNewStudent((p) => ({ ...p, correo: e.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            placeholder="Teléfono"
            value={newStudent.telefono}
            onChange={(e) => setNewStudent((p) => ({ ...p, telefono: e.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            placeholder="Promedio general (0–20)"
            inputMode="decimal"
            value={newStudent.promedioGeneral}
            onChange={(e) => setNewStudent((p) => ({ ...p, promedioGeneral: e.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            placeholder="Asistencia %"
            inputMode="numeric"
            value={newStudent.asistenciaGeneral}
            onChange={(e) => setNewStudent((p) => ({ ...p, asistenciaGeneral: e.target.value }))}
          />
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            value={newStudent.engagement}
            onChange={(e) =>
              setNewStudent((p) => ({ ...p, engagement: e.target.value as LmsEngagement }))
            }
          >
            <option value="alto">Engagement LMS: alto</option>
            <option value="medio">Engagement LMS: medio</option>
            <option value="bajo">Engagement LMS: bajo</option>
          </select>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            value={newStudent.estado}
            onChange={(e) =>
              setNewStudent((p) => ({ ...p, estado: e.target.value as StudentStatus }))
            }
          >
            <option value="activo">Activo</option>
            <option value="en riesgo">En riesgo</option>
            <option value="retirado">Retirado</option>
          </select>
          <button
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 sm:col-span-2"
            type="submit"
          >
            Agregar estudiante
          </button>
        </form>
      </article>

      <article className="glass-card p-5">
        <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
          Estudiantes y riesgo calculado
        </h3>
        {withPred.length === 0 ? (
          <p className="text-sm text-slate-500">No hay estudiantes registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700">
                <tr>
                  <th className="py-2">Código</th>
                  <th className="py-2">Estudiante</th>
                  <th className="py-2">Sección</th>
                  <th className="py-2">Prom.</th>
                  <th className="py-2">Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {withPred.map((student) => (
                  <tr key={student.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 font-medium">{student.codigo}</td>
                    <td className="py-2">
                      {student.nombres} {student.apellidos}
                    </td>
                    <td className="py-2 text-xs">{student.nivel}</td>
                    <td className="py-2">{student.metrics.promedioGeneral.toFixed(1)}</td>
                    <td className="py-2">
                      <span className="inline-flex items-center gap-2 capitalize">
                        <span className={riskDot(student.prediction.level)} />
                        {student.prediction.level} ({Math.round(student.prediction.score)})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
