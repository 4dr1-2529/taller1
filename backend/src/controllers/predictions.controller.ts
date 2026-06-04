import { sendCreated, sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { resolveStudentScope } from "../utils/student-scope.js";
import { AppError } from "../middleware/errorHandler.js";
import { paramBigIntId, toDbId, idToString } from "../utils/ids.js";

function mapPrediction(p: {
  id: bigint;
  studentId: bigint;
  score: unknown;
  nivelRiesgo: string;
  probabilidad: unknown;
  probabilidadAbandono: unknown;
  createdAt: Date;
  factores: { factorKey: string; etiqueta: string; contribucion: unknown }[];
  student?: unknown;
}) {
  const factors = p.factores.map((f) => ({
    key: f.factorKey,
    label: f.etiqueta,
    contribution: Number(f.contribucion),
  }));
  return {
    ...p,
    id: idToString(p.id),
    studentId: idToString(p.studentId),
    level: p.nivelRiesgo,
    score: Number(p.score),
    probability: Number(p.probabilidadAbandono),
    probabilityAbandono: Number(p.probabilidadAbandono),
    factors,
    meta: null,
  };
}

/** Historial de predicciones con filtros y paginación. */
export async function listPredictions(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const scope = await resolveStudentScope(user);
    const studentId = req.query.studentId as string | undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 30);
    const skip = (page - 1) * limit;

    const where = {
      student: scope,
      ...(studentId ? { studentId: toDbId(studentId) } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.prediction.findMany({
        where,
        include: {
          factores: true,
          student: {
            select: { id: true, codigo: true, nombres: true, apellidos: true, seccionId: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.prediction.count({ where }),
    ]);

    const items = rows.map(mapPrediction);

    sendSuccess(res, { items,
      total,
      page,
      pages: Math.ceil(total / limit) || 1, });
  } catch (e) {
    next(e);
  }
}

export async function getPrediction(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramBigIntId(req);
    const scope = await resolveStudentScope(req.user!);
    const item = await prisma.prediction.findFirst({
      where: { id, student: scope },
      include: { student: true, factores: true },
    });
    if (!item) throw new AppError(404, "Predicción no encontrada");
    sendSuccess(res, { item: mapPrediction(item), });
  } catch (e) {
    next(e);
  }
}
