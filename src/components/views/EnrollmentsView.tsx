"use client";

import type { FormEvent } from "react";
import type { Course, Enrollment, Student } from "@/types/academic";

export type NewEnrollmentForm = {
  studentId: string;
  courseId: string;
  promedio: string;
  asistenciaPct: string;
};

type EnrollmentsViewProps = {
  enrollments: Enrollment[];
  students: Student[];
  courses: Course[];
  form: NewEnrollmentForm;
  setForm: (v: NewEnrollmentForm | ((p: NewEnrollmentForm) => NewEnrollmentForm)) => void;
  onAdd: (e: FormEvent<HTMLFormElement>) => void;
};

export function EnrollmentsView({
  enrollments,
  students,
  courses,
  form,
  setForm,
  onAdd,
}: EnrollmentsViewProps) {
  return (
    <div className="space-y-6">
      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Nueva matrícula / vínculo curso</h3>
        <p className="text-sm text-slate-600">
          Registra el desempeño por curso; alimenta reportes de desaprobados y comparativas.
        </p>
        <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={onAdd}>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
            value={form.studentId}
            onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
            required
          >
            <option value="">Selecciona estudiante</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombres} {s.apellidos}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
            value={form.courseId}
            onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))}
            required
          >
            <option value="">Selecciona curso</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Promedio curso (0–20)"
            value={form.promedio}
            onChange={(e) => setForm((p) => ({ ...p, promedio: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Asistencia curso %"
            value={form.asistenciaPct}
            onChange={(e) => setForm((p) => ({ ...p, asistenciaPct: e.target.value }))}
            required
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 md:col-span-2"
          >
            Guardar matrícula
          </button>
        </form>
      </article>

      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-slate-900">Matrículas registradas</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2">Estudiante</th>
                <th className="py-2">Curso</th>
                <th className="py-2">Promedio</th>
                <th className="py-2">Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => {
                const st = students.find((s) => s.id === e.studentId);
                const c = courses.find((x) => x.id === e.courseId);
                return (
                  <tr key={e.id} className="border-b border-slate-100">
                    <td className="py-2">
                      {st ? `${st.nombres} ${st.apellidos}` : e.studentId}
                    </td>
                    <td className="py-2">{c?.nombre ?? e.courseId}</td>
                    <td className="py-2">{e.promedio.toFixed(1)}</td>
                    <td className="py-2">{e.asistenciaPct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
