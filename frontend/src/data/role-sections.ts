import type { AppSection } from "@/data/navigation";

/**
 * Secciones visibles por rol — Director (admin), Profesor (docente) y
 * Estudiante (estudiante). El rol interno sigue siendo uno de esos tres:
 * no existe un cuarto rol "Docente".
 */
export const ROLE_SECTIONS: Record<string, AppSection[]> = {
  admin: [
    "Grados y secciones", "Auditoría", "Configuración",
    "Dashboard",
    "Estudiantes",
    "Profesores",
    "Asignaciones",
    "Cursos",
    "Matrículas",
    "Notas",
    "Asistencia",
    "Actividad LMS",
    "Predicción",
    "Historial predicciones",
    "Alertas",
    "Mensajería Académica",
    "Avisos",
    "Materiales",
    "Actividades",
    "Reportes",
  ],
  docente: [
    "Reportes", "Configuración",
    "Dashboard",
    "Estudiantes",
    "Cursos",
    "Notas",
    "Asistencia",
    "Actividad LMS",
    "Predicción",
    "Historial predicciones",
    "Alertas",
    "Mensajería Académica",
    "Avisos",
    "Materiales",
    "Actividades",
  ],
  estudiante: [
    "Configuración",
    "Dashboard",
    "Cursos",
    "Notas",
    "Asistencia",
    "Actividad LMS",
    "Predicción",
    "Alertas",
    "Mensajería Académica",
    "Avisos",
    "Materiales",
    "Actividades",
  ],
};
