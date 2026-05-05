"use client";

import { type FormEvent, useMemo, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { AcademicView } from "@/components/views/AcademicView";
import { AlertsView } from "@/components/views/AlertsView";
import { CoursesView } from "@/components/views/CoursesView";
import { DashboardView } from "@/components/views/DashboardView";
import {
  EnrollmentsView,
  type NewEnrollmentForm,
} from "@/components/views/EnrollmentsView";
import { LMSView } from "@/components/views/LMSView";
import { PredictionView } from "@/components/views/PredictionView";
import { ReportsView } from "@/components/views/ReportsView";
import {
  defaultStudentForm,
  StudentsView,
  type NewStudentForm,
} from "@/components/views/StudentsView";
import { TeachersView } from "@/components/views/TeachersView";
import {
  APP_SECTIONS,
  seedCourses,
  seedEnrollments,
  seedStudents,
  seedTeachers,
  type AppSection,
} from "@/data/seed";
import { earlyAlertCount } from "@/lib/aggregates";
import { buildMetrics } from "@/lib/student-factory";
import type { Enrollment, Student } from "@/types/academic";

const initialEnrollment: NewEnrollmentForm = {
  studentId: "",
  courseId: "",
  promedio: "12",
  asistenciaPct: "80",
};

function sectionSubtitle(section: AppSection): string {
  switch (section) {
    case "Dashboard":
      return "Indicadores globales, tendencia histórica y ranking de riesgo.";
    case "Alertas":
      return "Priorización automática y recomendaciones de intervención.";
    case "Estudiantes":
      return "Registro y vista consolidada con score de deserción.";
    case "Profesores":
      return "Directorio docente del colegio.";
    case "Cursos":
      return "Oferta académica y asignación.";
    case "Matrículas":
      return "Vínculo estudiante–curso con notas y asistencia por aula.";
    case "Datos académicos":
      return "Resumen por estudiante y detalle de matrículas.";
    case "Actividad LMS":
      return "Engagement, tiempo en plataforma y entregas.";
    case "Predicción":
      return "Interpretabilidad del ensemble y simulación de escenarios.";
    case "Reportes":
      return "Tableros analíticos y exportación PDF / Excel.";
    default:
      return "";
  }
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<AppSection>(APP_SECTIONS[0]);
  const [students, setStudents] = useState<Student[]>(seedStudents);
  const [teachers] = useState(seedTeachers);
  const [courses] = useState(seedCourses);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(seedEnrollments);

  const [newStudent, setNewStudent] = useState<NewStudentForm>(defaultStudentForm);
  const [enrollmentForm, setEnrollmentForm] =
    useState<NewEnrollmentForm>(initialEnrollment);

  const alertCount = useMemo(() => earlyAlertCount(students), [students]);

  function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newStudent.codigo || !newStudent.nombres || !newStudent.apellidos) {
      return;
    }
    const promedio = Number.parseFloat(newStudent.promedioGeneral.replace(",", "."));
    const asistencia = Number.parseFloat(newStudent.asistenciaGeneral.replace(",", "."));
    const metrics = buildMetrics(
      Number.isFinite(promedio) ? Math.min(20, Math.max(0, promedio)) : 13,
      Number.isFinite(asistencia) ? Math.min(100, Math.max(0, asistencia)) : 85,
      newStudent.engagement,
    );
    const created: Student = {
      id: `s-${Date.now()}`,
      codigo: newStudent.codigo.trim(),
      nombres: newStudent.nombres.trim(),
      apellidos: newStudent.apellidos.trim(),
      nivel: newStudent.nivel.trim(),
      correo: newStudent.correo.trim(),
      telefono: newStudent.telefono.trim(),
      estado: newStudent.estado,
      metrics,
    };
    setStudents((prev) => [...prev, created]);
    setNewStudent(defaultStudentForm);
  }

  function addEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enrollmentForm.studentId || !enrollmentForm.courseId) return;
    const promedio = Number.parseFloat(enrollmentForm.promedio.replace(",", "."));
    const asistencia = Number.parseFloat(enrollmentForm.asistenciaPct.replace(",", "."));
    if (!Number.isFinite(promedio) || !Number.isFinite(asistencia)) return;
    const row: Enrollment = {
      id: `e-${Date.now()}`,
      studentId: enrollmentForm.studentId,
      courseId: enrollmentForm.courseId,
      promedio: Math.min(20, Math.max(0, promedio)),
      asistenciaPct: Math.min(100, Math.max(0, asistencia)),
    };
    setEnrollments((prev) => [...prev, row]);
    setEnrollmentForm({
      studentId: enrollmentForm.studentId,
      courseId: "",
      promedio: "12",
      asistenciaPct: "80",
    });
  }

  function renderSection() {
    switch (activeSection) {
      case "Dashboard":
        return <DashboardView students={students} courses={courses} enrollments={enrollments} />;
      case "Alertas":
        return <AlertsView students={students} />;
      case "Estudiantes":
        return (
          <StudentsView
            students={students}
            newStudent={newStudent}
            setNewStudent={setNewStudent}
            onAddStudent={addStudent}
          />
        );
      case "Profesores":
        return <TeachersView teachers={teachers} />;
      case "Cursos":
        return <CoursesView courses={courses} teachers={teachers} />;
      case "Matrículas":
        return (
          <EnrollmentsView
            enrollments={enrollments}
            students={students}
            courses={courses}
            form={enrollmentForm}
            setForm={setEnrollmentForm}
            onAdd={addEnrollment}
          />
        );
      case "Datos académicos":
        return (
          <AcademicView students={students} courses={courses} enrollments={enrollments} />
        );
      case "Actividad LMS":
        return <LMSView students={students} />;
      case "Predicción":
        return <PredictionView students={students} />;
      case "Reportes":
        return (
          <ReportsView students={students} courses={courses} enrollments={enrollments} />
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <AppSidebar
        sections={APP_SECTIONS}
        activeSection={activeSection}
        onSelect={setActiveSection}
        alertCount={alertCount}
      />

      <main className="flex-1 space-y-6 p-4 md:p-8">
        <header className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-indigo-600">
            I.E.P. Blenkir Huancayo · Ingeniería de Sistemas
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Modelo predictivo con ensemble learning para riesgo de deserción
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{activeSection}</span>
            {" · "}
            {sectionSubtitle(activeSection)}
          </p>
        </header>

        {renderSection()}
      </main>
    </div>
  );
}
