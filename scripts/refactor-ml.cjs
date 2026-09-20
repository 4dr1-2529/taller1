const fs = require('node:fs');
function edit(p, fn) { fs.writeFileSync(p, fn(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n'))); }
// Preserve earlier scientific/technical artifacts, without using them for the new contract.
fs.mkdirSync('legacy/ml-v1', {recursive:true});
for (const f of ['train.py','evaluate.py']) fs.copyFileSync('machine-learning/'+f,'legacy/ml-v1/'+f);
for (const f of fs.readdirSync('machine-learning/models')) {
  if (/\.(joblib|json|csv)$/.test(f)) fs.renameSync('machine-learning/models/'+f,'legacy/ml-v1/'+f);
}
edit('machine-learning/app/features.py', s => {
  const start=s.indexOf('FEATURE_NAMES:'); const end=s.indexOf('\n\ndef proba_to_score');
  s=s.slice(0,start)+`FEATURE_NAMES: list[str] = [
    "promedio_general", "cursos_desaprobados", "asistencia_general",
    "frecuencia_acceso_lms", "tiempo_interaccion_lms",
    "actividades_realizadas", "recursos_consultados",
]
LEVEL_MAP = {0: "bajo", 1: "medio", 2: "alto"}
LEVEL_TO_SCORE = {0: 25.0, 1: 52.0, 2: 78.0}

def build_feature_vector(data: dict[str, Any]) -> np.ndarray:
    from utils.validators import validate_predict_payload
    validated = validate_predict_payload(data)
    return np.array([[validated[name] for name in FEATURE_NAMES]], dtype=np.float64)
`+s.slice(end);
  for (const key of ['tareas_ratio','uso_foros','disminucion_actividad']) {
    const a=s.indexOf('    if float(data.get("'+key+'"');
    if(a>=0) { let b=s.indexOf('\n    if ',a+1); const sort=s.indexOf('\n    factors.sort',a); if(b<0||b>sort)b=sort; s=s.slice(0,a)+s.slice(b+1); }
  }
  // Explanations are observations, not invented feature importance.
  s=s.replaceAll('data.get("frecuencia_acceso_lms", data.get("actividad_lms_prom", 100))','data["frecuencia_acceso_lms"]').replaceAll('data.get("frecuencia_acceso_lms", data.get("actividad_lms_prom", 0))','data["frecuencia_acceso_lms"]').replace(' < 60:', ' < 1:').replace('(60 - v) * 0.4', '(1 - v)');
  return s;
});
fs.writeFileSync('machine-learning/utils/validators.py', `"""Strict seven-feature contract; no fabricated defaults."""
import math

class ValidationError(ValueError):
    pass

def validate_predict_payload(data):
    from app.features import FEATURE_NAMES
    if set(data) != set(FEATURE_NAMES):
        raise ValidationError("Se requieren exactamente las siete variables del contrato 2026")
    result = {}
    for name in FEATURE_NAMES:
        value = data[name]
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
            raise ValidationError(f"Valor inválido: {name}")
        if name == "promedio_general" and value > 20 or name == "asistencia_general" and value > 100:
            raise ValidationError(f"Fuera de rango: {name}")
        if name in ("cursos_desaprobados", "actividades_realizadas", "recursos_consultados") and int(value) != value:
            raise ValidationError(f"Se requiere entero: {name}")
        result[name] = float(value)
    return result
`);
edit('machine-learning/app/main.py', s => {
  s=s.replace('from fastapi import FastAPI','from fastapi import FastAPI, HTTPException').replace('from pydantic import BaseModel, Field','from pydantic import BaseModel, Field, ConfigDict').replace('best_model_name = "stacking-ensemble"','best_model_name = "unavailable"');
  const a=s.indexOf('class PredictInput'); const b=s.indexOf('class PredictOutput');
  s=s.slice(0,a)+`class PredictInput(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    promedio_general: float = Field(..., ge=0, le=20)
    cursos_desaprobados: int = Field(..., ge=0)
    asistencia_general: float = Field(..., ge=0, le=100)
    frecuencia_acceso_lms: float = Field(..., ge=0)
    tiempo_interaccion_lms: float = Field(..., ge=0)
    actividades_realizadas: int = Field(..., ge=0)
    recursos_consultados: int = Field(..., ge=0)


`+s.slice(b);
  s=s.replace('        feature_names = joblib.load(MODELS_DIR / "features.joblib")', `        feature_names = joblib.load(MODELS_DIR / "features.joblib")
        if list(feature_names) != FEATURE_NAMES or getattr(model, "n_features_in_", 0) != len(FEATURE_NAMES):
            model = None
            raise ValueError("Artifact incompatible with the 2026 feature contract")`);
  s=s.replace('    except FileNotFoundError:', '    except (FileNotFoundError, ValueError):\n        model = None');
  const c=s.indexOf('def _normalize_input'); const d=s.indexOf('@app.post("/predict"');
  s=s.slice(0,c)+s.slice(d);
  s=s.replace('        return heuristic_predict(payload)', '        raise HTTPException(status_code=503, detail="Modelo 2026 validado no disponible")');
  s=s.replace('        probability_abandono = float(proba[2]) if len(proba) > 2 else probability', '        probability_abandono = float(proba[2])');
  return s;
});
edit('machine-learning/app/dataset.py', s => s.replace('labels = sorted({target for _, target in clean})','labels = ["bajo", "medio", "alto"]').replace('if set(labels) != {"alto", "bajo", "medio"}:','if {target for _, target in clean} != set(labels):'));
edit('machine-learning/train.py', s => {
  const a=s.indexOf('def compute_risk_score'); const b=s.indexOf('def evaluate_model');
  s=s.slice(0,a)+s.slice(b);
  const c=s.indexOf('    if mode == "demo":'); const d=s.indexOf('    X_train, X_test',c);
  return s.slice(0,c)+`    if mode != "real":
        raise RuntimeError("Generación de datos sintéticos pospuesta a Data Seed v2")
    X, y, data_meta = load_dataset()
`+s.slice(d);
});
edit('machine-learning/evaluate.py', s => s.replace('from train import evaluate_model, generate_synthetic_data','from train import evaluate_model\nfrom app.dataset import load_dataset\nfrom app.features import FEATURE_NAMES').replace('    X, y = generate_synthetic_data(1200)','    X, y, _ = load_dataset()\n    if list(joblib.load(MODELS_DIR / "features.joblib")) != FEATURE_NAMES:\n        raise ValueError("Modelo incompatible")'));
edit('backend/src/validators/schemas.ts', s => {
  const a=s.indexOf('export const lmsMetricsSchema'); const b=s.indexOf('export const messageSchema');
  return s.slice(0,a)+'export const predictSchema = z.object({ studentId: z.string().regex(/^[1-9]\\d*$/) }).strict();\n\n'+s.slice(b);
});
edit('backend/src/controllers/predict.controller.ts', s => {
  s=s.replace('import { computeLocalRisk } from "../services/risk-engine.js";', 'import { studentIndicators } from "../services/lms.service.js";');
  const a=s.indexOf('    const lmsRows'); const b=s.indexOf('    let savedPrediction',a);
  s=s.slice(0,a)+`    const metrics = await studentIndicators(student!.id);
    if (metrics.promedio_general === null || metrics.asistencia_general === null) throw new AppError(409, "Datos académicos insuficientes para predecir");
    const payload = buildMlPayload(metrics);
    const ml = await predictWithMl(payload);
    if (!ml) throw new AppError(503, "Modelo 2026 no disponible. No se genera riesgo ficticio.");
    const result = {
      score: ml.score, level: ml.level as NivelRiesgo,
      probability: ml.probability_abandono ?? ml.probability,
      probabilityAbandono: ml.probability_abandono ?? ml.probability,
      factors: ml.factors ?? [], modelName: ml.model_name,
      predictionSource: "ml_model" as const,
      recommendation: buildRecommendation(ml.level, ml.factors ?? [], ml.recommendation),
      predictedAt: ml.predicted_at ?? new Date().toISOString(), inputData: payload,
    };

`+s.slice(b);
  return s;
});
edit('backend/src/services/ml-client.ts', s => {
  s=s.replace('import type { MetricsInput } from "./risk-engine.js";', 'import type { studentIndicators } from "./lms.service.js";');
  const a=s.indexOf('/** Construye'); const b=s.indexOf('  try {',s.indexOf('export async function predictWithMl'));
  s=s.slice(0,a)+`export function buildMlPayload(metrics: Awaited<ReturnType<typeof studentIndicators>>) {
  return {
    promedio_general: metrics.promedio_general, cursos_desaprobados: metrics.cursos_desaprobados,
    asistencia_general: metrics.asistencia_general, frecuencia_acceso_lms: metrics.frecuencia_acceso_lms,
    tiempo_interaccion_lms: metrics.tiempo_interaccion_lms, actividades_realizadas: metrics.actividades_realizadas,
    recursos_consultados: metrics.recursos_consultados,
  };
}

export async function predictWithMl(body: ReturnType<typeof buildMlPayload>): Promise<MlPredictResult | null> {
`+s.slice(b);
  return s.replace('    const body = buildMlPayload(metrics, estado, extra);\n','');
});
edit('backend/src/routes/index.ts', s => s.replace(', createStudentRisk,', ',').replace(/^router.post\("\/student-risks"[^\n]*\n/m,''));
edit('backend/src/controllers/reports.controller.ts', s => {
  const a=s.indexOf('export async function createStudentRisk');const b=s.indexOf('export async function applyRecommendation');
  return (s.slice(0,a)+s.slice(b)).replace('          { estado: "en_riesgo" },\n','').replace('(s.estado === "en_riesgo" ? "medio" : "bajo")','"bajo"');
});
