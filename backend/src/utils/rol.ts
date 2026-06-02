import type { RolCodigo } from "@prisma/client";
import { prisma } from "./prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { toDbId } from "./ids.js";

export async function getRolId(codigo: RolCodigo): Promise<bigint> {
  const rol = await prisma.role.findUnique({ where: { codigo } });
  if (!rol) throw new AppError(500, `Rol no configurado: ${codigo}`);
  return rol.id;
}

export async function getUserRolCodigo(usuarioId: string | bigint): Promise<RolCodigo | null> {
  const user = await prisma.user.findUnique({
    where: { id: toDbId(usuarioId) },
    include: { rol: { select: { codigo: true } } },
  });
  return user?.rol.codigo ?? null;
}

/** Map user row with `rol` include to API shape with `role` string. */
export function mapUserWithRole<T extends { rol: { codigo: RolCodigo } }>(
  user: T,
): Omit<T, "rol"> & { role: RolCodigo } {
  const { rol, ...rest } = user;
  return { ...rest, role: rol.codigo };
}
