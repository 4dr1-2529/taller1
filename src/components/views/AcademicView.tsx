"use client";

import clsx from "clsx";
import { attachPredictions } from "@/lib/aggregates";
import type { Course, Enrollment, Student } from "@/types/academic";

type AcademicViewProps = {
  students: Student[];
  courses: Course[];
  enrollments: Enrollment[];
};

export function AcademicView({ students, courses, enrollments }: AcademicViewProps) {
  const withPred = attachPredictions(students);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        {withPred.map((s) => (
          <article
            key={s.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-semibold text-slate-900">
                  {s.nombres} {s.apellidos}
                </h4>
                <p className="text-xs text-slate-500">{s.nivel}</p>
              </div>
              <span
                className={clsx(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                  s.prediction.level === "alto" && "bg-rose-100 text-rose-800",
                  s.prediction.level === "medio" && "bg-amber-100 text-amber-900",
                  s.prediction.level === "bajo" && "bg-emerald-100 text-emerald-900",
                )}
              >
                Riesgo {s.prediction.level}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Promedio general</dt>
                <dd className="font-semibold text-slate-900">{s.metrics.promedioGeneral.toFixed(1)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Asistencia</dt>
                <dd className="font-semibold text-slate-900">{s.metrics.asistenciaGeneral}%</dd>
              </div>
              <div>
                <dt className="text-slate-500">Engagement LMS</dt>
                <dd className="font-semibold capitalize text-slate-900">{s.metrics.lms.engagement}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Tareas</dt>
                <dd className="font-semibold text-slate-900">
                  {s.metrics.lms.tareasEntregadas}/{s.metrics.lms.tareasTotales}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-slate-900">Notas por curso (matrícula)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2">Estudiante</th>
                <th className="py-2">Curso</th>
                <th className="py-2">Promedio</th>
                <th className="py-2">Asistencia curso</th>
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
                    <td className="py-2">{c?.nombre}</td>
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
