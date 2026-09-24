# Data Seed V6 — Metodología

> **MODELO EXPERIMENTAL — DATOS SINTÉTICOS.** Todo lo documentado aquí corresponde al
> Data Seed V6 (`synthetic_scientific`): población sintética de twin científico para la
> demostración tecnológica. No es información institucional ni evidencia científica.

## 1. Fuente autorizada

| Campo | Valor |
| --- | --- |
| Workbook | `backend/prisma/data/definitive-2026/BLENKIR_DATASET_DEFINITIVO_2026_CIENTIFICO_SINTETICO_V6.xlsx` |
| `dataset_id` | `BLENKIR_DATA_SEED_V6_250` |
| `dataset_version` | `6.0-synthetic-scientific-twin` |
| SHA-256 del archivo | `0bb7dd701ddc1dd9d14386d7b908ba7238e733e67b522e649da2cab74fcd0a0c` |
| Digesto lógico (tablas generadas) | `9eb428bd0612a1f6c19040219bea939429dcaaf410b376a0211d13418fb09c50` |
| `cutoff_date` | `2026-09-21` |
| `random_seed` | `20260921` (generación determinista) |
| `bcrypt_cost` | 12 |
| Contraseñas en Excel | No (`SET_IN_RAILWAY_ENV`); se inyectan por variables de entorno |
| `predictions` / `legacy_lms` | `DO_NOT_POPULATE` (el importador nunca crea predicciones ni métricas ML) |

La integridad está anclada en `backend/scripts/lib/definitive-dataset-reader.mjs`:
`SOURCE` + `SOURCE_HASH` + `DATASET_ID`/`DATASET_VERSION` verificados en cada lectura.
La unicidad del XLSX activo excluye la versión legada `AUDITADO_V5`.

El workbook V6 tiene **25 hojas** (el V5 auditado tenía 18). Comparación celda a celda:

- **15 hojas idénticas** al V5: Director, Profesores, Estudiantes250, Secciones,
  CatalogoCursos, OfertaPlan, AsignacionesPlan, TutoresPlan, GeneracionRelacional,
  MLFeatures, MapeoPrisma, Fuentes, Usuarios, CorrelativosFinales y AuditoriaCorrecciones.
- **3 hojas distintas**: `README`, `Resumen` e `ImportConfig` (metadato V6:
  `dataset_id`, `dataset_version`).
- **7 hojas nuevas, solo V6**: `ML_V6_Dataset`, `ML_V6_Outcome`, `ML_V6_Splits`,
  `ML_V6_Inferencia`, `ML_V6_Parametros`, `ML_V6_Diccionario`, `ML_V6_Calidad`
  (documentación de referencia del experimento de aprendizaje; **no las consume el
  importador**).

El importador solo lee las 18 hojas que conoce (`README`, `Resumen` + las 16 con encabezado
fijo).

## 2. Población objetivo y verificada

Validación en modo solo lectura (`npm run db:dataset:validate --workspace=backend`):
`DEFINITIVE_DATASET_VALID=true`.

| Entidad | Objetivo | Importado en BD local | Detalle |
| --- | ---: | ---: | --- |
| Usuarios | 275 | **275** | 1 director + 24 docentes + 250 estudiantes |
| Estudiantes | 250 | **250** | 225 con matrícula activa / 15 retirada / 10 trasladada |
| Profesores | 24 | **24** | 2 cursos / 7 secciones por especialista |
| Secciones | 22 | 22 | Capacidad 30; distribución 46/46/46/46/33/33 |
| Ofertas de curso | 328 | 328 | 104 de 1.°–2.° + 224 de 3.°–6.° |
| Matrículas | 250 | **250** | Una por estudiante |
| Inscripciones a curso | 3724 | **3724** | 3354 activas / 370 retiradas |
| Calificaciones | 10209 | **10209** | 0–20; I-II + III |
| Asistencias | 34950 | **34950** | Solo días hábiles; presente/tardanza/justificado |
| Histórico académico | 725 | 725 | 250 / 250 / 225 por período |
| Eventos LMS | 4610 | 4610 |/login, sesión, recurso, actividad, curso |
| Recursos / actividades / progresos | 656 / 328 / 3354 | igual | Contenido por oferta |
| Correlativos | EST-250 · PROF-024 · MAT-2026-250 | igual | Siguiente libre: EST-251, PROF-025, MAT-2026-251 |
| Predicciones / alertas / tablas ML | 0 | **0** | El importador no fabrica ML |

Identidades (`dni_sintetico`, `telefono_sintetico`) se importan tal cual:
son ficticias, no se validan contra RENIEC y no sirven para contacto real.

## 3. Secuencia de reconstrucción local (BD desde cero)

1. `npx prisma migrate reset --force` con `DATABASE_URL` local (5 migraciones del repo).
   - **Discrepancia reportada:** `db:reset:full`, `db:seed:demo`, `db:reseed`,
     `db:reset:demo`, `db:legacy-users` y `db:prod` apuntan a
     `scripts/legacy-population-disabled.mjs` y terminan con error
     "LEGACY: población y reparaciones antiguas deshabilitadas". El equivalente real es
     `prisma migrate reset --force` + `npm run db:seed:structure`.
2. `npm run db:seed:structure` → 1 institución, 22 secciones, 90 cursos-grado,
   3 roles, 9 permisos, 7 `ml_feature_def`, 3 correlativos en `0`, **0 usuarios**.
3. `npm run db:dataset:import --workspace=backend -- --execute` con
   `ALLOW_DEFINITIVE_DATASET_IMPORT`, `DEFINITIVE_DATASET_EXECUTE`,
   `ALLOW_PRODUCTION_DATASET_IMPORT` en `true`, `NODE_ENV=production`, las tres
   contraseñas (≥12 caracteres) tomadas de `backend/.env` y `DATABASE_URL` local.
   Condición previa `PRESEED_ZERO_OK`; transacción serializable; postchecks antes del commit.
   Salida: `MODE=EXECUTE`, `DATASET_ID=BLENKIR_DATA_SEED_V6_250`,
   `DATASET_VERSION=6.0-synthetic-scientific-twin`, `DEFINITIVE_DATASET_IMPORTED=true`.
4. Verificación SQL de los nueve conteos de la tabla §2 (todos coinciden).

Ninguna de estas operaciones se ejecutó contra Railway ni Vercel: todo fue local y no
hubo commit, push, merge ni deploy.

## 4. Relación con el dataset de ML

El workbook V6 aporta la población operativa. El vector de entrenamiento es un artefacto
distinto y autorizado: `machine-learning/data/synthetic-scientific-v6/BLENKIR_ML_DATASET_V6_SYNTHETIC.csv`
(450 instantáneas de 225 estudiantes; ver `docs/ml/PIPELINE_ML_V6.md`).

En la BD importada **no existen** predicciones hasta que se ejecuta, de forma explícita:

```
npm run ml:v6:predict-all               # preview, solo lectura (no escribe BD)
npm run ml:v6:predict-all -- --write    # escritura guardada (solo host local/no productivo)
```

Resultado en la BD local: 250 predicciones del lote + 1 de la verificación en vivo = 251,
189 alertas abiertas, 1757 instantáneas de features y 0 predicciones sin `decisionThreshold`.

## 5. Trazabilidad declarada en cada predicción

Cada fila de `prediccion.input_data` conserva:

```
dataMode=synthetic_scientific · datasetVersion=BLENKIR_V6_SYNTH_20260924
modelVersion=BLENKIR_V6_BIN_20260924 · contractVersion=2026-v3 · decisionThreshold=0.41
```

Comprobado: 251/251 con umbral presente y `contract_version='2026-v3'`.
