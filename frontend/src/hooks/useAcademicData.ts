"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthProvider";
import {
  mapCourseFromApi,
  mapEstadoToApi,
  mapStudentFromApi,
  mapTeacherFromApi,
} from "@/lib/api-mappers";
import { buildMetrics } from "@/lib/student-factory";
import { fetchAllStudents } from "@/lib/fetch-all-students";
import {
  parseGrade,
  parsePercent,
  validateCourseForm,
  validateMatriculaForm,
  validateStudentForm,
  validateTeacherForm,
  validateTeacherProfileFields,
  firstError,
} from "@/lib/validation";
import { api } from "@/services/api";
import { profesorService } from "@/services/profesorService";
import type { Course, Student, Teacher } from "@/types/academic";
import type { NewStudentForm } from "@/components/views/StudentsView";
import type { NewMatriculaForm } from "@/components/views/EnrollmentsView";
import type { NewTeacherForm } from "@/components/views/TeachersView";

export type DataSource = "api" | "none";

export type MatriculaStats = {
  matriculasActivas: number;
  matriculasAnioLectivo: number;
  estudiantesActivos: number;
  anioLectivo: string | null;
};

export function useAcademicData() {
  const { isAuthenticated, loading: authLoading, refresh: refreshAuth, user } = useAuth();
  const isDocente = user?.role === "docente";
  const isEstudiante = user?.role === "estudiante";
  const [dataSource, setDataSource] = useState<DataSource>("none");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [matriculaStats, setMatriculaStats] = useState<MatriculaStats | null>(null);

  const role = user?.role;

  const loadFromApi = useCallback(async () => {
    if (!api.hasToken) {
      setDataSource("none");
      return false;
    }
    if (!role) {
      return false;
    }
    setLoading(true);
    try {
      await api.health();
      if (isEstudiante) {
        setStudents([]);
        setTeachers([]);
        setCourses([]);
        setMatriculaStats(null);
        setDataSource("api");
        return true;
      }
      const [st, te, co, stats] = await Promise.all([
        isDocente ? Promise.resolve([]) : fetchAllStudents(false),
        isDocente ? Promise.resolve({ items: [] }) : api.getTeachers(),
        isDocente ? profesorService.getCursos() : api.getCourses(),
        isDocente ? Promise.resolve(null) : api.getMatriculaStats().catch(() => null),
      ]);
      setStudents(st);
      setTeachers(te.items.map((r) => mapTeacherFromApi(r as Parameters<typeof mapTeacherFromApi>[0])));
      setCourses(co.items.map((r) => mapCourseFromApi(r as Parameters<typeof mapCourseFromApi>[0])));
      setMatriculaStats(stats);
      setDataSource("api");
      return true;
    } catch (firstError) {
      try {
        await refreshAuth();
        if (!api.hasToken) throw firstError;
        if (isEstudiante) {
          setStudents([]);
          setTeachers([]);
          setCourses([]);
          setMatriculaStats(null);
          setDataSource("api");
          return true;
        }
        const [st, te, co, stats] = await Promise.all([
          isDocente ? Promise.resolve([]) : fetchAllStudents(false),
          isDocente ? Promise.resolve({ items: [] }) : api.getTeachers(),
          isDocente ? profesorService.getCursos() : api.getCourses(),
          isDocente ? Promise.resolve(null) : api.getMatriculaStats().catch(() => null),
        ]);
        setStudents(st);
        setTeachers(te.items.map((r) => mapTeacherFromApi(r as Parameters<typeof mapTeacherFromApi>[0])));
        setCourses(co.items.map((r) => mapCourseFromApi(r as Parameters<typeof mapCourseFromApi>[0])));
        setMatriculaStats(stats);
        setDataSource("api");
        return true;
      } catch {
        setStudents([]);
        setTeachers([]);
        setCourses([]);
        setMatriculaStats(null);
        setDataSource("none");
        return false;
      }
    } finally {
      setLoading(false);
    }
  }, [refreshAuth, isDocente, isEstudiante, role]);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && role) {
      void loadFromApi();
    } else if (!isAuthenticated) {
      setDataSource("none");
      setStudents([]);
      setTeachers([]);
      setCourses([]);
      setMatriculaStats(null);
    }
  }, [isAuthenticated, authLoading, role, loadFromApi]);

  async function addStudent(form: NewStudentForm): Promise<void> {
    if (!api.hasToken) {
      toast.error("Inicie sesión para registrar estudiantes");
      return;
    }
    const fieldErrors = validateStudentForm(form);
    const validationMsg = firstError(fieldErrors);
    if (validationMsg) {
      toast.error(validationMsg);
      return;
    }
    const promedioParsed = form.promedioGeneral.trim() ? parseGrade(form.promedioGeneral) : 0;
    const asistenciaParsed = form.asistenciaGeneral.trim() ? parsePercent(form.asistenciaGeneral) : 0;
    const metrics = buildMetrics(promedioParsed ?? 0, asistenciaParsed ?? 0, form.engagement);
    try {
      const res = await api.createStudent({
        codigo: form.codigo.trim(),
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        seccionId: form.seccionId,
        dni: form.dni.trim() || undefined,
        correo: form.correo.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        estado: mapEstadoToApi(form.estado),
        promedioGeneral: metrics.promedioGeneral,
        asistenciaGeneral: metrics.asistenciaGeneral,
        lmsEngagement: form.engagement,
      });
      const created = mapStudentFromApi(res.student as Parameters<typeof mapStudentFromApi>[0]);
      setStudents((prev) => [...prev, created]);
      toast.success("Estudiante registrado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  async function addTeacher(form: NewTeacherForm): Promise<void> {
    if (!api.hasToken) {
      toast.error("Inicie sesión para registrar docentes");
      return;
    }
    const fieldErrors = validateTeacherForm({ ...form, cursos: form.cursos });
    const validationMsg = firstError(fieldErrors);
    if (validationMsg) {
      toast.error(validationMsg);
      return;
    }
    const cursos = form.cursos
      .filter((c) => c.codigo.trim() && c.nombre.trim() && c.seccionId)
      .map((c) => ({
        codigo: c.codigo.trim(),
        nombre: c.nombre.trim(),
        seccionId: c.seccionId,
        periodo: "2026",
      }));
    try {
      await api.createTeacher({
        codigo: form.codigo.trim(),
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        especialidad: form.especialidad.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim() || undefined,
        crearCuenta: form.crearCuenta,
        password: form.crearCuenta ? form.password : undefined,
        cursos: cursos.length ? cursos : undefined,
      });
      await loadFromApi();
      toast.success(
        cursos.length ? `Docente registrado con ${cursos.length} curso(s)` : "Docente registrado",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar docente");
    }
  }

  async function updateTeacher(
    id: string,
    data: {
      nombres: string;
      apellidos: string;
      especialidad: string;
      correo: string;
      telefono: string;
      cursosNuevos: { codigo: string; nombre: string; seccionId: string }[];
    },
  ) {
    if (!api.hasToken) return;
    const fieldErrors = validateTeacherProfileFields(data);
    const validationMsg = firstError(fieldErrors);
    if (validationMsg) {
      toast.error(validationMsg);
      return;
    }
    const cursosNuevos = data.cursosNuevos
      .filter((c) => c.codigo.trim() && c.nombre.trim() && c.seccionId)
      .map((c) => ({
        codigo: c.codigo.trim(),
        nombre: c.nombre.trim(),
        seccionId: c.seccionId,
        periodo: "2026",
      }));
    try {
      await api.updateTeacher(id, {
        nombres: data.nombres.trim(),
        apellidos: data.apellidos.trim(),
        especialidad: data.especialidad.trim(),
        correo: data.correo.trim(),
        telefono: data.telefono.trim() || null,
        cursosNuevos: cursosNuevos.length ? cursosNuevos : undefined,
      });
      await loadFromApi();
      toast.success("Docente actualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar");
    }
  }

  async function deactivateTeacher(id: string) {
    if (!api.hasToken) return;
    try {
      await api.deleteTeacher(id);
      await loadFromApi();
      toast.success("Docente desactivado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al desactivar");
    }
  }

  async function createTeacherAccount(id: string, password: string) {
    if (!api.hasToken || password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    try {
      await api.createTeacherAccount(id, password);
      await loadFromApi();
      toast.success("Cuenta de docente creada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear cuenta");
    }
  }

  async function updateCourse(
    id: string,
    payload: { nombre?: string; profesorId?: string; seccionId?: string },
  ) {
    if (!api.hasToken) return;
    try {
      await api.updateCourse(id, payload);
      await loadFromApi();
      toast.success("Curso actualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar curso");
    }
  }

  async function addCourse(payload: {
    codigo: string;
    nombre: string;
    profesorId: string;
    seccionId: string;
    gradoId?: string;
  }): Promise<void> {
    if (!api.hasToken) {
      toast.error("Inicie sesión para crear cursos");
      return;
    }
    const fieldErrors = validateCourseForm({
      codigo: payload.codigo,
      nombre: payload.nombre,
      profesorId: payload.profesorId,
      gradoId: payload.gradoId ?? "",
      seccionId: payload.seccionId,
    });
    const validationMsg = firstError(fieldErrors);
    if (validationMsg) {
      toast.error(validationMsg);
      return;
    }
    try {
      const res = await api.createCourse({ ...payload, periodo: "2026" });
      const row = mapCourseFromApi(res.course as Parameters<typeof mapCourseFromApi>[0]);
      setCourses((prev) => [...prev, row]);
      toast.success("Curso creado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear curso");
    }
  }

  async function addMatricula(form: NewMatriculaForm): Promise<void> {
    const fieldErrors = validateMatriculaForm(form);
    const validationMsg = firstError(fieldErrors);
    if (validationMsg) {
      toast.error(validationMsg);
      return;
    }
    if (!api.hasToken) {
      toast.error("Inicie sesión para matricular");
      return;
    }
    try {
      await api.createMatricula({
        estudianteId: form.estudianteId,
        seccionId: form.seccionId,
        anioLectivoId: form.anioLectivoId,
      });
      const stats = await api.getMatriculaStats();
      setMatriculaStats(stats);
      await loadFromApi();
      toast.success("Matrícula institucional registrada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al matricular");
    }
  }

  return {
    students,
    teachers,
    courses,
    matriculaStats,
    dataSource,
    loading: loading || authLoading,
    refresh: loadFromApi,
    addStudent,
    addTeacher,
    updateTeacher,
    deactivateTeacher,
    createTeacherAccount,
    addCourse,
    updateCourse,
    addMatricula,
  };
}
