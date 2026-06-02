import { prisma } from "./prisma.js";
import { toDbId, idToString } from "./ids.js";

export async function getTeacherIdForUser(userId: string): Promise<string | null> {
  const teacher = await prisma.teacher.findFirst({
    where: { usuarioId: toDbId(userId), activo: true },
    select: { id: true },
  });
  return teacher ? idToString(teacher.id) : null;
}
