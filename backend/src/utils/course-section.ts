import type { Prisma } from "@prisma/client";
import { AppError } from "../middleware/errorHandler.js";
import { prisma } from "./prisma.js";

export type SeccionWithGrado = Prisma.SeccionGetPayload<{
  include: { grado: { include: { nivel: true } } };
}>;

type Db = Pick<typeof prisma, "seccion">;

export async function requireActiveSeccion(
  seccionId: string,
  db: Db = prisma,
): Promise<SeccionWithGrado> {
  const seccion = await db.seccion.findFirst({
    where: { id: seccionId, activo: true },
    include: { grado: { include: { nivel: true } } },
  });
  if (!seccion) throw new AppError(400, "Sección no encontrada o inactiva");
  return seccion;
}

/** Sufijo por salón: 4A, 1B — evita un mismo código para todo el grado. */
export function seccionCodigoSuffix(seccion: SeccionWithGrado): string {
  return `${seccion.grado.numero}${seccion.nombre}`;
}

export function buildCourseCodigoForSeccion(baseCodigo: string, seccion: SeccionWithGrado): string {
  const base = baseCodigo.trim().toUpperCase();
  const suffix = seccionCodigoSuffix(seccion);
  if (base.endsWith(suffix) || base.endsWith(`-${suffix}`)) {
    return base.slice(0, 32);
  }
  const combined = `${base}-${suffix}`;
  return combined.slice(0, 32);
}

export function formatSeccionCourseLabel(seccion: SeccionWithGrado): string {
  const nivel =
    seccion.grado.nivel.codigo === "secundaria" ? "Secundaria" : "Primaria";
  return `${nivel} · ${seccion.grado.nombre} ${seccion.nombre}`;
}
