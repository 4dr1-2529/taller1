import { api } from "@/services/api";

export type EstudianteProfile = {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
  grado: number | null;
  gradoLabel: string | null;
  seccion: string | null;
  salon: string | null;
  periodoAcademico: string | null;
  promedioGeneral: number;
  asistenciaGeneral: number;
};

export type EstudianteDashboardData = {
  profile: EstudianteProfile | null;
  kpis: {
    grado: string;
    salon: string;
    promedioGeneral: number;
    asistenciaGeneral: number;
    nivelRiesgo: string;
    alertasActivas: number;
  };
  resumen: {
    ultimaNota: { curso: string; nota: number; bimestre: number; fecha: string } | null;
    ultimaAsistencia: { fecha: string; estado: string } | null;
    ultimaActividadLms: { semana: string; actividadPct: number; minutos: number } | null;
    ultimaPrediccion: { score: number; nivel: string; fecha: string } | null;
    recomendacion: string | null;
  };
  alertasPreview: {
    id: string;
    nivel: string;
    titulo: string;
    recomendacion: string | null;
    estado: string;
    fecha: string;
  }[];
};

export type EstudianteNotasData = {
  profile: EstudianteProfile | null;
  filas: {
    courseId: string;
    curso: string;
    profesor: string | null;
    bimestre1: number | null;
    bimestre2: number | null;
    bimestre3: number | null;
    bimestre4: number | null;
    promedioFinal: number | null;
    estado: string;
  }[];
  resumen: {
    promedioGeneral: number;
    cursosAprobados: number;
    cursosEnRiesgo: number;
    cursosDesaprobados: number;
    totalCursos: number;
  };
};

export type EstudianteAsistenciaQuery = {
  mes?: string;
  bimestre?: string;
  estado?: string;
  desde?: string;
  hasta?: string;
};

function qs(params: EstudianteAsistenciaQuery): string {
  const q = new URLSearchParams();
  if (params.mes) q.set("mes", params.mes);
  if (params.bimestre) q.set("bimestre", params.bimestre);
  if (params.estado) q.set("estado", params.estado);
  if (params.desde) q.set("desde", params.desde);
  if (params.hasta) q.set("hasta", params.hasta);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const estudianteService = {
  getPerfil: () => api.call<EstudianteProfile>("/estudiante/perfil"),
  getDashboard: () => api.call<EstudianteDashboardData>("/estudiante/dashboard"),
  getNotas: () => api.call<EstudianteNotasData>("/estudiante/notas"),
  getAsistencia: (params?: EstudianteAsistenciaQuery) =>
    api.call<{
      profile: EstudianteProfile | null;
      items: {
        id: string;
        fecha: string;
        curso: string | null;
        estado: string;
        observacion: string | null;
        profesor: string | null;
      }[];
      resumen: {
        asistencias: number;
        tardanzas: number;
        faltas: number;
        justificadas: number;
        porcentaje: number;
        total: number;
      };
    }>(`/estudiante/asistencia${qs(params ?? {})}`),
  getLms: () =>
    api.call<{
      profile: EstudianteProfile | null;
      tarjetas: {
        compromiso: string;
        tiempoPlataforma: number;
        accesosLms: number;
        tareasEntregadas: number;
        tareasPendientes: number;
        participacion: number;
      };
      semanas: {
        semana: string;
        accesos: number;
        minutos: number;
        tareasEntregadas: number;
        participacion: number;
        compromiso: string;
      }[];
      chartSemanal: { semana: string; actividad: number; minutos: number; horas: number }[];
      chartTareas: { tipo: string; valor: number }[];
    }>("/estudiante/lms"),
  getPrediccion: () =>
    api.call<{
      profile: EstudianteProfile | null;
      prediction: {
        id: string;
        score: number;
        probabilidad: number;
        probabilidadAbandono: number;
        nivelRiesgo: string;
        nivel: string;
        modelo: string;
        modeloVersion: string | null;
        fecha: string;
        factores: { key: string; label: string; contribution: number }[];
        recomendacion: string;
      } | null;
    }>("/estudiante/prediccion"),
  refreshPrediccion: () => api.call<{ prediction: unknown }>("/estudiante/prediccion", { method: "POST" }),
  getAlertas: () =>
    api.call<{
      items: {
        id: string;
        titulo: string;
        nivelRiesgo: string;
        recomendacion: string | null;
        estado: string;
        score: number | null;
        probabilidad: number | null;
        fecha: string;
      }[];
      total: number;
    }>("/estudiante/alertas"),
  getMensajes: () =>
    api.call<{
      items: {
        id: string;
        remitente: string;
        remitenteEmail: string | null;
        curso: string | null;
        mensaje: string;
        fecha: string;
        leido: boolean;
      }[];
      total: number;
    }>("/estudiante/mensajes"),
};
