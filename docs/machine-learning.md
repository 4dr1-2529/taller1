# Machine Learning

## Modelos

- **Random Forest** — 150 árboles, `class_weight=balanced`
- **XGBoost** (o HistGradientBoosting si hay incompatibilidad)
- **Stacking** — RF + HGB, meta RF
- **Selección:** mejor F1-score → `models/best_model.joblib`

## Variables (10 features)

`promedio_general`, `cursos_desaprobados`, `asistencia_general`, `frecuencia_acceso_lms`, `tiempo_plataforma`, `tareas_ratio`, `participacion_actividades`, `uso_foros`, `disminucion_actividad`, `estado`

## Scripts

```bash
npm run ml:train      # entrenar
npm run ml:evaluate   # evaluar modelos guardados
npm run ml:test       # pruebas Python
```

## Artefactos

| Archivo | Contenido |
|---------|-----------|
| `models/best_model.joblib` | Modelo productivo |
| `models/metrics.json` | Accuracy, Precision, Recall, F1, matrices |
| `models/metrics_comparison.csv` | Comparación tabular |
| `models/training_history.json` | Historial de entrenamiento |
| `reports/evaluation_report.json` | Salida de `evaluate.py` |

## Respuesta de predicción

No se inventan resultados: si no hay modelo, se usa heurística documentada en `app/main.py`.
