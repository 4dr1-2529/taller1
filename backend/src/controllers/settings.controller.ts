import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { sendSuccess } from "../utils/response.js";

export async function getSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const setting = await prisma.systemConfig.findUnique({ where: { clave: "alertas.nivel_minimo" } });
    sendSuccess(res, { anio: 2026, nivelMinimoAlerta: setting?.valor === "alto" ? "alto" : "medio" });
  } catch (e) { next(e); }
}
export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { nivelMinimoAlerta } = z.object({ nivelMinimoAlerta: z.enum(["medio", "alto"]) }).strict().parse(req.body);
    await prisma.$transaction(async tx => {
      await tx.systemConfig.upsert({ where: { clave: "alertas.nivel_minimo" }, create: { clave: "alertas.nivel_minimo", valor: nivelMinimoAlerta }, update: { valor: nivelMinimoAlerta } });
      await tx.auditLog.create({ data: { entidad: "Configuracion", entidadId: "alertas.nivel_minimo", accion: "UPDATE", detalle: nivelMinimoAlerta, usuarioId: BigInt(req.user!.sub), ipAddress: req.ip } });
    });
    sendSuccess(res, { nivelMinimoAlerta });
  } catch (e) { next(e); }
}
