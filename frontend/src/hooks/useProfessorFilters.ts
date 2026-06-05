"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Course } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import {
  defaultAcademicFilters,
  filterCourses,
  seccionesForGrado,
  uniqueGradosFromSecciones,
  type AcademicFilterState,
} from "@/lib/student-filters";
import { PROFESOR_HINTS } from "@/constants/blenkir";

export function useProfessorFilters(secciones: SeccionOption[], courses: Course[] = []) {
  const [draft, setDraft] = useState<AcademicFilterState>(defaultAcademicFilters);
  const [applied, setApplied] = useState<AcademicFilterState>(defaultAcademicFilters);
  const [searched, setSearched] = useState(false);

  const grados = useMemo(() => uniqueGradosFromSecciones(secciones), [secciones]);
  const seccionOptions = useMemo(
    () => seccionesForGrado(secciones, draft.gradoId),
    [secciones, draft.gradoId],
  );
  const courseOptions = useMemo(
    () => filterCourses(courses, draft, secciones),
    [courses, draft, secciones],
  );

  const updateDraft = useCallback(<K extends keyof AcademicFilterState>(key: K, value: AcademicFilterState[K]) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "gradoId") {
        next.seccionId = "";
        next.courseId = "";
      }
      if (key === "seccionId") next.courseId = "";
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    const empty = defaultAcademicFilters();
    setDraft(empty);
    setApplied(empty);
    setSearched(false);
  }, []);

  const validateSalon = useCallback((requireCourse = false) => {
    if (!draft.gradoId || !draft.seccionId) {
      toast.error(PROFESOR_HINTS.selectGradoSeccion);
      return false;
    }
    if (requireCourse && !draft.courseId) {
      toast.error(PROFESOR_HINTS.selectCourse);
      return false;
    }
    return true;
  }, [draft.gradoId, draft.seccionId, draft.courseId]);

  const applyFilters = useCallback(() => {
    setApplied({ ...draft });
    setSearched(true);
    return true;
  }, [draft]);

  const applySearch = useCallback(() => {
    if (!validateSalon()) return false;
    setApplied({ ...draft });
    setSearched(true);
    return true;
  }, [draft, validateSalon]);

  return {
    draft,
    applied,
    searched,
    grados,
    seccionOptions,
    courseOptions,
    updateDraft,
    clear,
    applySearch,
    applyFilters,
    validateSalon,
    setDraft,
    setApplied,
    setSearched,
  };
}
