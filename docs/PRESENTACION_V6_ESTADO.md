# Estado V6 — Componente · Estado · Evidencia

> **MODELO EXPERIMENTAL — DATOS SINTÉTICOS.** Todo el ciclo BLENKIR V6 se ejecutó en
> **local** (`localhost`): sin commit, sin push, sin merge, sin deploy y sin tocar
> Railway/Vercel.

Leyenda: **PASS** = verificado ejecutando; **NOTA** = limitación conocida documentada;
**INFO** = decisión de diseño.

| # | Componente | Estado | Evidencia |
| --- | --- | --- | --- |
| 1 | Data Seed V6 como fuente única del importador | **PASS** | `definitive-dataset-reader.mjs`: `SOURCE`…`_CIENTIFICO_SINTETICO_V6.xlsx`, `SOURCE_HASH=0bb7dd70…`, `DATASET_ID=BLENKIR_DATA_SEED_V6_250`, `DATASET_VERSION=6.0-synthetic-scientific-twin`; unicidad excluye `AUDITADO_V5` |
| 2 | Validación del dataset sin BD | **PASS** | `db:dataset:validate` → `DEFINITIVE_DATASET_VALID=true`, `LOGICAL_SHA256=9eb428bd…`, conteos idénticos al import |
| 3 | Reconstrucción de BD desde cero | **PASS** | `prisma migrate reset --force` (5 migraciones) → `db:seed:structure` (`PRESEED_ZERO_OK`, 0 usuarios) → `db:dataset:import --execute` → `DEFINITIVE_DATASET_IMPORTED=true` |
| 4 | Conteos de población | **PASS** | SQL directo: 275 usuarios (1/24/250), 250 estudiantes (225/15/10), 250 matrículas, 3724 inscripciones, 10209 calificaciones, 34950 asistencias, 725 históricos, 4610 eventos LMS, correlativos 250/24/250 |
| 5 | Entrenamiento ML V6 binario (7 features) | **PASS** | `train.py` → `MODE=synthetic_scientific`, ganador **stacking**, `model_version=BLENKIR_V6_BIN_20260924`, artefactos en `artifacts/synthetic/` |
| 6 | Selección solo por VALIDATION | **PASS** | `metrics.json`: `selection=validation_f1_desercion`, `holdout_used_for_selection=false`, `selection_metrics` (validation) ≠ `final_metrics` (holdout) |
| 7 | Métricas de holdout completas | **PASS** | ACC 0.6364 · Prec 0.3214 · Rec 0.6429 · F1 0.4286 · Bal.Acc 0.6387 · ROC-AUC 0.6277 · PR-AUC 0.3081 · Brier 0.2011 · CM [[33,19],[5,9]] (n=66) |
| 8 | Umbrales centralizados 0.41 / 0.65 | **PASS** | `app/thresholds.py` (`RISK_THRESHOLDS`), `decision_threshold=0.41` en `metadata.json` y `metrics.json` |
| 9 | Contrato FastAPI v3 (camel + snake) | **PASS** | `GET /health`: `model_loaded=true`, `model=stacking`, `contract=2026-v3`, `n_features=7`, `data_mode=synthetic_scientific`, `experimental=true` |
| 10 | Pruebas ML | **PASS** | `npm run ml:test` → 32/32 OK (`Ran 32 tests … OK`) |
| 11 | Cliente backend `ml-client` (snake → camel) | **PASS** | zod con `.transform()`: acepta `decision_threshold` y lo expone como `decisionThreshold` |
| 12 | Camino en vivo `POST /predict` | **PASS** | Docente → `EST-0009`: `nivel=medio prob=0.5026 modelo=stacking dataMode=synthetic_scientific contractVersion=2026-v3 decisionThreshold=0.41 experimental=true source=machine-learning` |
| 13 | Trazabilidad persistida | **PASS** | 251/251 predicciones con `input_data.decisionThreshold` y `contract_version=2026-v3`; **0** filas sin umbral |
| 14 | Lote `ml:v6:predict-all` con guardas | **PASS** | `--preview` solo lectura; `--write` local → `WRITE_DONE written=250 skippedExisting=0 skippedNoData=0 mlErrors=0 alertsCreated=189`; se rehúsa en productiva sin `ALLOW_SYNTHETIC_PREDICTION_WRITE=true` |
| 15 | Distribución de riesgo en BD | **PASS** | 189 alertas abiertas (`nueva`): 177 medio · 12 alto; predicciones 61 bajo / 177 medio / 12 alto |
| 16 | Métricas por API (`/ml/metrics`) | **PASS** | `data_mode=synthetic_scientific`, `experimental=true`, `model_used=best_model=stacking`, `holdout_used_for_selection=false`, `decision_threshold=0.41` |
| 17 | Vistas del director (predicciones, historial, métricas, estudiante) | **PASS** | `PredictionView`, `PredictionHistoryView`, `MlMetricsSection`, `StudentPredictionView` con badge experimental |
| 18 | Vista del docente | **PASS** | `ProfessorPredictionView` + endpoints `/profesor/*` (scope por secciones) |
| 19 | Vista del estudiante | **PASS** | `StudentPredictionView` + `/estudiante/alertas` (solo las suyas) |
| 20 | Badge experimental | **PASS** | `ExperimentalBadge` se muestra si `dataMode==="synthetic_scientific"` (o `datasetVersion` contiene V6 sin `dataMode`) |
| 21 | Dashboards con bloque ML | **PASS** | `BentoHero`/`BentoDashboard` + `/dashboard/kpis`: `alertasAbiertas=189`, `riesgoPromedio=45`, `nivelAlto=12` |
| 22 | Smoke de 3 roles (RBAC incluido) | **PASS** | `npm run test:smoke` → **68 ok, 0 fallos** (director, docente, estudiante; permitidos y denegados) |
| 23 | Trucos de honestidad ML | **PASS** | Sin métricas/SHAP fabricadas: "Factores/Señales observadas"; sin predicción no hay alerta ni `avgRisk`; riesgo `null` ≠ 0 |
| 24 | type-check (shared, frontend, backend, tools) | **PASS** | `npm run type-check` → exit 0 |
| 25 | Lint | **PASS** | `npm run lint` (eslint frontend) → exit 0 |
| 26 | Tests unit (formato predicción) | **PASS** | 4/4 |
| 27 | Tests backend | **PASS** | 49 (`node --test tests/*.test.mjs`) + 32 (`tsx --test`) = **81/81** |
| 28 | Tests frontend | **PASS** | 16/16 |
| 29 | Build completo | **PASS** | `npm run build` → shared + `tsc` backend + `next build` (5 páginas) exit 0 |
| 30 | `git diff --check` | **PASS** | exit 0 (solo avisos LF→CRLF, sin conflictos ni whitespace roto) |
| 31 | Sin commit / push / merge / deploy | **PASS** | 38 entradas sin commitear (30 modificados + 8 nuevos), **0 en staging**; `30 files changed, 1702 insertions(+), 392 deletions(-)`; `.env` ignorado (sin secretos) |
| 32 | Digesto lógico anclado en tests | **PASS** | `definitive-production-readonly.test.mjs` actualizado al digesto V6 `9eb428bd…` (incluye `sourceHash` del XLSX) |
| 33 | Coherencia `model_used` | **PASS** | `train.py` ahora escribe `model_used = best_model`; `metrics.json` corregido a `stacking` (antes decía `XGBoost`, campo descriptivo legado que contradecía al modelo servido) |
| 34 | Discrepancia de scripts `db:*` legacy | **NOTA** | `db:reset:full`, `db:seed:demo`, `db:reseed`, `db:reset:demo`, `db:legacy-users`, `db:prod` apuntan a `legacy-population-disabled.mjs` (error intencional). Equivalente real: `prisma migrate reset --force` + `db:seed:structure` |
| 35 | Alta de estudiante local (secciones) | **NOTA** | Las 22 secciones × 30 = 30/30 plazas ocupadas y `POST /academic/secciones` devuelve 409 (capacidad completa). Limitación conocida, sin cambios de negocio |
| 36 | Rate limit y recarga del servicio ML | **NOTA** | API: 300 peticiones / 15 min (reiniciar el proceso reinicia la ventana). `uvicorn --reload` solo observa `*.py`: para recargar tras editar `metrics.json` debe tocarse un `.py` o reiniciar `npm run dev` |

## Resumen de comandos ejecutados en el ciclo final

```sh
npm run type-check                       # exit 0
npm run lint                             # exit 0
npm test                                 # unit 4 + backend 81 + ml 32 → exit 0
npm run test --workspace=frontend        # 16/16
npm run build                            # exit 0
git diff --check                         # exit 0
npm run test:smoke                       # 68 ok, 0 fallos
npm run ml:v6:predict-all                # preview solo lectura
npm run ml:v6:predict-all -- --write     # written=250, alerts=189
```
