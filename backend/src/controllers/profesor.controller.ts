import { sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { idToString, toDbId } from "../utils/ids.js";
import { getTeacherSectionIds } from "../utils/teacher-scope.js";
import {
  buildProfesorStudentWhere,
  parseProfesorQuery,
  requireTeacherIdFromUser,
} from "../utils/profesor-query.js";
import { buildProfesorDashboard } from "../services/profesor-dashboard.service.js";
import { deriveLmsEngagement } from "../utils/lms-engagement.js";
import { courseListInclude, mapCourseForApi, courseDisplayName } from "../utils/course-label.js";
import { listGrades, createGrade } from "./grades.controller.js";
import { listAttendance, bulkAttendance } from "./attendance.controller.js";
import { listAlerts, patchAlertStatus } from "./alerts.controller.js";
import { listPredictions } from "./predictions.controller.js";
import { predict } from "./predict.controller.js";

async function teacherId(req: Request): Promise<bigint> {
  try {
    return await requireTeacherIdFromUser(req.user!.sub);
  } catch {
    throw new AppError(403, "Profesor no vinculado a una cuenta", "FORBIDDEN");
  }
}

const studentListInclude = {
  seccion: { include: { grado: { include: { nivel: true } } } },
  lmsActividades: { orderBy: { anioSemana: "asc" as const } },
  lmsIndicadores: { take: 1, orderBy: { id: "desc" as const } },
  predicciones: { orderBy: { createdAt: "desc" as const }, take: 1 },
  alertas: { where: { estado: { in: ["nueva", "en_seguimiento"] as ("nueva" | "en_seguimiento")[] } } },
};

function mapStudentRow(
  s: Awaited<
    ReturnType<
      typeof prisma.student.findMany<{
        include: typeof studentListInclude;
      }>
    >
  >[number],
) {
  return {
    ...s,
    id: idToString(s.id),
    seccionId: s.seccionId ? idToString(s.seccionId) : null,
    lmsActivities: s.lmsActividades,
    lmsEngagement: deriveLmsEngagement(s.lmsActividades, s.lmsIndicadores?.[0] ?? null),
    lmsIndicador: s.lmsIndicadores?.[0] ?? null,
    predictions: s.predicciones,
    alerts: s.alertas,
  };
}

export async function profesorDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = await teacherId(req);
    const data = await buildProfesorDashboard(tid);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
}

export async function profesorGrados(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = await teacherId(req);
    const sectionIds = await getTeacherSectionIds(tid);
    if (!sectionIds.length) return sendSuccess(res, { items: [] });

    const secciones = await prisma.seccion.findMany({
      where: { id: { in: sectionIds }, activo: true },
      include: { grado: { include: { nivel: true } } },
      orderBy: [{ grado: { numero: "asc" } }, { nombre: "asc" }],
    });
    const map = new Map<number, { id: number; numero: number; nombre: string; label: string }>();
    for (const s of secciones) {
      const g = s.grado;
      if (!map.has(g.numero)) {
        map.set(g.numero, {
          id: Number(g.id),
          numero: g.numero,
          nombre: g.nombre,
          label: `${g.numero}°`,
        });
      }
    }
    sendSuccess(res, { items: [...map.values()].sort((a, b) => a.numero - b.numero) });
  } catch (e) {
    next(e);
  }
}

export async function profesorSecciones(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = await teacherId(req);
    const gradoId = req.query.gradoId as string | undefined;
    let sectionIds = await getTeacherSectionIds(tid);
    if (gradoId) {
      const filtered = await prisma.seccion.findMany({
        where: { id: { in: sectionIds }, gradoId: toDbId(gradoId), activo: true },
        select: { id: true },
      });
      sectionIds = filtered.map((s) => s.id);
    }
    if (!sectionIds.length) return sendSuccess(res, { items: [] });

    const items = await prisma.seccion.findMany({
      where: { id: { in: sectionIds }, activo: true },
      include: {
        grado: { include: { nivel: true } },
        _count: { select: { estudiantes: true } },
      },
      orderBy: [{ grado: { numero: "asc" } }, { nombre: "asc" }],
    });
    sendSuccess(res, {
      items: items.map((s) => ({
        ...s,
        id: idToString(s.id),
        gradoId: idToString(s.gradoId),
      })),
    });
  } catch (e) {
    next(e);
  }
}

export async function profesorCursos(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = await teacherId(req);
    const pq = parseProfesorQuery(req);
    const rows = await prisma.course.findMany({
      where: {
        profesorId: tid,
        activo: true,
        ...(pq.cursoId ? { id: toDbId(pq.cursoId) } : {}),
        ...(pq.seccionId ? { seccionId: toDbId(pq.seccionId) } : {}),
        ...(pq.gradoId ? { seccion: { gradoId: toDbId(pq.gradoId) } } : {}),
      },
      include: {
        ...courseListInclude,
        calificaciones: { select: { nota: true } },
        _count: { select: { inscripciones: true } },
      },
      orderBy: [{ seccion: { grado: { numero: "asc" } } }, { seccion: { nombre: "asc" } }],
    });

    const items = await Promise.all(
      rows.map(async (c) => {
        const secId = c.seccionId;
        const studentCount = secId
          ? await prisma.student.count({
              where: await buildProfesorStudentWhere(tid, { seccionId: idToString(secId) }),
            })
          : 0;
        const notas = c.calificaciones.map((g) => Number(g.nota));
        const promedio = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
        const alertas = secId
          ? await prisma.alert.count({
              where: {
                estado: { in: ["nueva", "en_seguimiento"] },
                student: await buildProfesorStudentWhere(tid, { seccionId: idToString(secId) }),
              },
            })
          : 0;
        return {
          ...mapCourseForApi(c),
          id: idToString(c.id),
          nombre: courseDisplayName(c),
          totalEstudiantes: studentCount,
          promedioCurso: Math.round(promedio * 10) / 10,
          alertasActivas: alertas,
        };
      }),
    );
    sendSuccess(res, { items });
  } catch (e) {
    next(e);
  }
}

export async function profesorEstudiantes(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = await teacherId(req);
    const pq = parseProfesorQuery(req);
    const where = await buildProfesorStudentWhere(tid, pq);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(800, Number(req.query.limit) || 200);
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { apellidos: "asc" },
        include: studentListInclude,
      }),
      prisma.student.count({ where }),
    ]);

    sendSuccess(res, {
      items: rows.map(mapStudentRow),
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    next(e);
  }
}

export async function profesorNotas(req: Request, res: Response, next: NextFunction) {
  return listGrades(req, res, next);
}

export async function profesorNotasPost(req: Request, res: Response, next: NextFunction) {
  return createGrade(req, res, next);
}

export async function profesorAsistencia(req: Request, res: Response, next: NextFunction) {
  return listAttendance(req, res, next);
}

export async function profesorAsistenciaMasiva(req: Request, res: Response, next: NextFunction) {
  return bulkAttendance(req, res, next);
}

export async function profesorLms(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = await teacherId(req);
    const pq = parseProfesorQuery(req);
    const where = await buildProfesorStudentWhere(tid, pq);
    const students = await prisma.student.findMany({
      where,
      orderBy: { apellidos: "asc" },
      include: {
        seccion: { include: { grado: true } },
        lmsActividades: { orderBy: { anioSemana: "asc" } },
        lmsIndicadores: { take: 1, orderBy: { id: "desc" } },
      },
    });

    sendSuccess(res, {
      items: students.map((s) => {
        const ind = s.lmsIndicadores[0];
        const acts = s.lmsActividades;
        return {
          id: idToString(s.id),
          codigo: s.codigo,
          nombres: s.nombres,
          apellidos: s.apellidos,
          seccion: s.seccion,
          accesosLms: ind ? Number(ind.frecuenciaAcceso) : 0,
          tiempoPlataforma: ind ? Number(ind.tiempoPlataforma) : 0,
          tareasEntregadas: ind ? Math.round(Number(ind.tareasRatio) * 100) : 0,
          participacion: ind ? Number(ind.participacion) : 0,
          compromiso: deriveLmsEngagement(acts, ind ?? null),
          lmsActivities: acts,
        };
      }),
      total: students.length,
    });
  } catch (e) {
    next(e);
  }
}

export async function profesorPredicciones(req: Request, res: Response, next: NextFunction) {
  return listPredictions(req, res, next);
}

export async function profesorPrediccionesPost(req: Request, res: Response, next: NextFunction) {
  return predict(req, res, next);
}

export async function profesorHistorialPredicciones(req: Request, res: Response, next: NextFunction) {
  return listPredictions(req, res, next);
}

export async function profesorAlertas(req: Request, res: Response, next: NextFunction) {
  return listAlerts(req, res, next);
}

export async function profesorAlertaEstado(req: Request, res: Response, next: NextFunction) {
  return patchAlertStatus(req, res, next);
}

/** Alias legacy */
export const misCursos = profesorCursos;
export const misSecciones = profesorSecciones;
export const misEstudiantes = profesorEstudiantes;
