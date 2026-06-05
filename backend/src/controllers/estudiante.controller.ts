import { sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../middleware/errorHandler.js";
import { requireStudentIdFromUser, rejectClientStudentId } from "../utils/estudiante-scope.js";
import { idToString, toDbId } from "../utils/ids.js";
import {
  loadStudentProfile,
  buildEstudianteDashboard,
  buildEstudianteNotas,
  buildEstudianteAsistencia,
  buildEstudianteLms,
  buildEstudiantePrediccion,
  buildEstudianteAlertas,
  buildEstudianteMensajes,
} from "../services/estudiante.service.js";
import { predict } from "./predict.controller.js";

async function scopedStudentId(req: Request): Promise<bigint> {
  const studentId = await requireStudentIdFromUser(req.user!.sub);
  const fromQuery = req.query.studentId as string | undefined;
  const fromBody = (req.body as { studentId?: string } | undefined)?.studentId;
  rejectClientStudentId(fromQuery ?? fromBody, studentId);
  return studentId;
}

export async function estudiantePerfil(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = await scopedStudentId(req);
    const profile = await loadStudentProfile(studentId);
    if (!profile) throw new AppError(404, "Perfil no encontrado");
    sendSuccess(res, profile);
  } catch (e) {
    next(e);
  }
}

export async function estudianteDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = await scopedStudentId(req);
    const data = await buildEstudianteDashboard(studentId);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
}

export async function estudianteNotas(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = await scopedStudentId(req);
    const data = await buildEstudianteNotas(studentId);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
}

export async function estudianteAsistencia(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = await scopedStudentId(req);
    const data = await buildEstudianteAsistencia(studentId, {
      mes: req.query.mes as string | undefined,
      bimestre: req.query.bimestre as string | undefined,
      estado: req.query.estado as string | undefined,
      desde: req.query.desde as string | undefined,
      hasta: req.query.hasta as string | undefined,
    });
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
}

export async function estudianteLms(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = await scopedStudentId(req);
    const data = await buildEstudianteLms(studentId);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
}

export async function estudiantePrediccion(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = await scopedStudentId(req);
    const data = await buildEstudiantePrediccion(studentId);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
}

export async function estudiantePrediccionPost(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = await scopedStudentId(req);
    req.body = { ...(req.body ?? {}), studentId: idToString(studentId) };
    await predict(req, res, next);
  } catch (e) {
    next(e);
  }
}

export async function estudianteAlertas(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = await scopedStudentId(req);
    const data = await buildEstudianteAlertas(studentId);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
}

export async function estudianteMensajes(req: Request, res: Response, next: NextFunction) {
  try {
    await scopedStudentId(req);
    const userId = toDbId(req.user!.sub);
    const data = await buildEstudianteMensajes(userId);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
}
