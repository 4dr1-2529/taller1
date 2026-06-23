import { sendCreated, sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import { paramBigIntId } from "../utils/ids.js";
import { logAudit } from "../utils/audit.js";
import {
  assignTutorToSection,
  createCourseAssignment,
  deactivateAssignment,
  getAssignmentById,
  listAssignments,
} from "../services/teacher-assignment.service.js";
import {
  createAssignmentSchema,
  createTutorAssignmentSchema,
  listAssignmentsQuerySchema,
} from "../validators/schemas.js";

export async function listTeacherAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listAssignmentsQuerySchema.parse(req.query);
    const items = await listAssignments(q);
    sendSuccess(res, { items, total: items.length });
  } catch (e) {
    next(e);
  }
}

export async function getTeacherAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await getAssignmentById(String(paramBigIntId(req)));
    sendSuccess(res, { item });
  } catch (e) {
    next(e);
  }
}

export async function postTeacherAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createAssignmentSchema.parse(req.body);
    const item = await createCourseAssignment(body);
    await logAudit({
      entidad: "TeacherCourseAssignment",
      entidadId: item.id,
      accion: "CREATE",
      usuarioId: req.user!.sub,
      teacherId: item.profesorId,
      detalle: `${item.tipoAsignacion}: ${item.curso?.nombre} — ${item.seccion?.label}`,
    });
    sendCreated(res, { item });
  } catch (e) {
    next(e);
  }
}

export async function postTutorAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createTutorAssignmentSchema.parse(req.body);
    const result = await assignTutorToSection(body);
    await logAudit({
      entidad: "TutorSeccion",
      accion: "CREATE",
      usuarioId: req.user!.sub,
      teacherId: body.profesorId,
      detalle: `Tutor de aula — ${result.totalCursos} cursos`,
    });
    sendCreated(res, result);
  } catch (e) {
    next(e);
  }
}

export async function patchDeactivateAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(paramBigIntId(req));
    const result = await deactivateAssignment(id);
    await logAudit({
      entidad: "TeacherCourseAssignment",
      entidadId: id,
      accion: "DEACTIVATE",
      usuarioId: req.user!.sub,
    });
    sendSuccess(res, result, "Asignación desactivada");
  } catch (e) {
    next(e);
  }
}
