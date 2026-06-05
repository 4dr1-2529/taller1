import { prisma } from "./prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { toDbId } from "./ids.js";

export async function requireStudentIdFromUser(userSub: string): Promise<bigint> {
  const student = await prisma.student.findFirst({
    where: { usuarioId: toDbId(userSub), activo: true },
    select: { id: true },
  });
  if (!student) {
    throw new AppError(403, "Estudiante no vinculado a una cuenta activa", "FORBIDDEN");
  }
  return student.id;
}

export function rejectClientStudentId(queryStudentId: string | undefined, tokenStudentId: bigint): void {
  if (!queryStudentId) return;
  if (toDbId(queryStudentId) !== tokenStudentId) {
    throw new AppError(403, "No tiene permiso para acceder a este estudiante", "FORBIDDEN");
  }
}
