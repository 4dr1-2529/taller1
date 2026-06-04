"use client";

import { type FormEvent, useEffect, useState } from "react";
import { api } from "@/services/api";
import { AppShell } from "@/components/layout/AppShell";
import { RoleDashboard } from "@/components/dashboard/RoleDashboard";
import { EmptyState } from "@/components/EmptyState";
import { useAcademicStructure } from "@/hooks/useAcademicStructure";
import { AlertsView } from "@/components/views/AlertsView";
import { MensajeriaAcademicaView } from "@/components/views/MensajeriaAcademicaView";
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
import { GradesView } from "@/components/views/GradesView";
import { AttendanceView } from "@/components/views/AttendanceView";
import { APP_SECTIONS, type AppSection } from "@/data/navigation";
import { earlyAlertCount } from "@/lib/aggregates";
import { useAcademicData } from "@/hooks/useAcademicData";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/contexts/AuthProvider";

/** Director, Profesor, Estudiante — permisos según tesis ML deserción */
const ROLE_SECTIONS: Record<string, AppSection[]> = {
  admin: [
    "Dashboard",
    "Estudiantes",
    "Profesores",
    "Cursos",
    "Matrículas",
    "Notas",
    "Asistencia",
    "Actividad LMS",
    "Predicción",
    "Historial predicciones",
    "Alertas",
    "Mensajería Académica",
    "Reportes",
  ],
  docente: [
    "Dashboard",
    "Estudiantes",
    "Cursos",
    "Notas",
    "Asistencia",
    "Actividad LMS",
    "Predicción",
    "Historial predicciones",
    "Alertas",
    "Mensajería Académica",
  ],
  estudiante: [
    "Dashboard",
    "Notas",
    "Asistencia",
    "Actividad LMS",
    "Predicción",
    "Mensajería Académica",
  ],
};

const initialEnrollment: NewEnrollmentForm = {
  estudianteId: "",
  seccionId: "",
  anioLectivoId: "",
};

function sectionSubtitle(section: AppSection): string {
  switch (section) {
    case "Dashboard":
      return "Indicadores de riesgo de deserción y rendimiento académico.";
    case "Estudiantes":
      return "Registro y seguimiento con puntaje predictivo.";
    case "Profesores":
      return "Docentes y cursos asignados.";
    case "Cursos":
      return "Oferta académica por sección.";
    case "Matrículas":
      return "Matrícula institucional: estudiante + año + grado + sección (una por periodo).";
    case "Notas":
      return "Calificaciones 0–20 y promedio.";
    case "Asistencia":
      return "Registro de asistencia diaria.";
    case "Actividad LMS":
      return "Participación en plataforma virtual.";
    case "Predicción":
      return "Modelo ensemble — riesgo de deserción.";
    case "Historial predicciones":
      return "Historial de scores y factores.";
    case "Alertas":
      return "Alertas tempranas con recomendación automática.";
    case "Mensajería Académica":
      return "Comunicados y mensajes institucionales.";
    case "Reportes":
      return "Exportación y analítica.";
    default:
      return "";
  }
}

export default function Home() {
  const { user } = useAuth();
  const role = user?.role ?? "estudiante";
  const visibleSections = ROLE_SECTIONS[role] ?? ROLE_SECTIONS.estudiante;

  const [activeSection, setActiveSection] = useState<AppSection>(visibleSections[0]);
  const {
    students,
    teachers,
    courses,
    enrollments,
    matriculaStats,
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
  const isDirector = role === "admin";
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (!visibleSections.includes(activeSection)) {
      setActiveSection(visibleSections[0]);
    }
  }, [role, visibleSections, activeSection]);

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
    setEnrollmentForm({ ...enrollmentForm, seccionId: enrollmentForm.seccionId });
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
    setNewCourse({ ...defaultCourseForm, profesorId: user?.teacherId ?? "" });
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
        return useApi || students.length > 0 || role === "estudiante" ? (
          <RoleDashboard
            role={role}
            students={students}
            courses={courses}
            enrollments={enrollments}
            useApi={useApi}
          />
        ) : (
          <EmptyState
            title="Sin estudiantes registrados"
            description="Inicie sesión como director y registre estudiantes para activar el modelo predictivo."
            showLogin={!useApi}
          />
        );
      case "Estudiantes":
        return (
          <StudentsView
            students={students}
            secciones={secciones}
            newStudent={newStudent}
            setNewStudent={setNewStudent}
            onAddStudent={handleAddStudent}
            canEdit={isDirector}
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
            canEdit={isDirector}
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
            canEdit={isDirector || role === "docente"}
            canReassign={isDirector}
            lockProfesorId={role === "docente" ? user?.teacherId ?? undefined : undefined}
          />
        );
      case "Matrículas":
        return (
          <EnrollmentsView
            students={students}
            secciones={secciones}
            matriculaStats={matriculaStats}
            form={enrollmentForm}
            setForm={setEnrollmentForm}
            onAdd={handleAddEnrollment}
          />
        );
      case "Notas":
        return (
          <GradesView
            students={students}
            courses={courses}
            teachers={teachers}
            secciones={secciones}
          />
        );
      case "Asistencia":
        return (
          <AttendanceView
            students={students}
            courses={courses}
            teachers={teachers}
            secciones={secciones}
          />
        );
      case "Actividad LMS":
        return <LMSView students={students} secciones={secciones} />;
      case "Predicción":
        return <PredictionView students={students} secciones={secciones} useApi={useApi} />;
      case "Alertas":
        return (
          <AlertsView students={students} teachers={teachers} secciones={secciones} useApi={useApi} />
        );
      case "Historial predicciones":
        return role === "estudiante" ? null : <PredictionHistoryView students={students} />;
      case "Mensajería Académica":
        return <MensajeriaAcademicaView />;
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
