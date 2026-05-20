"use client";

import { type FormEvent, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AcademicView } from "@/components/views/AcademicView";
import { AcademicStructureView } from "@/components/views/AcademicStructureView";
import { RoleDashboard } from "@/components/dashboards/RoleDashboard";
import { EmptyState } from "@/components/EmptyState";
import { useAcademicStructure } from "@/hooks/useAcademicStructure";
import { AlertsView } from "@/components/views/AlertsView";
import { ChatView } from "@/components/views/ChatView";
import { DashboardView } from "@/components/views/DashboardView";
import { EnrollmentsView, type NewEnrollmentForm } from "@/components/views/EnrollmentsView";
import { LMSView } from "@/components/views/LMSView";
import { PredictionView } from "@/components/views/PredictionView";
import { MlMetricsView } from "@/components/views/MlMetricsView";
import { ReportsView } from "@/components/views/ReportsView";
import { defaultStudentForm, StudentsView, type NewStudentForm } from "@/components/views/StudentsView";
import {
  TeachersView,
  defaultTeacherForm,
  type NewTeacherForm,
} from "@/components/views/TeachersView";
import {
  CoursesView,
  defaultCourseForm,
  type NewCourseForm,
} from "@/components/views/CoursesView";
import { PsychFollowUpView } from "@/components/views/PsychFollowUpView";
import { GradesView } from "@/components/views/GradesView";
import { AttendanceView } from "@/components/views/AttendanceView";
import { APP_SECTIONS, type AppSection } from "@/data/navigation";
import { earlyAlertCount } from "@/lib/aggregates";
import { useAcademicData } from "@/hooks/useAcademicData";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/contexts/AuthProvider";

const ROLE_SECTIONS: Record<string, AppSection[]> = {
  admin: [...APP_SECTIONS],
  docente: [
    "Dashboard",
    "Estructura académica",
    "Alertas",
    "Estudiantes",
    "Cursos",
    "Matrículas",
    "Notas",
    "Asistencia",
    "Datos académicos",
    "Actividad LMS",
    "Predicción",
    "Chat",
    "Reportes",
  ],
  tutor: [
    "Dashboard",
    "Estructura académica",
    "Alertas",
    "Seguimiento psicológico",
    "Estudiantes",
    "Cursos",
    "Matrículas",
    "Notas",
    "Asistencia",
    "Datos académicos",
    "Actividad LMS",
    "Predicción",
    "Chat",
    "Reportes",
  ],
  psicologo: [
    "Dashboard",
    "Alertas",
    "Seguimiento psicológico",
    "Estudiantes",
    "Datos académicos",
    "Actividad LMS",
    "Predicción",
    "Chat",
    "Reportes",
  ],
  estudiante: ["Dashboard", "Datos académicos", "Actividad LMS", "Predicción"],
  apoderado: ["Dashboard", "Datos académicos", "Actividad LMS", "Alertas", "Predicción"],
};

const initialEnrollment: NewEnrollmentForm = {
  studentId: "",
  courseId: "",
  promedio: "0",
  asistenciaPct: "0",
};

function sectionSubtitle(section: AppSection): string {
  switch (section) {
    case "Dashboard": return "Indicadores globales, tendencia histórica y ranking de riesgo.";
    case "Estructura académica": return "Niveles Primaria/Secundaria, grados y secciones del colegio.";
    case "Alertas": return "Priorización automática y recomendaciones de intervención.";
    case "Seguimiento psicológico": return "Registro de entrevistas y planes de apoyo emocional.";
    case "Estudiantes": return "Registro y vista consolidada con score de deserción.";
    case "Profesores": return "Registro de docentes, especialidad y cursos que dictan.";
    case "Cursos": return "Oferta académica y asignación.";
    case "Matrículas": return "Vínculo estudiante–curso por periodo académico.";
    case "Notas": return "Calificaciones por bimestre (escala 0–20) y recálculo de promedio.";
    case "Asistencia": return "Control diario: presente, tardanza y falta justificada.";
    case "Datos académicos": return "Resumen por estudiante y detalle de matrículas.";
    case "Actividad LMS": return "Engagement, tiempo en plataforma y entregas.";
    case "Predicción": return "Interpretabilidad del ensemble y simulación de escenarios.";
    case "Modelos IA": return "Random Forest, boosting y stacking — métricas y matriz de confusión.";
    case "Chat": return "Coordinación entre tutoría, docentes y psicología.";
    case "Reportes": return "Tableros analíticos y exportación PDF / Excel.";
    default: return "";
  }
}

export default function Home() {
  const { user } = useAuth();
  const role = user?.role ?? "estudiante";
  const visibleSections = ROLE_SECTIONS[role] ?? [...ROLE_SECTIONS.estudiante];

  const [activeSection, setActiveSection] = useState<AppSection>(visibleSections[0]);
  const {
    students,
    teachers,
    courses,
    enrollments,
    dataSource,
    loading,
    refresh,
    addStudent,
    addTeacher,
    updateTeacher,
    deactivateTeacher,
    createTeacherAccount,
    addCourse,
    updateCourse,
    addEnrollment,
  } = useAcademicData();
  const { secciones } = useAcademicStructure();

  const [newStudent, setNewStudent] = useState<NewStudentForm>(defaultStudentForm);
  const [newTeacher, setNewTeacher] = useState<NewTeacherForm>(defaultTeacherForm);
  const [newCourse, setNewCourse] = useState<NewCourseForm>(defaultCourseForm);
  const [enrollmentForm, setEnrollmentForm] = useState<NewEnrollmentForm>(initialEnrollment);

  const useApi = dataSource === "api";
  const canManageStaff = role === "admin";
  const alertCount = useMemo(() => earlyAlertCount(students), [students]);

  async function handleAddStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newStudent.codigo || !newStudent.nombres || !newStudent.apellidos || !newStudent.seccionId) return;
    await addStudent(newStudent);
    setNewStudent(defaultStudentForm);
  }

  async function handleAddEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await addEnrollment(enrollmentForm);
    setEnrollmentForm({ studentId: enrollmentForm.studentId, courseId: "", promedio: "0", asistenciaPct: "0" });
  }

  async function handleAddTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await addTeacher(newTeacher);
    setNewTeacher(defaultTeacherForm);
  }

  async function handleAddCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const profesorId = user?.teacherId ?? newCourse.profesorId;
    if (!profesorId) return;
    await addCourse({
      codigo: newCourse.codigo,
      nombre: newCourse.nombre,
      profesorId,
      seccionId: newCourse.seccionId || undefined,
    });
    setNewCourse({
      ...defaultCourseForm,
      profesorId: user?.teacherId ?? "",
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
          <div className="space-y-6">
            <RoleDashboard
              role={role}
              students={students}
              courses={courses}
              enrollments={enrollments}
              alertCount={alertCount}
            />
            {students.length > 0 ? (
              <DashboardView students={students} courses={courses} enrollments={enrollments} useApi={useApi} />
            ) : (
              <EmptyState
                title="Sin estudiantes registrados"
                description="Cree el usuario administrador (npm run db:bootstrap), inicie sesión y registre estudiantes reales por sección."
                showLogin={!useApi}
              />
            )}
          </div>
        );
      case "Estructura académica":
        return <AcademicStructureView />;
      case "Alertas":
        return <AlertsView students={students} useApi={useApi} />;
      case "Seguimiento psicológico":
        return <PsychFollowUpView students={students} useApi={useApi} />;
      case "Estudiantes":
        return (
          <StudentsView
            students={students}
            secciones={secciones}
            newStudent={newStudent}
            setNewStudent={setNewStudent}
            onAddStudent={handleAddStudent}
          />
        );
      case "Profesores":
        return (
          <TeachersView
            teachers={teachers}
            secciones={secciones}
            form={newTeacher}
            setForm={setNewTeacher}
            onSubmit={handleAddTeacher}
            onUpdate={updateTeacher}
            onDeactivate={deactivateTeacher}
            onCreateAccount={createTeacherAccount}
            canEdit={canManageStaff}
          />
        );
      case "Cursos":
        return (
          <CoursesView
            courses={courses}
            teachers={teachers}
            secciones={secciones}
            form={newCourse}
            setForm={setNewCourse}
            onSubmit={handleAddCourse}
            onReassignProfesor={(courseId, profesorId) => updateCourse(courseId, { profesorId })}
            canEdit={canManageStaff || role === "docente"}
            canReassign={canManageStaff}
            lockProfesorId={role === "docente" ? user?.teacherId ?? undefined : undefined}
          />
        );
      case "Matrículas":
        return <EnrollmentsView enrollments={enrollments} students={students} courses={courses} form={enrollmentForm} setForm={setEnrollmentForm} onAdd={handleAddEnrollment} />;
      case "Notas":
        return <GradesView students={students} courses={courses} />;
      case "Asistencia":
        return <AttendanceView students={students} />;
      case "Datos académicos":
        return <AcademicView students={students} courses={courses} enrollments={enrollments} />;
      case "Actividad LMS":
        return <LMSView students={students} />;
      case "Predicción":
        return <PredictionView students={students} useApi={dataSource === "api"} />;
      case "Modelos IA":
        return <MlMetricsView />;
      case "Chat":
        return <ChatView />;
      case "Reportes":
        return <ReportsView students={students} courses={courses} enrollments={enrollments} />;
      default:
        return null;
    }
  }

  return (
    <AppShell
      sections={visibleSections}
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      alertCount={alertCount}
      subtitle={sectionSubtitle(activeSection)}
      dataSource={dataSource}
      loading={loading}
      onRefresh={refresh}
    >
      {renderSection()}
    </AppShell>
  );
}
