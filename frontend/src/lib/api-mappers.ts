import { toApiStatus, toUiStatus } from "@/lib/status";
import type {
  Course,
  Enrollment,
  LmsEngagement,
  Student,
  StudentStatus,
  Teacher,
} from "@/types/academic";

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
  promedioGeneral: number;
  asistenciaGeneral: number;
  lmsEngagement: string;
  lmsActivities?: ApiLmsActivity[];
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
  periodo?: string;
  profesor?: { nombres: string; apellidos: string };
  cursoCatalogo?: { nombre: string; area: string };
};

type ApiEnrollment = {
  id: string;
  studentId: string;
  courseId: string;
  periodo?: string;
  promedio?: number;
  asistenciaPct?: number;
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

export function mapStudentFromApi(row: ApiStudent): Student {
  const acts = row.lmsActivities ?? [];
  const last = acts[acts.length - 1];
  const nivelLabel = formatSeccionLabel(row.seccion, row.nivel);
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
      promedioGeneral: row.promedioGeneral,
      asistenciaGeneral: row.asistenciaGeneral,
      lms: {
        engagement: mapEngagement(row.lmsEngagement),
        actividadSemanalPct: acts.map((a) => a.actividadPct),
        minutosPorSemana: acts.map((a) => a.minutos),
        tareasEntregadas: last?.tareasEntregadas ?? 0,
        tareasTotales: last?.tareasTotales ?? 0,
        horasPlataformaSemana: last?.horasPlataforma ?? 0,
      },
    },
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
  const nivel =
    row.nivel ??
    (row.cursoCatalogo ? `${row.cursoCatalogo.area} · ${row.cursoCatalogo.nombre}` : "General");
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
    promedio: row.promedio ?? 0,
    asistenciaPct: row.asistenciaPct ?? 0,
    periodo: row.periodo,
  };
}

export function mapEstadoToApi(estado: StudentStatus): string {
  return toApiStatus(estado);
}
