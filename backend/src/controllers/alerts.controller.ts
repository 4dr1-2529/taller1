import type { Request, Response, NextFunction } from "express";
import type { NivelRiesgo } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { alertStatusSchema } from "../validators/schemas.js";
import { resolveStudentScope, assertStudentInScope } from "../utils/student-scope.js";
import { logAudit } from "../utils/audit.js";
import { paramBigIntId, toDbId, idToString } from "../utils/ids.js";
import { AppError } from "../middleware/errorHandler.js";
import { courseDisplayName } from "../utils/course-label.js";

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

function mapFactors(
  factores: { factorKey: string; etiqueta: string; contribucion: unknown }[],
) {
  return factores.map((f) => ({
    key: f.factorKey,
    label: f.etiqueta,
    contribution: Number(f.contribucion),
  }));
}

function enrichAlert(a: {
  id: bigint;
  titulo: string;
  descripcion: string;
  nivelRiesgo: NivelRiesgo;
  estado: string;
  score: unknown;
  probabilidad: unknown;
  recomendacion: string | null;
  createdAt: Date;
  updatedAt: Date;
  factores: { factorKey: string; etiqueta: string; contribucion: unknown }[];
  student: {
    id: bigint;
    codigo: string;
    nombres: string;
    apellidos: string;
    seccionId: bigint | null;
    inscripciones?: {
      course: {
        id: bigint;
        codigo: string;
        cursoCatalogo: { nombre: string } | null;
        profesor: { nombres: string; apellidos: string };
      };
    }[];
  };
}) {
  const en = a.student.inscripciones?.[0];
  const course = en?.course;
  return {
    id: idToString(a.id),
    titulo: a.titulo,
    descripcion: a.descripcion,
    level: a.nivelRiesgo,
    status: a.estado,
    score: a.score != null ? Number(a.score) : null,
    probability: a.probabilidad != null ? Number(a.probabilidad) : null,
    recommendation: a.recomendacion,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    student: {
      ...a.student,
      id: idToString(a.student.id),
      seccionId: a.student.seccionId ? idToString(a.student.seccionId) : null,
    },
    nivel_riesgo: LEVEL_LABEL[a.nivelRiesgo] ?? a.nivelRiesgo,
    estado_label: STATUS_LABEL[a.estado] ?? a.estado,
    factores_riesgo: mapFactors(a.factores),
    fecha: a.createdAt,
    curso: course
      ? { id: idToString(course.id), nombre: courseDisplayName(course) }
      : null,
    profesor: course?.profesor
      ? `${course.profesor.nombres} ${course.profesor.apellidos}`
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
        ...(all ? {} : { estado: { in: ["nueva", "en_seguimiento"] } }),
        ...(level && ["bajo", "medio", "alto"].includes(level)
          ? { nivelRiesgo: level as NivelRiesgo }
          : {}),
      },
      include: {
        factores: true,
        student: {
          select: {
            id: true,
            codigo: true,
            nombres: true,
            apellidos: true,
            seccionId: true,
            inscripciones: {
              take: 1,
              include: {
                course: {
                  select: {
                    id: true,
                    codigo: true,
                    cursoCatalogo: { select: { nombre: true } },
                    profesor: { select: { nombres: true, apellidos: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ nivelRiesgo: "desc" }, { createdAt: "desc" }],
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
    const id = paramBigIntId(req);
    const scope = await resolveStudentScope(req.user!);

    const existing = await prisma.alert.findFirst({
      where: { id, student: scope },
      include: { student: true, factores: true },
    });
    if (!existing) throw new AppError(404, "Alerta no encontrada o sin permiso");

    const item = await prisma.alert.update({
      where: { id },
      data: { estado: status },
      include: {
        factores: true,
        student: {
          select: {
            id: true,
            codigo: true,
            nombres: true,
            apellidos: true,
            seccionId: true,
            inscripciones: {
              take: 1,
              include: {
                course: {
                  select: {
                    id: true,
                    codigo: true,
                    cursoCatalogo: { select: { nombre: true } },
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
