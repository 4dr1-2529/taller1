import { toApiStatus, toUiStatus } from "@/lib/status";
import type {
  Course,
  Enrollment,
  LmsEngagement,
  Student,
  StudentStatus,
  Teacher,
} from "@/types/academic";

/** Prisma Decimal llega como string en JSON — normalizar a number. */
function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

type ApiSeccion = {
  id: string;
  nombre: string;
  grado?: {
    numero: number;
    nombre: string;
    nivel?: { codigo: string; nombre: string };
  };
};

type ApiLmsActivity = {
  actividadPct: number;
  minutos: number;
  tareasEntregadas: number;
  tareasTotales: number;
  horasPlataforma: number;
};

type ApiStoredPrediction = {
  score: number;
  level: "bajo" | "medio" | "alto";
  probability?: number | null;
  modelName?: string;
  factorsJson?: string;
  createdAt?: string;
};

type ApiStudent = {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  nivel?: string;
  seccionId?: string | null;
  seccion?: ApiSeccion | null;
  correo: string | null;
  telefono: string | null;
  estado: string;
  promedioGeneral: number | string;
  asistenciaGeneral: number | string;
  lmsEngagement: string;
  lmsActivities?: ApiLmsActivity[];
  predictions?: ApiStoredPrediction[];
};

type ApiTeacherCourse = {
  id: string;
  codigo: string;
  nombre: string;
  seccionId?: string | null;
  periodo?: string;
  cursoCatalogo?: { nombre: string; area: string } | null;
};

type ApiTeacher = {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  correo: string;
  telefono: string | null;
  userId?: string | null;
  user?: { id: string; email: string; activo: boolean } | null;
  courses?: ApiTeacherCourse[];
  _count?: { courses: number };
};

type ApiCourse = {
  id: string;
  codigo: string;
  nombre: string;
  nivel?: string;
  profesorId: string;
  seccionId?: string | null;
  seccion?: ApiSeccion | null;
  periodo?: string;
  profesor?: { nombres: string; apellidos: string };
  cursoCatalogo?: { nombre: string; area: string };
};

type ApiEnrollment = {
  id: string;
  studentId: string;
  courseId: string;
  periodo?: string;
  promedio?: number | string;
  asistenciaPct?: number | string;
};

export function formatSeccionLabel(seccion?: ApiSeccion | null, fallbackNivel?: string): string {
  if (!seccion) return fallbackNivel ?? "Sin sección";
  const grado = seccion.grado;
  const nivel = grado?.nivel?.nombre ?? grado?.nivel?.codigo ?? "";
  const gradoNombre = grado?.nombre ?? `${grado?.numero ?? ""}°`;
  return `${nivel} · ${gradoNombre} ${seccion.nombre}`.replace(/^ · /, "").trim();
}

function mapEstado(estado: string): StudentStatus {
  return toUiStatus(estado);
}

function mapEngagement(v: string): LmsEngagement {
  if (v === "alto" || v === "bajo") return v;
  return "medio";
}

function parseFactorsJson(raw?: string) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { key: string; label: string; contribution: number }[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function mapStudentFromApi(row: ApiStudent): Student {
  const acts = row.lmsActivities ?? [];
  const last = acts[acts.length - 1];
  const nivelLabel = formatSeccionLabel(row.seccion, row.nivel);
  const lastPred = row.predictions?.[0];
  return {
    id: row.id,
    codigo: row.codigo,
    nombres: row.nombres,
    apellidos: row.apellidos,
    nivel: nivelLabel,
    seccionId: row.seccionId ?? row.seccion?.id,
    correo: row.correo ?? "",
    telefono: row.telefono ?? "",
    estado: mapEstado(row.estado),
    metrics: {
      promedioGeneral: toNumber(row.promedioGeneral),
      asistenciaGeneral: toNumber(row.asistenciaGeneral),
      lms: {
        engagement: mapEngagement(row.lmsEngagement),
        actividadSemanalPct: acts.map((a) => toNumber(a.actividadPct)),
        minutosPorSemana: acts.map((a) => toNumber(a.minutos)),
        tareasEntregadas: toNumber(last?.tareasEntregadas),
        tareasTotales: toNumber(last?.tareasTotales),
        horasPlataformaSemana: toNumber(last?.horasPlataforma),
      },
    },
    storedPrediction: lastPred
      ? {
          score: toNumber(lastPred.score),
          level: lastPred.level,
          probability: lastPred.probability != null ? toNumber(lastPred.probability) : undefined,
          factors: parseFactorsJson(lastPred.factorsJson),
          modelName: lastPred.modelName,
          createdAt: lastPred.createdAt,
        }
      : undefined,
  };
}

export function mapTeacherFromApi(row: ApiTeacher): Teacher {
  return {
    id: row.id,
    codigo: row.codigo,
    nombres: row.nombres,
    apellidos: row.apellidos,
    especialidad: row.especialidad,
    correo: row.correo,
    telefono: row.telefono ?? "",
    userId: row.userId ?? row.user?.id ?? null,
    user: row.user ?? null,
    courses: (row.courses ?? []).map((c) => ({
      id: c.id,
      codigo: c.codigo,
      nombre: c.nombre,
      seccionId: c.seccionId ?? undefined,
      periodo: c.periodo,
      area: c.cursoCatalogo?.area,
    })),
    courseCount: row._count?.courses ?? row.courses?.length ?? 0,
  };
}

export function mapCourseFromApi(row: ApiCourse): Course {
  const nivel = row.seccion
    ? formatSeccionLabel(row.seccion)
    : row.nivel ??
      (row.cursoCatalogo ? `${row.cursoCatalogo.area} · ${row.cursoCatalogo.nombre}` : "Sin sección");
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    nivel,
    profesorId: row.profesorId,
    seccionId: row.seccionId ?? undefined,
    periodo: row.periodo,
    profesor: row.profesor,
  };
}

export function mapEnrollmentFromApi(row: ApiEnrollment): Enrollment {
  return {
    id: row.id,
    studentId: row.studentId,
    courseId: row.courseId,
    promedio: toNumber(row.promedio),
    asistenciaPct: toNumber(row.asistenciaPct),
    periodo: row.periodo,
  };
}

export function mapEstadoToApi(estado: StudentStatus): string {
  return toApiStatus(estado);
}
