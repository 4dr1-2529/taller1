"use client";

import type { Course, Teacher } from "@/types/academic";

type CoursesViewProps = {
  courses: Course[];
  teachers: Teacher[];
};

export function CoursesView({ courses, teachers }: CoursesViewProps) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-base font-semibold text-slate-900">Cursos</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-2">Código</th>
              <th className="py-2">Curso</th>
              <th className="py-2">Nivel</th>
              <th className="py-2">Profesor</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => {
              const teacher = teachers.find((item) => item.id === course.profesorId);
              return (
                <tr key={course.id} className="border-b border-slate-100">
                  <td className="py-2 font-medium">{course.codigo}</td>
                  <td className="py-2">{course.nombre}</td>
                  <td className="py-2">{course.nivel}</td>
                  <td className="py-2">
                    {teacher ? `${teacher.nombres} ${teacher.apellidos}` : "Sin asignar"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
