"use client";

import { useMemo, useState } from "react";
import type { Course, Student, Teacher } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import {
  defaultAcademicFilters,
  filterCourses,
  filterStudents,
  seccionesForGrado,
  uniqueGradosFromSecciones,
  type AcademicFilterState,
} from "@/lib/student-filters";

export type AcademicFilterOptions = {
  showGrado?: boolean;
  showSeccion?: boolean;
  showCourse?: boolean;
  showProfesor?: boolean;
  showBimestre?: boolean;
  showEstado?: boolean;
  showSearch?: boolean;
  showFecha?: boolean;
  showSemana?: boolean;
  showRisk?: boolean;
  showAlertStatus?: boolean;
};

export function useAcademicFilters(
  students: Student[],
  courses: Course[],
  secciones: SeccionOption[],
  teachers: Teacher[] = [],
  options: AcademicFilterOptions = {},
) {
  const [filters, setFilters] = useState<AcademicFilterState>(defaultAcademicFilters);

  const grados = useMemo(() => uniqueGradosFromSecciones(secciones), [secciones]);
  const seccionOptions = useMemo(
    () => seccionesForGrado(secciones, filters.gradoId),
    [secciones, filters.gradoId],
  );

  const filteredStudents = useMemo(
    () => filterStudents(students, filters, secciones),
    [students, filters, secciones],
  );

  const filteredCourses = useMemo(
    () => filterCourses(courses, filters, secciones),
    [courses, filters, secciones],
  );

  const updateFilter = <K extends keyof AcademicFilterState>(key: K, value: AcademicFilterState[K]) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "gradoId") {
        next.seccionId = "";
        next.courseId = "";
      }
      if (key === "seccionId") next.courseId = "";
      return next;
    });
  };

  const resetFilters = () => setFilters(defaultAcademicFilters());

  const hasGrado = Boolean(filters.gradoId || filters.seccionId);
  const hasSeccion = Boolean(filters.seccionId);

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    grados,
    seccionOptions,
    filteredStudents,
    filteredCourses,
    teachers,
    hasGrado,
    hasSeccion,
    options,
  };
}
