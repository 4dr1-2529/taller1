# Resultados experimentales V6 — Deserción binaria

> **MODELO EXPERIMENTAL — DATOS SINTÉTICOS.** `dataMode=synthetic_scientific`,
> `dataset_version=BLENKIR_V6_SYNTH_20260924`, `model_version=BLENKIR_V6_BIN_20260924`,
> `contract_version=2026-v3`, `labeling="Datos científicos sintéticos V6: resultados
> EXPERIMENTALES, no evidencia institucional ni validación científica."`

Fuente única: `machine-learning/artifacts/synthetic/metrics.json` (generado por `train.py`,
reproducible con `npm run ml:train`). Nada de lo siguiente fue escrito a mano.

## 1. Diseño

| Elemento | Valor |
| --- | --- |
| Filas / estudiantes | 450 instantáneas / 225 estudiantes |
| Splits (del CSV) | train 316 · validation 68 · holdout 66 (estudiantes 158 / 34 / 33) |
| Clase positiva (`deserta=1`) | 94 de 450 (20.9%) |
| Selección | `selection="validation_f1_desercion"`, `holdout_used_for_selection=false` |
| Umbral de decisión | 0.41 (elegido en validation) · bandas 0.41 / 0.65 |
| `leakage_review_required` | `false` |
| `feature_importance_source` | `RandomForestClassifier (base del stacking)` |

## 2. VALIDATION (n = 68) — usado para elegir el modelo

| Modelo | thr | Acc | Prec | Rec | F1 | Bal.Acc | ROC-AUC | PR-AUC | Brier | CM [[TN,FP],[FN,TP]] |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Random Forest | 0.27 | 0.4265 | 0.2642 | 1.0000 | 0.4179 | 0.6389 | 0.5556 | 0.2299 | 0.2211 | [[15,39],[0,14]] |
| XGBoost | 0.05 | 0.3382 | 0.2373 | 1.0000 | 0.3836 | 0.5833 | 0.5542 | 0.2442 | 0.2533 | [[9,45],[0,14]] |
| **Stacking (ganador)** | **0.41** | **0.5000** | **0.2826** | **0.9286** | **0.4333** | **0.6587** | **0.5913** | **0.2486** | **0.2378** | [[21,33],[1,13]] |

## 3. HOLDOUT (n = 66) — evaluación final, una sola vez

| Modelo | thr | Acc | Prec | Rec | F1 | Bal.Acc | ROC-AUC | PR-AUC | Brier | CM [[TN,FP],[FN,TP]] |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Random Forest | 0.27 | 0.6212 | 0.3429 | 0.8571 | 0.4898 | 0.7074 | 0.6648 | 0.3898 | 0.1752 | [[29,23],[2,12]] |
| XGBoost | 0.05 | 0.3636 | 0.2308 | 0.8571 | 0.3636 | 0.5440 | 0.6168 | 0.3676 | 0.1805 | [[12,40],[2,12]] |
| **Stacking (servido)** | **0.41** | **0.6364** | **0.3214** | **0.6429** | **0.4286** | **0.6387** | **0.6277** | **0.3081** | **0.2011** | [[33,19],[5,9]] |

Métrica final declarada por la API (`final_metrics`): `split=holdout`, `model=stacking`,
ACC 0.6364 · Precision 0.3214 · Recall 0.6429 · F1 0.4286 · Balanced Accuracy 0.6387 ·
ROC-AUC 0.6277 · PR-AUC 0.3081 · Brier 0.2011 · CM [[33,19],[5,9]].

### Limitación declarada (no se oculta)

- En **validation** el stacking es el mejor (F1 0.4333). En **holdout** el Random Forest
  obtiene F1 0.4898, superior al 0.4286 del stacking. **La selección no se hizo con
  holdout** (`holdout_used_for_selection=false`), por lo que no se re-elige el modelo
  retroalimentándose con el holdout: sería contaminación del proceso.
- Recall alto y precisión baja: el modelo prioriza no dejar escapar casos de deserción y
  genera falsos positivos; el umbral 0.41 es operativo, no calibrado científicamente.
- Con 66 muestras de holdout (14 positivas), las diferencias entre modelos no son
  concluyentes estadísticamente. Sirve para demostrar el funcionamiento del pipeline.

## 4. Distribución de bandas

| Conjunto | bajo | medio | alto |
| --- | ---: | ---: | ---: |
| validation + holdout (predicciones del propio experimento) | 60 | 67 | 7 |
| Preview del CSV V6 (225 estudiantes evaluados, media P=0.411) | 114 | 102 | 9 |
| **BD local escrita por `ml:v6:predict-all -- --write`** | **61** | **177** | **12** |

La BD usa indicadores recalculados del operacional (calificaciones, asistencias, eventos
LMS), por eso no replica la distribución del CSV.

## 5. Estado en la BD local (post-import + lote V6)

| Tabla | Contenido |
| --- | --- |
| `prediccion` | 251 (250 del lote + 1 de la verificación en vivo) — 251/251 con `decisionThreshold` y `contract_version=2026-v3` |
| `prediccion_factor` | 204 |
| `prediccion_feature_snapshot` | 1757 (todos los valores numéricos) |
| `alerta` | 189 abiertas (`estado=nueva`): 177 medio · 12 alto |
| Meta en las 251 filas | `synthetic_scientific` / `BLENKIR_V6_SYNTH_20260924` / `BLENKIR_V6_BIN_20260924` / `2026-v3` / `0.41` |

## 6. Verificación de reproducibilidad

```bash
npm run ml:test        # 32/32 OK (features, umbralización, contrato, rechazos)
npm run ml:evaluate    # reevalúa los artefactos sobre holdout.joblib sin reentrenar
npm run test:smoke     # 68 ok, 0 fallos (3 roles + trazabilidad V6)
```

Endpoint en vivo: `GET http://127.0.0.1:5000/metrics` devuelve `data_mode`,
`experimental=true`, `model_used = best_model = stacking`,
`holdout_used_for_selection=false`, `decision_threshold=0.41`.
