import { prisma } from "./prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { toDbId } from "./ids.js";

export async function getActiveAnioLectivoId(): Promise<bigint> {
  const anio = await prisma.anioLectivo.findFirst({ where: { activo: true }, orderBy: { anio: "desc" } });
  if (!anio) throw new AppError(400, "No hay año lectivo activo");
  return anio.id;
}

export async function resolvePeriodoId(periodoId?: string, periodoNumero?: number): Promise<bigint> {
  if (periodoId) return toDbId(periodoId);
  if (periodoNumero != null) {
    const anioId = await getActiveAnioLectivoId();
    const p = await prisma.periodoAcademico.findFirst({
      where: { anioLectivoId: anioId, numero: periodoNumero },
    });
    if (p) return p.id;
  }
  const active = await prisma.periodoAcademico.findFirst({
    where: { activo: true },
    orderBy: { numero: "desc" },
  });
  if (!active) throw new AppError(400, "No hay periodo académico activo");
  return active.id;
}

export async function resolvePeriodoByParam(periodo: string): Promise<bigint> {
  if (/^\d+$/.test(periodo.trim())) return toDbId(periodo);
  const p = await prisma.periodoAcademico.findFirst({ where: { nombre: periodo } });
  if (!p) throw new AppError(404, "Periodo no encontrado");
  return p.id;
}
