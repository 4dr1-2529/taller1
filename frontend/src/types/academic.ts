export type RiskLevel = "bajo" | "medio" | "alto";

export type StudentStatus = "activo" | "en riesgo" | "retirado";

export type LmsEngagement = "alto" | "medio" | "bajo";

export type StudentLmsProfile = {
  engagement: LmsEngagement;
  actividadSemanalPct: number[];
  minutosPorSemana: number[];
  tareasEntregadas: number;
  tareasTotales: number;
  horasPlataformaSemana: number;
};

export type StudentAcademicMetrics = {
  promedioGeneral: number;
  asistenciaGeneral: number;
  lms: StudentLmsProfile;
};

export type Student = {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  /** Etiqueta legible: Primaria · 3° A */
  nivel: string;
  seccionId?: string;
  correo: string;
  telefono: string;
  estado: StudentStatus;
  metrics: StudentAcademicMetrics;
  prediction?: { score: number; level: RiskLevel; probability?: number };
  /** Última predicción persistida en BD (prioridad sobre cálculo local) */
  storedPrediction?: {
    score: number;
    level: RiskLevel;
    probability?: number;
    factors?: { key: string; label: string; contribution: number }[];
    modelName?: string;
    createdAt?: string;
  };
};

export type TeacherCourse = {
  id: string;
  codigo: string;
  nombre: string;
  seccionId?: string;
  periodo?: string;
  area?: string;
};

export type Teacher = {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  correo: string;
  telefono: string;
  courses?: TeacherCourse[];
  courseCount?: number;
  userId?: string | null;
  user?: { id: string; email: string; activo: boolean } | null;
};

export type Course = {
  id: string;
  codigo: string;
  nombre: string;
  nivel: string;
  profesorId: string;
  seccionId?: string;
  periodo?: string;
  profesor?: { nombres: string; apellidos: string };
};

export type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  promedio: number;
  asistenciaPct: number;
  periodo?: string;
  student?: Student;
  course?: Course;
};

export type FactorKey =
  | "bajo_promedio"
  | "baja_asistencia"
  | "baja_actividad_lms"
  | "tareas_incompletas";

export type RiskFactor = {
  key: FactorKey | string;
  label: string;
  contribution: number;
  severity: "leve" | "moderada" | "alta";
};

export type PredictionOutput = {
  score: number;
  level: RiskLevel;
  probability?: number;
  factors: RiskFactor[];
  modelName?: string;
  meta?: {
    nombreModelo?: string;
    descripcion?: string;
    pesos?: Record<string, number>;
    notas?: string[];
  };
};

export type ScenarioDeltas = {
  promedioDelta?: number;
  asistenciaDelta?: number;
  lmsActividadDelta?: number;
  tareasEntregadasExtra?: number;
};

export type RiskHistoryPoint = {
  periodo: string;
  riesgoGlobal: number;
};

export type UserRole =
  | "admin"
  | "docente"
  | "tutor"
  | "psicologo"
  | "estudiante"
  | "apoderado";

export type AuditLog = {
  id: string;
  entidad: string;
  entidadId: string | null;
  accion: string;
  usuarioId: string | null;
  detalle: string | null;
  ipAddress: string | null;
  createdAt: string;
  student?: { nombres: string; apellidos: string; codigo: string };
};
