export type RiskLevel = "bajo" | "medio" | "alto";

export type StudentStatus = "activo" | "en riesgo" | "retirado";

export type LmsEngagement = "alto" | "medio" | "bajo";

export type StudentLmsProfile = {
  engagement: LmsEngagement;
  /** Porcentaje de actividad relativa por semana (0–100). */
  actividadSemanalPct: number[];
  minutosPorSemana: number[];
  tareasEntregadas: number;
  tareasTotales: number;
  horasPlataformaSemana: number;
};

export type StudentAcademicMetrics = {
  /** Escala 0–20 (Perú). */
  promedioGeneral: number;
  /** Porcentaje 0–100. */
  asistenciaGeneral: number;
  lms: StudentLmsProfile;
};

export type Student = {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  nivel: string;
  correo: string;
  telefono: string;
  estado: StudentStatus;
  metrics: StudentAcademicMetrics;
};

export type Teacher = {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  especialidad: string;
  correo: string;
  telefono: string;
};

export type Course = {
  id: string;
  codigo: string;
  nombre: string;
  nivel: string;
  profesorId: string;
};

export type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  promedio: number;
  asistenciaPct: number;
};

export type FactorKey =
  | "bajo_promedio"
  | "baja_asistencia"
  | "baja_actividad_lms"
  | "tareas_incompletas";

export type RiskFactor = {
  key: FactorKey;
  label: string;
  /** Contribución ponderada al score final (0–100). */
  contribution: number;
  severity: "leve" | "moderada" | "alta";
};

export type PredictionOutput = {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  meta: {
    nombreModelo: string;
    descripcion: string;
    pesos: Record<string, number>;
    notas: string[];
  };
};

export type ScenarioDeltas = {
  promedioDelta?: number;
  asistenciaDelta?: number;
  /** Suma a cada semana de actividad LMS (0–100). */
  lmsActividadDelta?: number;
  tareasEntregadasExtra?: number;
};

export type RiskHistoryPoint = {
  periodo: string;
  riesgoGlobal: number;
};
