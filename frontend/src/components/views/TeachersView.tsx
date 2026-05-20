"use client";

import type { Teacher } from "@/types/academic";

type TeachersViewProps = {
  teachers: Teacher[];
};

export function TeachersView({ teachers }: TeachersViewProps) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-base font-semibold text-slate-900">Docentes</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-2">Código</th>
              <th className="py-2">Docente</th>
              <th className="py-2">Especialidad</th>
              <th className="py-2">Correo</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="border-b border-slate-100">
                <td className="py-2 font-medium">{teacher.codigo}</td>
                <td className="py-2">
                  {teacher.nombres} {teacher.apellidos}
                </td>
                <td className="py-2">{teacher.especialidad}</td>
                <td className="py-2 text-slate-600">{teacher.correo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
