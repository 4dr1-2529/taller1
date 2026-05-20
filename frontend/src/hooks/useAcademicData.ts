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
    addEnrollment,
  };
}
