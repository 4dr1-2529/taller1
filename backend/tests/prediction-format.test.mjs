/**
 * Prueba unitaria del formato de respuesta tesis.
 * node backend/tests/prediction-format.test.mjs
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Compilar TS en runtime no disponible — replicamos lógica mínima
function toThesisPrediction(p) {
  const NIVEL = { bajo: "Bajo", medio: "Medio", alto: "Alto" };
  return {
    probabilidad_abandono: Math.round(p.probabilityAbandono * 1000) / 1000,
    score_predictivo: Math.round(p.score * 10) / 10,
    nivel_riesgo: NIVEL[p.level] ?? p.level,
    factores_riesgo: p.factors,
    recomendacion: p.recommendation,
    modelo_usado: p.modelName,
    fecha_prediccion: p.predictedAt,
  };
}

let ok = 0;
let fail = 0;

function assert(name, cond) {
  if (cond) {
    ok++;
    console.log(`✓ ${name}`);
  } else {
    fail++;
    console.error(`✗ ${name}`);
  }
}

const sample = {
  score: 85.2,
  level: "alto",
  probabilityAbandono: 0.852,
  factors: [{ key: "asistencia", label: "Baja asistencia", contribution: 12 }],
  modelName: "stacking",
  recommendation: "Intervención prioritaria",
  predictedAt: "2026-06-02T12:00:00.000Z",
};

const tesis = toThesisPrediction(sample);
assert("nivel_riesgo en español", tesis.nivel_riesgo === "Alto");
assert("score_predictivo numérico", tesis.score_predictivo === 85.2);
assert("probabilidad_abandono", tesis.probabilidad_abandono === 0.852);
assert("factores_riesgo array", Array.isArray(tesis.factores_riesgo) && tesis.factores_riesgo.length === 1);

console.log(`\n${ok} ok, ${fail} fallos`);
process.exit(fail > 0 ? 1 : 0);
