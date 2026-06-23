import {
  api,
  type Alert,
  type ApiPredictionResult,
  type ApiSeccion,
  type Course,
  type Student,
} from "@/services/api";

export type ProfesorQueryParams = {
  gradoId?: string;
  seccionId?: string;
  cursoId?: string;
  search?: string;
  bimestre?: string;
  fecha?: string;
  riskLevel?: string;
  status?: string;
  page?: number;
  limit?: number;
  all?: boolean;
};

function qs(params: ProfesorQueryParams): string {
  const q = new URLSearchParams();
  if (params.gradoId) q.set("gradoId", params.gradoId);
  if (params.seccionId) q.set("seccionId", params.seccionId);
  if (params.cursoId) q.set("cursoId", params.cursoId);
  if (params.search) q.set("search", params.search);
  if (params.bimestre) q.set("bimestre", params.bimestre);
  if (params.fecha) q.set("fecha", params.fecha);
  if (params.riskLevel) q.set("riskLevel", params.riskLevel);
  if (params.status) q.set("status", params.status);
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.all) q.set("all", "true");
  const s = q.toString();
  return s ? `?${s}` : "";
}

export type ProfesorDashboardData = {
  kpis: {
    totalStudents: number;
    totalCourses?: number;
    misSecciones?: number;
    totalAlumnos?: number;
    notasPendientes?: number;
    openAlerts: number;
    avgGrade: number;
    avgAttendance: number;
    avgRisk: number;
    byLevel: { bajo: number; medio: number; alto: number };
  };
  workload?: {
    tipoAsignacion: string;
    cursos: { id: string; nombre: string; codigo: string }[];
    grados: string[];
    secciones: string[];
    cargaAcademica: number;
    totalAlumnos: number;
  };
  cursosAsignados?: { id: string; nombre: string; codigo: string }[];
  seccionesAsignadas?: string[];
  gradosAsignados?: string[];
  avgBySection?: { salon: string; promedio: number }[];
  riskBySection: { label: string; alto: number; medio: number; bajo: number; total: number }[];
  alertsBySalonShort: { salon: string; count: number }[];
  attendanceByGrado: { grado: string; asistencia: number }[];
  lmsActivityByGrado: { grado: string; alta: number; media: number; baja: number; sin: number }[];
  avgByCourse: { courseId: string; nombre: string; salon: string; promedio: number; totalNotas: number }[];
  riskTrend: { periodo: string; riesgoGlobal: number }[];
};

export const profesorService = {
  getDashboard: () => api.call<ProfesorDashboardData>("/profesor/dashboard"),

  getGrados: () =>
    api.call<{ items: { id: number; numero: number; nombre: string; label: string }[] }>("/profesor/grados"),

  getSecciones: (gradoId?: string) =>
    api.call<{ items: ApiSeccion[] }>(`/profesor/secciones${gradoId ? `?gradoId=${gradoId}` : ""}`),

  getCursos: (params?: ProfesorQueryParams) =>
    api.call<{
      items: (Course & { totalEstudiantes?: number; promedioCurso?: number; alertasActivas?: number })[];
    }>(`/profesor/cursos${qs(params ?? {})}`),

  getEstudiantes: (params?: ProfesorQueryParams) =>
    api.call<{ items: Student[]; total: number; page: number; pages: number }>(
      `/profesor/estudiantes${qs(params ?? {})}`,
    ),

  getNotas: (params?: ProfesorQueryParams) =>
    api.call<{ items: unknown[] }>(`/profesor/notas${qs(params ?? {})}`),

  createNota: (payload: Record<string, unknown>) =>
    api.call<{ item: unknown }>("/profesor/notas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getAsistencia: (params?: ProfesorQueryParams) =>
    api.call<{ items: unknown[] }>(`/profesor/asistencia${qs(params ?? {})}`),

  bulkAsistencia: (payload: {
    fecha: string;
    records: {
      studentId: string;
      presente: boolean;
      justificado: boolean;
      tardanza: boolean;
      observacion?: string;
    }[];
  }) =>
    api.call<{ upserted: number; fecha: string }>("/profesor/asistencia/masiva", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getLms: (params?: ProfesorQueryParams) =>
    api.call<{ items: unknown[]; total: number }>(`/profesor/lms${qs(params ?? {})}`),

  getHistorialPredicciones: (params?: ProfesorQueryParams) =>
    api.call<{ items: unknown[]; total: number; page: number; pages: number }>(
      `/profesor/historial-predicciones${qs(params ?? {})}`,
    ),

  predict: (studentId: string, metrics?: Record<string, unknown>) =>
    api.call<{ prediction: ApiPredictionResult; source: string; alert?: Alert | null }>(
      "/profesor/predicciones",
      {
      method: "POST",
        body: JSON.stringify({ studentId, metrics }),
      },
    ),

  getAlertas: (params?: ProfesorQueryParams) =>
    api.call<{ items: Alert[]; total: number; salonSummary?: { salon: string; count: number }[] }>(
      `/profesor/alertas${qs(params ?? {})}`,
    ),

  patchAlertaEstado: (id: string, status: string) =>
    api.call<{ item: Alert }>(`/profesor/alertas/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
