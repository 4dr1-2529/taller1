# Machine Learning 2026-v3 — Deserción binaria (Data Seed V6)

> **MODELO EXPERIMENTAL — DATOS SINTÉTICOS.** `dataMode=synthetic_scientific`,
> `dataset_version=BLENKIR_V6_SYNTH_20260924`, `model_version=BLENKIR_V6_BIN_20260924`,
> `contract_version=2026-v3`. Evidencia de funcionamiento tecnológico: no es evidencia
> institucional ni validación científica del fenómeno de deserción.

Vector ordenado de **7 variables** (orden fijo en `app/features.py`): `promedio_general`,
`cursos_desaprobados`, `asistencia_general`, `frecuencia_acceso_lms`,
`tiempo_interaccion_lms`, `actividades_realizadas`, `recursos_consultados`.

Prohibidos como predictores: `metadata`, `prob_generador`, `score_generador` y cualquier
columna identificatoria (`student_code`, `snapshot_id`, `grado`, `seccion_codigo`, `split`,
`data_mode`, `dataset_version`, `target_label`).

Las mismas validaciones se aplican en carga de datos, contrato FastAPI y cliente backend.
Todos los valores deben ser finitos y no negativos; notas 0–20, asistencia 0–100 y recuentos
enteros. Las entradas adicionales o ausentes se rechazan; no se inventan valores para
registros faltantes.

## Datos y splits

`data/synthetic-scientific-v6/BLENKIR_ML_DATASET_V6_SYNTHETIC.csv`: 450 instantáneas de
225 estudiantes (2 cortes), target binario `target_desercion` (`permanece=0` 356 /
`deserta=1` 94). El split **viene del CSV y no se remezcla**: train 316 (158 estudiantes) ·
validation 68 (34) · holdout 66 (33).

## Modelos, selección y umbrales

- Candidatos: Random Forest, XGBoost (HistGradientBoosting si XGBoost no es compatible) y
  Stacking.
- **Selección exclusivamente por VALIDATION** (`selection=validation_f1_desercion`,
  empate por balanced accuracy y ROC-AUC). `holdout_used_for_selection=false`: el holdout
  solo se evalúa al final, con el umbral elegido en validation.
- Ganador actual: **stacking** (validation F1 0.4333 @ thr 0.41); holdout ACC 0.6364,
  F1 0.4286, ROC-AUC 0.6277, PR-AUC 0.3081, Brier 0.2011, CM [[33,19],[5,9]].
- Umbrales centralizados en `app/thresholds.py`: `decision_threshold=0.41` y bandas
  `bajo < 0.41 ≤ medio < 0.65 ≤ alto`. Son umbrales operativos/experimentales, no
  calibrados científicamente.
- Los factores que devuelve la API son **"Señales observadas"** descriptivas
  (`build_factors`): no son SHAP, no son importancia aprendida ni causalidad.

## Artefactos

Se escriben solo en `artifacts/synthetic/` (nunca en `artifacts/real/`): `best_model.joblib`,
modelos individuales, `features.joblib`, `holdout.joblib`, `metadata.json`, `metrics.json`,
`metrics_comparison.csv`, `training_history.json`, `data-quality.json`.
Los artefactos antiguos están en `legacy/ml-v1` y no prueban desempeño de este vector.
Sin `best_model.joblib` + `features.joblib` + `metadata.json` coherentes, la API no produce
predicciones: devuelve un error honesto en lugar de inventarlas.

## Comandos

```bash
npm run ml:train      # python train.py (escribe artifacts/synthetic)
npm run ml:evaluate   # reevalúa sobre holdout.joblib, sin reentrenar
npm run ml:test       # python tests/test_predict.py (32 pruebas)
npm run dev:ml        # uvicorn app.main:app --reload --port 5000
npm run ml:v6:predict-all            # lote V6 en modo preview (solo lectura)
npm run ml:v6:predict-all -- --write # lote con escritura guardada
```

`ml:v6:predict-all --write` se rehúsa a escribir en base productiva salvo
`ALLOW_SYNTHETIC_PREDICTION_WRITE=true` explícito.

Métricas completas: `docs/ml/RESULTADOS_EXPERIMENTALES_V6.md`.
Pipeline: `docs/ml/PIPELINE_ML_V6.md`. Datos: `docs/ml/DATA_SEED_V6_METODOLOGIA.md`.
