/**
 * API del Director — endpoints globales (sin filtro de profesor).
 */
import { api } from "@/services/api";

export const directorService = {
  getDashboardKpis: () => api.getDashboardKpis(),
  getStudents: (page?: number, limit?: number, q?: string) => api.getStudents(page, limit, q),
  getTeachers: () => api.getTeachers(),
  getCourses: () => api.getCourses(),
  getMatriculaStats: () => api.getMatriculaStats(),
  getSecciones: (gradoId?: number) => api.getSecciones(gradoId),
  getAlerts: (params?: Parameters<typeof api.getAlerts>[0]) => api.getAlerts(params),
  getGrades: (studentId?: string, courseId?: string) => api.getGrades(studentId, courseId),
  getAttendance: (studentId?: string) => api.getAttendance(studentId),
  getPredictions: (params?: Parameters<typeof api.getPredictions>[0]) => api.getPredictions(params),
  predict: (studentId: string, metrics?: Record<string, unknown>) => api.predict(studentId, metrics),
};
