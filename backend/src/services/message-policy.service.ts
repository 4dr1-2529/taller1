import type { RolCodigo } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export function allowedDirectRoles(a: RolCodigo, b: RolCodigo): boolean {
  return (a === "admin" && b === "docente") || (a === "docente" && b === "admin") ||
    (a === "docente" && b === "estudiante") || (a === "estudiante" && b === "docente");
}

export async function assertDirectConversation(sender: string, recipient: string) {
  const users = await prisma.user.findMany({ where: { id: { in: [BigInt(sender), BigInt(recipient)] }, activo: true }, include: { rol: true } });
  const a = users.find(u => String(u.id) === sender);
  const b = users.find(u => String(u.id) === recipient);
  if (!a || !b || !allowedDirectRoles(a.rol.codigo, b.rol.codigo)) throw new AppError(403, "Relación de mensajería no permitida");
  const studentUser = a.rol.codigo === "estudiante" ? a : b.rol.codigo === "estudiante" ? b : null;
  if (!studentUser) return;
  const teacherUser = a.rol.codigo === "docente" ? a : b;
  const enrollment = await prisma.enrollment.findFirst({ where: {
    estado: "activa", student: { usuarioId: studentUser.id, activo: true, matriculas: { some: { estado: "activa", anioLectivo: { anio: 2026 } } } },
    course: { activo: true, anioLectivo: { anio: 2026 }, profesor: { usuarioId: teacherUser.id, activo: true } },
  } });
  if (!enrollment) throw new AppError(403, "Profesor y estudiante no comparten un curso activo en 2026");
}
