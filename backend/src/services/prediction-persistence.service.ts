import type { NivelRiesgo, Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma.js";

type Result = {
  score: number; level: NivelRiesgo; probabilityAbandono: number; modelName: string;
  recommendation: string; inputData: Prisma.InputJsonObject;
  factors: { key: string; label: string; contribution: number }[];
  modelVersion?: string; datasetVersion?: string; dataMode?: string;
  contractVersion?: string; decisionThreshold?: number;
};

export async function persistPrediction(studentId: bigint, result: Result, actor: string, ip?: string) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM estudiante WHERE id = ${studentId} FOR UPDATE`;
    const student = await tx.student.findUniqueOrThrow({ where: { id: studentId } });
    // La trazabilidad del modelo (versión, dataset, modo) se guarda en input_data
    // junto a las siete features: no se crean columnas ni migraciones nuevas.
    const inputData: Prisma.InputJsonObject = {
      ...result.inputData,
      ...(result.modelVersion ? { modelVersion: result.modelVersion } : null),
      ...(result.datasetVersion ? { datasetVersion: result.datasetVersion } : null),
      ...(result.dataMode ? { dataMode: result.dataMode } : null),
      ...(result.contractVersion ? { contractVersion: result.contractVersion } : null),
      ...(typeof result.decisionThreshold === "number"
        ? { decisionThreshold: result.decisionThreshold }
        : null),
    };
    const prediction = await tx.prediction.create({ data: {
      studentId, score: result.score, nivelRiesgo: result.level,
      probabilidad: result.probabilityAbandono, probabilidadAbandono: result.probabilityAbandono,
      modelName: result.modelName, contractVersion: (result.contractVersion ?? "2026-v2").slice(0, 20),
      inputData,
      recommendation: result.recommendation,
      features: { create: Object.entries(result.inputData).filter(([,v]) => typeof v === "number").map(([featureCodigo, v]) => ({ featureCodigo, valorNumerico: v as number })) },
      factores: { create: result.factors.map(f => ({ factorKey: f.key, etiqueta: f.label, contribucion: f.contribution })) },
    } });
    await tx.auditLog.create({ data: { entidad: "Prediction", entidadId: String(prediction.id), accion: "CREATE", usuarioId: BigInt(actor), estudianteId: studentId, ipAddress: ip } });
    const config = await tx.systemConfig.findUnique({ where: { clave: "alertas.nivel_minimo" } });
    const threshold = config?.valor === "alto" ? "alto" : "medio";
    let alert = null;
    if (result.level === "alto" || result.level === threshold) {
      const existing = await tx.alert.findFirst({ where: { studentId, estado: { in: ["nueva", "en_seguimiento"] }, nivelRiesgo: result.level } });
      if (!existing) {
        alert = await tx.alert.create({ data: {
          studentId, prediccionId: prediction.id, titulo: `Alerta temprana: riesgo ${result.level}`,
          descripcion: `Probabilidad estimada de deserción (P target=1): ${(result.probabilityAbandono * 100).toFixed(1)}%.`,
          nivelRiesgo: result.level, score: result.score, probabilidad: result.probabilityAbandono,
          recomendacion: result.recommendation, estado: "nueva",
        } });
        await tx.alertaHistorial.create({ data: { alertaId: alert.id, estadoNuevo: "nueva", usuarioId: BigInt(actor), comentario: "Generada por el modelo" } });
        await tx.auditLog.create({ data: { entidad: "Alert", entidadId: String(alert.id), accion: "CREATE", usuarioId: BigInt(actor), estudianteId: studentId, ipAddress: ip } });
        const staff = await tx.user.findMany({ where: { activo: true, OR: [
          { rol: { codigo: "admin" } },
          { profesor: { activo: true, cursosOferta: { some: { activo: true, anioLectivo: { anio: 2026 }, inscripciones: { some: { studentId, estado: "activa" } } } } } },
        ] }, select: { id: true } });
        await tx.notification.createMany({ data: staff.map(u => ({ usuarioId: u.id, tipo: "alerta", titulo: `Riesgo ${result.level}: ${student.nombres} ${student.apellidos}`, mensaje: result.recommendation })) });
      }
    }
    await tx.aiRecommendation.create({ data: { studentId, prediccionId: prediction.id, titulo: "Seguimiento académico", detalle: result.recommendation } });
    return { prediction, alert };
  }, { timeout: 15000 });
}
