import type { Prisma } from "@prisma/client";

export async function refreshAcademicSummary(tx: Prisma.TransactionClient, studentId: bigint) {
  const grades = await tx.grade.groupBy({ by: ["cursoOfertaId"], where: { studentId, periodo: { anioLectivo: { anio: 2026 } } }, _avg: { nota: true } });
  const attendance = await tx.attendance.findMany({ where: { studentId, fecha: { gte: new Date("2026-01-01"), lt: new Date("2027-01-01") } } });
  const computable = attendance.filter(a => !a.justificado);
  const avg = grades.length ? grades.reduce((sum,g) => sum + Number(g._avg.nota),0) / grades.length : 0;
  const pct = computable.length ? 100 * computable.filter(a => a.presente || a.tardanza).length / computable.length : 0;
  await tx.student.update({ where: { id: studentId }, data: { promedioGeneral: Math.round(avg * 100) / 100, asistenciaGeneral: Math.round(pct * 100) / 100 } });
}

export async function academicAudit(tx: Prisma.TransactionClient, actor: string, entidad: string, id: bigint, studentId: bigint, accion: string, ip?: string) {
  await tx.auditLog.create({ data: { entidad, entidadId: String(id), estudianteId: studentId, usuarioId: BigInt(actor), accion, ipAddress: ip } });
}
