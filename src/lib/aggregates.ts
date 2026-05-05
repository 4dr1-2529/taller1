import type { Course, Enrollment, RiskHistoryPoint, RiskLevel, Student } from "@/types/academic";
import { computePrediction } from "@/lib/risk-model";

export const RISK_HISTORY_MOCK: RiskHistoryPoint[] = [
  { periodo: "2025-09", riesgoGlobal: 38 },
  { periodo: "2025-10", riesgoGlobal: 41 },
  { periodo: "2025-11", riesgoGlobal: 44 },
  { periodo: "2025-12", riesgoGlobal: 42 },
  { periodo: "2026-01", riesgoGlobal: 46 },
  { periodo: "2026-02", riesgoGlobal: 45 },
  { periodo: "2026-03", riesgoGlobal: 43 },
];

export type StudentWithPrediction = Student & {
  prediction: ReturnType<typeof computePrediction>;
};

export function attachPredictions(students: Student[]): StudentWithPrediction[] {
  return students.map((s) => ({
    ...s,
    prediction: computePrediction(s.metrics, s.estado),
  }));
}

export function globalRiskScore(students: Student[]): number {
  if (!students.length) return 0;
  const withPred = attachPredictions(students);
  const sum = withPred.reduce((acc, s) => acc + s.prediction.score, 0);
  return Math.round((sum / withPred.length) * 10) / 10;
}

export function earlyAlertCount(students: Student[]): number {
  return attachPredictions(students).filter(
    (s) => s.prediction.level === "alto" || s.prediction.level === "medio",
  ).length;
}

export function riskTrendLabel(history: RiskHistoryPoint[]): {
  direction: "up" | "down" | "flat";
  label: string;
  delta: number;
} {
  if (history.length < 2) {
    return { direction: "flat", label: "Sin datos suficientes", delta: 0 };
  }
  const prev = history[history.length - 2].riesgoGlobal;
  const last = history[history.length - 1].riesgoGlobal;
  const delta = Math.round((last - prev) * 10) / 10;
  if (delta > 0.5) return { direction: "up", label: "El riesgo global sube", delta };
  if (delta < -0.5) return { direction: "down", label: "El riesgo global baja", delta };
  return { direction: "flat", label: "Riesgo estable", delta };
}

export function averageAttendance(students: Student[]): number {
  if (!students.length) return 0;
  const v =
    students.reduce((a, s) => a + s.metrics.asistenciaGeneral, 0) / students.length;
  return Math.round(v * 10) / 10;
}

export function averageLmsParticipation(students: Student[]): number {
  if (!students.length) return 0;
  const vals = students.map((s) => {
    const arr = s.metrics.lms.actividadSemanalPct;
    return arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : 0;
  });
  const v = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.round(v * 10) / 10;
}

export type CourseRiskRow = {
  courseId: string;
  nombre: string;
  riesgoPromedio: number;
  estudiantes: number;
};

export function riskByCourse(
  students: Student[],
  courses: Course[],
  enrollments: Enrollment[],
): CourseRiskRow[] {
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const byCourse = new Map<string, number[]>();
  for (const e of enrollments) {
    const st = studentMap.get(e.studentId);
    if (!st) continue;
    const pred = computePrediction(st.metrics, st.estado);
    if (!byCourse.has(e.courseId)) byCourse.set(e.courseId, []);
    byCourse.get(e.courseId)!.push(pred.score);
  }
  return courses.map((c) => {
    const scores = byCourse.get(c.id) ?? [];
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return {
      courseId: c.id,
      nombre: c.nombre,
      riesgoPromedio: Math.round(avg * 10) / 10,
      estudiantes: scores.length,
    };
  });
}

export function rankingAtRisk(students: Student[], limit = 8): StudentWithPrediction[] {
  return [...attachPredictions(students)]
    .sort((a, b) => b.prediction.score - a.prediction.score)
    .slice(0, limit);
}

export function failCountByCourse(
  courses: Course[],
  enrollments: Enrollment[],
  umbral = 11,
): { courseId: string; nombre: string; desaprobados: number }[] {
  return courses.map((c) => ({
    courseId: c.id,
    nombre: c.nombre,
    desaprobados: enrollments.filter((e) => e.courseId === c.id && e.promedio < umbral)
      .length,
  }));
}

export function lowLmsStudents(students: Student[], maxParticipation = 45): StudentWithPrediction[] {
  return attachPredictions(students).filter((s) => {
    const arr = s.metrics.lms.actividadSemanalPct;
    const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return avg <= maxParticipation;
  });
}

export type AtRiskByCourseRow = {
  courseId: string;
  courseName: string;
  students: { id: string; nombre: string; score: number; level: RiskLevel }[];
};

export function atRiskStudentsByCourse(
  students: Student[],
  courses: Course[],
  enrollments: Enrollment[],
  minScore = 41,
): AtRiskByCourseRow[] {
  const predList = attachPredictions(students);
  const predMap = new Map(predList.map((s) => [s.id, s]));
  return courses.map((c) => {
    const inCourse = enrollments.filter((e) => e.courseId === c.id);
    const studentsAtRisk = inCourse
      .map((e) => predMap.get(e.studentId))
      .filter((s): s is StudentWithPrediction => !!s)
      .filter((s) => s.prediction.score >= minScore)
      .map((s) => ({
        id: s.id,
        nombre: `${s.nombres} ${s.apellidos}`,
        score: Math.round(s.prediction.score),
        level: s.prediction.level,
      }));
    return { courseId: c.id, courseName: c.nombre, students: studentsAtRisk };
  });
}
