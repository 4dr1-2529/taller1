# Machine Learning 2026-v3 — resumen vigente (BLENKIR V6)

> **MODELO EXPERIMENTAL · DATOS CIENTÍFICO-SINTÉTICOS.** `dataMode=synthetic_scientific`,
> `datasetVersion=BLENKIR_V6_SYNTH_20260924`, `modelVersion=BLENKIR_V6_BIN_20260924`,
> `contractVersion=2026-v3`, `experimental=true`. Es evidencia de funcionamiento tecnológico:
> **no** es evidencia institucional ni validación científica del fenómeno de deserción.

Este documento es un **resumen** del pipeline vigente. Ante cualquier discrepancia prevalecen las
referencias canónicas:

- `machine-learning/README.md`
- `docs/ml/PIPELINE_ML_V6.md`
- `docs/ml/RESULTADOS_EXPERIMENTALES_V6.md`
- `docs/ml/DATA_SEED_V6_METODOLOGIA.md`
- `docs/python-ia/modelo-predictivo.md`

## Vector de entrada — 7 variables, orden fijo

`promedio_general`, `cursos_desaprobados`, `asistencia_general`, `frecuencia_acceso_lms`,
`tiempo_interaccion_lms`, `actividades_realizadas`, `recursos_consultados` (orden fijo en
`machine-learning/app/features.py`).

Prohibidos como predictores: `metadata`, `prob_generador`, `score_generador` y cualquier columna
identificatoria (`student_code`, `snapshot_id`, `grado`, `seccion_codigo`, `split`, `data_mode`,
`dataset_version`, `target_label`).

Las mismas validaciones se aplican en carga de datos, contrato FastAPI y cliente backend: todos los
valores deben ser finitos y no negativos; notas 0–20, asistencia 0–100 y recuentos enteros. Las
entradas adicionales o ausentes se rechazan; **no se inventan valores** para registros faltantes.

## Datos — dataset científico-sintético V6

- Fichero: `machine-learning/data/synthetic-scientific-v6/BLENKIR_ML_DATASET_V6_SYNTHETIC.csv`.
- **450 instantáneas de 225 estudiantes** (2 cortes), target **binario** `target_desercion`
  (`permanece=0` · `deserta=1`).
- El split **viene del CSV y no se remezcla**: train 316 · validation 68 · holdout 66.

> **No confundir poblaciones.** 225 estudiantes / 450 snapshots = dataset ML científico-sintético.
> La **población operativa/demo** que consume la aplicación es otra: **250 estudiantes · 24
> profesores · 1 director = 275 usuarios**. Datos reales institucionales: **todavía no disponibles**.

## Modelos, selección y umbrales

- Candidatos: Random Forest, XGBoost (HistGradientBoosting si XGBoost no es compatible) y Stacking.
- **Selección exclusivamente por VALIDACIÓN** (`selection=validation_f1_desercion`; empate por
  balanced accuracy y ROC-AUC). **`holdout_used_for_selection=false`**: el holdout solo se evalúa
  al final, con el umbral elegido en validación.
- **Ganador vigente: Stacking** (bases Random Forest + HistGradientBoosting, meta-estimador
  Random Forest, `cv=3`),
  validation F1 `0.4333` @ umbral `0.41`; holdout accuracy `0.6364`, F1 `0.4286`, ROC-AUC `0.6277`.
- Umbrales operativos centralizados en `app/thresholds.py`: `decision_threshold = 0.41` y
  `0.65` → bandas `bajo < 0.41 ≤ medio < 0.65 ≤ alto`. Son umbrales operativos/experimentales,
  **no** calibrados científicamente.
- El target es **binario** (`permanece` / `deserta`): los niveles de riesgo se derivan del umbral,
  no son clases de entrenamiento.
- Los factores que devuelve la API son **«señales observadas» descriptivas** (`build_factors`): no
  son SHAP, ni importancia aprendida, ni causalidad.

## Artefactos

Se escriben solo en `machine-learning/artifacts/synthetic/` (nunca en `artifacts/real/`):
`best_model.joblib`, modelos individuales, `features.joblib`, `holdout.joblib`, `metadata.json`,
`metrics.json`, `metrics_comparison.csv`, `training_history.json`, `data-quality.json`.

Sin `best_model.joblib` + `features.joblib` + `metadata.json` coherentes, la API **no** produce
predicciones: devuelve un error honesto en lugar de inventarlas.

## Qué NO describe este documento (correcciones frente a la versión 2026-v2)

| Afirmación antigua (SUPERADA) | Estado vigente |
|---|---|
| «Machine Learning 2026-v2» | **2026-v3**, contrato `2026-v3` |
| «No hay ganador declarado» / «entrenamiento futuro» | El entrenamiento V6 **ya se ejecutó** (2026‑09‑24); ganador **Stacking** con métricas publicadas |
| Target `bajo/medio/alto` codificado 0/1/2 (multiclase) | Target **binario** `permanece`/`deserta`; los niveles de riesgo se derivan del umbral |
| «Los futuros 200 registros» / «2500 muestras» | Dataset V6 con **450 instantáneas de 225 estudiantes** |
| Artefactos en `machine-learning/models` | `machine-learning/artifacts/synthetic/` |
| 9 variables / `generate_synthetic_data()` | **7 variables**; el dataset se carga desde el CSV autorizado |

Los materiales del pipeline anterior (`legacy/ml-v1`, `python-ia/`, `estado-del-arte-software/03-machine-learning/`,
`legacy/documentation/docs/machine-learning.md`) están marcados como **HISTÓRICO** y no describen el
estado vigente.

## Comandos

```bash
npm run ml:test      # python tests/test_predict.py (32 pruebas)
npm run ml:train     # reentrena y escribe artifacts/synthetic
npm run ml:evaluate  # reevalúa sobre holdout.joblib, sin reentrenar
npm run dev:ml       # uvicorn app.main:app --reload --port 5000
```

Métricas completas: `docs/ml/RESULTADOS_EXPERIMENTALES_V6.md`.
