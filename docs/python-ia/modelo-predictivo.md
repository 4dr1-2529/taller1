# Machine Learning 2026-v3 (modelo V6)

> Los **números de desempeño no se reproducen aquí**. Son documentos canónicos:
> [`machine-learning/README.md`](../../machine-learning/README.md),
> [`docs/ml/PIPELINE_ML_V6.md`](../ml/PIPELINE_ML_V6.md),
> [`docs/ml/RESULTADOS_EXPERIMENTALES_V6.md`](../ml/RESULTADOS_EXPERIMENTALES_V6.md) y
> [`docs/ml/DATA_SEED_V6_METODOLOGIA.md`](../ml/DATA_SEED_V6_METODOLOGIA.md).

## Modelo seleccionado

El modelo elegido es **Stacking** (base Random Forest + XGBoost, meta-estimador Random Forest) y ya existe
como artefacto entrenado en `machine-learning/artifacts/synthetic/`:

- `modelVersion`: `BLENKIR_V6_BIN_20260924`
- `datasetVersion`: `BLENKIR_V6_SYNTH_20260924`
- `dataMode`: `synthetic_scientific`
- `contractVersion`: `2026-v3`
- `experimental`: `true`

**Selección hecha únicamente con el conjunto de validación**
(`selection=validation_f1_desercion`, `holdout_used_for_selection=false`). El holdout **ya fue evaluado una
sola vez** y su resultado quedó registrado en `artifacts/synthetic/metrics.json`
(`final_metrics`, `split=holdout`); no se reparte ni se reutiliza para tomar decisiones de selección.

## Contrato de entrada

Vector ordenado de **7 variables**: `promedio_general`, `cursos_desaprobados`, `asistencia_general`,
`frecuencia_acceso_lms`, `tiempo_interaccion_lms`, `actividades_realizadas`, `recursos_consultados`.

Las mismas validaciones se aplican en la carga de datos, el contrato FastAPI y el cliente backend.
Todos los valores son finitos y no negativos; notas 0–20, asistencia 0–100 y recuentos enteros.
Las entradas adicionales o ausentes se rechazan: **no se imputan ni se inventan valores**.
La etiqueta es binaria (`permanece` / `deserta`); los niveles de riesgo (bajo/medio/alto) se derivan
después con los umbrales `p < 0.41`, `0.41 <= p < 0.65` y `p >= 0.65`.

Sin `best_model.joblib`, `features.joblib` y `metadata.json` coherentes, la API responde `503`:
no hay degradación a riesgo Bajo ni predicciones ficticias.

## Datos

El dataset vigente es **científico-sintético** (`dataMode=synthetic_scientific`, 225 estudiantes sintéticos
/ 450 registros, particiones por estudiante en entrenamiento, validación y holdout). Procedencia, unidad de
observación, fechas, etiquetas y posibles fugas requieren revisión científica: **el software no certifica por
sí solo la validez de las etiquetas**.

**Advertencia — modelo experimental:** sus resultados son experimentales y no constituyen evidencia de la
prevalencia del riesgo en la institución ni validación institucional. Los factores que muestra la aplicación
son indicadores descriptivos por reglas; **no** son importancia aprendida, atribuciones de tipo SHAP ni
evidencia causal.

## Pruebas y entrenamiento

- Pruebas: `npm run ml:test` (desde la raíz; equivale a
  `cd machine-learning && python tests/test_predict.py`).
- Reentrenamiento: `cd machine-learning` y su pipeline documentado en
  [`docs/ml/PIPELINE_ML_V6.md`](../ml/PIPELINE_ML_V6.md). Nunca sobre datos reales sin autorización.
- Los artefactos y métricos antiguos están en `legacy/ml-v1` y **no** describen el desempeño del vector actual.
