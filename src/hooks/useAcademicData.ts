"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  seedCourses,
  seedEnrollments,
  seedStudents,
  seedTeachers,
} from "@/data/seed";
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

export type DataSource = "api" | "local";

export function useAcademicData() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [dataSource, setDataSource] = useState<DataSource>("local");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>(seedStudents);
  const [teachers, setTeachers] = useState<Teacher[]>(seedTeachers);
  const [courses, setCourses] = useState<Course[]>(seedCourses);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(seedEnrollments);

  const loadFromApi = useCallback(async () => {
    if (!api.hasToken) return false;
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
      setDataSource("local");
      setStudents(seedStudents);
      setTeachers(seedTeachers);
      setCourses(seedCourses);
      setEnrollments(seedEnrollments);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      void loadFromApi().then((ok) => {
        if (ok) toast.success("Datos sincronizados con el servidor");
      });
    } else {
      setDataSource("local");
      setStudents(seedStudents);
      setTeachers(seedTeachers);
      setCourses(seedCourses);
      setEnrollments(seedEnrollments);
    }
  }, [isAuthenticated, authLoading, loadFromApi]);

  async function addStudent(form: NewStudentForm): Promise<void> {
    const promedio = Number.parseFloat(form.promedioGeneral.replace(",", "."));
    const asistencia = Number.parseFloat(form.asistenciaGeneral.replace(",", "."));
    const metrics = buildMetrics(
      Number.isFinite(promedio) ? Math.min(20, Math.max(0, promedio)) : 13,
      Number.isFinite(asistencia) ? Math.min(100, Math.max(0, asistencia)) : 85,
      form.engagement,
    );

    if (dataSource === "api" && api.hasToken) {
      try {
        const res = await api.createStudent({
          codigo: form.codigo.trim(),
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          nivel: form.nivel.trim(),
          correo: form.correo.trim(),
          telefono: form.telefono.trim() || undefined,
          estado: mapEstadoToApi(form.estado),
          promedioGeneral: metrics.promedioGeneral,
          asistenciaGeneral: metrics.asistenciaGeneral,
          lmsEngagement: form.engagement,
        });
        const created = mapStudentFromApi(res.student as Parameters<typeof mapStudentFromApi>[0]);
        setStudents((prev) => [...prev, created]);
        toast.success("Estudiante registrado en base de datos");
        return;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al guardar");
        return;
      }
    }

    const created: Student = {
      id: `s-${Date.now()}`,
      codigo: form.codigo.trim(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      nivel: form.nivel.trim(),
      correo: form.correo.trim(),
      telefono: form.telefono.trim(),
      estado: form.estado,
      metrics,
    };
    setStudents((prev) => [...prev, created]);
    toast.success("Estudiante agregado (modo local)");
  }

  async function addEnrollment(form: NewEnrollmentForm): Promise<void> {
    if (!form.studentId || !form.courseId) return;
    const promedio = Number.parseFloat(form.promedio.replace(",", "."));
    const asistencia = Number.parseFloat(form.asistenciaPct.replace(",", "."));
    if (!Number.isFinite(promedio) || !Number.isFinite(asistencia)) return;

    if (dataSource === "api" && api.hasToken) {
      try {
        const res = await api.createEnrollment({
          studentId: form.studentId,
          courseId: form.courseId,
          promedio: Math.min(20, Math.max(0, promedio)),
          asistenciaPct: Math.min(100, Math.max(0, asistencia)),
        });
        const row = mapEnrollmentFromApi(res.item as Parameters<typeof mapEnrollmentFromApi>[0]);
        setEnrollments((prev) => [...prev, row]);
        toast.success("Matrícula registrada");
        return;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al matricular");
        return;
      }
    }

    setEnrollments((prev) => [
      ...prev,
      {
        id: `e-${Date.now()}`,
        studentId: form.studentId,
        courseId: form.courseId,
        promedio: Math.min(20, Math.max(0, promedio)),
        asistenciaPct: Math.min(100, Math.max(0, asistencia)),
      },
    ]);
    toast.success("Matrícula agregada (modo local)");
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
