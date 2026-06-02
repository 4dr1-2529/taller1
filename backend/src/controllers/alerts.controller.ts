import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { alertStatusSchema } from "../validators/schemas.js";
import { resolveStudentScope, assertStudentInScope } from "../utils/student-scope.js";
import { logAudit } from "../utils/audit.js";
import { paramId } from "../utils/params.js";
import { AppError } from "../middleware/errorHandler.js";

const STATUS_LABEL: Record<string, string> = {
  nueva: "Nueva",
  en_seguimiento: "En seguimiento",
  resuelta: "Resuelta",
};

const LEVEL_LABEL: Record<string, string> = {
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
};

function parseFactors(json: string | null) {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function enrichAlert(a: {
  id: string;
  titulo: string;
  descripcion: string;
  level: string;
  status: string;
  score: number | null;
  probability: number | null;
  factorsJson: string | null;
  recommendation: string | null;
  createdAt: Date;
  updatedAt: Date;
  factorKey: string | null;
  student: {
    id: string;
    codigo: string;
    nombres: string;
    apellidos: string;
    seccionId: string | null;
    enrollments?: {
      course: {
        id: string;
        nombre: string;
        profesor: { nombres: string; apellidos: string };
      };
    }[];
  };
}) {
  const en = a.student.enrollments?.[0];
  return {
    ...a,
    nivel_riesgo: LEVEL_LABEL[a.level] ?? a.level,
    estado_label: STATUS_LABEL[a.status] ?? a.status,
    factores_riesgo: parseFactors(a.factorsJson),
    fecha: a.createdAt,
    curso: en?.course ? { id: en.course.id, nombre: en.course.nombre } : null,
    profesor: en?.course?.profesor
      ? `${en.course.profesor.nombres} ${en.course.profesor.apellidos}`
      : null,
  };
}

export async function listAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveStudentScope(req.user!);
    const level = req.query.level as string | undefined;
    const all = req.query.all === "true";

    const items = await prisma.alert.findMany({
      where: {
        student: scope,
        ...(all ? {} : { status: { in: ["nueva", "en_seguimiento"] } }),
        ...(level && ["bajo", "medio", "alto"].includes(level)
          ? { level: level as "bajo" | "medio" | "alto" }
          : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            codigo: true,
            nombres: true,
            apellidos: true,
            seccionId: true,
            enrollments: {
              take: 1,
              include: {
                course: {
                  select: {
                    id: true,
                    nombre: true,
                    profesor: { select: { nombres: true, apellidos: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ level: "desc" }, { createdAt: "desc" }],
      take: 100,
    });

    const enriched = items.map((a) => enrichAlert(a));
    res.json({ ok: true, items: enriched, total: enriched.length });
  } catch (e) {
    next(e);
  }
}

export async function patchAlertStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = alertStatusSchema.parse(req.body);
    const id = paramId(req);
    const scope = await resolveStudentScope(req.user!);

    const existing = await prisma.alert.findFirst({
      where: { id, student: scope },
      include: { student: true },
    });
    if (!existing) throw new AppError(404, "Alerta no encontrada o sin permiso");

    const item = await prisma.alert.update({
      where: { id },
      data: { status },
      include: {
        student: {
          select: {
            id: true,
            codigo: true,
            nombres: true,
            apellidos: true,
            seccionId: true,
            enrollments: {
              take: 1,
              include: {
                course: {
                  select: {
                    id: true,
                    nombre: true,
                    profesor: { select: { nombres: true, apellidos: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    await logAudit({
      entidad: "Alert",
      entidadId: item.id,
      accion: "UPDATE_STATUS",
      detalle: status,
      studentId: item.studentId,
      usuarioId: req.user?.sub,
    });

    res.json({ ok: true, item: enrichAlert(item) });
  } catch (e) {
    next(e);
  }
}
