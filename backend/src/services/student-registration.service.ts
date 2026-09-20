import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { studentSchema } from "../validators/schemas.js";
import { AppError } from "../middleware/errorHandler.js";
import { nextCode } from "./correlativo.service.js";

export async function enroll2026(tx: Prisma.TransactionClient, studentId: bigint, seccionId: bigint, actor: string, ip?: string) {
  // Serialize capacity checks and admissions to the same section.
  await tx.$queryRaw`SELECT id FROM seccion WHERE id = ${seccionId} FOR UPDATE`;
  const section = await tx.seccion.findUnique({ where: { id: seccionId }, include: { grado: true } });
  if (!section?.activo) throw new AppError(400, "Sección inexistente o inactiva");
  const year = await tx.anioLectivo.findFirst({ where: { anio: 2026, activo: true } });
  if (!year) throw new AppError(400, "Configure el año lectivo 2026 activo");
  const student = await tx.student.findUnique({ where: { id: studentId } });
  if (!student?.activo) throw new AppError(400, "Estudiante inexistente o inactivo");
  if (await tx.matricula.findUnique({ where: { estudianteId_anioLectivoId: { estudianteId: studentId, anioLectivoId: year.id } } })) {
    throw new AppError(409, "El estudiante ya tiene matrícula en 2026");
  }
  const occupied = await tx.matricula.count({ where: { seccionId, anioLectivoId: year.id, estado: "activa" } });
  if (occupied >= section.capacidad) throw new AppError(409, "La sección alcanzó su capacidad");
  const matricula = await tx.matricula.create({ data: {
    estudianteId: studentId, seccionId, anioLectivoId: year.id,
    codigo: await nextCode(tx, "matricula"), fechaMatricula: new Date(), estado: "activa",
  }, include: { estudiante: true, seccion: { include: { grado: { include: { nivel: true } } } }, anioLectivo: true } });
  const courses = await tx.course.findMany({ where: { seccionId, anioLectivoId: year.id, activo: true } });
  await tx.enrollment.createMany({ data: courses.map(c => ({ studentId, cursoOfertaId: c.id })), skipDuplicates: true });
  await tx.student.update({ where: { id: studentId }, data: { seccionId } });
  await tx.auditLog.create({ data: { entidad: "Matricula", entidadId: String(matricula.id), accion: "CREATE", usuarioId: BigInt(actor), estudianteId: studentId, ipAddress: ip } });
  return matricula;
}

export async function registerStudent(input: unknown, actor: string, ip?: string) {
  const data = studentSchema.parse(input);
  const temporaryPassword = randomBytes(18).toString("base64url");
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const student = await prisma.$transaction(async tx => {
    if (await tx.user.findUnique({ where: { dni: data.dni } }) || await tx.student.findUnique({ where: { dni: data.dni } })) {
      throw new AppError(409, "DNI duplicado");
    }
    if (await tx.teacher.findUnique({ where: { dni: data.dni } })) throw new AppError(409, "DNI duplicado");
    const codigo = await nextCode(tx, "estudiante");
    const email = data.correo || `${codigo.replace("-", "").toLowerCase()}@blenkir.edu.pe`;
    if (await tx.user.findUnique({ where: { email } }) || await tx.student.findFirst({ where: { email } })) throw new AppError(409, "Correo duplicado");
    const role = await tx.role.findUnique({ where: { codigo: "estudiante" } });
    if (!role) throw new AppError(400, "Rol estudiante no configurado");
    const user = await tx.user.create({ data: { email, passwordHash, rolId: role.id, nombres: data.nombres, apellidos: data.apellidos, dni: data.dni, telefono: data.telefono } });
    const created = await tx.student.create({ data: { codigo, usuarioId: user.id, nombres: data.nombres, apellidos: data.apellidos, dni: data.dni, email, telefono: data.telefono, seccionId: BigInt(data.seccionId), fechaIngreso: new Date() }, include: { seccion: { include: { grado: { include: { nivel: true } } } } } });
    await enroll2026(tx, created.id, BigInt(data.seccionId), actor, ip);
    await tx.auditLog.create({ data: { entidad: "Student", entidadId: String(created.id), accion: "CREATE", usuarioId: BigInt(actor), estudianteId: created.id, ipAddress: ip } });
    return created;
  }, { timeout: 15000 });
  // One-time delivery to the director. Never persist or log the plaintext password.
  return { student, credentials: { email: student.email, temporaryPassword } };
}
