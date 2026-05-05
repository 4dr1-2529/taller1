"use client";

import clsx from "clsx";
import type { FormEvent } from "react";
import { attachPredictions } from "@/lib/aggregates";
import type { LmsEngagement, Student, StudentStatus } from "@/types/academic";

function riskDot(level: string) {
  return clsx(
    "inline-block h-2.5 w-2.5 rounded-full",
    level === "alto" && "bg-rose-500",
    level === "medio" && "bg-amber-500",
    level === "bajo" && "bg-emerald-500",
  );
}

type NewStudentForm = {
  codigo: string;
  nombres: string;
  apellidos: string;
  nivel: string;
  correo: string;
  telefono: string;
  estado: StudentStatus;
  promedioGeneral: string;
  asistenciaGeneral: string;
  engagement: LmsEngagement;
};

const defaultForm: NewStudentForm = {
  codigo: "",
  nombres: "",
  apellidos: "",
  nivel: "",
  correo: "",
  telefono: "",
  estado: "activo",
  promedioGeneral: "13",
  asistenciaGeneral: "85",
  engagement: "medio",
};

type StudentsViewProps = {
  students: Student[];
  newStudent: NewStudentForm;
  setNewStudent: (v: NewStudentForm | ((p: NewStudentForm) => NewStudentForm)) => void;
  onAddStudent: (e: FormEvent<HTMLFormElement>) => void;
};

export function StudentsView({ students, newStudent, setNewStudent, onAddStudent }: StudentsViewProps) {
  const withPred = attachPredictions(students);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Registrar estudiante</h3>
        <p className="text-sm text-slate-600">
          Los campos académicos alimentan el modelo ensemble; si los omites, se usan valores por defecto
          razonables.
        </p>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onAddStudent}>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Código"
            value={newStudent.codigo}
            onChange={(e) => setNewStudent((p) => ({ ...p, codigo: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Nombres"
            value={newStudent.nombres}
            onChange={(e) => setNewStudent((p) => ({ ...p, nombres: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Apellidos"
            value={newStudent.apellidos}
            onChange={(e) => setNewStudent((p) => ({ ...p, apellidos: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Nivel"
            value={newStudent.nivel}
            onChange={(e) => setNewStudent((p) => ({ ...p, nivel: e.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Correo"
            type="email"
            value={newStudent.correo}
            onChange={(e) => setNewStudent((p) => ({ ...p, correo: e.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Teléfono"
            value={newStudent.telefono}
            onChange={(e) => setNewStudent((p) => ({ ...p, telefono: e.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Promedio general (0–20)"
            inputMode="decimal"
            value={newStudent.promedioGeneral}
            onChange={(e) => setNewStudent((p) => ({ ...p, promedioGeneral: e.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Asistencia %"
            inputMode="numeric"
            value={newStudent.asistenciaGeneral}
            onChange={(e) => setNewStudent((p) => ({ ...p, asistenciaGeneral: e.target.value }))}
          />
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 sm:col-span-2"
            type="submit"
          >
            Agregar estudiante
          </button>
        </form>
      </article>

      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-slate-900">Estudiantes y riesgo calculado</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2">Código</th>
                <th className="py-2">Estudiante</th>
                <th className="py-2">Prom.</th>
                <th className="py-2">Asist.</th>
                <th className="py-2">Riesgo</th>
              </tr>
            </thead>
            <tbody>
              {withPred.map((student) => (
                <tr key={student.id} className="border-b border-slate-100">
                  <td className="py-2 font-medium">{student.codigo}</td>
                  <td className="py-2">
                    {student.nombres} {student.apellidos}
                  </td>
                  <td className="py-2">{student.metrics.promedioGeneral.toFixed(1)}</td>
                  <td className="py-2">{student.metrics.asistenciaGeneral}%</td>
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
      </article>
    </div>
  );
}

export { defaultForm as defaultStudentForm };
export type { NewStudentForm };
