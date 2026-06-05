import type { Course, RiskFactor, RiskHistoryPoint, RiskLevel, Student } from "@/types/academic";
import { computePrediction } from "@/lib/risk-engine";
import { toRiskEngineStatus } from "@/lib/status";

export type StudentWithPrediction = Student & {
  prediction: ReturnType<typeof computePrediction>;
};

function mapStoredFactors(factors?: { key: string; label: string; contribution: number }[]): RiskFactor[] {
  if (!factors?.length) return [];
  return factors.map((f) => ({
    ...f,
    severity: (f.contribution >= 20 ? "alta" : f.contribution >= 10 ? "media" : "baja") as RiskFactor["severity"],
  }));
}

function predictionFromStored(s: Student): StudentWithPrediction["prediction"] {
  const sp = s.storedPrediction;
  if (!sp) return computePrediction(s.metrics, toRiskEngineStatus(s.estado));
  const factors = mapStoredFactors(sp.factors);
  const fallback = computePrediction(s.metrics, toRiskEngineStatus(s.estado));
  return {
    score: sp.score,
    level: sp.level,
    probability: sp.probability ?? sp.score / 100,
    factors: factors.length ? factors : fallback.factors,
    modelName: sp.modelName ?? fallback.modelName,
  };
}

export function attachPredictions(students: Student[]): StudentWithPrediction[] {
  return students.map((s) => ({
    ...s,
    prediction: predictionFromStored(s),
  }));
}

export function globalRiskScore(students: Student[]): number {
  if (!students.length) return 0;
  const withPred = attachPredictions(students);
  const sum = withPred.reduce((acc, s) => acc + s.prediction.score, 0);
  return Math.round((sum / withPred.length) * 10) / 10;
}

export function buildRiskHistory(students: Student[]): RiskHistoryPoint[] {
  if (!students.length) return [];
  const now = new Date();
  const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return [{ periodo, riesgoGlobal: globalRiskScore(students) }];
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
    return { direction: "flat", label: "Registre más periodos para ver tendencia", delta: 0 };
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
  const v = students.reduce((a, s) => a + s.metrics.asistenciaGeneral, 0) / students.length;
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

/** Estudiantes matriculados en el salón del curso (misma sección). */
export function studentsInCourseSalon(students: Student[], course: Course): Student[] {
  if (!course.seccionId) return students;
  return students.filter((s) => s.seccionId === course.seccionId);
}

export type CourseRiskRow = {
  courseId: string;
  nombre: string;
  riesgoPromedio: number;
  estudiantes: number;
};

export function riskByCourse(students: Student[], courses: Course[]): CourseRiskRow[] {
  return courses.map((c) => {
    const inSalon = studentsInCourseSalon(students, c);
    const scores = attachPredictions(inSalon).map((s) => s.prediction.score);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return {
      courseId: c.id,
      nombre: c.nombre,
      riesgoPromedio: Math.round(avg * 10) / 10,
      estudiantes: inSalon.length,
    };
  });
}

export function failCountByCourse(
  students: Student[],
  courses: Course[],
  umbral = 11,
): { courseId: string; nombre: string; desaprobados: number }[] {
  return courses.map((c) => ({
    courseId: c.id,
    nombre: c.nombre,
    desaprobados: studentsInCourseSalon(students, c).filter((s) => s.metrics.promedioGeneral < umbral)
      .length,
  }));
}

export function rankingAtRisk(students: Student[], limit = 8): StudentWithPrediction[] {
  return [...attachPredictions(students)]
    .sort((a, b) => b.prediction.score - a.prediction.score)
    .slice(0, limit);
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
  minScore = 41,
): AtRiskByCourseRow[] {
  const predMap = new Map(attachPredictions(students).map((s) => [s.id, s]));
  return courses.map((c) => {
    const inSalon = studentsInCourseSalon(students, c);
    const studentsAtRisk = inSalon
      .map((s) => predMap.get(s.id))
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
