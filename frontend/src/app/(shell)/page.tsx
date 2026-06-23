"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/services/api";
import { AppShell } from "@/components/layout/AppShell";
import { RoleDashboard } from "@/components/dashboard/RoleDashboard";
import { EmptyState } from "@/components/EmptyState";
import { useAcademicStructure } from "@/hooks/useAcademicStructure";
import { useProfessorStructure } from "@/hooks/useProfessorStructure";
import { profesorService } from "@/services/profesorService";
import { directorService } from "@/services/directorService";
import { estudianteService } from "@/services/estudianteService";
import { StudentDashboard } from "@/components/student/StudentDashboard";
import { StudentGradesView } from "@/components/student/StudentGradesView";
import { StudentAttendanceView } from "@/components/student/StudentAttendanceView";
import { StudentLMSView } from "@/components/student/StudentLMSView";
import { StudentPredictionView } from "@/components/student/StudentPredictionView";
import { StudentMensajeriaView } from "@/components/student/StudentMensajeriaView";
import { ProfessorStudentsView } from "@/components/views/ProfessorStudentsView";
import { AlertsView } from "@/components/views/AlertsView";
import { ProfessorAlertsView } from "@/components/views/ProfessorAlertsView";
import { MensajeriaAcademicaView } from "@/components/views/MensajeriaAcademicaView";
import { EnrollmentsView, type NewMatriculaForm } from "@/components/views/EnrollmentsView";
import { LMSView } from "@/components/views/LMSView";
import { ProfessorLMSView } from "@/components/views/ProfessorLMSView";
import { PredictionView } from "@/components/views/PredictionView";
import { ProfessorPredictionView } from "@/components/views/ProfessorPredictionView";
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
import { TeacherAssignmentsView } from "@/components/views/TeacherAssignmentsView";
import { GradesView } from "@/components/views/GradesView";
import { ProfessorGradesView } from "@/components/views/ProfessorGradesView";
import { AttendanceView } from "@/components/views/AttendanceView";
import { ProfessorAttendanceView } from "@/components/views/ProfessorAttendanceView";
import { type AppSection } from "@/data/navigation";
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
    "Asignaciones",
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

const initialMatricula: NewMatriculaForm = {
  estudianteId: "",
  seccionId: "",
  anioLectivoId: "",
};

function sectionSubtitle(section: AppSection, role: string): string {
  if (role === "estudiante") {
    switch (section) {
      case "Dashboard":
        return "Resumen personal de tu rendimiento y riesgo académico.";
      case "Notas":
        return "Estas son tus notas registradas.";
      case "Asistencia":
        return "Este es tu historial de asistencia.";
      case "Actividad LMS":
        return "Esta es tu actividad LMS.";
      case "Predicción":
        return "Este es tu riesgo actual.";
      case "Mensajería Académica":
        return "Mensajes enviados a tu perfil.";
      default:
        return "";
    }
  }
  switch (section) {
    case "Dashboard":
      return "Indicadores de riesgo de deserción y rendimiento académico.";
    case "Estudiantes":
      return "Registro y seguimiento con puntaje predictivo.";
    case "Profesores":
      return "Docentes y cursos asignados.";
    case "Asignaciones":
      return "Asignación docente: tutor de aula (1°-2°) o por curso (3°-6° polidocencia).";
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
  const { user, loading: authLoading, isAuthenticated, isDocente, isEstudiante } = useAuth();
  const role = user?.role;
  const visibleSections = role ? (ROLE_SECTIONS[role] ?? ROLE_SECTIONS.estudiante) : ROLE_SECTIONS.admin;

  const [activeSection, setActiveSection] = useState<AppSection>("Dashboard");
  const {
    students,
    teachers,
    courses,
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
    addMatricula,
  } = useAcademicData();
  const { secciones: directorSecciones } = useAcademicStructure();
  const { secciones: professorSecciones } = useProfessorStructure();
  const secciones = role === "docente" ? professorSecciones : directorSecciones;

  const [newStudent, setNewStudent] = useState<NewStudentForm>(defaultStudentForm);
  const [newTeacher, setNewTeacher] = useState<NewTeacherForm>(defaultTeacherForm);
  const [newCourse, setNewCourse] = useState<NewCourseForm>(defaultCourseForm);
  const [matriculaForm, setMatriculaForm] = useState<NewMatriculaForm>(initialMatricula);

  const useApi = dataSource === "api";
  const isDirector = role === "admin";
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.replace("/login");
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!role || !visibleSections.includes(activeSection)) {
      setActiveSection(visibleSections[0]);
    }
  }, [role, visibleSections, activeSection]);

  useEffect(() => {
    if (authLoading || !user || !useApi || !api.hasToken) {
      if (!authLoading && user) setAlertCount(earlyAlertCount(students));
      return;
    }
    if (isDocente) {
      void profesorService
        .getDashboard()
        .then((d) => setAlertCount(d.kpis.openAlerts))
        .catch(() => setAlertCount(0));
      return;
    }
    if (isEstudiante) {
      void estudianteService
        .getDashboard()
        .then((d) => setAlertCount(d.kpis.alertasActivas))
        .catch(() => setAlertCount(0));
      return;
    }
    void directorService
      .getAlerts()
      .then((r) => setAlertCount(r.total ?? r.items.length))
      .catch(() => setAlertCount(earlyAlertCount(students)));
  }, [useApi, students, loading, isDocente, isEstudiante, user, authLoading]);

  async function handleAddStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newStudent.codigo || !newStudent.nombres || !newStudent.apellidos || !newStudent.seccionId) return;
    await addStudent(newStudent);
    setNewStudent(defaultStudentForm);
  }

  async function handleAddMatricula(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await addMatricula(matriculaForm);
    setMatriculaForm({ ...matriculaForm, estudianteId: "" });
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
      gradoId: newCourse.gradoId,
    });
    setNewCourse({ ...defaultCourseForm, profesorId: user?.teacherId ?? "" });
  }

  function renderSection() {
    if (!role) return null;
    if (loading && dataSource === "api" && !isEstudiante && !isDocente) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      );
    }

    switch (activeSection) {
      case "Dashboard":
        if (isEstudiante) return <StudentDashboard />;
        return useApi || students.length > 0 ? (
          <RoleDashboard
            role={role}
            students={students}
            courses={courses}
            matriculaStats={matriculaStats}
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
        return role === "docente" ? (
          <ProfessorStudentsView courses={courses} secciones={secciones} />
        ) : (
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
      case "Asignaciones":
        return (
          <TeacherAssignmentsView teachers={teachers} secciones={secciones} />
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
            canEdit={isDirector}
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
            form={matriculaForm}
            setForm={setMatriculaForm}
            onAdd={handleAddMatricula}
          />
        );
      case "Notas":
        if (isEstudiante) return <StudentGradesView />;
        return role === "docente" ? (
          <ProfessorGradesView courses={courses} secciones={secciones} />
        ) : (
          <GradesView students={students} courses={courses} teachers={teachers} secciones={secciones} />
        );
      case "Asistencia":
        if (isEstudiante) return <StudentAttendanceView />;
        return role === "docente" ? (
          <ProfessorAttendanceView courses={courses} secciones={secciones} />
        ) : (
          <AttendanceView
            students={students}
            courses={courses}
            teachers={teachers}
            secciones={secciones}
          />
        );
      case "Actividad LMS":
        if (isEstudiante) return <StudentLMSView />;
        return role === "docente" ? (
          <ProfessorLMSView courses={courses} secciones={secciones} />
        ) : (
          <LMSView students={students} secciones={secciones} />
        );
      case "Predicción":
        if (isEstudiante) return <StudentPredictionView />;
        return role === "docente" ? (
          <ProfessorPredictionView courses={courses} secciones={secciones} />
        ) : (
          <PredictionView students={students} secciones={secciones} useApi={useApi} />
        );
      case "Alertas":
        return role === "docente" ? (
          <ProfessorAlertsView courses={courses} secciones={secciones} />
        ) : (
          <AlertsView students={students} teachers={teachers} secciones={secciones} useApi={useApi} />
        );
      case "Historial predicciones":
        return role === "estudiante" ? null : (
          <PredictionHistoryView
            students={students}
            secciones={secciones}
            courses={courses}
            professorMode={role === "docente"}
          />
        );
      case "Mensajería Académica":
        return isEstudiante ? <StudentMensajeriaView /> : <MensajeriaAcademicaView />;
      case "Reportes":
        return <ReportsView students={students} courses={courses} />;
      default:
        return null;
    }
  }

  if (authLoading || !user || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-orange)]" aria-label="Cargando sesión" />
      </div>
    );
  }

  return (
    <AppShell
      sections={visibleSections}
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      alertCount={alertCount}
      subtitle={sectionSubtitle(activeSection, role)}
      dataSource={dataSource}
      loading={loading}
      onRefresh={refresh}
    >
      {renderSection()}
    </AppShell>
  );
}
