# Pipeline ML V6 — Binario de deserción (7 features)

> **MODELO EXPERIMENTAL — DATOS SINTÉTICOS.** Entrenado con
> `BLENKIR_ML_DATASET_V6_SYNTHETIC.csv` (`dataMode=synthetic_scientific`).
> Los resultados son evidencia de funcionamiento tecnológico, no evidencia clínica/institucional
> ni validación científica del fenómeno de deserción.

## 1. Dataset de entrenamiento

| Campo | Valor |
| --- | --- |
| Archivo | `machine-learning/data/synthetic-scientific-v6/BLENKIR_ML_DATASET_V6_SYNTHETIC.csv` |
| Filas | 450 instantáneas (225 estudiantes × 2 cortes: `2026-07-31`, `2026-09-21`) |
| `dataset_version` | `BLENKIR_V6_SYNTH_20260924` |
| `outcome_date` | `2026-12-15` (horizonte del desenlace) |
| Target | `target_desercion` binario: `permanece=0` (356) / `deserta=1` (94) |
| Split (viene del CSV, **no se remezcla**) | train 316 (158 estudiantes) · validation 68 (34) · holdout 66 (33) |
| Columnas prohibidas | `student_code`, `snapshot_id`, `grado`, `seccion_codigo`, `split`, `data_mode`, `dataset_version`, `target_label` y cualquier metadata no numérica |

## 2. Vector de features (orden fijo)

Definido en `machine-learning/app/features.py` (`FEATURE_NAMES`) y verificado contra
`features.joblib` en carga, en `evaluate.py` y en el contrato del API:

```
promedio_general, cursos_desaprobados, asistencia_general,
frecuencia_acceso_lms, tiempo_interaccion_lms, actividades_realizadas, recursos_consultados
```

Reglas (las mismas en `train.py`, `app/dataset.py` y `utils/validators.py`):
exactamente 7 valores, finitos, no negativos; notas 0–20, asistencia 0–100, recuentos enteros;
entradas adicionales o ausentes → rechazo con error; jamás se inventan valores.
`prob_generador`/`score_generador` están prohibidos como predictores.

## 3. Umbralización (fuente única)

`machine-learning/app/thresholds.py`:

- El modelo estima `P(deserción) = P(target_desercion = 1)`.
- `decision_threshold = 0.41` (umbral de decisión binaria, elegido en **validation**).
- Bandas de riesgo: `bajo < 0.41 ≤ medio < 0.65 ≤ alto` (`RISK_THRESHOLDS = {medio: 0.41, alto: 0.65}`).
- `score` 0–100 derivado de la probabilidad para los dashboards.
- Los umbrales son operativos/experimentales y así se declaran en `metadata.json`
  ("no validados científicamente; se conservan como base operativa documentada").

## 4. Entrenamiento y selección (`train.py`)

1. Carga el CSV, valida target binario y los tres splits; errores → `DATASET_ERROR=`.
2. Entrena **solo sobre `split=train`**: Random Forest, XGBoost (o HistGradientBoosting si
   XGBoost no es compatible) y Stacking con sus umbrales optimizados.
3. **Selección exclusivamente por VALIDATION**: mejor F1 de la clase deserción
   (`selection="validation_f1_desercion"`), con empate por balanced accuracy y ROC-AUC.
   `holdout_used_for_selection = false`.
4. El **holdout se evalúa una sola vez**, al final, con el umbral decidido en validation:
   Accuracy, Precision, Recall, F1, Balanced Accuracy, ROC-AUC, PR-AUC, Brier y matriz de
   confusión (`evaluate_binary`).
5. Escribe artefactos **solo** en `machine-learning/artifacts/synthetic/` (nunca en `artifacts/real/`).

Comandos:

```bash
npm run ml:train        # cd machine-learning && python train.py
npm run ml:evaluate     # reutiliza holdout.joblib, no crea otra partición
npm run ml:test         # python tests/test_predict.py (32 pruebas)
```

## 5. Artefactos (`machine-learning/artifacts/synthetic/`)

| Archivo | Contenido |
| --- | --- |
| `best_model.joblib` | Modelo ganador (**stacking**) servido por FastAPI |
| `random_forest_model.joblib`, `xgboost_model.joblib`, `stacking_model.joblib` | Candidatos |
| `features.joblib` | Las 7 features en orden fijo |
| `holdout.joblib` | `X`, `y`, `splits` y `features` del holdout (para `evaluate.py`) |
| `metadata.json` | `data_mode`, `model_version`, `contract_version`, `decision_threshold`, `risk_thresholds`, splits, `experimental=true`, `labeling` |
| `metrics.json` | Métricas validation + holdout, `selection`, `holdout_used_for_selection=false`, `model_used` (etiqueta = modelo servido) |
| `metrics_comparison.csv` | Tabla plana modelo × split × métrica |
| `training_history.json`, `data-quality.json` | Historial y control de calidad del dataset |

Versiones: `model_version = BLENKIR_V6_BIN_20260924`, `dataset_version = BLENKIR_V6_SYNTH_20260924`,
`contract_version = 2026-v3`, `trained_at = 2026-09-24T18:40:33Z`.

## 6. API FastAPI (contrato v3, puerto 5000)

- `GET /health` → `model_loaded`, `model`, `model_version`, `data_mode`, `dataset_version`,
  `contract_version`, `n_features=7`, `features`, `decision_threshold`, `risk_thresholds`,
  `experimental=true`.
- `POST /predict` → acepta claves en **camelCase y snake_case** (v3), valida el vector
  (extra → error), devuelve `probability`, `level` (bajo/medio/alto), `score`, `factors`,
  `recommendation`, `decision_threshold`, `risk_thresholds`, `model_name`, `model_version`,
  `contract_version`, `data_mode`, `experimental`.
- **Factores** = "Señales observadas" descriptivas (`build_factors` en `app/features.py`):
  no son SHAP, no son importancia aprendida, no son causalidad.
- Niveles `synthetic_scientific` (por defecto) y `real`; sin artefactos compatibles → error
  honesto, jamás inventa predicciones.
- Pruebas: `npm run ml:test` → 32/32 OK.

## 7. Integración backend (4000)

| Pieza | Responsabilidad |
| --- | --- |
| `backend/src/services/ml-client.ts` | Cliente + schema zod; acepta `decision_threshold` (snake) y lo **transforma** a `decisionThreshold` |
| `backend/src/controllers/predict.controller.ts` | `POST /predict` → `studentIndicators` (BD) → ML → persiste; `source="machine-learning"` |
| `backend/src/services/prediction-persistence.service.ts` | Guarda `input_data` con la meta trazable (`dataMode`, `modelVersion`, `datasetVersion`, `contractVersion`, `decisionThreshold`) + factores + snapshot |
| `backend/src/controllers/predictions.controller.ts` | Historial con `dataMode`, `modelVersion`, `datasetVersion`, `contractVersion`, `decisionThreshold`, `experimental` |
| `backend/scripts/predict-all-v6.ts` | Lote masivo desde el CSV V6 |

Trazabilidad verificada en vivo (docente, `EST-0009`):
`nivel=medio prob=0.5026 modelo=stacking dataMode=synthetic_scientific
modelVersion=BLENKIR_V6_BIN_20260924 datasetVersion=BLENKIR_V6_SYNTH_20260924
contractVersion=2026-v3 decisionThreshold=0.41 experimental=true source=machine-learning`.

## 8. Lote `ml:v6:predict-all`

```bash
npm run ml:v6:predict-all            # --preview por defecto: SOLO LECTURA, no abre BD
npm run ml:v6:predict-all -- --write # escritura guardada
```

Guardas de `--write` (informe por booleanos, nunca imprime secretos):

- `hostIsLocal` / `hostConfigured` / `railway` / `nodeProduction` / `allowFlag`.
- Si `isProduction` y no existe `ALLOW_SYNTHETIC_PREDICTION_WRITE=true` → **se rehúsa** a escribir.
- Omite estudiantes ya evaluados (`skippedExisting`), cuenta `skippedNoData` y `mlErrors`.
- Artefacto de preview en `machine-learning/artifacts/synthetic/predictions-preview.json`.

Resultado local: `WRITE_DONE written=250 skippedExisting=0 skippedNoData=0 mlErrors=0
alertsCreated=189` (bandas: bajo 61 · medio 177 · alto 12) + 1 predicción de la
verificación en vivo = **251 predicciones**, 189 alertas, 1757 instantáneas de features,
0 predicciones sin `decisionThreshold`.

> La distribución del preview del CSV (225 evaluados: 114/102/9, media 0.411) difiere de la
> BD (61/177/12) porque en la BD los indicadores se recalculan desde el operacional
> (calificaciones, asistencias y eventos LMS), no desde el CSV.
