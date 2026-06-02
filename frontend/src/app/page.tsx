"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { AppShell } from "@/components/layout/AppShell";
import { BentoDashboard } from "@/components/dashboard/bento/BentoDashboard";
import { AcademicStructureView } from "@/components/views/AcademicStructureView";
import { EmptyState } from "@/components/EmptyState";
import { useAcademicStructure } from "@/hooks/useAcademicStructure";
import { AlertsView } from "@/components/views/AlertsView";
import { ChatView } from "@/components/views/ChatView";
import { EnrollmentsView, type NewEnrollmentForm } from "@/components/views/EnrollmentsView";
import { LMSView } from "@/components/views/LMSView";
import { PredictionView } from "@/components/views/PredictionView";
import { PredictionHistoryView } from "@/components/views/PredictionHistoryView";
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
import { TeacherMonitoringView } from "@/components/views/TeacherMonitoringView";
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
    "Actividad LMS",
    "Predicción",
    "Historial predicciones",
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
    "Actividad LMS",
    "Predicción",
    "Historial predicciones",
    "Chat",
    "Reportes",
  ],
  psicologo: [
    "Dashboard",
    "Alertas",
    "Seguimiento psicológico",
    "Estudiantes",
    "Actividad LMS",
    "Predicción",
    "Historial predicciones",
    "Chat",
    "Reportes",
  ],
  estudiante: ["Dashboard", "Actividad LMS", "Predicción", "Historial predicciones"],
  apoderado: ["Dashboard", "Actividad LMS", "Alertas", "Predicción", "Historial predicciones"],
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
    case "Estudiantes": return "Registro y vista consolidada con puntaje de deserción.";
    case "Profesores": return "Registro de docentes, especialidad y cursos que dictan.";
    case "Cursos": return "Oferta académica y asignación.";
    case "Matrículas": return "Vínculo estudiante–curso por periodo académico.";
    case "Notas": return "Calificaciones por bimestre (escala 0–20) y recálculo de promedio.";
    case "Asistencia": return "Registro diario: asistió, tardanza, falta o falta justificada.";
    case "Actividad LMS": return "Uso de la plataforma virtual: tiempo conectado, tareas y nivel de compromiso.";
    case "Predicción": return "Puntaje de riesgo, simulación de escenarios y métricas del modelo.";
    case "Historial predicciones": return "Registro histórico de scores, factores y recomendaciones.";
    case "Chat": return "Coordinación entre tutoría, docentes y psicología.";
    case "Reportes": return "Tableros analíticos y exportación PDF / Excel.";
    case "Monitoreo docentes":
      return "Cree correos de acceso y supervise la actividad de cada profesor en el sistema.";
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
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (!useApi || !api.hasToken) {
      setAlertCount(earlyAlertCount(students));
      return;
    }
    void api
      .getAlerts()
      .then((r) => setAlertCount(r.total ?? r.items.length))
      .catch(() => setAlertCount(earlyAlertCount(students)));
  }, [useApi, students.length, loading]);

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
    if (!profesorId || !newCourse.seccionId) return;
    await addCourse({
      codigo: newCourse.codigo,
      nombre: newCourse.nombre,
      profesorId,
      seccionId: newCourse.seccionId,
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
        return students.length > 0 ? (
          <BentoDashboard
            role={role}
            students={students}
            courses={courses}
            enrollments={enrollments}
            useApi={useApi}
          />
        ) : (
          <EmptyState
            title="Sin estudiantes registrados"
            description="Cree el usuario administrador (npm run db:bootstrap), inicie sesión y registre estudiantes reales por sección."
            showLogin={!useApi}
          />
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
      case "Actividad LMS":
        return <LMSView students={students} />;
      case "Predicción":
        return <PredictionView students={students} useApi={dataSource === "api"} />;
      case "Historial predicciones":
        return <PredictionHistoryView students={students} />;
      case "Chat":
        return <ChatView />;
      case "Monitoreo docentes":
        return <TeacherMonitoringView teachers={teachers} />;
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
