import { prisma } from "./prisma.js";

export async function logAudit(params: {
  entidad: string;
  entidadId?: string;
  accion: string;
  usuarioId?: string;
  detalle?: string;
  ipAddress?: string;
  studentId?: string;
  teacherId?: string;
}) {
  await prisma.auditLog.create({
    data: {
      entidad: params.entidad,
      entidadId: params.entidadId,
      accion: params.accion,
      usuarioId: params.usuarioId,
      detalle: params.detalle,
      ipAddress: params.ipAddress,
      studentId: params.studentId,
      teacherId: params.teacherId,
    },
  });
}
