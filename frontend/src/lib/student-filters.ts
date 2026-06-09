import type { Course, Student, Teacher } from "@/types/academic";
import type { SeccionOption } from "@/hooks/useAcademicStructure";
import { lmsActivityTierFromMetrics } from "@/lib/lms-engagement";

export type AcademicFilterState = {
  gradoId: string;
  seccionId: string;
  courseId: string;
  profesorId: string;
  bimestre: string;
  estado: string;
  search: string;
  fecha: string;
  semana: string;
  riskLevel: string;
  alertStatus: string;
};

export const defaultAcademicFilters = (): AcademicFilterState => ({
  gradoId: "",
  seccionId: "",
  courseId: "",
  profesorId: "",
  bimestre: "",
  estado: "",
  search: "",
  fecha: new Date().toISOString().slice(0, 10),
  semana: "",
  riskLevel: "",
  alertStatus: "",
});

function splitWhitespace(value: string): string[] {
  const parts: string[] = [];
  let current = "";
  for (const ch of value.trim()) {
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      if (current) {
        parts.push(current);
        current = "";
      }
      continue;
    }
    current += ch;
  }
  if (current) parts.push(current);
  return parts;
}

/** Extrae número de grado (1–6) desde etiqueta de sección del estudiante */
export function parseGradoNumero(nivel: string): number | null {
  let digits = "";
  for (const ch of nivel) {
    if (ch >= "0" && ch <= "9") {
      digits += ch;
      continue;
    }
    if (digits.length > 0) break;
  }
  if (!digits) return null;
  const num = Number(digits);
  return Number.isFinite(num) ? num : null;
}

export function parseSeccionLetra(nivel: string): string {
  const parts = splitWhitespace(nivel);
  const last = parts[parts.length - 1];
  if (!last || last.length !== 1) return "";
  const ch = last.toUpperCase();
  return ch >= "A" && ch <= "D" ? ch : "";
}

export function salónLabel(gradoNum: number | null, seccionLetra: string): string {
  if (!gradoNum || !seccionLetra) return "—";
  return `${gradoNum}${seccionLetra}`;
}

export function matchSearch(student: Student, q: string): boolean {
  const term = q.trim().toLowerCase();
  if (!term) return true;
  const full = `${student.nombres} ${student.apellidos} ${student.codigo}`.toLowerCase();
  return full.includes(term);
}

export function filterStudents(
  students: Student[],
  filters: AcademicFilterState,
  secciones: SeccionOption[],
): Student[] {
  let list = [...students];
  if (filters.seccionId) {
    list = list.filter((s) => s.seccionId === filters.seccionId);
  } else if (filters.gradoId) {
    const gradoNum = Number(filters.gradoId);
    const ids = new Set(
      secciones.filter((s) => s.gradoId === gradoNum).map((s) => s.id),
    );
    list = list.filter((s) => s.seccionId && ids.has(s.seccionId));
  }
  if (filters.estado) {
    list = list.filter((s) => s.estado === filters.estado);
  }
  if (filters.search) {
    list = list.filter((s) => matchSearch(s, filters.search));
  }
  return list;
}

export function filterCourses(
  courses: Course[],
  filters: AcademicFilterState,
  secciones: SeccionOption[],
): Course[] {
  let list = [...courses];
  if (filters.profesorId) {
    list = list.filter((c) => c.profesorId === filters.profesorId);
  }
  if (filters.seccionId) {
    list = list.filter((c) => !c.seccionId || c.seccionId === filters.seccionId);
  } else if (filters.gradoId) {
    const gradoNum = Number(filters.gradoId);
    const ids = new Set(
      secciones.filter((s) => s.gradoId === gradoNum).map((s) => s.id),
    );
    list = list.filter((c) => !c.seccionId || ids.has(c.seccionId));
  }
  if (filters.courseId) {
    list = list.filter((c) => c.id === filters.courseId);
  }
  return list;
}

export function uniqueGradosFromSecciones(secciones: SeccionOption[]) {
  const map = new Map<number, string>();
  for (const s of secciones) {
    if (!map.has(s.gradoId)) {
      const num = parseGradoNumero(s.gradoLabel) ?? s.gradoId;
      map.set(s.gradoId, `${num}°`);
    }
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([id, label]) => ({ id: String(id), label }));
}

export function seccionesForGrado(secciones: SeccionOption[], gradoId: string) {
  if (!gradoId) return secciones;
  const gid = Number(gradoId);
  return secciones.filter((s) => s.gradoId === gid);
}

export function teachersForSelect(teachers: Teacher[]) {
  return teachers.map((t) => ({
    id: t.id,
    label: `${t.nombres} ${t.apellidos}`,
  }));
}

export type GradeStatus = "Aprobado" | "En riesgo" | "Desaprobado";

export function salonShortFromSeccion(s: SeccionOption): string {
  const num = parseGradoNumero(s.gradoLabel) ?? s.gradoId;
  return `${num}°${s.nombre}`;
}

export type { LmsActivityTier } from "@/lib/lms-engagement";

export function lmsActivityTier(student: Student): import("@/lib/lms-engagement").LmsActivityTier {
  return lmsActivityTierFromMetrics(
    student.metrics.lms.engagement,
    student.metrics.lms.actividadSemanalPct.map((actividadPct, i) => ({
      actividadPct,
      minutos: student.metrics.lms.minutosPorSemana[i],
    })),
    {
      tareasRatio:
        student.metrics.lms.tareasTotales > 0
          ? student.metrics.lms.tareasEntregadas / student.metrics.lms.tareasTotales
          : 0,
      tiempoPlataforma: student.metrics.lms.horasPlataformaSemana,
    },
  );
}

export function notaEstado(nota: number, promedio?: number): GradeStatus {
  const ref = promedio ?? nota;
  if (ref < 11) return "Desaprobado";
  if (ref < 14) return "En riesgo";
  return "Aprobado";
}
