import { prisma } from "./prisma.js";

export async function getTeacherIdForUser(userId: string): Promise<string | null> {
  const teacher = await prisma.teacher.findFirst({
    where: { userId, activo: true },
    select: { id: true },
  });
  return teacher?.id ?? null;
}
