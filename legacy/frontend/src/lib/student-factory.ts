import type { LmsEngagement, StudentAcademicMetrics, StudentLmsProfile } from "@/types/academic";

export function lmsProfileFromEngagement(engagement: LmsEngagement): StudentLmsProfile {
  if (engagement === "alto") {
    return {
      engagement,
      actividadSemanalPct: [78, 80, 82, 85],
      minutosPorSemana: [120, 125, 130, 140],
      tareasEntregadas: 9,
      tareasTotales: 10,
      horasPlataformaSemana: 4.5,
    };
  }
  if (engagement === "medio") {
    return {
      engagement,
      actividadSemanalPct: [55, 52, 58, 60],
      minutosPorSemana: [70, 68, 72, 75],
      tareasEntregadas: 7,
      tareasTotales: 10,
      horasPlataformaSemana: 2.5,
    };
  }
  return {
    engagement,
    actividadSemanalPct: [35, 32, 38, 30],
    minutosPorSemana: [45, 42, 48, 40],
    tareasEntregadas: 4,
    tareasTotales: 10,
    horasPlataformaSemana: 1.4,
  };
}

export function buildMetrics(
  promedio: number,
  asistencia: number,
  engagement: LmsEngagement,
): StudentAcademicMetrics {
  return {
    promedioGeneral: promedio,
    asistenciaGeneral: asistencia,
    lms: lmsProfileFromEngagement(engagement),
  };
}
