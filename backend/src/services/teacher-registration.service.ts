import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";
import { teacherSchema } from "../validators/schemas.js";
import { AppError } from "../middleware/errorHandler.js";
import { nextCode } from "./correlativo.service.js";

export async function registerTeacher(input: unknown, actor: string, ip?: string) {
  const data = teacherSchema.parse(input);
  const hash = data.crearCuenta ? await bcrypt.hash(data.password!, 12) : undefined;
  return prisma.$transaction(async tx => {
    if (await tx.user.findFirst({ where: { OR: [{ dni: data.dni }, { email: data.correo }] } }) || await tx.teacher.findFirst({ where: { OR: [{ dni: data.dni }, { email: data.correo }] } })) throw new AppError(409, "DNI o correo duplicado");
    if (await tx.student.findFirst({ where: { OR: [{ dni: data.dni }, { email: data.correo }] } })) throw new AppError(409, "DNI o correo duplicado");
    const role = await tx.role.findUniqueOrThrow({ where: { codigo: "docente" } });
    const user = hash ? await tx.user.create({ data: { rolId: role.id, email: data.correo, passwordHash: hash, nombres: data.nombres, apellidos: data.apellidos, dni: data.dni, telefono: data.telefono } }) : null;
    const teacher = await tx.teacher.create({ data: {
      codigo: await nextCode(tx, "profesor"), dni: data.dni, nombres: data.nombres, apellidos: data.apellidos,
      especialidad: data.especialidad, email: data.correo, telefono: data.telefono, usuarioId: user?.id,
    }, include: { cursosOferta: { include: { cursoCatalogo: true } }, usuario: { select: { id: true, email: true, activo: true } } } });
    await tx.auditLog.create({ data: { entidad: "Teacher", entidadId: String(teacher.id), profesorId: teacher.id, usuarioId: BigInt(actor), accion: "CREATE", ipAddress: ip } });
    return teacher;
  });
}
