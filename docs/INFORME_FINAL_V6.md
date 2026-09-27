# INFORME FINAL CICLO BLENKIR V6 (1–36) + GUION DE DEMOSTRACIÓN DE 3 MINUTOS

> **MODELO EXPERIMENTAL — DATOS SINTÉTICOS.** Todo se ejecutó en local.
> Sin commit, sin push, sin merge, sin deploy; sin tocar Railway ni Vercel.
> Ningún secreto se imprimió: solo booleanos y conteos.
>
> **ACTUALIZACIÓN 2026-09-26:** lo anterior es el estado *de este ciclo*. El repositorio sí avanzó:
> refresh UI/UX fusionado a `main` (PR #5 → squash `d3c0b80`). Estado operativo verificado hoy:
> [ESTADO_ACTUAL_V6.md](ESTADO_ACTUAL_V6.md).

## Informe numerado

**A. Alcance y datos**

1. **Ciclo completo ejecutado**: ejecutar → identificar → corregir → re-ejecutar, sin PASS
   inventado. Cada afirmación de este informe tiene evidencia de comando o consulta real.
2. **Fuente única V6**: `BLENKIR_DATASET_DEFINITIVO_2026_CIENTIFICO_SINTETICO_V6.xlsx`,
   SHA-256 `0bb7dd701ddc1dd9d14386d7b908ba7238e733e67b522e649da2cab74fcd0a0c`,
   `dataset_id=BLENKIR_DATA_SEED_V6_250`, `dataset_version=6.0-synthetic-scientific-twin`,
   semilla `20260921`, corte `2026-09-21`, bcrypt cost 12.
3. **Composición verificada celda a celda** del workbook (25 hojas): 15 hojas idénticas al
   V5 auditado, 3 distintas (`README`, `Resumen`, `ImportConfig`) y 7 nuevas `ML_V6_*`
   (documentación, no consumidas por el importador).
4. **Validación de solo lectura** (`db:dataset:validate`): `DEFINITIVE_DATASET_VALID=true`,
   `LOGICAL_SHA256=9eb428bd0612a1f6c19040219bea939429dcaaf410b376a0211d13418fb09c50`,
   conteos idénticos a los del import.
5. **BD local reconstruida desde cero**: `prisma migrate reset --force` (5 migraciones) +
   `db:seed:structure` → `PRESEED_ZERO_OK` (0 usuarios, 22 secciones, 3 roles,
   7 `ml_feature_def`, correlativos en 0).
6. **Discrepancia identificada y reportada**: `db:reset:full`, `db:seed:demo`, `db:reseed`,
   `db:reset:demo`, `db:legacy-users` y `db:prod` apuntan a
   `scripts/legacy-population-disabled.mjs` (error intencional). Equivalente real usado:
   `prisma migrate reset --force` + `npm run db:seed:structure`.
7. **Import ejecutado** con las 3 autorizaciones + `NODE_ENV=production` (solo en ese
   proceso) + contraseñas locales ≥12: `MODE=EXECUTE`, `DEFINITIVE_DATASET_IMPORTED=true`,
   transacción serializable con postchecks; nunca conectado a startup, migraciones o deploy.
8. **Conteos exactos en BD**: 275 usuarios (1/24/250), **250** estudiantes (225 activa /
   15 retirada / 10 trasladada), **250** matrículas, **3724** inscripciones (3354 activas /
   370 retiradas), **10209** calificaciones (3724/3724/2761/0), **34950** asistencias,
   725 históricos, 750 resúmenes, 4610 eventos LMS, 328 ofertas, 656 recursos, 328
   actividades, 3354 progresos.
9. **Correlativos**: 250 / 24 / 250 → siguientes códigos `EST-251`, `PROF-025`,
   `MAT-2026-251`; sin cambios en el servicio de correlativos.
10. **Cero fabricación de ML en la import**: predicciones, alertas, factores, snapshots y
    tablas `ml_*` = 0 tras el import (el XLSX declara `DO_NOT_POPULATE`).

**B. Aprendizaje de máquina**

11. **Dataset de ML**: `machine-learning/data/synthetic-scientific-v6/BLENKIR_ML_DATASET_V6_SYNTHETIC.csv`
    → 450 instantáneas / 225 estudiantes, `data_mode=synthetic_scientific`,
    `dataset_version=BLENKIR_V6_SYNTH_20260924`, target binario `target_desercion`
    (356 `permanece` / 94 `deserta`), splits **del CSV sin remezclar**: train 316 (158
    estudiantes) · validation 68 (34) · holdout 66 (33).
12. **Exactamente 7 features** en el orden fijo de `app/features.py` (promedio_general,
    cursos_desaprobados, asistencia_general, frecuencia_acceso_lms,
    tiempo_interaccion_lms, actividades_realizadas, recursos_consultados); prohibidos
    metadata, `prob_generador` y `score_generador`; entradas extra o ausentes → rechazo.
13. **Umbrales centralizados** en `app/thresholds.py`: `decision_threshold=0.41` y bandas
    `bajo < 0.41 ≤ medio < 0.65 ≤ alto`, declarados como operativos/no validados.
14. **Selección SOLO por VALIDATION**: `selection=validation_f1_desercion`,
    `holdout_used_for_selection=false`. Ganador **stacking** (validation F1 0.4333 @ 0.41;
    RF 0.4179; XGBoost 0.3836).
15. **Evaluación final en holdout (n=66)** del modelo servido: Accuracy 0.6364 · Precision
    0.3214 · Recall 0.6429 · F1 0.4286 · Balanced Accuracy 0.6387 · ROC-AUC 0.6277 ·
    PR-AUC 0.3081 · Brier 0.2011 · matriz de confusión [[33,19],[5,9]].
16. **Limitación declarada, no oculta**: en holdout RF obtiene F1 0.4898 (mayor que el
    0.4286 del stacking); **no se re-elige** porque eso contaminaría el proceso (el holdout
    nunca decide). Con 14 positivos en holdout las diferencias no son concluyentes.
17. **Artefactos solo en `machine-learning/artifacts/synthetic/`** (nunca en `artifacts/real/`):
    modelos, `features.joblib`, `holdout.joblib`, `metadata.json`, `metrics.json`,
    `metrics_comparison.csv`, historial y control de calidad.
18. **FastAPI contrato 2026-v3** en 5000: `/health` (`modelLoaded=true`, `model=stacking`,
    `model_version=BLENKIR_V6_BIN_20260924`, `data_mode=synthetic_scientific`,
    `n_features=7`, `experimental=true`), `/predict` (camel + snake), `/metrics`.
19. **Pruebas ML**: `npm run ml:test` → **32/32 OK** (vector, umbrales, contrato, rechazos).

**C. Integración backend ↔ ML**

20. **Corrección aplicada**: el FastAPI publica `decision_threshold` (snake) → `ml-client.ts`
    ahora lo acepta con `.transform()` a `decisionThreshold` y `predict-all-v6.ts` lee
    `ml.decisionThreshold ?? ml.decision_threshold`.
21. **Corrección de las 250 filas existentes**: `JSON_SET(... '$.decisionThreshold', 0.41)`
    con el valor del `metadata.json` del artefacto (no fabricado); hoy **251/251** con umbral.
22. **Lote en modo preview**: `npm run ml:v6:predict-all` es solo lectura (no abre BD),
    evaluó 225 estudiantes (114/102/9, media P=0.411) y escribió
    `artifacts/synthetic/predictions-preview.json`.
23. **Lote con escritura guardada**: `--write` local → `WRITE_DONE written=250
    skippedExisting=0 skippedNoData=0 mlErrors=0 alertsCreated=189`; en productiva se
    **rehúsa** salvo `ALLOW_SYNTHETIC_PREDICTION_WRITE=true`.
24. **Camino en vivo verificado** (`POST /predict`, docente, estudiante `EST-0009`):
    `nivel=medio prob=0.5026 modelo=stacking dataMode=synthetic_scientific
    modelVersion=BLENKIR_V6_BIN_20260924 datasetVersion=BLENKIR_V6_SYNTH_20260924
    contractVersion=2026-v3 decisionThreshold=0.41 experimental=true
    source=machine-learning`, y la fila persistida conserva `thr=0.41`.
25. **Estado en BD**: 251 predicciones (250 del lote + 1 en vivo), 189 alertas abiertas
    (177 medio · 12 alto), 204 factores, 1757 snapshots (todos numéricos), **0** predicciones
    sin `decisionThreshold` y `contract_version=2026-v3` en todas.
26. **Métricas coherentes por API** (`/ml/metrics`): `data_mode=synthetic_scientific`,
    `experimental=true`, `model_used = best_model = stacking`, `holdout_used_for_selection=false`,
    `decision_threshold=0.41`. Corregido el campo legado `model_used` (decía `XGBoost`) en
    `train.py` y en `metrics.json`, para no contradecir al modelo servido.

**D. Frontend y roles**

27. **Director**: `PredictionView` (tabla de predicciones con badge + resultado),
    `MlMetricsSection` (validación vs holdout dentro de la sección **Predicción**),
    `PredictionHistoryView` (historial con factores), `StudentPredictionView` en detalle.
28. **Docente**: `ProfessorPredictionView` y alcance por secciones; **Estudiante**:
    `StudentPredictionView` + `/estudiante/alertas` (solo lo suyo).
29. **Badge experimental** presente en 5 lugares: `BentoHero`, `PredictionView`,
    `MlMetricsSection`, `PredictionHistoryView`, `StudentPredictionView`; se muestra cuando
    `dataMode === "synthetic_scientific"`.
30. **Dashboards con bloque ML** (`data.ml` de `/dashboard/kpis`): `dataMode=synthetic_scientific`,
    `modelSelected=stacking`, `contractVersion=2026-v3`, `decisionThreshold=0.41`,
    `nFeatures=7`, `metricsAvailable=true`, `experimental=true`, `evaluated=250`
    estudiantes (251 predicciones), `avgProbability=0.45`, `alertsActive=189`,
    `byLevel` 61/177/12 y `byLevel` de alertas 0/177/12. Además `avgRisk=45`,
    `openAlerts=189` y `riskBySection`/`riskByGrado` poblados. Sin predicción el riesgo es
    `null`, jamás 0.
31. **Smoke de 3 roles**: `npm run test:smoke` → **68 ok, 0 fallos** (logins director /
    docente / estudiante, matriz RBAC permitidos y denegados, y dos chequeos ML
    actualizados de «modelo sin entrenar» a «trazabilidad V6»).

**E. Verificación y documentación**

32. **Suite completa PASS**: `type-check` (shared + frontend + backend + tools) 0 · `lint` 0 ·
    `test:unit` 4/4 · tests backend **81/81** (49 node + 32 tsx) · tests frontend **16/16** ·
    `ml:test` **32/32** · `npm run build` 0 (shared + tsc + next build) · `git diff --check` 0.
33. **Documentación nueva/actualizada**: `docs/ml/DATA_SEED_V6_METODOLOGIA.md`,
    `docs/ml/PIPELINE_ML_V6.md`, `docs/ml/RESULTADOS_EXPERIMENTALES_V6.md`,
    `docs/PRESENTACION_V6_ESTADO.md`, `docs/DATASET_DEFINITIVO_2026_V6_LOCAL.md` (y aviso
    de superseded en el doc V5), `machine-learning/README.md`, `machine-learning/data/README.md`.
34. **Pruebas del importador ajustadas al V6**: digesto anclado en
    `definitive-production-readonly.test.mjs` actualizado al valor real `9eb428bd…`
    (incluye el hash del XLSX fuente) → tests en verde.
35. **Límites y notas conocidas**: (a) secciones 30/30 plazas y
    `POST /academic/secciones` → 409, sin cambios de negocio; (b) rate limit API
    300 peticiones/15 min (reiniciar el proceso reinicia la ventana); (c) `uvicorn --reload`
    solo observa `*.py`: recargar `metrics.json` requiere tocar un `.py` o reiniciar
    `npm run dev`; (d) ninguna prueba automatizada se conecta a Railway/Vercel.
36. **Estado global**: ciclo V6 **completo y verificado en local**. Git en rama `main`:
    **38 entradas** sin commitear (30 modificados + 8 nuevos), **0 en staging**,
    `30 files changed, 1702 insertions(+), 392 deletions(-)`. Los nuevos son
    `backend/scripts/predict-all-v6.ts`, `frontend/src/components/ui/ExperimentalBadge.tsx`,
    `machine-learning/app/thresholds.py`, `machine-learning/artifacts/` (binarios ~5 MB,
    sin trackear) y la documentación (`docs/ml/`, `PRESENTACION_V6_ESTADO.md`,
    `DATASET_DEFINITIVO_2026_V6_LOCAL.md`, `INFORME_FINAL_V6.md`). Sin secretos en git
    (`.env` ignorado). Pendiente de decisión del usuario: commit, y carga/validación en
    entorno productivo (**no ejecutada**).

---

## GUION DE DEMOSTRACIÓN DE 3 MINUTOS

**Stack previo**: `npm run dev` → web **http://localhost:3029**, API
**http://localhost:4000/api/v1**, ML **http://127.0.0.1:5000**.
Credenciales en `backend/.env` (`DIRECTOR_INITIAL_PASSWORD`, `TEACHER_INITIAL_PASSWORD`,
`STUDENT_INITIAL_PASSWORD`) con los correos `director@blenkir.edu.pe`,
`prof001@blenkir.edu.pe`, `est0001@alumnos.blenkir.edu.pe`.

**Frase de apertura (obligatoria, dice la honestidad del proyecto):**
> «Todo lo que van a ver es un modelo **experimental** funcionando sobre **datos sintéticos**
> del Data Seed V6: demuestra que la tecnología del pipeline existe y funciona; **no** es
> información real de la institución ni evidencia científica de deserción.»

| Tiempo | Pantalla / URL | Qué hacer | Qué decir |
| --- | --- | --- | --- |
| 0:00–0:20 | `http://localhost:3029/login` | Entrar con `director@blenkir.edu.pe` | «Sistema con 3 roles: director, docente y estudiante. Población de prueba: 275 usuarios, 250 estudiantes, 10 209 calificaciones y 34 950 asistencias.» |
| 0:20–0:50 | Sidebar → **Dashboard** | Señalar el **ExperimentalBadge** y los KPIs | «Badge *MODELO EXPERIMENTAL — DATOS SINTÉTICOS*. Aquí el bloque ML: 250 estudiantes evaluados (251 predicciones), probabilidad media 0.45, riesgo promedio 45, 12 en riesgo alto, 189 alertas abiertas. Sin predicción el riesgo sale vacío, no cero.» |
| 0:50–1:20 | Sidebar → **Predicción** | Revisar la tabla y abrir `MlMetricsSection` | «Elegimos el modelo **por validación** (F1 0.4333 con umbral 0.41) y **nunca** tocamos el holdout para elegir. Holdout final: exactitud 0.6364, F1 0.4286, ROC-AUC 0.6277, precisión 0.3214, recall 0.6429, matriz [[33,19],[5,9]]. El holdout lo mostramos entero, aunque ahí Random Forest saca F1 más alto: el holdout no se usa para seleccionar.» |
| 1:20–1:45 | Sidebar → **Alertas** | Abrir una alerta de riesgo alto | «Cada alerta viene de una predicción trazable: modelo `BLENKIR_V6_BIN_20260924`, dataset `BLENKIR_V6_SYNTH_20260924`, contrato `2026-v3`, umbral 0.41. No hay alerta sin predicción.» |
| 1:45–2:05 | Sidebar → **Historial predicciones** | Mostrar probabilidad, factores y detalle | «Probabilidad de deserción y **señales observadas** (promedio, asistencia, LMS): son descriptivas, **no** son SHAP ni causalidad. Aquí está el badge otra vez.» |
| 2:05–2:25 | Cerrar sesión → `prof001@blenkir.edu.pe` → **Predicción** | Ver alcance del docente | «El docente solo ve sus secciones: 3 cursos, 7 salones. Misma vista experimental, mismo umbral.» |
| 2:25–2:40 | Cerrar sesión → `est0001@alumnos.blenkir.edu.pe` → **Predicción** | Ver su propio resultado | «El estudiante ve **su** predicción y **sus** alertas, nunca las de otros.» |
| 2:40–3:00 | `http://127.0.0.1:5000/health` y `/metrics` | Mostrar JSON vivo | «Servicio ML con 7 features exactas, contrato `2026-v3`, `holdout_used_for_selection=false`, `experimental=true`. Pruebas: 32/32 ML, 81 backend, 16 frontend, smoke 68/0, build PASS. Todo local, sin deploy ni commit.» |

**Cierre (si preguntan por límites):**
> «Es un modelo con recall alto y precisión baja (prioriza no perder casos), entrenado con
> 225 estudiantes sintéticos; los umbrales 0.41/0.65 son operativos. La validación científica
> con datos institucionales reales es un paso posterior y no la hacemos aquí.»
