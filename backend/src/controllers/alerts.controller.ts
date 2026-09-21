import { sendCreated, sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import type { NivelRiesgo, Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { alertStatusSchema } from "../validators/schemas.js";
import { resolveStudentScope, assertStudentInScope } from "../utils/student-scope.js";
import { logAudit } from "../utils/audit.js";
import { paramBigIntId, toDbId, idToString } from "../utils/ids.js";
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
  };
}) {
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
      seccion: (a.student as { seccion?: { nombre: string; grado?: { numero: number } } }).seccion,
    },
    nivel_riesgo: LEVEL_LABEL[a.nivelRiesgo] ?? a.nivelRiesgo,
    estado_label: STATUS_LABEL[a.estado] ?? a.estado,
    factores_riesgo: mapFactors(a.factores),
    fecha: a.createdAt,
    curso: null,
    profesor: null,
  };
}

export async function listAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveStudentScope(req.user!);
    const level = (req.query.level ?? req.query.riskLevel) as string | undefined;
    const all = req.query.all === "true";
    const seccionId = req.query.seccionId as string | undefined;
    const gradoId = req.query.gradoId as string | undefined;
    const cursoId = req.query.cursoId as string | undefined;
    const search = (req.query.search as string | undefined)?.trim();
    const status = req.query.status as string | undefined;
    const profesorId = req.query.profesorId as string | undefined;

    const studentWhere: Record<string, unknown> = { AND: [scope] };
    if (seccionId) studentWhere.seccionId = toDbId(seccionId);
    if (gradoId) {
      studentWhere.seccion = { gradoId: toDbId(gradoId) };
    }
    if (cursoId) {
      studentWhere.seccion = {
        ...(studentWhere.seccion as object),
        cursosOferta: { some: { id: toDbId(cursoId) } },
      };
    }
    if (profesorId) {
      studentWhere.seccion = {
        tutoresSeccion: { some: { profesorId: toDbId(profesorId) } },
      };
    }
    if (search) {
      studentWhere.OR = [
        { nombres: { contains: search } },
        { apellidos: { contains: search } },
        { codigo: { contains: search } },
      ];
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const skip = (page - 1) * limit;
    const alertWhere: Prisma.AlertWhereInput = {
      student: studentWhere,
      ...(all ? {} : { estado: { in: ["nueva", "en_seguimiento"] } }),
      ...(status && ["nueva", "en_seguimiento", "resuelta"].includes(status)
        ? { estado: status as "nueva" | "en_seguimiento" | "resuelta" }
        : {}),
      ...(level && ["bajo", "medio", "alto"].includes(level)
        ? { nivelRiesgo: level as NivelRiesgo }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.alert.findMany({
        where: alertWhere,
      include: {
        factores: true,
        student: {
          select: {
            id: true,
            codigo: true,
            nombres: true,
            apellidos: true,
            seccionId: true,
            seccion: {
              select: {
                nombre: true,
                grado: { select: { numero: true } },
              },
            },
          },
        },
      },
      orderBy: [{ nivelRiesgo: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
      prisma.alert.count({ where: alertWhere }),
    ]);

    const enriched = items.map((a) => enrichAlert(a));
    const summaryBySalon = new Map<string, number>();
    for (const a of items) {
      const g = a.student.seccion?.grado?.numero;
      const sec = a.student.seccion?.nombre;
      if (g && sec) {
        const key = `${g}°${sec}`;
        summaryBySalon.set(key, (summaryBySalon.get(key) ?? 0) + 1);
      }
    }
    const salonSummary = [...summaryBySalon.entries()]
      .map(([salon, count]) => ({ salon, count }))
      .sort((a, b) => a.salon.localeCompare(b.salon, "es"));

    sendSuccess(res, { items: enriched, total, page, pages: Math.ceil(total / limit) || 1, salonSummary });
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
    if (!existing) throw new AppError(403, "Alerta fuera de su alcance");

    const item = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM alerta WHERE id = ${id} FOR UPDATE`;
      const previous = await tx.alert.findUniqueOrThrow({ where: { id } });
      const item = await tx.alert.update({
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
          },
        },
      },
    });

      await tx.alertaHistorial.create({ data: { alertaId: id, estadoAnterior: previous.estado, estadoNuevo: status, usuarioId: BigInt(req.user!.sub) } });
      await tx.auditLog.create({ data: { entidad: "Alert", entidadId: String(id), accion: "UPDATE_STATUS", detalle: status, usuarioId: BigInt(req.user!.sub), estudianteId: item.studentId, ipAddress: req.ip } });
      return item;
    });
    await logAudit({
      entidad: "Alert",
      entidadId: item.id,
      accion: "UPDATE_STATUS",
      detalle: status,
      studentId: item.studentId,
      usuarioId: req.user?.sub,
    });

    sendSuccess(res, { item: enrichAlert(item) });
  } catch (e) {
    next(e);
  }
}
