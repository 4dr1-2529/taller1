"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthProvider";
import {
  mapCourseFromApi,
  mapEnrollmentFromApi,
  mapEstadoToApi,
  mapStudentFromApi,
  mapTeacherFromApi,
} from "@/lib/api-mappers";
import { buildMetrics } from "@/lib/student-factory";
import { api } from "@/services/api";
import type { Course, Enrollment, Student, Teacher } from "@/types/academic";
import type { NewStudentForm } from "@/components/views/StudentsView";
import type { NewEnrollmentForm } from "@/components/views/EnrollmentsView";
import type { NewTeacherForm } from "@/components/views/TeachersView";

export type DataSource = "api" | "none";

export function useAcademicData() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [dataSource, setDataSource] = useState<DataSource>("none");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  const loadFromApi = useCallback(async () => {
    if (!api.hasToken) {
      setDataSource("none");
      return false;
    }
    setLoading(true);
    try {
      await api.health();
      const [st, te, co, en] = await Promise.all([
        api.getStudents(200),
        api.getTeachers(),
        api.getCourses(),
        api.getEnrollments(),
      ]);
      setStudents(st.items.map((r) => mapStudentFromApi(r as Parameters<typeof mapStudentFromApi>[0])));
      setTeachers(te.items.map((r) => mapTeacherFromApi(r as Parameters<typeof mapTeacherFromApi>[0])));
      setCourses(co.items.map((r) => mapCourseFromApi(r as Parameters<typeof mapCourseFromApi>[0])));
      setEnrollments(
        en.items.map((r) => mapEnrollmentFromApi(r as Parameters<typeof mapEnrollmentFromApi>[0])),
      );
      setDataSource("api");
      return true;
    } catch {
      setStudents([]);
      setTeachers([]);
      setCourses([]);
      setEnrollments([]);
      setDataSource("none");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      void loadFromApi();
    } else {
      setDataSource("none");
      setStudents([]);
      setTeachers([]);
      setCourses([]);
      setEnrollments([]);
    }
  }, [isAuthenticated, authLoading, loadFromApi]);

  async function addStudent(form: NewStudentForm): Promise<void> {
    if (!api.hasToken) {
      toast.error("Inicie sesión para registrar estudiantes");
      return;
    }
    if (!form.seccionId) {
      toast.error("Seleccione una sección (grado y salón)");
      return;
    }
    const promedio = Number.parseFloat(form.promedioGeneral.replace(",", "."));
    const asistencia = Number.parseFloat(form.asistenciaGeneral.replace(",", "."));
    const metrics = buildMetrics(
      Number.isFinite(promedio) ? Math.min(20, Math.max(0, promedio)) : 0,
      Number.isFinite(asistencia) ? Math.min(100, Math.max(0, asistencia)) : 0,
      form.engagement,
    );
    try {
      const res = await api.createStudent({
        codigo: form.codigo.trim(),
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        seccionId: form.seccionId,
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
    const cursos = form.cursos
      .filter((c) => c.codigo.trim() && c.nombre.trim())
      .map((c) => ({
        codigo: c.codigo.trim(),
        nombre: c.nombre.trim(),
        seccionId: c.seccionId || undefined,
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
        cursos.length
          ? `Docente registrado con ${cursos.length} curso(s)`
          : "Docente registrado",
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
    const cursosNuevos = data.cursosNuevos
      .filter((c) => c.codigo.trim() && c.nombre.trim())
      .map((c) => ({
        codigo: c.codigo.trim(),
        nombre: c.nombre.trim(),
        seccionId: c.seccionId || undefined,
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
    seccionId?: string;
  }): Promise<void> {
    if (!api.hasToken) {
      toast.error("Inicie sesión para crear cursos");
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

  async function addEnrollment(form: NewEnrollmentForm): Promise<void> {
    if (!form.studentId || !form.courseId) return;
    if (!api.hasToken) {
      toast.error("Inicie sesión para matricular");
      return;
    }
    try {
      const res = await api.createEnrollment({
        studentId: form.studentId,
        courseId: form.courseId,
        periodo: "2026-I",
      });
      const row = mapEnrollmentFromApi(res.item as Parameters<typeof mapEnrollmentFromApi>[0]);
      setEnrollments((prev) => [...prev, row]);
      toast.success("Matrícula registrada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al matricular");
    }
  }

  return {
    students,
    teachers,
    courses,
    enrollments,
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
    addEnrollment,
  };
}
