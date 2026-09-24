# Datos de entrenamiento ML (V6)

> **MODELO EXPERIMENTAL — DATOS SINTÉTICOS.**

Dataset autorizado y versionado:

```
data/synthetic-scientific-v6/BLENKIR_ML_DATASET_V6_SYNTHETIC.csv
450 instantáneas · 225 estudiantes · dataset_version=BLENKIR_V6_SYNTH_20260924
data_mode=synthetic_scientific · cutoffs 2026-07-31 y 2026-09-21 · outcome 2026-12-15
```

Vector ordenado de **7 variables**: `promedio_general`, `cursos_desaprobados`,
`asistencia_general`, `frecuencia_acceso_lms`, `tiempo_interaccion_lms`,
`actividades_realizadas`, `recursos_consultados`.

Target **binario** `target_desercion`: `permanece=0` (356) / `deserta=1` (94), con la columna
`target_label` solo como lectura humana. El split `train/validation/holdout` (316/68/66;
158/34/33 estudiantes) viene en el CSV y no se remezcla.

Las mismas validaciones se aplican en carga de datos, contrato FastAPI y cliente backend:
valores finitos y no negativos, notas 0–20, asistencia 0–100, recuentos enteros. Las
entradas adicionales o ausentes se rechazan; no se inventan valores para registros faltantes.

Los modelos son Random Forest, XGBoost (HistGradientBoosting si XGBoost no es compatible) y
Stacking. La selección se hace por F1 de la clase deserción en **validation** y la evaluación
final en **holdout** (`holdout_used_for_selection=false`); `evaluate.py` reutiliza ese
holdout y no crea otra partición.

La procedencia, unidad de observación, fechas, etiquetas y posibles fugas requieren revisión
científica: el software no certifica por sí solo la validez de las etiquetas. Los artefactos y
métricas antiguos están en `legacy/ml-v1` y no prueban desempeño de este vector.

Ver: `docs/ml/DATA_SEED_V6_METODOLOGIA.md`, `docs/ml/PIPELINE_ML_V6.md`,
`docs/ml/RESULTADOS_EXPERIMENTALES_V6.md`.
