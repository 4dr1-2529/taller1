/**
 * Formato de respuesta alineado al informe de tesis (español).
 * Mantiene compatibilidad con campos camelCase existentes en el frontend.
 */

export type RiskLevelDb = "bajo" | "medio" | "alto";

export type PredictionFactor = {
  key: string;
  label: string;
  contribution: number;
};

export type InternalPrediction = {
  score: number;
  level: RiskLevelDb;
  probability: number;
  probabilityAbandono: number;
  factors: PredictionFactor[];
  modelName: string;
  recommendation: string;
  predictedAt: string;
  inputData?: Record<string, unknown>;
  id?: string;
  studentId?: string;
  // Trazabilidad del modelo experimental (V6)
  modelVersion?: string;
  datasetVersion?: string;
  dataMode?: string;
  contractVersion?: string;
  decisionThreshold?: number;
  experimental?: boolean;
};

const NIVEL_LABEL: Record<RiskLevelDb, string> = {
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
};

/** Claves de trazabilidad del modelo guardadas junto a las features en input_data. */
export const PREDICTION_META_KEYS = [
  "modelVersion",
  "datasetVersion",
  "dataMode",
  "contractVersion",
  "decisionThreshold",
] as const;

export type PredictionMeta = Partial<Record<(typeof PREDICTION_META_KEYS)[number], unknown>>;

/** Separa las siete features del snapshot de la trazabilidad del modelo. */
export function splitPredictionInput(inputData: unknown): {
  features: Record<string, unknown>;
  meta: PredictionMeta;
} {
  const source = (inputData && typeof inputData === "object" ? inputData : {}) as Record<string, unknown>;
  const meta: PredictionMeta = {};
  const features: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if ((PREDICTION_META_KEYS as readonly string[]).includes(key)) {
      (meta as Record<string, unknown>)[key] = value;
    } else {
      features[key] = value;
    }
  }
  return { features, meta };
}

/** Respuesta estándar para informe / consumo externo */
export type ThesisPredictionResponse = {
  probabilidad_abandono: number;
  score_predictivo: number;
  nivel_riesgo: string;
  factores_riesgo: PredictionFactor[];
  recomendacion: string;
  modelo_usado: string;
  fecha_prediccion: string;
  fecha: string;
  datos_ingresados?: Record<string, unknown>;
};

export function toThesisPrediction(p: InternalPrediction): ThesisPredictionResponse {
  return {
    probabilidad_abandono: Math.round(p.probabilityAbandono * 1000) / 1000,
    score_predictivo: Math.round(p.score * 10) / 10,
    nivel_riesgo: NIVEL_LABEL[p.level] ?? p.level,
    factores_riesgo: p.factors,
    recomendacion: p.recommendation,
    modelo_usado: p.modelName,
    fecha_prediccion: p.predictedAt,
    fecha: p.predictedAt,
    datos_ingresados: p.inputData,
  };
}

/** Payload unificado para API (tesis + compatibilidad) */
export function buildPredictionApiPayload(p: InternalPrediction) {
  const tesis = toThesisPrediction(p);
  return {
    ...p,
    ...tesis,
    // Alias bidireccional para clientes legacy
    score: p.score,
    level: p.level,
    probability: p.probabilityAbandono,
    probabilityAbandono: p.probabilityAbandono,
    factors: p.factors,
    recommendation: p.recommendation,
    modelName: p.modelName,
    predictedAt: p.predictedAt,
    inputData: p.inputData,
    modelVersion: p.modelVersion,
    datasetVersion: p.datasetVersion,
    dataMode: p.dataMode,
    contractVersion: p.contractVersion,
    decisionThreshold: p.decisionThreshold,
    experimental: p.experimental ?? p.dataMode === "synthetic_scientific",
  };
}
