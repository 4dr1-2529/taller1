"use client";

import { type FormEvent, useMemo, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { DataSourceBanner } from "@/components/DataSourceBanner";
import { AcademicView } from "@/components/views/AcademicView";
import { AlertsView } from "@/components/views/AlertsView";
import { ChatView } from "@/components/views/ChatView";
import { CoursesView } from "@/components/views/CoursesView";
import { DashboardView } from "@/components/views/DashboardView";
import {
  EnrollmentsView,
  type NewEnrollmentForm,
} from "@/components/views/EnrollmentsView";
import { LMSView } from "@/components/views/LMSView";
import { PredictionView } from "@/components/views/PredictionView";
import { MlMetricsView } from "@/components/views/MlMetricsView";
import { ReportsView } from "@/components/views/ReportsView";
import {
  defaultStudentForm,
  StudentsView,
  type NewStudentForm,
} from "@/components/views/StudentsView";
import { TeachersView } from "@/components/views/TeachersView";
import { PsychFollowUpView } from "@/components/views/PsychFollowUpView";
import { NotificationBell } from "@/components/NotificationBell";
import { APP_SECTIONS, type AppSection } from "@/data/seed";
import { earlyAlertCount } from "@/lib/aggregates";
import { useAcademicData } from "@/hooks/useAcademicData";
import { CardSkeleton } from "@/components/ui/Skeleton";

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
    case "Seguimiento psicológico":
      return "Registro de entrevistas y planes de apoyo emocional.";
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
    case "Modelos IA":
      return "Random Forest, boosting y stacking — métricas y matriz de confusión.";
    case "Chat":
      return "Coordinación entre tutoría, docentes y psicología.";
    case "Reportes":
      return "Tableros analíticos y exportación PDF / Excel.";
    default:
      return "";
  }
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<AppSection>(APP_SECTIONS[0]);
  const {
    students,
    teachers,
    courses,
    enrollments,
    dataSource,
    loading,
    refresh,
    addStudent,
    addEnrollment,
  } = useAcademicData();

  const [newStudent, setNewStudent] = useState<NewStudentForm>(defaultStudentForm);
  const [enrollmentForm, setEnrollmentForm] =
    useState<NewEnrollmentForm>(initialEnrollment);

  const useApi = dataSource === "api";
  const alertCount = useMemo(() => earlyAlertCount(students), [students]);

  async function handleAddStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newStudent.codigo || !newStudent.nombres || !newStudent.apellidos) return;
    await addStudent(newStudent);
    setNewStudent(defaultStudentForm);
  }

  async function handleAddEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await addEnrollment(enrollmentForm);
    setEnrollmentForm({
      studentId: enrollmentForm.studentId,
      courseId: "",
      promedio: "12",
      asistenciaPct: "80",
    });
  }

  function renderSection() {
    if (loading && dataSource === "api") {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      );
    }

    switch (activeSection) {
      case "Dashboard":
        return (
          <DashboardView
            students={students}
            courses={courses}
            enrollments={enrollments}
            useApi={useApi}
          />
        );
      case "Alertas":
        return <AlertsView students={students} useApi={useApi} />;
      case "Seguimiento psicológico":
        return <PsychFollowUpView students={students} useApi={useApi} />;
      case "Estudiantes":
        return (
          <StudentsView
            students={students}
            newStudent={newStudent}
            setNewStudent={setNewStudent}
            onAddStudent={handleAddStudent}
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
            onAdd={handleAddEnrollment}
          />
        );
      case "Datos académicos":
        return (
          <AcademicView students={students} courses={courses} enrollments={enrollments} />
        );
      case "Actividad LMS":
        return <LMSView students={students} />;
      case "Predicción":
        return <PredictionView students={students} useApi={dataSource === "api"} />;
      case "Modelos IA":
        return <MlMetricsView />;
      case "Chat":
        return <ChatView />;
      case "Reportes":
        return (
          <ReportsView students={students} courses={courses} enrollments={enrollments} />
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen text-slate-900 lg:flex dark:text-slate-100">
      <AppSidebar
        sections={APP_SECTIONS}
        activeSection={activeSection}
        onSelect={setActiveSection}
        alertCount={alertCount}
      />

      <main className="flex-1 space-y-6 p-4 md:p-8">
        <header className="glass-card rounded-2xl p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                I.E.P. Blenkir Huancayo · Ingeniería de Sistemas
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Modelo predictivo con ensemble learning para riesgo de deserción
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {activeSection}
                </span>
                {" · "}
                {sectionSubtitle(activeSection)}
              </p>
            </div>
            <NotificationBell />
          </div>
        </header>

        <DataSourceBanner dataSource={dataSource} loading={loading} onRefresh={refresh} />

        {renderSection()}
      </main>
    </div>
  );
}
