import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { resolveStudentScope } from "../utils/student-scope.js";
import { AppError } from "../middleware/errorHandler.js";
import { paramId } from "../utils/params.js";

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
      ...(studentId ? { studentId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.prediction.findMany({
        where,
        include: {
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

    const parsed = items.map((p) => ({
      ...p,
      factors: safeParseJson(p.factorsJson, []),
      meta: p.metaJson ? safeParseJson(p.metaJson, null) : null,
    }));

    res.json({
      ok: true,
      items: parsed,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    next(e);
  }
}

export async function getPrediction(req: Request, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const scope = await resolveStudentScope(req.user!);
    const item = await prisma.prediction.findFirst({
      where: { id, student: scope },
      include: { student: true },
    });
    if (!item) throw new AppError(404, "Predicción no encontrada");
    res.json({
      ok: true,
      item: {
        ...item,
        factors: safeParseJson(item.factorsJson, []),
        meta: item.metaJson ? safeParseJson(item.metaJson, null) : null,
      },
    });
  } catch (e) {
    next(e);
  }
}

function safeParseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
