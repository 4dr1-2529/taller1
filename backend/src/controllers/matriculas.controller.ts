import { enroll2026 } from "../services/student-registration.service.js";
import { z } from "zod";
import { sendCreated, sendSuccess } from "../utils/response.js";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { matriculaSchema } from "../validators/schemas.js";
import { AppError } from "../middleware/errorHandler.js";
import { logAudit } from "../utils/audit.js";
import { toDbId, idToString } from "../utils/ids.js";
import { resolveStudentScope, assertStudentInScope } from "../utils/student-scope.js";

function mapMatricula(row: {
  id: bigint;
  codigo: string;
  estado: string;
  fechaMatricula: Date;
  estudianteId: bigint;
  seccionId: bigint;
  anioLectivoId: bigint;
  estudiante: {
    id: bigint;
    codigo: string;
    nombres: string;
    apellidos: string;
    seccionId: bigint | null;
  };
  seccion: {
    id: bigint;
    nombre: string;
    grado: { id: bigint; numero: number; nombre: string; nivel: { nombre: string } | null };
  };
  anioLectivo: { id: bigint; anio: number; nombre: string };
}) {
  const g = row.seccion.grado;
  const nivel = g.nivel?.nombre ?? "";
  return {
    id: idToString(row.id),
    codigo: row.codigo,
    estado: row.estado,
    fechaMatricula: row.fechaMatricula,
    estudianteId: idToString(row.estudianteId),
    seccionId: idToString(row.seccionId),
    anioLectivoId: idToString(row.anioLectivoId),
    estudiante: {
      id: idToString(row.estudiante.id),
      codigo: row.estudiante.codigo,
      nombres: row.estudiante.nombres,
      apellidos: row.estudiante.apellidos,
      seccionId: row.estudiante.seccionId ? idToString(row.estudiante.seccionId) : null,
    },
    seccion: {
      id: idToString(row.seccion.id),
      nombre: row.seccion.nombre,
      gradoNumero: g.numero,
      gradoNombre: g.nombre,
      nivel,
      label: `${g.numero}° ${row.seccion.nombre}`.trim(),
    },
    anioLectivo: {
      id: idToString(row.anioLectivo.id),
      anio: row.anioLectivo.anio,
      nombre: row.anioLectivo.nombre,
    },
  };
}

export async function listMatriculas(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveStudentScope(req.user!);
    const seccionId = req.query.seccionId as string | undefined;
    const gradoId = req.query.gradoId as string | undefined;
    const anioLectivoId = req.query.anioLectivoId as string | undefined;
    const estado = (req.query.estado as string | undefined) ?? "activa";
    const q = String(req.query.q ?? "").trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(800, Math.max(1, Number(req.query.limit) || 100));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      estudiante: { AND: [scope, ...(q ? [{ OR: [
        { nombres: { contains: q } },
        { apellidos: { contains: q } },
        { codigo: { contains: q } },
      ] }] : [])] },
      anioLectivo: { anio: 2026 },
      ...(seccionId ? { seccionId: toDbId(seccionId) } : {}),
      ...(gradoId ? { seccion: { gradoId: toDbId(gradoId) } } : {}),
      ...(anioLectivoId ? { anioLectivoId: toDbId(anioLectivoId) } : {}),
      ...(estado ? { estado } : {}),
    };

    const [rows, total, activas] = await Promise.all([
      prisma.matricula.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ anioLectivo: { anio: "desc" } }, { estudiante: { apellidos: "asc" } }],
        include: {
          estudiante: true,
          seccion: { include: { grado: { include: { nivel: true } } } },
          anioLectivo: true,
        },
      }),
      prisma.matricula.count({ where }),
      prisma.matricula.count({ where: { ...where, estado: "activa" } }),
    ]);

    sendSuccess(res, {
      items: rows.map(mapMatricula),
      total,
      page,
      pages: Math.ceil(total / limit),
      activas,
    });
  } catch (e) {
    next(e);
  }
}

export async function createMatricula(req: Request, res: Response, next: NextFunction) {
  try {
    const data = matriculaSchema.parse(req.body);
    await assertStudentInScope(req.user!, data.estudianteId);

    const year = await prisma.anioLectivo.findUnique({ where: { id: toDbId(data.anioLectivoId) } });
    if (year?.anio !== 2026 || data.estado && data.estado !== "activa") throw new AppError(400, "Solo matrícula activa 2026");
    const item = await prisma.$transaction(tx => enroll2026(tx, toDbId(data.estudianteId), toDbId(data.seccionId), req.user!.sub, req.ip));
    sendCreated(res, { item: mapMatricula(item) });
  } catch (e) {
    next(e);
  }
}

export async function matriculaStats(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveStudentScope(req.user!);
    const anioActivo = await prisma.anioLectivo.findFirst({
      where: { activo: true, anio: 2026 },
      orderBy: { anio: "desc" },
    });
    const whereAnio = anioActivo
      ? { estudiante: scope, anioLectivoId: anioActivo.id }
      : { estudiante: scope };

    const [activas, totalAnio, estudiantesActivos] = await Promise.all([
      prisma.matricula.count({ where: { ...whereAnio, estado: "activa" } }),
      prisma.matricula.count({ where: whereAnio }),
      prisma.student.count({ where: { ...scope, activo: true } }),
    ]);

    sendSuccess(res, {
      matriculasActivas: activas,
      matriculasAnioLectivo: totalAnio,
      estudiantesActivos,
      anioLectivo: anioActivo?.nombre ?? null,
    });
  } catch (e) {
    next(e);
  }
}

export async function updateMatriculaState(req: Request, res: Response, next: NextFunction) {
  try {
    const { estado } = z.object({ estado: z.enum(["retirada", "trasladada"]) }).strict().parse(req.body);
    const id = toDbId(String(req.params.id));
    await prisma.$transaction(async tx => {
      const row = await tx.matricula.findFirst({ where: { id, anioLectivo: { anio: 2026 } } });
      if (!row) throw new AppError(404, "Matrícula 2026 no encontrada");
      await tx.$queryRaw`SELECT id FROM seccion WHERE id = ${row.seccionId} FOR UPDATE`;
      await tx.matricula.update({ where: { id }, data: { estado } });
      await tx.enrollment.updateMany({ where: { studentId: row.estudianteId, course: { anioLectivoId: row.anioLectivoId } }, data: { estado: "retirada" } });
      await tx.auditLog.create({ data: { entidad: "Matricula", entidadId: String(id), accion: "UPDATE_STATE", detalle: estado, usuarioId: BigInt(req.user!.sub), estudianteId: row.estudianteId, ipAddress: req.ip } });
    });
    sendSuccess(res, { estado });
  } catch (e) { next(e); }
}
