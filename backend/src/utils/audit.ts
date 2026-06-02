import { prisma } from "./prisma.js";
import { toDbId, idToString } from "./ids.js";

export async function logAudit(params: {
  entidad: string;
  entidadId?: string | bigint;
  accion: string;
  usuarioId?: string | bigint;
  detalle?: string;
  ipAddress?: string;
  studentId?: string | bigint;
  teacherId?: string | bigint;
}) {
  await prisma.auditLog.create({
    data: {
      entidad: params.entidad,
      entidadId: params.entidadId != null ? idToString(params.entidadId) : undefined,
      accion: params.accion,
      usuarioId: params.usuarioId != null ? toDbId(params.usuarioId) : undefined,
      detalle: params.detalle,
      ipAddress: params.ipAddress,
      estudianteId: params.studentId != null ? toDbId(params.studentId) : undefined,
      profesorId: params.teacherId != null ? toDbId(params.teacherId) : undefined,
    },
  });
}
