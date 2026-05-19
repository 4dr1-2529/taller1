import type {
  Course,
  Enrollment,
  LmsEngagement,
  Student,
  StudentStatus,
  Teacher,
} from "@/types/academic";

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
  nivel: string;
  correo: string;
  telefono: string | null;
  estado: string;
  promedioGeneral: number;
  asistenciaGeneral: number;
  lmsEngagement: string;
  lmsActivities?: ApiLmsActivity[];
};

type ApiTeacher = {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  correo: string;
  telefono: string | null;
};

type ApiCourse = {
  id: string;
  codigo: string;
  nombre: string;
  nivel: string;
  profesorId: string;
};

type ApiEnrollment = {
  id: string;
  studentId: string;
  courseId: string;
  promedio: number;
  asistenciaPct: number;
};

function mapEstado(estado: string): StudentStatus {
  if (estado === "en_riesgo") return "en riesgo";
  if (estado === "activo" || estado === "retirado") return estado;
  return "activo";
}

function mapEngagement(v: string): LmsEngagement {
  if (v === "alto" || v === "bajo") return v;
  return "medio";
}

export function mapStudentFromApi(row: ApiStudent): Student {
  const acts = row.lmsActivities ?? [];
  const last = acts[acts.length - 1];
  return {
    id: row.id,
    codigo: row.codigo,
    nombres: row.nombres,
    apellidos: row.apellidos,
    nivel: row.nivel,
    correo: row.correo,
    telefono: row.telefono ?? "",
    estado: mapEstado(row.estado),
    metrics: {
      promedioGeneral: row.promedioGeneral,
      asistenciaGeneral: row.asistenciaGeneral,
      lms: {
        engagement: mapEngagement(row.lmsEngagement),
        actividadSemanalPct: acts.map((a) => a.actividadPct),
        minutosPorSemana: acts.map((a) => a.minutos),
        tareasEntregadas: last?.tareasEntregadas ?? 5,
        tareasTotales: last?.tareasTotales ?? 10,
        horasPlataformaSemana: last?.horasPlataforma ?? 2,
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
  };
}

export function mapCourseFromApi(row: ApiCourse): Course {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    nivel: row.nivel,
    profesorId: row.profesorId,
  };
}

export function mapEnrollmentFromApi(row: ApiEnrollment): Enrollment {
  return {
    id: row.id,
    studentId: row.studentId,
    courseId: row.courseId,
    promedio: row.promedio,
    asistenciaPct: row.asistenciaPct,
  };
}

export function mapEstadoToApi(estado: StudentStatus): string {
  if (estado === "en riesgo") return "en_riesgo";
  return estado;
}
