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
    const anioLectivoId = req.query.anioLectivoId as string | undefined;
    const estado = (req.query.estado as string | undefined) ?? "activa";
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(800, Math.max(1, Number(req.query.limit) || 100));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      estudiante: scope,
      ...(seccionId ? { seccionId: toDbId(seccionId) } : {}),
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

    const [student, seccion, anio] = await Promise.all([
      prisma.student.findUnique({
        where: { id: toDbId(data.estudianteId) },
        select: { id: true, codigo: true, seccionId: true },
      }),
      prisma.seccion.findUnique({
        where: { id: toDbId(data.seccionId) },
        include: { grado: true },
      }),
      prisma.anioLectivo.findUnique({ where: { id: toDbId(data.anioLectivoId) } }),
    ]);

    if (!student || !seccion || !anio) {
      throw new AppError(404, "Estudiante, sección o año lectivo no encontrado");
    }

    const existing = await prisma.matricula.findUnique({
      where: {
        estudianteId_anioLectivoId: {
          estudianteId: student.id,
          anioLectivoId: anio.id,
        },
      },
    });
    if (existing) {
      throw new AppError(
        409,
        "El estudiante ya tiene matrícula activa para este año lectivo. Use actualización de sección si cambió de salón.",
      );
    }

    const codigo =
      data.codigo?.trim() ||
      `MAT-${student.codigo}-${anio.anio}`;

    const dupCodigo = await prisma.matricula.findUnique({ where: { codigo } });
    if (dupCodigo) throw new AppError(409, "Código de matrícula ya registrado");

    const item = await prisma.matricula.create({
      data: {
        estudianteId: student.id,
        seccionId: seccion.id,
        anioLectivoId: anio.id,
        codigo,
        fechaMatricula: data.fechaMatricula ? new Date(data.fechaMatricula) : new Date(),
        estado: data.estado ?? "activa",
      },
      include: {
        estudiante: true,
        seccion: { include: { grado: { include: { nivel: true } } } },
        anioLectivo: true,
      },
    });

    await prisma.student.update({
      where: { id: student.id },
      data: { seccionId: seccion.id },
    });

    await logAudit({
      entidad: "Matricula",
      entidadId: item.id,
      accion: "CREATE",
      usuarioId: req.user?.sub,
      studentId: data.estudianteId,
    });

    sendCreated(res, { item: mapMatricula(item) });
  } catch (e) {
    next(e);
  }
}

export async function matriculaStats(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveStudentScope(req.user!);
    const anioActivo = await prisma.anioLectivo.findFirst({
      where: { activo: true },
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
