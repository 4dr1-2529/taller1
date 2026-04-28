"use client";

import { useMemo, useState } from "react";
import { DashboardCard } from "@/components/DashboardCard";
import { Sidebar } from "@/components/Sidebar";

type StudentStatus = "activo" | "en riesgo" | "retirado";
type RiskLevel = "bajo" | "medio" | "alto";

type Student = {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  nivel: string;
  correo: string;
  telefono: string;
  estado: StudentStatus;
};

type Teacher = {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  correo: string;
  telefono: string;
};

type Course = {
  id: string;
  codigo: string;
  nombre: string;
  nivel: string;
  profesorId: string;
};

const sections = [
  "Dashboard",
  "Estudiantes",
  "Profesores",
  "Cursos",
  "Matriculas",
  "Datos academicos",
  "Actividad LMS",
  "Prediccion",
  "Reportes",
];

const initialStudents: Student[] = [
  {
    id: "s1",
    codigo: "ST-001",
    nombres: "Lucia",
    apellidos: "Paredes",
    nivel: "4to Secundaria",
    correo: "lucia.paredes@colegio.edu.pe",
    telefono: "987654321",
    estado: "activo",
  },
  {
    id: "s2",
    codigo: "ST-002",
    nombres: "Carlos",
    apellidos: "Rojas",
    nivel: "5to Secundaria",
    correo: "carlos.rojas@colegio.edu.pe",
    telefono: "912345678",
    estado: "en riesgo",
  },
];

const initialTeachers: Teacher[] = [
  {
    id: "t1",
    codigo: "PR-001",
    nombres: "Ana",
    apellidos: "Quispe",
    especialidad: "Matematica",
    correo: "ana.quispe@colegio.edu.pe",
    telefono: "999111222",
  },
  {
    id: "t2",
    codigo: "PR-002",
    nombres: "Luis",
    apellidos: "Mendoza",
    especialidad: "Comunicacion",
    correo: "luis.mendoza@colegio.edu.pe",
    telefono: "988777666",
  },
];

const initialCourses: Course[] = [
  { id: "c1", codigo: "CU-101", nombre: "Algebra", nivel: "4to Secundaria", profesorId: "t1" },
  { id: "c2", codigo: "CU-201", nombre: "Literatura", nivel: "5to Secundaria", profesorId: "t2" },
];

const riskByLevel = [
  { nivel: "Bajo", valor: 56, color: "bg-emerald-500" },
  { nivel: "Medio", valor: 29, color: "bg-amber-500" },
  { nivel: "Alto", valor: 15, color: "bg-rose-500" },
];

const avgByCourse = [
  { curso: "Algebra", valor: 14.2 },
  { curso: "Literatura", valor: 12.8 },
  { curso: "Ciencias", valor: 13.6 },
];

const lmsByWeek = [
  { semana: "Sem 1", valor: 62 },
  { semana: "Sem 2", valor: 74 },
  { semana: "Sem 3", valor: 69 },
  { semana: "Sem 4", valor: 80 },
];

function getPredictionFromRule(student: Student): { risk: RiskLevel; score: number } {
  if (student.estado === "en riesgo") {
    return { risk: "alto", score: 0.84 };
  }
  if (student.estado === "retirado") {
    return { risk: "alto", score: 0.93 };
  }
  return { risk: "bajo", score: 0.2 };
}

export default function Home() {
  const [activeSection, setActiveSection] = useState(sections[0]);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [teachers] = useState<Teacher[]>(initialTeachers);
  const [courses] = useState<Course[]>(initialCourses);
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudents[0]?.id ?? "");

  const [newStudent, setNewStudent] = useState({
    codigo: "",
    nombres: "",
    apellidos: "",
    nivel: "",
    correo: "",
    telefono: "",
    estado: "activo" as StudentStatus,
  });

  const prediction = useMemo(() => {
    const found = students.find((s) => s.id === selectedStudentId);
    if (!found) {
      return null;
    }
    return getPredictionFromRule(found);
  }, [selectedStudentId, students]);

  const studentsAtRisk = students.filter((s) => s.estado === "en riesgo").length;

  const addStudent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newStudent.codigo || !newStudent.nombres || !newStudent.apellidos) {
      return;
    }
    setStudents((prev) => [
      ...prev,
      {
        id: `s-${Date.now()}`,
        ...newStudent,
      },
    ]);
    setNewStudent({
      codigo: "",
      nombres: "",
      apellidos: "",
      nivel: "",
      correo: "",
      telefono: "",
      estado: "activo",
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <Sidebar sections={sections} activeSection={activeSection} onSelect={setActiveSection} />

      <main className="flex-1 space-y-6 p-4 md:p-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">I.E.P. Blenkir Huancayo</p>
          <h2 className="mt-1 text-2xl font-bold">
            Modelo Predictivo de Riesgo de Desercion Estudiantil
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Modulo activo: <span className="font-semibold">{activeSection}</span>
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard title="Total de estudiantes" value={students.length} />
          <DashboardCard title="Total de cursos" value={courses.length} />
          <DashboardCard title="Total de profesores" value={teachers.length} />
          <DashboardCard
            title="Estudiantes en riesgo"
            value={studentsAtRisk}
            subtitle="Seguimiento de alerta temprana"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">Riesgo de desercion por nivel</h3>
            <div className="mt-4 space-y-3">
              {riskByLevel.map((item) => (
                <div key={item.nivel}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{item.nivel}</span>
                    <span>{item.valor}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.valor}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">Promedio academico por curso</h3>
            <div className="mt-4 space-y-3">
              {avgByCourse.map((item) => (
                <div key={item.curso}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{item.curso}</span>
                    <span>{item.valor.toFixed(1)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${item.valor * 6}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">Actividad LMS por semana</h3>
            <div className="mt-4 flex items-end gap-3">
              {lmsByWeek.map((item) => (
                <div key={item.semana} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-md bg-cyan-500"
                    style={{ height: `${item.valor * 1.2}px`, minHeight: "8px" }}
                  />
                  <span className="text-xs text-slate-600">{item.semana}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">Registrar estudiante</h3>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={addStudent}>
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Codigo"
                value={newStudent.codigo}
                onChange={(e) => setNewStudent((prev) => ({ ...prev, codigo: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Nombres"
                value={newStudent.nombres}
                onChange={(e) => setNewStudent((prev) => ({ ...prev, nombres: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Apellidos"
                value={newStudent.apellidos}
                onChange={(e) => setNewStudent((prev) => ({ ...prev, apellidos: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Nivel"
                value={newStudent.nivel}
                onChange={(e) => setNewStudent((prev) => ({ ...prev, nivel: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Correo"
                value={newStudent.correo}
                onChange={(e) => setNewStudent((prev) => ({ ...prev, correo: e.target.value }))}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Telefono"
                value={newStudent.telefono}
                onChange={(e) => setNewStudent((prev) => ({ ...prev, telefono: e.target.value }))}
              />
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={newStudent.estado}
                onChange={(e) => setNewStudent((prev) => ({ ...prev, estado: e.target.value as StudentStatus }))}
              >
                <option value="activo">Activo</option>
                <option value="en riesgo">En riesgo</option>
                <option value="retirado">Retirado</option>
              </select>
              <button
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                type="submit"
              >
                Agregar estudiante
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">Prediccion simulada de riesgo</h3>
            <div className="mt-4 space-y-3">
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.nombres} {student.apellidos}
                  </option>
                ))}
              </select>
              {prediction ? (
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-600">Nivel de riesgo estimado</p>
                  <p className="text-2xl font-bold capitalize text-slate-900">{prediction.risk}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Score simulado: {(prediction.score * 100).toFixed(0)}%
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-600">No hay estudiante seleccionado.</p>
              )}
            </div>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold">Tabla de estudiantes</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2">Codigo</th>
                    <th className="py-2">Estudiante</th>
                    <th className="py-2">Nivel</th>
                    <th className="py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-slate-100">
                      <td className="py-2">{student.codigo}</td>
                      <td className="py-2">{student.nombres} {student.apellidos}</td>
                      <td className="py-2">{student.nivel}</td>
                      <td className="py-2 capitalize">{student.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold">Tabla de profesores</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2">Codigo</th>
                    <th className="py-2">Docente</th>
                    <th className="py-2">Especialidad</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="border-b border-slate-100">
                      <td className="py-2">{teacher.codigo}</td>
                      <td className="py-2">{teacher.nombres} {teacher.apellidos}</td>
                      <td className="py-2">{teacher.especialidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-base font-semibold">Tabla de cursos</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2">Codigo</th>
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
                      <td className="py-2">{course.codigo}</td>
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
        </section>
      </main>
    </div>
  );
}
